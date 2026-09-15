import { validateReport, type Report } from './reports';
import type {
  ModerationCommand, ModerationQueueRequest, ModeratorContextResult, ModeratorContextSource,
  ModeratorDecisionResult, ModeratorQueueReport, ModeratorQueueResult,
} from '../app/api/moderation/store';

export type ModeratorClientError = 'unauthenticated' | 'forbidden' | 'conflict' | 'invalid_request'
  | 'unavailable' | 'limited' | 'request_timeout' | 'outcome_unknown';
export type ModeratorClientFailure = { readonly ok: false; readonly error: ModeratorClientError };
interface ModeratorClientContract {
  login(email: string, password: string): Promise<{ readonly ok: true; readonly expiresAt: string } | ModeratorClientFailure>;
  logout(): Promise<{ readonly ok: true } | ModeratorClientFailure>;
  clear(): void;
  expiresAt(): number | null;
  queue(request: ModerationQueueRequest): Promise<ModeratorQueueResult | ModeratorClientFailure>;
  context(receipt_id: string): Promise<ModeratorContextResult | ModeratorClientFailure>;
  decide(command: ModerationCommand): Promise<ModeratorDecisionResult | ModeratorClientFailure>;
}
export type ModeratorClient = ReturnType<typeof createModeratorClient>;

export const MODERATOR_CLIENT_TIMEOUT_MS = 18000;
export const MAX_MODERATOR_CLIENT_REPLY_BYTES = 384 * 1024;
const RETENTION_US = BigInt(30 * 24 * 60 * 60 * 1000) * BigInt(1000);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const COMMON = ['receipt_id', 'report_type', 'state', 'revision', 'received_at'];
const AUDIT = ['moderated_at', 'moderator_id', 'reason', 'duplicate_of'];
const CONTENT = ['schema_version', 'report_type', 'geometry', 'referenced_bundle_version', 'context', 'note'];
const encoder = new TextEncoder();
const failure = <ErrorCode extends ModeratorClientError>(error: ErrorCode): { readonly ok: false; readonly error: ErrorCode } => Object.freeze({ ok: false, error });
const uuid = (value: unknown): value is string => typeof value === 'string' && value.length === 36 && UUID.test(value);
const action = (value: unknown): value is ModerationCommand['action'] => value === 'accepted' || value === 'rejected' || value === 'duplicate';
const state = (value: unknown): value is ModerationQueueRequest['state'] => value === 'pending' || action(value);
const revision = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;

function object(value: unknown, allowed: readonly string[], required = allowed): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Reflect.ownKeys(value).every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    return typeof key === 'string' && allowed.includes(key) && descriptor.enumerable && 'value' in descriptor;
  }) && required.every(key => Object.prototype.hasOwnProperty.call(value, key));
}

function text(value: unknown, max: number): value is string {
  if (typeof value !== 'string' || value.length > max * 2) return false;
  let count = 0;
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (++count > max || code === 0 || (code >= 0xd800 && code <= 0xdfff)) return false;
  }
  return true;
}
const reason = (value: unknown): value is string => text(value, 1000) && value.trim().length > 0;

// Preserve the database spelling for pagination; Date's millisecond round-trip loses rows.
function timestamp(value: unknown): { text: string; us: bigint; ms: number } | null {
  if (typeof value !== 'string' || value.length > 32) return null;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match || match[0] !== value || value.startsWith('0000-')) return null;
  const calendar = Date.parse(`${match[1]}Z`);
  if (!Number.isFinite(calendar) || new Date(calendar).toISOString().slice(0, 19) !== match[1]) return null;
  const hours = Number(match[5] ?? 0), minutes = Number(match[6] ?? 0);
  if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0)) return null;
  const offset = (hours * 60 + minutes) * 60000 * (match[4] === '-' ? -1 : 1);
  const us = BigInt(calendar - offset) * BigInt(1000) + BigInt((match[2] ?? '').padEnd(6, '0'));
  return us < BigInt(0) ? null : { text: value, us, ms: Number(us / BigInt(1000)) };
}

function queueInput(value: unknown): ModerationQueueRequest | null {
  if (!object(value, ['state', 'after'], ['state']) || !state(value.state)) return null;
  if (!('after' in value)) return { state: value.state };
  if (!object(value.after, ['received_at', 'receipt_id']) || !timestamp(value.after.received_at) || !uuid(value.after.receipt_id)) return null;
  return { state: value.state, after: { received_at: value.after.received_at as string, receipt_id: value.after.receipt_id } };
}

function decisionInput(value: unknown): ModerationCommand | null {
  const keys = ['receipt_id', 'expected_revision', 'action', 'reason'];
  if (!object(value, [...keys, 'duplicate_of'], keys) || !uuid(value.receipt_id) || !revision(value.expected_revision)
    || value.expected_revision === Number.MAX_SAFE_INTEGER || !action(value.action) || !reason(value.reason)
    || (value.action === 'duplicate' ? !uuid(value.duplicate_of) || value.duplicate_of === value.receipt_id : 'duplicate_of' in value)) return null;
  return { receipt_id: value.receipt_id, expected_revision: value.expected_revision, action: value.action, reason: value.reason,
    ...(value.action === 'duplicate' ? { duplicate_of: value.duplicate_of as string } : {}) };
}

export function validateModeratorDecision(value: unknown): value is ModerationCommand {
  try { return decisionInput(value) !== null; } catch { return false; }
}

function sourceProjection(value: unknown, observed?: bigint): ModeratorContextSource | null {
  if (!object(value, [...COMMON, ...AUDIT]) || !uuid(value.receipt_id) || !state(value.state) || !revision(value.revision)
    || (value.report_type !== 'mapping_error' && value.report_type !== 'shelter_request')) return null;
  const received = timestamp(value.received_at);
  if (!received || (observed !== undefined && (received.us > observed || received.us + RETENTION_US <= observed))) return null;
  if (value.state === 'pending') {
    if (!AUDIT.every(key => value[key] === null)) return null;
  } else {
    const moderated = timestamp(value.moderated_at);
    if (!moderated || moderated.us < received.us || moderated.us >= received.us + RETENTION_US
      || (observed !== undefined && moderated.us > observed) || value.revision < 2 || !uuid(value.moderator_id)
      || !reason(value.reason) || (value.state === 'duplicate'
        ? !uuid(value.duplicate_of) || value.duplicate_of === value.receipt_id : value.duplicate_of !== null)) return null;
  }
  return Object.freeze({ receipt_id: value.receipt_id, report_type: value.report_type, state: value.state,
    revision: value.revision, received_at: received.text, moderated_at: value.moderated_at as string | null,
    moderator_id: value.moderator_id as string | null, reason: value.reason as string | null, duplicate_of: value.duplicate_of as string | null });
}

function contentProjection(value: unknown): Omit<Report, 'client_request_id'> | null {
  if (!object(value, CONTENT, CONTENT.slice(0, 4))) return null;
  const result = validateReport({ ...value, client_request_id: '00000000-0000-7000-8000-000000000000' });
  if (!result.ok) return null;
  const { client_request_id: _omitted, ...content } = result.report;
  return Object.freeze(content);
}

function queueProjection(value: unknown, request: ModerationQueueRequest, now: number): ModeratorQueueResult {
  if (!object(value, ['ok', 'queue']) || value.ok !== true || !object(value.queue, ['reports', 'page_limit'])
    || value.queue.page_limit !== 25 || !Array.isArray(value.queue.reports) || value.queue.reports.length > 25) return failure('unavailable');
  let previous = request.after ? { us: timestamp(request.after.received_at)!.us, id: request.after.receipt_id } : undefined;
  const seen = new Set<string>();
  const reports: ModeratorQueueReport[] = [];
  for (const raw of value.queue.reports) {
    if (!object(raw, [...COMMON, 'expires_at', 'content', 'moderation']) || raw.state !== request.state
      || !uuid(raw.receipt_id) || seen.has(raw.receipt_id)) return failure('unavailable');
    const received = timestamp(raw.received_at), expires = timestamp(raw.expires_at), content = contentProjection(raw.content);
    if (!received || !expires || expires.us - received.us !== RETENTION_US || expires.us <= BigInt(now) * BigInt(1000)
      || !content || content.report_type !== raw.report_type
      || (previous && (received.us < previous.us || (received.us === previous.us && raw.receipt_id <= previous.id)))) return failure('unavailable');
    const audit = raw.moderation;
    if (audit !== null && !object(audit, AUDIT)) return failure('unavailable');
    const source = sourceProjection({ receipt_id: raw.receipt_id, report_type: raw.report_type, state: raw.state,
      revision: raw.revision, received_at: raw.received_at,
      ...(audit === null ? { moderated_at: null, moderator_id: null, reason: null, duplicate_of: null } : audit) });
    if (!source || (raw.state === 'pending') !== (audit === null)) return failure('unavailable');
    reports.push(Object.freeze({ receipt_id: source.receipt_id, report_type: source.report_type, state: source.state,
      revision: source.revision, received_at: received.text, expires_at: expires.text, content,
      moderation: audit === null ? null : Object.freeze({ moderated_at: audit.moderated_at as string,
        moderator_id: audit.moderator_id as string, reason: audit.reason as string, duplicate_of: audit.duplicate_of as string | null }) }));
    previous = { us: received.us, id: raw.receipt_id }; seen.add(raw.receipt_id);
  }
  return Object.freeze({ ok: true, queue: Object.freeze({ reports: Object.freeze(reports), page_limit: 25 }) });
}

function contextProjection(value: unknown, receipt: string): ModeratorContextResult {
  if (!object(value, ['ok', 'context']) || value.ok !== true || !object(value.context, ['source', 'observed_at'])) return failure('unavailable');
  const observed = timestamp(value.context.observed_at);
  const source = observed && sourceProjection(value.context.source, observed.us);
  return observed && source && source.receipt_id === receipt
    ? Object.freeze({ ok: true, context: Object.freeze({ source, observed_at: observed.text }) }) : failure('unavailable');
}

function decisionProjection(value: unknown, command: ModerationCommand): ModeratorDecisionResult {
  if (!object(value, ['ok', 'decision']) || value.ok !== true || !object(value.decision, ['receipt_id', 'state', 'revision', 'moderated_at'])) return failure('outcome_unknown');
  const decision = value.decision, moderated = timestamp(decision.moderated_at);
  if (!moderated || decision.receipt_id !== command.receipt_id || decision.state !== command.action
    || decision.revision !== command.expected_revision + 1) return failure('outcome_unknown');
  return Object.freeze({ ok: true, decision: Object.freeze({ receipt_id: command.receipt_id, state: command.action,
    revision: command.expected_revision + 1, moderated_at: moderated.text }) });
}

function strictJson(json: string): unknown {
  const value: unknown = JSON.parse(json);
  const members = (raw: string) => [...raw.matchAll(/"(?:[^"\\]|\\[\s\S])*"|(:)/g)].filter(match => match[1]).length;
  if (members(json) !== members(JSON.stringify(value))) throw Error('invalid_json');
  return value;
}

function loginProjection(value: unknown, now: number): { token: string; expiry: string; ms: number } | null {
  if (!object(value, ['ok', 'accessToken', 'expiresAt']) || value.ok !== true
    || typeof value.accessToken !== 'string' || value.accessToken.length > 8192) return null;
  const parts = value.accessToken.split('.');
  if (parts.length !== 3 || parts.some(part => !part || part.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/.test(part))) return null;
  const expiry = timestamp(value.expiresAt);
  if (!expiry || expiry.ms <= now || expiry.ms > now + 3600000) return null;
  // This is consistency checking only, never signature verification or authorization.
  const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
  const payload = strictJson(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Uint8Array.from(decoded, c => c.charCodeAt(0))));
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const exp = (payload as Record<string, unknown>).exp;
  if (typeof exp !== 'number' || !Number.isSafeInteger(exp) || exp < 0 || BigInt(exp) * BigInt(1000000) !== expiry.us) return null;
  return { token: value.accessToken, expiry: expiry.text, ms: expiry.ms };
}

function cancelBody(response: Response): void {
  try { void response.body?.cancel().catch(() => {}); } catch { /* Cancellation is best effort, never awaited. */ }
}

interface Deadline {
  signal: AbortSignal;
  check(): void;
  wait<T>(promise: Promise<T>): Promise<T>;
}
async function readJson(response: Response, deadline: Deadline): Promise<unknown> {
  const length = response.headers.get('content-length');
  if (length !== null && (!/^(0|[1-9][0-9]{0,8})$/.test(length) || Number(length) > MAX_MODERATOR_CLIENT_REPLY_BYTES)) {
    cancelBody(response); throw Error('body_limit');
  }
  const reader = response.body?.getReader();
  if (!reader) throw Error('missing_body');
  const bytes = new Uint8Array(MAX_MODERATOR_CLIENT_REPLY_BYTES);
  let size = 0;
  try {
    while (true) {
      deadline.check();
      const part = await deadline.wait(reader.read());
      deadline.check();
      if (part.done) return strictJson(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, size)));
      if (!(part.value instanceof Uint8Array) || part.value.byteLength === 0 || part.value.byteLength > bytes.length - size) throw Error('body_limit');
      bytes.set(part.value, size); size += part.value.byteLength;
    }
  } finally {
    try { void reader.cancel().catch(() => {}); } catch { /* Do not wait for a hostile stream. */ }
    try { reader.releaseLock(); } catch { /* A pending read may retain the lock. */ }
  }
}

function errorProjection(status: number, body: unknown): ModeratorClientFailure | null {
  if (!object(body, ['ok', 'error']) || body.ok !== false) return null;
  const errors: Record<number, readonly string[]> = {
    400: ['invalid_request'], 401: ['unauthenticated'], 403: ['forbidden'], 408: ['request_timeout'],
    409: ['conflict'], 429: ['limited'], 503: ['unavailable', 'outcome_unknown'],
  };
  return typeof body.error === 'string' && errors[status]?.includes(body.error) ? failure(body.error as ModeratorClientError) : null;
}

/** Browser-only ephemeral session. Server Auth plus database allowlisting authorize every call. */
export function createModeratorClient({ transport = fetch, now = Date.now }: {
  transport?: typeof fetch; now?: () => number;
} = {}): ModeratorClientContract {
  let token: string | null = null;
  let expiry: number | null = null;
  let epoch = 0;
  let mutation: object | null = null;
  const running = new Set<(error: ModeratorClientError) => void>();
  const clock = () => {
    const value = now();
    if (!Number.isSafeInteger(value) || value < 0) throw Error('invalid_clock');
    return value;
  };
  const invalidate = (error: ModeratorClientError = 'unauthenticated') => {
    epoch++; token = null; expiry = null;
    for (const stop of [...running]) stop(error);
  };
  const expiresAt = (): number | null => {
    try {
      if (expiry !== null && expiry <= clock()) invalidate();
      return expiry;
    } catch { invalidate(); return null; }
  };

  type Wire = ModeratorClientFailure | { ok: true; body: unknown };
  async function exchange(path: string, body: object, bearer: string | null, mode: 'login' | 'logout' | 'read' | 'decision'): Promise<Wire> {
    const generation = epoch;
    const controller = new AbortController();
    const start = performance.now();
    let error: ModeratorClientError = 'unavailable';
    let dispatched = false;
    let reject!: () => void;
    const ended = new Promise<never>((_, fail) => { reject = () => fail(Error('ended')); });
    void ended.catch(() => {});
    const stop = (code: ModeratorClientError) => {
      if (controller.signal.aborted) return;
      error = code; reject(); controller.abort();
    };
    running.add(stop);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      if (generation !== epoch) stop('unauthenticated');
      if ((mode === 'read' || mode === 'decision') && expiresAt() === null) stop('unauthenticated');
      if (performance.now() - start >= MODERATOR_CLIENT_TIMEOUT_MS) stop('request_timeout');
      controller.signal.throwIfAborted();
    };
    const deadline: Deadline = { signal: controller.signal, check, wait: promise => Promise.race([ended, promise]) };
    try {
      const remaining = mode === 'read' || mode === 'decision' ? (expiry ?? clock()) - clock() : Infinity;
      timer = setTimeout(() => {
        if (remaining <= MODERATOR_CLIENT_TIMEOUT_MS && generation === epoch) invalidate();
        else stop('request_timeout');
      }, Math.max(0, Math.min(MODERATOR_CLIENT_TIMEOUT_MS, remaining)));
      check();
      const serialized = JSON.stringify(body);
      if (encoder.encode(serialized).length > 8192) return failure('invalid_request');
      const init: RequestInit = { method: 'POST', body: serialized, signal: controller.signal, credentials: 'omit',
        cache: 'no-store', redirect: 'error', referrerPolicy: 'same-origin', headers: {
          'Content-Type': 'application/json', Accept: 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        } };
      dispatched = true;
      const response = await deadline.wait(Promise.resolve(transport(path, init)).then(value => {
        if (controller.signal.aborted || generation !== epoch) cancelBody(value);
        return value;
      }));
      check();
      if (response.redirected || (response.url && (typeof location === 'undefined' || response.url !== `${location.origin}${path}`))) {
        cancelBody(response); throw Error('unexpected_url');
      }
      if (response.status === 401 || response.status === 403) {
        const denied = response.status === 401 ? 'unauthenticated' : 'forbidden';
        cancelBody(response); invalidate(denied); check();
      }
      const value = await deadline.wait(readJson(response, deadline));
      check();
      return response.status === 200 ? { ok: true, body: value }
        : errorProjection(response.status, value) ?? failure(mode === 'decision' ? 'outcome_unknown' : 'unavailable');
    } catch {
      return failure(mode === 'decision' && dispatched ? 'outcome_unknown' : error);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      running.delete(stop);
      // Settled operations must not leave their transport alive after parsing/validation fails.
      controller.abort();
    }
  }

  async function login(email: string, password: string): ReturnType<ModeratorClient['login']> {
    invalidate();
    const generation = epoch;
    try {
      if (!text(email, 254) || email.length > 254 || !text(password, 1024) || !password
        || password.length > 1024 || encoder.encode(password).byteLength > 1024) return failure('invalid_request');
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail.length > 254 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.exec(normalizedEmail)?.[0] !== normalizedEmail) return failure('invalid_request');
      const result = await exchange('/api/moderation/login', { email: normalizedEmail, password }, null, 'login');
      if (generation !== epoch) return result.ok ? failure('unauthenticated') : result;
      if (!result.ok) return result;
      const session = loginProjection(result.body, clock());
      if (generation !== epoch) return failure('unauthenticated');
      if (!session) return failure('unavailable');
      token = session.token; expiry = session.ms;
      return Object.freeze({ ok: true, expiresAt: session.expiry });
    } catch { return failure('unavailable'); }
  }

  async function logout(): ReturnType<ModeratorClient['logout']> {
    const previous = token;
    invalidate();
    if (!previous) return Object.freeze({ ok: true });
    const result = await exchange('/api/moderation/logout', {}, previous, 'logout');
    if (!result.ok) return result;
    return object(result.body, ['ok']) && result.body.ok === true ? Object.freeze({ ok: true }) : failure('unavailable');
  }

  async function queue(request: ModerationQueueRequest): ReturnType<ModeratorClient['queue']> {
    try {
      if (expiresAt() === null || !token) return failure('unauthenticated');
      const input = queueInput(request);
      if (!input) return failure('invalid_request');
      const generation = epoch;
      const result = await exchange('/api/moderation/queue', input, token, 'read');
      if (generation !== epoch || expiresAt() === null) return result.ok ? failure('unauthenticated') : result;
      return result.ok ? queueProjection(result.body, input, clock()) : result;
    } catch { return failure('unavailable'); }
  }

  async function context(receipt_id: string): ReturnType<ModeratorClient['context']> {
    try {
      if (expiresAt() === null || !token) return failure('unauthenticated');
      if (!uuid(receipt_id)) return failure('invalid_request');
      const generation = epoch;
      const result = await exchange('/api/moderation/context', { receipt_id }, token, 'read');
      if (generation !== epoch || expiresAt() === null) return result.ok ? failure('unauthenticated') : result;
      return result.ok ? contextProjection(result.body, receipt_id) : result;
    } catch { return failure('unavailable'); }
  }

  async function decide(command: ModerationCommand): ReturnType<ModeratorClient['decide']> {
    let owner: object | null = null;
    let dispatched = false;
    try {
      if (expiresAt() === null || !token) return failure('unauthenticated');
      const input = decisionInput(command);
      if (!input) return failure('invalid_request');
      if (mutation) return failure('limited');
      mutation = owner = {};
      const generation = epoch;
      dispatched = true;
      const result = await exchange('/api/moderation/decision', input, token, 'decision');
      if (generation !== epoch || expiresAt() === null) return failure('outcome_unknown');
      return result.ok ? decisionProjection(result.body, input) : result;
    } catch { return failure(dispatched ? 'outcome_unknown' : 'unavailable'); }
    finally { if (owner && mutation === owner) mutation = null; }
  }

  return Object.freeze({ login, logout, clear: () => invalidate(), expiresAt, queue, context, decide });
}
