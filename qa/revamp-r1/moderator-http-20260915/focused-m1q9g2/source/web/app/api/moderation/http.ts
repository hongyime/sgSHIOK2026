import { createHash } from 'node:crypto';
import project from '../../../lib/report-project.json';
import { authenticateModerator } from './auth';
import { decideModeratorReport, readModeratorQueue, readModeratorContext,
  validateModerationCommand, validateModerationQueueRequest, validateModerationContextRequest } from './store';
import type { ReportStoreConfig } from '../reports/store';

export const MODERATION_REQUEST_TIMEOUT_MS = 15000;
export const MAX_MODERATION_BODY_BYTES = 8192;
export const MODERATION_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  Vary: 'Authorization, Origin',
};
type Operation = 'queue' | 'decision' | 'context';
type Environment = Readonly<Record<string, string | undefined>>;
interface Config { origin: string; store: ReportStoreConfig }
interface Dependencies {
  env?: Environment;
  transport?: typeof fetch;
  now?: () => number;
  admitAttempt?: (tokenHash: string, time: number) => boolean;
}

/** Warm-instance pressure limit only, not an account-wide quota or authorization. */
export function createModeratorAttemptLimiter(): (tokenHash: string, time: number) => boolean {
  let minute = -1;
  let total = 0;
  const counts = new Map<string, number>();
  return (tokenHash, time) => {
    const current = Math.floor(time / 60000);
    if (!Number.isSafeInteger(current) || current < 0 || current < minute) return false;
    if (current > minute) { minute = current; total = 0; counts.clear(); }
    const count = counts.get(tokenHash) ?? 0;
    if (total >= 60 || count >= 30) return false;
    total++; counts.set(tokenHash, count + 1);
    return true;
  };
}
const admitAttempt = createModeratorAttemptLimiter();

function config(env: Environment): Config | null {
  // Moderator access and resident intake have separate switches. This does not enable either.
  if (env.SHIOK_MODERATION_ENABLED !== 'true' || env.VERCEL !== '1' || env.NODE_ENV !== 'production'
    || !['production', 'preview'].includes(env.VERCEL_ENV ?? '')
    || env.SHIOK_REPORTS_PROJECT_URL !== project.projectUrl
    || !/^sb_secret_[A-Za-z0-9_-]{16,256}$/.test(env.SHIOK_REPORTS_SECRET_KEY ?? '')
    || /\s/.test(env.SHIOK_REPORTS_SECRET_KEY ?? '')) return null;
  const origin = env.SHIOK_REPORTS_ORIGIN;
  try {
    const url = new URL(origin ?? '');
    if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) return null;
  } catch { return null; }
  return { origin: origin!, store: { projectUrl: project.projectUrl, secretKey: env.SHIOK_REPORTS_SECRET_KEY! } };
}

function response(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: MODERATION_RESPONSE_HEADERS });
}
function cancelBody(request: Request): void {
  if (!request.body?.locked) void request.body?.cancel().catch(() => {});
}

export function moderationMethodNotAllowed(request: Request): Response {
  cancelBody(request);
  return new Response(request.method === 'HEAD' ? null : JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405, headers: { ...MODERATION_RESPONSE_HEADERS, Allow: 'POST', 'Content-Type': 'application/json' },
  });
}

async function readBody(request: Request, signal: AbortSignal): Promise<{ ok: true; value: unknown } | { ok: false; status: number }> {
  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400 };
  const bytes = new Uint8Array(MAX_MODERATION_BODY_BYTES);
  let length = 0;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) break;
      if (!(part.value instanceof Uint8Array)) return { ok: false, status: 400 };
      if (part.value.byteLength > bytes.length - length) return { ok: false, status: 413 };
      bytes.set(part.value, length); length += part.value.byteLength;
    }
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, length));
    const value: unknown = JSON.parse(text);
    // Preserve the report parser's rejection of duplicate JSON members, including escaped names.
    const members = (json: string) => [...json.matchAll(/"(?:[^"\\]|\\[\s\S])*"|(:)/g)].filter(m => m[1]).length;
    if (members(text) !== members(JSON.stringify(value))) return { ok: false, status: 400 };
    return { ok: true, value };
  } catch { return { ok: false, status: 400 }; }
  finally { cancel(); signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

/** Bearer-only private HTTP boundary. Auth verifies; each database RPC independently authorizes. */
export async function handleModerationPost(request: Request, operation: Operation, dependencies: Dependencies = {}): Promise<Response> {
  if (request.method !== 'POST') return moderationMethodNotAllowed(request);
  const reject = (status: number, error: string) => { cancelBody(request); return response(status, { ok: false, error }); };
  const settings = config(dependencies.env ?? process.env);
  if (!settings) return reject(503, 'unavailable');
  const url = new URL(request.url);
  const site = request.headers.get('sec-fetch-site');
  if (url.origin !== settings.origin || request.headers.get('origin') !== settings.origin
    || (site !== null && site !== 'same-origin')) return reject(403, 'forbidden');
  if (url.search || url.pathname !== `/api/moderation/${operation}`) return reject(400, 'invalid_request');
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')
    || !['', 'identity'].includes(request.headers.get('content-encoding') ?? '')) return reject(415, 'unsupported_media_type');
  const length = request.headers.get('content-length');
  if (length !== null && !/^(0|[1-9][0-9]{0,8})$/.test(length)) return reject(400, 'invalid_request');
  if (length !== null && Number(length) > MAX_MODERATION_BODY_BYTES) return reject(413, 'body_too_large');
  const authorization = request.headers.get('authorization') ?? '';
  if (authorization.length > 8199 || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization)) {
    return reject(401, 'unauthenticated');
  }
  if (request.signal.aborted) return reject(408, 'request_timeout');
  const token = authorization.slice(7);
  const now = dependencies.now ?? Date.now;
  try {
    const hash = createHash('sha256').update(token).digest('hex');
    if (!(dependencies.admitAttempt ?? admitAttempt)(hash, now())) return reject(429, 'limited');
  } catch { return reject(503, 'unavailable'); }

  const controller = new AbortController();
  let dispatched = false;
  let end!: (value: Response) => void;
  const ended = new Promise<Response>(resolve => { end = resolve; });
  const stop = () => {
    end(response(dispatched ? 503 : 408, { ok: false, error: dispatched ? 'outcome_unknown' : 'request_timeout' }));
    controller.abort();
  };
  request.signal.addEventListener('abort', stop, { once: true });
  const timer = setTimeout(stop, MODERATION_REQUEST_TIMEOUT_MS);
  try {
    return await Promise.race([ended, (async () => {
      const body = await readBody(request, controller.signal);
      controller.signal.throwIfAborted();
      if (!body.ok) return response(body.status, { ok: false, error: body.status === 413 ? 'body_too_large' : 'invalid_request' });
      const valid = operation === 'queue' ? validateModerationQueueRequest(body.value)
        : operation === 'context' ? validateModerationContextRequest(body.value) : validateModerationCommand(body.value);
      if (!valid) return response(400, { ok: false, error: 'invalid_request' });
      const auth = await authenticateModerator(settings.store, token, controller.signal, dependencies.transport, now);
      controller.signal.throwIfAborted();
      if (!auth.ok) return response(auth.error === 'unauthenticated' ? 401 : 503, { ok: false, error: auth.error });
      const result = operation === 'queue' && validateModerationQueueRequest(body.value)
        ? await readModeratorQueue(settings.store, auth.identity, body.value, controller.signal, dependencies.transport)
        : operation === 'context' && validateModerationContextRequest(body.value)
          ? await readModeratorContext(settings.store, auth.identity, body.value, controller.signal, dependencies.transport)
        : operation === 'decision' && validateModerationCommand(body.value)
          ? await decideModeratorReport(settings.store, auth.identity, body.value, controller.signal, dependencies.transport, () => {
            controller.signal.throwIfAborted(); dispatched = true;
          }) : { ok: false as const, error: 'invalid_request' as const };
      controller.signal.throwIfAborted();
      if (result.ok) return response(200, result);
      const status = result.error === 'forbidden' ? 403 : result.error === 'conflict' ? 409
        : result.error === 'invalid_request' ? 400 : 503;
      return response(status, { ok: false, error: result.error });
    })()]);
  } catch { return response(503, { ok: false, error: dispatched ? 'outcome_unknown' : 'unavailable' }); }
  finally { clearTimeout(timer); request.signal.removeEventListener('abort', stop); }
}
