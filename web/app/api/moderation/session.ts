import { createHash } from 'node:crypto';
import project from '../../../lib/report-project.json';
import type { ReportStoreConfig } from '../reports/store';
import { authenticateModerator } from './auth';
import { readModeratorQueue } from './store';
import { MAX_MODERATION_BODY_BYTES, MODERATION_REQUEST_TIMEOUT_MS,
  MODERATION_RESPONSE_HEADERS, moderationMethodNotAllowed } from './http';

export const MAX_MODERATOR_SESSION_REPLY_BYTES = 32768;
type Environment = Readonly<Record<string, string | undefined>>;
type ErrorCode = 'invalid_request' | 'unauthenticated' | 'unavailable' | 'limited' | 'request_timeout';
export interface ModeratorSessionDependencies {
  env?: Environment;
  transport?: typeof fetch;
  now?: () => number;
  admitAttempt?: (time: number) => boolean;
  admitLogoutAttempt?: (tokenHash: string, time: number) => boolean;
}
interface Settings { origin: string; store: ReportStoreConfig }
interface Deadline { signal: AbortSignal; wait<T>(promise: Promise<T>): Promise<T> }

/** Six attempts per warm instance/minute, not a distributed budget or authorization. No identities are retained. */
export function createModeratorLoginLimiter(): (time: number) => boolean {
  let minute = -1, count = 0;
  return time => {
    const current = Math.floor(time / 60000);
    if (!Number.isSafeInteger(current) || current < 0 || current < minute) return false;
    if (current > minute) { minute = current; count = 0; }
    if (count >= 6) return false;
    count++;
    return true;
  };
}
const loginLimiter = createModeratorLoginLimiter();

/** Separate logout shield: at most 30 hashes/minute, six attempts/hash. Not a global quota or proof of revocation. */
export function createModeratorLogoutLimiter(): (tokenHash: string, time: number) => boolean {
  let minute = -1, total = 0;
  const counts = new Map<string, number>();
  return (tokenHash, time) => {
    const current = Math.floor(time / 60000);
    if (!Number.isSafeInteger(current) || current < 0 || current < minute
      || typeof tokenHash !== 'string' || /^[0-9a-f]{64}$/.exec(tokenHash)?.[0] !== tokenHash) return false;
    if (current > minute) { minute = current; total = 0; counts.clear(); }
    const count = counts.get(tokenHash) ?? 0;
    if (total >= 30 || count >= 6) return false;
    total++; counts.set(tokenHash, count + 1);
    return true;
  };
}
const logoutLimiter = createModeratorLogoutLimiter();

function settings(env: Environment): Settings | null {
  if (typeof window !== 'undefined' || env.SHIOK_MODERATION_ENABLED !== 'true' || env.VERCEL !== '1'
    || env.NODE_ENV !== 'production' || !['production', 'preview'].includes(env.VERCEL_ENV ?? '')
    || env.SHIOK_REPORTS_PROJECT_URL !== project.projectUrl
    || typeof env.SHIOK_REPORTS_SECRET_KEY !== 'string'
    || !/^(sb_secret_[A-Za-z0-9_-]{16,256}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.test(env.SHIOK_REPORTS_SECRET_KEY ?? '')) return null;
  const origin = env.SHIOK_REPORTS_ORIGIN;
  try {
    const url = new URL(origin ?? '');
    if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) return null;
  } catch { return null; }
  return { origin: origin!, store: { projectUrl: project.projectUrl, secretKey: env.SHIOK_REPORTS_SECRET_KEY! } };
}
function reply(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: MODERATION_RESPONSE_HEADERS });
}
function failure(error: ErrorCode): Response {
  return reply({ invalid_request: 400, unauthenticated: 401, unavailable: 503, limited: 429, request_timeout: 408 }[error], { ok: false, error });
}
function cancel(body: ReadableStream<Uint8Array> | null): void {
  try { if (!body?.locked) void body?.cancel().catch(() => {}); } catch { /* Cancellation cannot extend the deadline. */ }
}
function plainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}
function scalarText(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (code === 0 || (code >= 0xd800 && code <= 0xdfff)) return false;
  }
  return true;
}
function email(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 254 || !scalarText(value)) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.exec(normalized)?.[0] === normalized ? normalized : null;
}
function password(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 1024 && scalarText(value)
    && Buffer.byteLength(value, 'utf8') <= 1024;
}
function bearer(value: string): string | null {
  return value.length <= 8199 && /^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.exec(value)?.[0] === value
    ? value.slice(7) : null;
}

async function jsonBody(body: ReadableStream<Uint8Array> | null, max: number, deadline: Deadline): Promise<unknown> {
  const reader = body?.getReader();
  if (!reader) throw Error('invalid_body');
  const bytes = new Uint8Array(max);
  let size = 0;
  try {
    while (true) {
      deadline.signal.throwIfAborted();
      const part = await deadline.wait(reader.read());
      deadline.signal.throwIfAborted();
      if (part.done) break;
      if (!(part.value instanceof Uint8Array) || !part.value.byteLength || part.value.byteLength > max - size) throw Error('invalid_body');
      bytes.set(part.value, size); size += part.value.byteLength;
    }
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, size));
    const value: unknown = JSON.parse(text);
    const members = (json: string) => [...json.matchAll(/"(?:[^"\\]|\\[\s\S])*"|(:)/g)].filter(match => match[1]).length;
    if (members(text) !== members(JSON.stringify(value))) throw Error('invalid_body');
    return value;
  } finally {
    try { void reader.cancel().catch(() => {}); } catch { /* Suppress transport errors. */ }
    try { reader.releaseLock(); } catch { /* A non-cooperative read may still be pending. */ }
  }
}

function ingress(request: Request, config: Settings, operation: 'login' | 'logout'): boolean {
  const url = new URL(request.url), site = request.headers.get('sec-fetch-site');
  const length = request.headers.get('content-length');
  return url.origin === config.origin && request.headers.get('origin') === config.origin
    && (site === null || site === 'same-origin') && !url.search && url.pathname === `/api/moderation/${operation}`
    && /^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')
    && ['', 'identity'].includes(request.headers.get('content-encoding') ?? '')
    && (length === null || (/^(0|[1-9][0-9]{0,8})$/.exec(length)?.[0] === length && Number(length) <= MAX_MODERATION_BODY_BYTES));
}

async function session(request: Request, operation: 'login' | 'logout', dependencies: ModeratorSessionDependencies): Promise<Response> {
  if (request.method !== 'POST') return moderationMethodNotAllowed(request);
  const reject = (error: ErrorCode) => { cancel(request.body); return failure(error); };
  const env = dependencies.env ?? process.env;
  const config = settings(env);
  if (!config) return reject('unavailable');
  if (!ingress(request, config, operation)) return reject('invalid_request');
  const owner = operation === 'login' ? email(env.SHIOK_MODERATOR_EMAIL) : null;
  if (operation === 'login' && !owner) return reject('unavailable');
  const logoutToken = operation === 'logout' ? bearer(request.headers.get('authorization') ?? '') : null;
  if (operation === 'logout' && !logoutToken) return reject('unauthenticated');
  if (request.signal.aborted) return reject('request_timeout');
  const now = dependencies.now ?? Date.now;
  if (operation === 'login') {
    try { if (!(dependencies.admitAttempt ?? loginLimiter)(now())) return reject('limited'); }
    catch { return reject('unavailable'); }
  } else {
    try {
      const tokenHash = createHash('sha256').update(logoutToken!).digest('hex');
      if (!(dependencies.admitLogoutAttempt ?? logoutLimiter)(tokenHash, now())) return reject('limited');
    } catch { return reject('unavailable'); }
  }
  const controller = new AbortController();
  let rejectDeadline!: (error: Error) => void;
  const ended = new Promise<never>((_, fail) => { rejectDeadline = fail; });
  let logoutDispatched = false;
  const stop = () => { controller.abort(); rejectDeadline(Error('request_timeout')); };
  const deadline: Deadline = { signal: controller.signal, wait: promise => Promise.race([ended, promise]) };
  request.signal.addEventListener('abort', stop, { once: true });
  const timer = setTimeout(stop, MODERATION_REQUEST_TIMEOUT_MS);
  const transport: typeof fetch = async (input, init) => {
    controller.signal.throwIfAborted();
    const url = String(input);
    const response = await deadline.wait(Promise.resolve((dependencies.transport ?? fetch)(input, init)).then(value => {
      if (controller.signal.aborted || init?.signal?.aborted) cancel(value.body);
      return value;
    }));
    controller.signal.throwIfAborted();
    if (response.redirected || (response.url && response.url !== url)) { cancel(response.body); throw Error('unavailable'); }
    // The shared Auth verifier has its own 16 KiB cap; enforce strict JSON before passing it on.
    if (url === `${project.projectUrl}/auth/v1/user` && response.status === 200) {
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type') ?? '')) {
        cancel(response.body); throw Error('unavailable');
      }
      const body = await jsonBody(response.body, 16384, deadline);
      return Response.json(body);
    }
    return response;
  };
  try {
    return await deadline.wait((async () => {
      let body: unknown;
      try { body = await jsonBody(request.body, MAX_MODERATION_BODY_BYTES, deadline); }
      catch { controller.signal.throwIfAborted(); return failure('invalid_request'); }
      controller.signal.throwIfAborted();
      if (!plainObject(body)) return failure('invalid_request');
      if (operation === 'logout') {
        if (Object.keys(body).length) return failure('invalid_request');
        // Revoked moderators must still be able to sign out. Auth validates the bearer; no queue/allowlist check.
        logoutDispatched = true;
        const response = await transport(`${project.projectUrl}/auth/v1/logout?scope=local`, {
          method: 'POST', cache: 'no-store', redirect: 'error', credentials: 'omit', signal: controller.signal,
          headers: { apikey: config.store.secretKey, Authorization: `Bearer ${logoutToken}` },
        });
        cancel(response.body);
        controller.signal.throwIfAborted();
        return response.status === 204 ? reply(200, { ok: true }) : failure('unavailable');
      }
      if (Object.keys(body).length !== 2 || !Object.hasOwn(body, 'email') || !Object.hasOwn(body, 'password')
        || !email(body.email) || !password(body.password)) return failure('invalid_request');
      if (email(body.email) !== owner) return failure('unauthenticated');
      // This can create an Auth session. Lost acknowledgement is never automatically retried or called a confirmed cleanup.
      const response = await transport(`${project.projectUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST', cache: 'no-store', redirect: 'error', credentials: 'omit', signal: controller.signal,
        headers: { apikey: config.store.secretKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: owner, password: body.password }),
      });
      controller.signal.throwIfAborted();
      if (response.status !== 200) {
        cancel(response.body);
        return failure([400, 401, 403, 422].includes(response.status) ? 'unauthenticated' : response.status === 429 ? 'limited' : 'unavailable');
      }
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type') ?? '')) {
        cancel(response.body); return failure('unavailable');
      }
      const value = await jsonBody(response.body, MAX_MODERATOR_SESSION_REPLY_BYTES, deadline);
      if (!plainObject(value) || typeof value.access_token !== 'string' || !bearer(`Bearer ${value.access_token}`)
        || value.token_type !== 'bearer' || !Number.isSafeInteger(value.expires_in)
        || (value.expires_in as number) < 1 || (value.expires_in as number) > 3600
        || (value.expires_at !== undefined && !Number.isSafeInteger(value.expires_at))) return failure('unavailable');
      const token = value.access_token;
      const auth = await authenticateModerator(config.store, token, controller.signal, transport, now);
      controller.signal.throwIfAborted();
      if (!auth.ok) return failure(auth.error);
      if (value.expires_at !== undefined && value.expires_at !== Date.parse(auth.identity.tokenExpiresAt) / 1000) return failure('unavailable');
      const authorized = await readModeratorQueue(config.store, auth.identity, { state: 'pending' }, controller.signal, transport);
      controller.signal.throwIfAborted();
      if (!authorized.ok) return failure(authorized.error === 'forbidden' ? 'unauthenticated' : 'unavailable');
      if (Date.parse(auth.identity.tokenExpiresAt) <= now()) return failure('unauthenticated');
      // Neither token-response user metadata nor the owner-email shield confers database authority.
      return reply(200, { ok: true, accessToken: token, expiresAt: auth.identity.tokenExpiresAt });
    })());
  } catch { return failure(controller.signal.aborted && !logoutDispatched ? 'request_timeout' : 'unavailable'); }
  finally { clearTimeout(timer); request.signal.removeEventListener('abort', stop); stop(); }
}

export function handleModeratorLogin(request: Request, dependencies: ModeratorSessionDependencies = {}): Promise<Response> {
  return session(request, 'login', dependencies);
}
export function handleModeratorLogout(request: Request, dependencies: ModeratorSessionDependencies = {}): Promise<Response> {
  return session(request, 'logout', dependencies);
}
