import project from '../../../lib/report-project.json';
import type { ReportStoreConfig } from '../reports/store';

export const MODERATOR_AUTH_TIMEOUT_MS = 5000;
const MAX_AUTH_REPLY = 16384;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Authentication only. The database must independently authorize the live session. */
export interface VerifiedModeratorIdentity {
  readonly actor: string;
  readonly session: string;
  readonly tokenExpiresAt: string;
}
export type ModeratorAuthentication =
  | { readonly ok: true; readonly identity: VerifiedModeratorIdentity }
  | { readonly ok: false; readonly error: 'unauthenticated' | 'unavailable' };

function claims(token: unknown, now: number): { sub: string; session_id: string; exp: number } | null {
  if (typeof token !== 'string' || token.length > 8192 || !Number.isFinite(now)) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const value = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!header || !['ES256', 'RS256', 'HS256'].includes(header.alg)
      || !value || typeof value !== 'object' || Array.isArray(value)
      || typeof value.sub !== 'string' || !UUID.test(value.sub)
      || typeof value.session_id !== 'string' || !UUID.test(value.session_id)
      || value.iss !== `${project.projectUrl}/auth/v1` || value.aud !== 'authenticated'
      || value.role !== 'authenticated' || value.is_anonymous !== false
      || !Number.isSafeInteger(value.exp) || value.exp * 1000 <= now || value.exp * 1000 > now + 3600000
      || !Number.isSafeInteger(value.iat) || value.iat < 0 || value.iat * 1000 > now || value.iat >= value.exp
      || (value.nbf !== undefined && (!Number.isSafeInteger(value.nbf) || value.nbf * 1000 > now))) return null;
    return { sub: value.sub, session_id: value.session_id, exp: value.exp };
  } catch { return null; }
}

async function userBody(response: Response, signal: AbortSignal): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw Error('unavailable');
  const bytes = new Uint8Array(MAX_AUTH_REPLY);
  let size = 0;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, size)));
      if (!(part.value instanceof Uint8Array) || part.value.byteLength === 0
        || part.value.byteLength > bytes.length - size) throw Error('unavailable');
      bytes.set(part.value, size); size += part.value.byteLength;
    }
  } finally { cancel(); signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

/** No JWT signature is trusted locally: Auth must verify this exact token first. */
export async function authenticateModerator(
  config: ReportStoreConfig, accessToken: unknown, caller: AbortSignal,
  transport: typeof fetch = fetch, now: () => number = Date.now,
): Promise<ModeratorAuthentication> {
  if (config.projectUrl !== project.projectUrl || !/^(sb_secret_[A-Za-z0-9_-]{16,256}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.test(config.secretKey)) {
    return { ok: false, error: 'unavailable' };
  }
  const unverified = claims(accessToken, now());
  if (!unverified) return { ok: false, error: 'unauthenticated' };
  if (caller.aborted) return { ok: false, error: 'unavailable' };
  const controller = new AbortController();
  let reject!: (error: Error) => void;
  const ended = new Promise<never>((_, fail) => { reject = fail; });
  const stop = () => { reject(Error('ended')); controller.abort(); };
  caller.addEventListener('abort', stop, { once: true });
  const timer = setTimeout(stop, MODERATOR_AUTH_TIMEOUT_MS);
  try {
    return await Promise.race([ended, (async (): Promise<ModeratorAuthentication> => {
      controller.signal.throwIfAborted();
      const response = await transport(`${project.projectUrl}/auth/v1/user`, {
        method: 'GET', cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { apikey: config.secretKey, Authorization: `Bearer ${accessToken}` },
      });
      if (controller.signal.aborted) { void response.body?.cancel().catch(() => {}); controller.signal.throwIfAborted(); }
      if (response.status !== 200) {
        void response.body?.cancel().catch(() => {});
        return { ok: false, error: response.status === 401 || response.status === 403 ? 'unauthenticated' : 'unavailable' };
      }
      const body = await userBody(response, controller.signal);
      controller.signal.throwIfAborted();
      const verified = claims(accessToken, now());
      if (!verified || !body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'unauthenticated' };
      const user = body as Record<string, unknown>;
      if (user.id !== verified.sub || user.is_anonymous !== false || user.aud !== 'authenticated'
        || user.role !== 'authenticated' || (user.deleted_at !== undefined && user.deleted_at !== null)) {
        return { ok: false, error: 'unauthenticated' };
      }
      // Do not pass tokens, emails, metadata or provider responses to queue/audit/logging.
      return { ok: true, identity: Object.freeze({ actor: verified.sub, session: verified.session_id,
        tokenExpiresAt: new Date(verified.exp * 1000).toISOString() }) };
    })()]);
  } catch { return { ok: false, error: 'unavailable' }; }
  finally { clearTimeout(timer); caller.removeEventListener('abort', stop); }
}
