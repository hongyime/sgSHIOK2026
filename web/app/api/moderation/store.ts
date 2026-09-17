import { Buffer } from 'node:buffer';
import project from '../../../lib/report-project.json';
import { validateReport, type Report } from '../../../lib/reports';
import { planReportModeration, MAX_REPORT_DUPLICATE_HOPS, type ReportModerationState } from '../../../lib/report-lifecycle';
import type { ReportStoreConfig } from '../reports/store';
import type { VerifiedModeratorIdentity } from './auth';

export const MODERATOR_STORE_TIMEOUT_MS = 8000;
// 25 decided reports also carry up to 6,000 JSON-escaped reason bytes apiece.
export const MAX_MODERATOR_REPLY_BYTES = 384 * 1024;
type State = 'pending' | 'accepted' | 'rejected' | 'duplicate';
type Action = Exclude<State, 'pending'>;
type ErrorCode = 'invalid_request' | 'forbidden' | 'conflict' | 'unavailable' | 'outcome_unknown';
type Failure = { readonly ok: false; readonly error: ErrorCode };
export interface ModerationQueueRequest {
  state: State;
  after?: { received_at: string; receipt_id: string };
}
export interface ModerationCommand {
  receipt_id: string;
  expected_revision: number;
  action: Action;
  reason: string;
  duplicate_of?: string;
}
export interface ModerationContextRequest { receipt_id: string }
export interface ModeratorContextSource {
  readonly receipt_id: string;
  readonly report_type: Report['report_type'];
  readonly state: State;
  readonly revision: number;
  readonly received_at: string;
  readonly moderated_at: string | null;
  readonly moderator_id: string | null;
  readonly reason: string | null;
  readonly duplicate_of: string | null;
}
export type ModeratorContextResult = Failure | {
  readonly ok: true;
  // The RPC's required-empty target_chain is deliberately not exposed.
  readonly context: { readonly source: ModeratorContextSource; readonly observed_at: string };
};
export interface ModeratorQueueReport {
  readonly receipt_id: string;
  readonly report_type: Report['report_type'];
  readonly state: State;
  readonly revision: number;
  readonly received_at: string;
  readonly expires_at: string;
  readonly content: Omit<Report, 'client_request_id'>;
  readonly moderation: null | {
    readonly moderated_at: string;
    readonly moderator_id: string;
    readonly reason: string;
    readonly duplicate_of: string | null;
  };
}
export type ModeratorQueueResult = Failure | {
  readonly ok: true;
  readonly queue: { readonly reports: readonly ModeratorQueueReport[]; readonly page_limit: 25 };
};
export type ModeratorDecisionResult = Failure | {
  readonly ok: true;
  readonly decision: { readonly receipt_id: string; readonly state: Action; readonly revision: number; readonly moderated_at: string };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const COMMON = ['receipt_id', 'report_type', 'state', 'revision', 'received_at'];
const AUDIT = ['moderated_at', 'moderator_id', 'reason', 'duplicate_of'];
const CONTENT = ['schema_version', 'report_type', 'geometry', 'referenced_bundle_version', 'context', 'note'];
const COMMAND = ['receipt_id', 'expected_revision', 'action', 'reason'];
const RETENTION_US = BigInt(30 * 24 * 60 * 60 * 1000) * BigInt(1000);
const failure = (error: ErrorCode): Failure => ({ ok: false, error });
const uuid = (value: unknown): value is string => typeof value === 'string' && value.length === 36 && UUID.test(value);
const action = (value: unknown): value is Action => value === 'accepted' || value === 'rejected' || value === 'duplicate';
const state = (value: unknown): value is State => value === 'pending' || action(value);
const revision = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
const reportType = (value: unknown): value is Report['report_type'] => value === 'mapping_error' || value === 'shelter_request';

function object(value: unknown, allowed: readonly string[], required = allowed): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Reflect.ownKeys(value).every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    return typeof key === 'string' && allowed.includes(key) && descriptor.enumerable && 'value' in descriptor;
  }) && required.every(key => Object.prototype.hasOwnProperty.call(value, key));
}

function reason(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2000 || !value.trim()) return false;
  let count = 0;
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (++count > 1000 || code === 0 || (code >= 0xd800 && code <= 0xdfff)) return false;
  }
  return true;
}

// Keep the original string for keyset pagination. Date.parse alone loses microseconds
// and accepts normalized invalid dates, so compare using an exact UTC microsecond key.
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
  if (us < BigInt(0)) return null;
  return { text: value, us, ms: Number(us / BigInt(1000)) };
}

export function validateModerationQueueRequest(value: unknown): value is ModerationQueueRequest {
  try {
    return object(value, ['state', 'after'], ['state']) && state(value.state)
      && (!('after' in value) || (object(value.after, ['received_at', 'receipt_id'])
        && timestamp(value.after.received_at) !== null && uuid(value.after.receipt_id)));
  } catch { return false; }
}

export function validateModerationCommand(value: unknown): value is ModerationCommand {
  try {
    return object(value, [...COMMAND, 'duplicate_of'], COMMAND) && uuid(value.receipt_id)
      && revision(value.expected_revision) && value.expected_revision < Number.MAX_SAFE_INTEGER
      && action(value.action) && reason(value.reason)
      && (value.action === 'duplicate'
        ? uuid(value.duplicate_of) && value.duplicate_of !== value.receipt_id
        : !('duplicate_of' in value));
  } catch { return false; }
}

export function validateModerationContextRequest(value: unknown): value is ModerationContextRequest {
  try { return object(value, ['receipt_id']) && uuid(value.receipt_id); }
  catch { return false; }
}

function canonicalContent(value: unknown): Omit<Report, 'client_request_id'> | null {
  if (!object(value, CONTENT, CONTENT.slice(0, 4))) return null;
  // Reuse the admission validator without returning or manufacturing a real request ID.
  const checked = validateReport({ ...value, client_request_id: '00000000-0000-7000-8000-000000000000' });
  if (!checked.ok || Buffer.byteLength(checked.canonicalContent, 'utf8') > 8192) return null;
  const { client_request_id: _omitted, ...content } = checked.report;
  return Object.freeze(content);
}

function normalizeState(value: unknown, observed?: bigint): ReportModerationState | null {
  if (!object(value, [...COMMON, ...AUDIT]) || !uuid(value.receipt_id) || !reportType(value.report_type)
    || !state(value.state) || !revision(value.revision)) return null;
  const received = timestamp(value.received_at);
  if (!received || (observed !== undefined && (received.us > observed || received.us + RETENTION_US <= observed))) return null;
  const common = { receipt_id: value.receipt_id, report_type: value.report_type, state: value.state,
    revision: value.revision, received_at: received.ms };
  if (value.state === 'pending') return AUDIT.every(key => value[key] === null) ? common : null;
  const moderated = timestamp(value.moderated_at);
  if (!moderated || moderated.us < received.us || moderated.us >= received.us + RETENTION_US
    || (observed !== undefined && moderated.us > observed) || value.revision < 2
    || !uuid(value.moderator_id) || !reason(value.reason)
    || (value.state === 'duplicate' ? !uuid(value.duplicate_of) || value.duplicate_of === value.receipt_id : value.duplicate_of !== null)) return null;
  return { ...common, moderated_at: moderated.ms, moderator_id: value.moderator_id, reason: value.reason,
    ...(value.state === 'duplicate' ? { duplicate_of: value.duplicate_of as string } : {}) };
}

function queueProjection(body: unknown, request: ModerationQueueRequest): ModeratorQueueResult {
  if (!object(body, ['reports', 'page_limit']) || body.page_limit !== 25 || !Array.isArray(body.reports)
    || body.reports.length > 25) return failure('unavailable');
  let previous = request.after ? { us: timestamp(request.after.received_at)!.us, id: request.after.receipt_id } : undefined;
  const reports: ModeratorQueueReport[] = [];
  const seen = new Set<string>();
  const now = BigInt(Date.now()) * BigInt(1000);
  for (const raw of body.reports) {
    if (!object(raw, [...COMMON, 'expires_at', 'content', 'moderation']) || raw.state !== request.state
      || !uuid(raw.receipt_id) || seen.has(raw.receipt_id)) return failure('unavailable');
    const received = timestamp(raw.received_at), expires = timestamp(raw.expires_at);
    const content = canonicalContent(raw.content);
    if (!received || !expires || expires.us - received.us !== RETENTION_US || expires.us <= now
      || !content || content.report_type !== raw.report_type
      || (previous && (received.us < previous.us || (received.us === previous.us && raw.receipt_id <= previous.id)))) return failure('unavailable');
    const audit = raw.moderation;
    if (audit !== null && !object(audit, AUDIT)) return failure('unavailable');
    const normalized = normalizeState({ receipt_id: raw.receipt_id, report_type: raw.report_type, state: raw.state,
      revision: raw.revision, received_at: raw.received_at,
      ...(audit === null ? { moderated_at: null, moderator_id: null, reason: null, duplicate_of: null } : audit) });
    if (!normalized || (raw.state === 'pending') !== (audit === null)) return failure('unavailable');
    reports.push(Object.freeze({ receipt_id: normalized.receipt_id, report_type: normalized.report_type,
      state: normalized.state, revision: normalized.revision, received_at: received.text, expires_at: expires.text, content,
      moderation: audit === null ? null : Object.freeze({ moderated_at: audit.moderated_at as string,
        moderator_id: audit.moderator_id as string, reason: audit.reason as string, duplicate_of: audit.duplicate_of as string | null }) }));
    previous = { us: received.us, id: raw.receipt_id }; seen.add(raw.receipt_id);
  }
  return { ok: true, queue: { reports: Object.freeze(reports), page_limit: 25 } };
}

type Rpc = 'queue' | 'context' | 'decide';
function rpcFailure(status: number, body: unknown, rpc: Rpc): Failure | null {
  if (!object(body, ['code', 'message', 'details', 'hint']) || body.details !== null || body.hint !== null) return null;
  if (status === 403 && body.code === 'PT403' && body.message === 'moderator_unavailable') return failure('forbidden');
  if (status === 503 && body.code === 'PT503' && body.message === 'moderator_unavailable') return failure('unavailable');
  if (status === 400 && body.code === 'PT400' && body.message === { queue: 'invalid_queue', context: 'invalid_context', decide: 'invalid_decision' }[rpc]) return failure('invalid_request');
  if (rpc !== 'queue' && status === 409 && body.code === 'PT409'
    && ['revision_conflict', 'invalid_duplicate_chain', 'duplicate_target_missing', 'duplicate_type_mismatch'].includes(body.message as string)) return failure('conflict');
  return null;
}

function cancelBody(response: Response): void {
  try { void response.body?.cancel().catch(() => {}); } catch { /* Cancellation never controls the deadline. */ }
}

interface Deadline {
  signal: AbortSignal;
  wait<T>(promise: Promise<T>): Promise<T>;
}
async function jsonBody(response: Response, deadline: Deadline): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw Error('unavailable');
  const bytes = new Uint8Array(MAX_MODERATOR_REPLY_BYTES);
  let size = 0;
  try {
    while (true) {
      deadline.signal.throwIfAborted();
      const part = await deadline.wait(reader.read());
      deadline.signal.throwIfAborted();
      if (part.done) {
        const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, size));
        const value: unknown = JSON.parse(text);
        // Reject duplicate members instead of allowing last-write-wins to conceal fields.
        const members = (json: string) => [...json.matchAll(/"(?:[^"\\]|\\[\s\S])*"|(:)/g)].filter(match => match[1]).length;
        if (members(text) !== members(JSON.stringify(value))) throw Error('unavailable');
        return value;
      }
      // Empty immediate chunks cannot be allowed to starve the deadline timer forever.
      if (!(part.value instanceof Uint8Array) || part.value.byteLength === 0 || part.value.byteLength > bytes.length - size) throw Error('unavailable');
      bytes.set(part.value, size); size += part.value.byteLength;
    }
  } finally {
    try { void reader.cancel().catch(() => {}); } catch { /* No provider errors escape. */ }
    try { reader.releaseLock(); } catch { /* A hostile reader may retain its lock. */ }
  }
}

type RpcResult = Failure | { ok: true; body: unknown };
type Call = (rpc: Rpc, args: Record<string, unknown>) => Promise<RpcResult>;
async function operation<T extends ModeratorQueueResult | ModeratorDecisionResult | ModeratorContextResult>(
  config: ReportStoreConfig, identity: VerifiedModeratorIdentity, caller: AbortSignal, transport: typeof fetch,
  work: (call: Call, identity: VerifiedModeratorIdentity) => Promise<T>, onDispatch?: () => void,
): Promise<T | Failure> {
  let key: string, verified: VerifiedModeratorIdentity;
  try {
    if (typeof window !== 'undefined' || !object(config, ['projectUrl', 'secretKey']) || config.projectUrl !== project.projectUrl
      || typeof config.secretKey !== 'string' || !/^(sb_secret_[A-Za-z0-9_-]{16,256}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.test(config.secretKey)) return failure('unavailable');
    key = config.secretKey;
    if (!object(identity, ['actor', 'session', 'tokenExpiresAt']) || !uuid(identity.actor) || !uuid(identity.session)) return failure('forbidden');
    const expiry = timestamp(identity.tokenExpiresAt), now = Date.now();
    if (!expiry || expiry.ms <= now || expiry.ms > now + 3600000) return failure('forbidden');
    verified = { actor: identity.actor, session: identity.session, tokenExpiresAt: expiry.text };
  } catch { return failure('unavailable'); }
  if (caller.aborted) return failure('unavailable');
  const controller = new AbortController();
  let dispatched = false;
  let reject!: (error: Error) => void;
  const ended = new Promise<never>((_, fail) => { reject = fail; });
  const stop = () => { reject(Error('ended')); controller.abort(); };
  caller.addEventListener('abort', stop, { once: true });
  const timer = setTimeout(stop, MODERATOR_STORE_TIMEOUT_MS);
  const deadline: Deadline = { signal: controller.signal, wait: promise => Promise.race([ended, promise]) };
  const call: Call = async (rpc, args) => {
    controller.signal.throwIfAborted();
    const url = `${project.projectUrl}/rest/v1/rpc/shiok_moderator_${rpc}_v1`;
    const init: RequestInit = { method: 'POST', cache: 'no-store', redirect: 'error', signal: controller.signal,
      headers: { apikey: key, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ p_actor: verified.actor, p_session: verified.session, p_token_expires_at: verified.tokenExpiresAt, ...args }) };
    if (rpc === 'decide') { dispatched = true; onDispatch?.(); }
    controller.signal.throwIfAborted();
    const response = await deadline.wait(Promise.resolve(transport(url, init)).then(value => {
      if (controller.signal.aborted) cancelBody(value);
      return value;
    }));
    controller.signal.throwIfAborted();
    if (response.redirected || (response.url && response.url !== url)) { cancelBody(response); throw Error('unavailable'); }
    const body = await jsonBody(response, deadline);
    controller.signal.throwIfAborted();
    return response.status === 200 ? { ok: true, body }
      : rpcFailure(response.status, body, rpc) ?? failure(dispatched ? 'outcome_unknown' : 'unavailable');
  };
  try { return await deadline.wait(work(call, verified)); }
  catch { return failure(dispatched ? 'outcome_unknown' : 'unavailable'); }
  finally { clearTimeout(timer); caller.removeEventListener('abort', stop); }
}

/** Server-only service gateway. Upstream Auth verification is NOT database authorization. */
export async function readModeratorQueue(
  config: ReportStoreConfig, identity: VerifiedModeratorIdentity, request: ModerationQueueRequest,
  signal: AbortSignal, transport: typeof fetch = fetch,
): Promise<ModeratorQueueResult> {
  if (!validateModerationQueueRequest(request)) return failure('invalid_request');
  const input = { state: request.state, ...(request.after ? { after: { ...request.after } } : {}) };
  return operation(config, identity, signal, transport, async call => {
    const result = await call('queue', { p_state: input.state, p_after_received_at: input.after?.received_at ?? null,
      p_after_receipt_id: input.after?.receipt_id ?? null });
    return result.ok ? queueProjection(result.body, input) : result;
  });
}

/** Receipt-specific reread for reconciliation; never traverses a retained source's old target. */
export async function readModeratorContext(
  config: ReportStoreConfig, identity: VerifiedModeratorIdentity, request: ModerationContextRequest,
  signal: AbortSignal, transport: typeof fetch = fetch,
): Promise<ModeratorContextResult> {
  if (!validateModerationContextRequest(request)) return failure('invalid_request');
  const receipt = request.receipt_id;
  return operation(config, identity, signal, transport, async call => {
    const result = await call('context', { p_receipt: receipt, p_duplicate: null });
    if (!result.ok) return result;
    const body = result.body;
    if (!object(body, ['source', 'target_chain', 'observed_at']) || !Array.isArray(body.target_chain)
      || body.target_chain.length !== 0) return failure('unavailable');
    const observed = timestamp(body.observed_at);
    const normalized = observed && normalizeState(body.source, observed.us);
    if (!observed || !normalized || normalized.receipt_id !== receipt) return failure('unavailable');
    const raw = body.source as Record<string, unknown>;
    return { ok: true, context: { observed_at: observed.text, source: Object.freeze({
      receipt_id: normalized.receipt_id, report_type: normalized.report_type, state: normalized.state,
      revision: normalized.revision, received_at: raw.received_at as string,
      moderated_at: raw.moderated_at as string | null, moderator_id: raw.moderator_id as string | null,
      reason: raw.reason as string | null, duplicate_of: raw.duplicate_of as string | null,
    }) } };
  });
}

/** No retry: a dispatched write without an exact durable reply has an unknown outcome. */
export async function decideModeratorReport(
  config: ReportStoreConfig, identity: VerifiedModeratorIdentity, command: ModerationCommand,
  signal: AbortSignal, transport: typeof fetch = fetch, onDispatch?: () => void,
): Promise<ModeratorDecisionResult> {
  if (!validateModerationCommand(command)) return failure('invalid_request');
  const input = { ...command };
  return operation(config, identity, signal, transport, async (call, verified) => {
    const context = await call('context', { p_receipt: input.receipt_id, p_duplicate: input.duplicate_of ?? null });
    if (!context.ok) return context;
    const body = context.body;
    if (!object(body, ['source', 'target_chain', 'observed_at']) || !Array.isArray(body.target_chain)
      || body.target_chain.length > MAX_REPORT_DUPLICATE_HOPS) return failure('unavailable');
    const observed = timestamp(body.observed_at);
    if (!observed) return failure('unavailable');
    const source = normalizeState(body.source, observed.us);
    const targets = body.target_chain.map(value => normalizeState(value, observed.us));
    if (!source || source.receipt_id !== input.receipt_id || targets.some(value => value === null)) return failure('unavailable');
    const plan = planReportModeration(source, input, { moderator_id: verified.actor, moderated_at: observed.ms }, targets);
    if (!plan.ok) return failure(['revision_conflict', 'terminal_state', 'invalid_duplicate_chain', 'duplicate_target_missing',
      'duplicate_cycle', 'duplicate_type_mismatch'].includes(plan.error) ? 'conflict' : 'unavailable');
    const result = await call('decide', { p_receipt: input.receipt_id, p_revision: input.expected_revision,
      p_action: input.action, p_reason: input.reason, p_duplicate: input.duplicate_of ?? null, p_read_set: plan.readSet });
    if (!result.ok) return result;
    const decision = result.body;
    if (!object(decision, ['receipt_id', 'state', 'revision', 'moderated_at']) || decision.receipt_id !== input.receipt_id
      || decision.state !== input.action || decision.revision !== input.expected_revision + 1) return failure('outcome_unknown');
    const moderated = timestamp(decision.moderated_at);
    const received = timestamp((body.source as Record<string, unknown>).received_at)!;
    if (!moderated || moderated.us < observed.us || moderated.us >= received.us + RETENTION_US) return failure('outcome_unknown');
    return { ok: true, decision: { receipt_id: input.receipt_id, state: input.action,
      revision: input.expected_revision + 1, moderated_at: moderated.text } };
  }, onDispatch);
}
