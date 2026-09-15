import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import { createModeratorLoginLimiter, createModeratorLogoutLimiter, handleModeratorLogin, handleModeratorLogout,
  MAX_MODERATOR_SESSION_REPLY_BYTES, type ModeratorSessionDependencies } from '../../app/api/moderation/session';
import { MODERATION_REQUEST_TIMEOUT_MS, MODERATION_RESPONSE_HEADERS } from '../../app/api/moderation/http';
import * as loginRoute from '../../app/api/moderation/login/route';
import * as logoutRoute from '../../app/api/moderation/logout/route';
import project from '../report-project.json';

const origin = 'https://shiok.example';
const actor = '22345678-1234-4123-8123-123456789abc';
const session = '32345678-1234-4123-8123-123456789abc';
const time = Date.parse('2026-09-15T10:00:00Z');
const env = {
  VERCEL: '1', VERCEL_ENV: 'production', NODE_ENV: 'production', SHIOK_MODERATION_ENABLED: 'true',
  SHIOK_REPORTS_PROJECT_URL: project.projectUrl, SHIOK_REPORTS_ORIGIN: origin,
  SHIOK_REPORTS_SECRET_KEY: ['sb', 'secret', 'synthetic'.repeat(4)].join('_'),
  SHIOK_MODERATOR_EMAIL: 'owner@example.invalid',
};
const credentials = { email: env.SHIOK_MODERATOR_EMAIL, password: ' Synthetic password spaces ' };
const now = () => time;
function jwt(overrides: Record<string, unknown> = {}) {
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ sub: actor, session_id: session, exp: time / 1000 + 600, iat: time / 1000 - 60,
    iss: `${project.projectUrl}/auth/v1`, aud: 'authenticated', role: 'authenticated', is_anonymous: false, ...overrides })).toString('base64url');
  return `${head}.${body}.${createHmac('sha256', 'synthetic-auth-signing-key').update(`${head}.${body}`).digest('base64url')}`;
}
const token = jwt();
const tokenBody = { access_token: token, token_type: 'bearer', expires_in: 600, expires_at: time / 1000 + 600,
  refresh_token: 'discard-this-synthetic-refresh-token', user: { id: actor, email: credentials.email, app_metadata: { role: 'admin' } } };
const user = { id: actor, aud: 'authenticated', role: 'authenticated', is_anonymous: false };
const paths = {
  token: `${project.projectUrl}/auth/v1/token?grant_type=password`, user: `${project.projectUrl}/auth/v1/user`,
  queue: `${project.projectUrl}/rest/v1/rpc/shiok_moderator_queue_v1`, logout: `${project.projectUrl}/auth/v1/logout?scope=local`,
};
function request(operation: 'login' | 'logout' = 'login', options: {
  headers?: Record<string, string | null>; body?: BodyInit; signal?: AbortSignal; url?: string;
} = {}) {
  const headers = new Headers({ origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
    ...(operation === 'logout' ? { authorization: `Bearer ${token}` } : {}) });
  for (const [key, value] of Object.entries(options.headers ?? {})) {
    if (value === null) headers.delete(key); else headers.set(key, value);
  }
  return new Request(options.url ?? `${origin}/api/moderation/${operation}`, {
    method: 'POST', headers, body: options.body ?? JSON.stringify(operation === 'login' ? credentials : {}),
    signal: options.signal, duplex: 'half',
  } as RequestInit);
}
function provider() {
  return vi.fn<typeof fetch>(async (input, init) => {
    if (String(input) === paths.token) return Response.json(tokenBody);
    if (String(input) === paths.user) {
      const supplied = new Headers(init?.headers).get('authorization')?.slice(7) ?? '';
      const [head, payload, signature] = supplied.split('.');
      const expected = createHmac('sha256', 'synthetic-auth-signing-key').update(`${head}.${payload}`).digest('base64url');
      return signature === expected ? Response.json(user) : new Response(null, { status: 401 });
    }
    if (String(input) === paths.queue) return Response.json({ reports: [], page_limit: 25 });
    if (String(input) === paths.logout) return new Response(null, { status: 204 });
    throw Error('Unexpected endpoint');
  });
}
const login = (req = request(), transport: typeof fetch = provider(), overrides: Record<string, string | undefined> = {}, deps: ModeratorSessionDependencies = {}) =>
  handleModeratorLogin(req, { env: { ...env, ...overrides }, transport, now, admitAttempt: createModeratorLoginLimiter(), ...deps });
const logout = (req = request('logout'), transport: typeof fetch = provider(), overrides: Record<string, string | undefined> = {}, deps: ModeratorSessionDependencies = {}) =>
  handleModeratorLogout(req, { env: { ...env, ...overrides }, transport, now, admitLogoutAttempt: createModeratorLogoutLimiter(), ...deps });
async function expectFailure(response: Response, status: number, error: string) {
  expect(response.status).toBe(status); expect(await response.json()).toEqual({ ok: false, error });
}
function streaming(bytes: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({ start(controller) { for (const part of bytes) controller.enqueue(part); controller.close(); } });
}
const encoder = new TextEncoder();
beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(time); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Moderator password-session server boundary', () => {
  it('returns only the verified access token and expiry after the database authorizes the live session', async () => {
    const transport = provider();
    const response = await login(request(), transport, { SHIOK_REPORTS_ENABLED: 'false' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, accessToken: token, expiresAt: '2026-09-15T10:10:00.000Z' });
    expect(transport.mock.calls.map(call => String(call[0]))).toEqual([paths.token, paths.user, paths.queue]);
    const grant = transport.mock.calls[0][1]!;
    expect(JSON.parse(String(grant.body))).toEqual(credentials);
    expect(new Headers(grant.headers).get('apikey')).toBe(env.SHIOK_REPORTS_SECRET_KEY);
    expect(new Headers(grant.headers).has('authorization')).toBe(false);
    expect(new Headers(transport.mock.calls[1][1]?.headers).get('authorization')).toBe(`Bearer ${token}`);
    const queue = transport.mock.calls[2][1]!;
    expect(JSON.parse(String(queue.body))).toEqual({ p_actor: actor, p_session: session,
      p_token_expires_at: '2026-09-15T10:10:00.000Z', p_state: 'pending', p_after_received_at: null, p_after_receipt_id: null });
    expect(JSON.stringify(queue)).not.toContain(token);
    for (const [, init] of transport.mock.calls) {
      expect(init?.cache).toBe('no-store'); expect(init?.redirect).toBe('error'); expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
    expect(grant.credentials).toBe('omit');
    for (const [key, value] of Object.entries(MODERATION_RESPONSE_HEADERS)) expect(response.headers.get(key)).toBe(value);
    expect(response.headers.has('set-cookie')).toBe(false); expect(response.headers.has('access-control-allow-origin')).toBe(false);
  });
  it('normalizes the configured and supplied email, while preserving every password byte', async () => {
    const transport = provider();
    const response = await login(request('login', { body: JSON.stringify({ ...credentials, email: ' OWNER@EXAMPLE.INVALID ' }) }), transport,
      { SHIOK_MODERATOR_EMAIL: ' Owner@Example.Invalid ' });
    expect(response.status).toBe(200);
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toEqual(credentials);
  });
  it('rejects a different owner before all Auth IO without disclosing the configured email', async () => {
    const transport = vi.fn();
    await expectFailure(await login(request('login', { body: JSON.stringify({ ...credentials, email: 'other@example.invalid' }) }), transport), 401, 'unauthenticated');
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(Object.keys(env))('is default-off when %s is missing', async key => {
    const transport = vi.fn();
    await expectFailure(await login(request(), transport, { [key]: undefined }), 503, 'unavailable');
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    ['SHIOK_MODERATION_ENABLED', 'false'], ['SHIOK_MODERATION_ENABLED', 'TRUE'], ['VERCEL', 'true'], ['VERCEL_ENV', 'development'],
    ['NODE_ENV', 'test'], ['SHIOK_REPORTS_PROJECT_URL', 'https://other.supabase.co'], ['SHIOK_REPORTS_PROJECT_URL', project.projectUrl + '/'],
    ['SHIOK_REPORTS_SECRET_KEY', 'sbp_synthetic'], ['SHIOK_REPORTS_SECRET_KEY', env.SHIOK_REPORTS_SECRET_KEY + '\n'],
    ['SHIOK_REPORTS_ORIGIN', 'http://shiok.example'], ['SHIOK_REPORTS_ORIGIN', origin + '/'], ['SHIOK_REPORTS_ORIGIN', origin + '/path'],
    ['SHIOK_REPORTS_ORIGIN', 'https://user:password@shiok.example'], ['SHIOK_MODERATOR_EMAIL', ''], ['SHIOK_MODERATOR_EMAIL', 'not-email'],
    ['SHIOK_MODERATOR_EMAIL', 'x'.repeat(255)], ['SHIOK_MODERATOR_EMAIL', 'owner\u0000@example.invalid'],
  ])('rejects invalid %s config %# without IO', async (key, value) => {
    const transport = vi.fn();
    await expectFailure(await login(request(), transport, { [key]: value }), 503, 'unavailable');
    expect(transport).not.toHaveBeenCalled();
  });
  it('supports the explicitly configured preview origin without enabling intake', async () => {
    expect((await login(request(), provider(), { VERCEL_ENV: 'preview', SHIOK_REPORTS_ENABLED: 'false' })).status).toBe(200);
  });
  it('cannot run the secret boundary in a browser environment', async () => {
    vi.stubGlobal('window', {});
    const transport = vi.fn();
    await expectFailure(await login(request(), transport), 503, 'unavailable');
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['login', 'logout'] as const)('validates exact origin and route for %s', async operation => {
    const send = operation === 'login' ? login : logout;
    for (const options of [
      { headers: { origin: null } }, { headers: { origin: 'null' } }, { headers: { origin: 'https://other.example' } },
      { headers: { origin: origin + '/' } }, { headers: { 'sec-fetch-site': 'cross-site' } },
      { headers: { 'sec-fetch-site': 'same-site' } }, { headers: { 'sec-fetch-site': 'none' } },
      { url: `${origin}/api/moderation/${operation}?secret=never-echo` },
      { url: `${origin}/api/moderation/other` },
      { url: `https://other.example/api/moderation/${operation}`, headers: { 'x-forwarded-host': 'shiok.example' } },
    ]) {
      const transport = vi.fn();
      await expectFailure(await send(request(operation, options), transport), 400, 'invalid_request');
      expect(transport).not.toHaveBeenCalled();
    }
  });
  it.each(['login', 'logout'] as const)('permits absent fetch metadata only with exact Origin: %s', async operation => {
    expect((await (operation === 'login' ? login : logout)(request(operation, { headers: { 'sec-fetch-site': null } }))).status).toBe(200);
  });
  it.each([
    ['content-type', null], ['content-type', 'text/plain'], ['content-type', 'application/json; charset=ascii'],
    ['content-encoding', 'gzip'], ['content-length', '8193'], ['content-length', '-1'], ['content-length', '01'],
    ['content-length', '3.0'], ['content-length', '3,3'],
  ])('rejects invalid body header %s %#', async (key, value) => {
    const transport = vi.fn();
    await expectFailure(await login(request('login', { headers: { [key]: value } }), transport), 400, 'invalid_request');
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    null, [], {}, { email: credentials.email }, { password: 'secret' }, { ...credentials, actor },
    { ...credentials, session_id: session }, { ...credentials, email: null }, { ...credentials, email: '' },
    { ...credentials, email: 'x'.repeat(255) }, { ...credentials, email: 'owner\u0000@example.invalid' },
    { ...credentials, email: 'owner\ud800@example.invalid' }, { ...credentials, password: '' },
    { ...credentials, password: null }, { ...credentials, password: 1234 }, { ...credentials, password: 'x'.repeat(1025) },
    { ...credentials, password: 'é'.repeat(513) }, { ...credentials, password: 'before\u0000after' },
    { ...credentials, password: '\ud800' }, { ...credentials, password: '\udfff' },
  ])('rejects malformed credentials %# before IO', async value => {
    const transport = vi.fn();
    await expectFailure(await login(request('login', { body: JSON.stringify(value) }), transport), 400, 'invalid_request');
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['x'.repeat(1024), 'é'.repeat(512), '😀'.repeat(256), ' '])('preserves a legal password boundary %#', async password => {
    const transport = provider();
    expect((await login(request('login', { body: JSON.stringify({ ...credentials, password }) }), transport)).status).toBe(200);
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body)).password).toBe(password);
  });
  it.each([
    '{"email":"owner@example.invalid","email":"other@example.invalid","password":"password"}',
    '{"email":"owner@example.invalid","\\u0065mail":"owner@example.invalid","password":"password"}',
    '{"email":"owner@example.invalid","password":"first","password":"second"}',
    '{"__proto__":{"email":"owner@example.invalid"},"password":"password"}',
    '{', '\ufeff{"email":"owner@example.invalid","password":"password"}', ' '.repeat(8193),
  ])('rejects malformed/duplicate/BOM/oversized JSON %#', async body => {
    const transport = vi.fn();
    await expectFailure(await login(request('login', { body }), transport), 400, 'invalid_request');
    expect(transport).not.toHaveBeenCalled();
  });
  it('rejects non-UTF8 and empty-progress streams, including a lying content-length', async () => {
    for (const body of [streaming([new Uint8Array([0xff])]), streaming([new Uint8Array(), encoder.encode(JSON.stringify(credentials))]),
      streaming([new Uint8Array(8193)])]) {
      const transport = vi.fn();
      await expectFailure(await login(request('login', { body, headers: { 'content-length': '1' } }), transport), 400, 'invalid_request');
      expect(transport).not.toHaveBeenCalled();
    }
  });
  it('handles split UTF8 and JSON chunks without changing the password', async () => {
    const value = { ...credentials, password: 'spaces é 😀 :' };
    const bytes = encoder.encode(JSON.stringify(value));
    const transport = provider();
    expect((await login(request('login', { body: streaming([...bytes].map(byte => new Uint8Array([byte]))) }), transport)).status).toBe(200);
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toEqual(value);
  });
  it.each([400, 401, 403, 422])('suppresses provider credential denial %s', async status => {
    const transport = vi.fn<typeof fetch>(async () => new Response('private account details', { status }));
    await expectFailure(await login(request(), transport), 401, 'unauthenticated');
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([201, 204, 302, 404, 409, 500, 502])('never translates unknown token reply %s into an account claim', async status => {
    const transport = vi.fn<typeof fetch>(async () => new Response(status === 204 ? null : 'private provider diagnostic', { status }));
    await expectFailure(await login(request(), transport), 503, 'unavailable');
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('maps provider throttling to generic limited, without retrying or forwarding headers', async () => {
    const transport = vi.fn<typeof fetch>(async () => new Response('private quota', { status: 429, headers: { 'retry-after': '123' } }));
    const result = await login(request(), transport);
    expect(result.headers.has('retry-after')).toBe(false);
    await expectFailure(result, 429, 'limited'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([
    {}, null, [], { ...tokenBody, access_token: null }, { ...tokenBody, access_token: 'not-a-jwt' },
    { ...tokenBody, token_type: 'Bearer' }, { ...tokenBody, expires_in: 0 }, { ...tokenBody, expires_in: 3601 },
    { ...tokenBody, expires_in: '600' }, { ...tokenBody, expires_in: 1.1 }, { ...tokenBody, expires_at: 'private' },
  ])('rejects malformed token projection %# without attempting verification', async body => {
    const transport = vi.fn<typeof fetch>(async () => Response.json(body));
    await expectFailure(await login(request(), transport), 503, 'unavailable'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each(['empty', 'utf8', 'oversize', 'duplicate', 'mime', 'bom'] as const)('bounds token response %s', async shape => {
    const transport = vi.fn<typeof fetch>(async () => shape === 'empty' ? new Response(streaming([new Uint8Array()]), { headers: { 'content-type': 'application/json' } })
      : shape === 'utf8' ? new Response(new Uint8Array([0xff]), { headers: { 'content-type': 'application/json' } })
      : shape === 'oversize' ? Response.json({ ...tokenBody, extra: 'x'.repeat(MAX_MODERATOR_SESSION_REPLY_BYTES) })
      : shape === 'duplicate' ? new Response(`{"access_token":"fake",${JSON.stringify(tokenBody).slice(1)}`, { headers: { 'content-type': 'application/json' } })
      : shape === 'bom' ? new Response('\ufeff' + JSON.stringify(tokenBody), { headers: { 'content-type': 'application/json' } })
      : new Response(JSON.stringify(tokenBody), { headers: { 'content-type': 'text/plain' } }));
    await expectFailure(await login(request(), transport), 503, 'unavailable'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('accepts a token reply at the byte cap, discarding all unused fields', async () => {
    const base = JSON.stringify({ ...tokenBody, padding: '' });
    const grant = base.replace('"padding":""', `"padding":"${'x'.repeat(MAX_MODERATOR_SESSION_REPLY_BYTES - Buffer.byteLength(base))}"`);
    expect(Buffer.byteLength(grant)).toBe(MAX_MODERATOR_SESSION_REPLY_BYTES);
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.token
      ? new Response(grant, { headers: { 'content-type': 'application/json' } }) : fallback(url, init));
    const response = await login(request(), transport);
    expect(response.status).toBe(200); expect(Object.keys(await response.json())).toEqual(['ok', 'accessToken', 'expiresAt']);
  });
  it.each(['redirected', 'url'] as const)('rejects transport %s even when it ignores redirect:error', async field => {
    const transport = vi.fn<typeof fetch>(async () => {
      const response = Response.json(tokenBody);
      Object.defineProperty(response, field, { value: field === 'url' ? 'https://other.example/token' : true });
      return response;
    });
    await expectFailure(await login(request(), transport), 503, 'unavailable'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('does not trust a correctly shaped but forged signature or provider user metadata', async () => {
    const forged = token.slice(0, -1) + (token.endsWith('x') ? 'y' : 'x');
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.token
      ? Response.json({ ...tokenBody, access_token: forged }) : fallback(url, init));
    await expectFailure(await login(request(), transport), 401, 'unauthenticated');
    expect(transport.mock.calls.map(c => String(c[0]))).toEqual([paths.token, paths.user]);
    expect(new Headers(transport.mock.calls[1][1]?.headers).get('authorization')).toBe(`Bearer ${forged}`);
  });
  it.each([{ session_id: undefined }, { iss: 'https://other.supabase.co/auth/v1' }, { role: 'service_role' },
    { is_anonymous: true }, { exp: time / 1000 }, { sub: 'not-uuid' }])('rejects unusable signed claims %# before queue', async claims => {
    const transport = vi.fn<typeof fetch>(async () => Response.json({ ...tokenBody, access_token: jwt(claims) }));
    await expectFailure(await login(request(), transport), 401, 'unauthenticated'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('requires verified expiry to match optional token-response expiry', async () => {
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.token
      ? Response.json({ ...tokenBody, expires_at: time / 1000 + 601 }) : fallback(url, init));
    await expectFailure(await login(request(), transport), 503, 'unavailable'); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('does not require refresh token or provider user metadata to produce a session', async () => {
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.token
      ? Response.json({ access_token: token, token_type: 'bearer', expires_in: 600 }) : fallback(url, init));
    expect((await login(request(), transport)).status).toBe(200);
  });
  it('rejects a mismatching verified user and never calls the database', async () => {
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.user
      ? Response.json({ ...user, id: session }) : fallback(url, init));
    await expectFailure(await login(request(), transport), 401, 'unauthenticated'); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('rejects duplicate JSON in the exact-token verification response', async () => {
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.user
      ? new Response(`{"id":"${session}",${JSON.stringify(user).slice(1)}`, { headers: { 'content-type': 'application/json' } }) : fallback(url, init));
    await expectFailure(await login(request(), transport), 503, 'unavailable'); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('requires independent live database authorization even after a successful Auth verification', async () => {
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.queue
      ? Response.json({ code: 'PT403', message: 'moderator_unavailable', details: null, hint: null }, { status: 403 }) : fallback(url, init));
    await expectFailure(await login(request(), transport), 401, 'unauthenticated');
    expect(transport.mock.calls.map(c => String(c[0]))).toEqual([paths.token, paths.user, paths.queue]);
  });
  it.each(['revoked moderator', 'signed-out session', 'banned account'])('does not let owner email override a %s', async reason => {
    // These independent DB conditions intentionally have the same PT403 projection.
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.queue
      ? Response.json({ code: 'PT403', message: 'moderator_unavailable', details: null, hint: null }, { status: 403 }) : fallback(url, init));
    const result = await login(request(), transport);
    const text = await result.text();
    expect(result.status).toBe(401); expect(JSON.parse(text)).toEqual({ ok: false, error: 'unauthenticated' });
    expect(text).not.toContain(reason); expect(text).not.toContain(token); expect(text).not.toContain(credentials.email);
  });
  it.each(['redirected', 'url', 'mime'] as const)('checks the Auth verification response %s before reading authority', async shape => {
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => {
      if (String(url) !== paths.user) return fallback(url, init);
      const result = Response.json(user);
      if (shape === 'mime') result.headers.set('content-type', 'text/plain');
      else Object.defineProperty(result, shape, { value: shape === 'url' ? 'https://other.example/user' : true });
      return result;
    });
    await expectFailure(await login(request(), transport), 503, 'unavailable'); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('never returns a token when the database response is malformed or unavailable', async () => {
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.queue
      ? Response.json({ reports: [], page_limit: 26, private: 'never-echo' }) : fallback(url, init));
    await expectFailure(await login(request(), transport), 503, 'unavailable');
  });
  it('accepts a full legal 25-report authorization page and discards the content', async () => {
    const content = { schema_version: 1, report_type: 'mapping_error', geometry: { type: 'Point', coordinates: [103.8, 1.3] },
      referenced_bundle_version: 'generated_20260805_prefer_scored_routed' };
    const queue = { page_limit: 25, reports: Array.from({ length: 25 }, (_, i) => ({
      receipt_id: `42345678-1234-4123-8123-${String(i).padStart(12, '0')}`, report_type: 'mapping_error', state: 'pending', revision: 1,
      received_at: '2026-09-15T09:00:00.123456+00:00', expires_at: '2026-10-15T09:00:00.123456+00:00', content, moderation: null,
    })) };
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) === paths.queue ? Response.json(queue) : fallback(url, init));
    const response = await login(request(), transport);
    expect(response.status).toBe(200); expect(Object.keys(await response.json())).toEqual(['ok', 'accessToken', 'expiresAt']);
  });
  it('does not log secrets on success or thrown provider errors', async () => {
    const logs = [vi.spyOn(console, 'log'), vi.spyOn(console, 'error'), vi.spyOn(console, 'warn')];
    expect((await login()).status).toBe(200);
    await expectFailure(await login(request(), vi.fn(async () => { throw Error(JSON.stringify(tokenBody)); })), 503, 'unavailable');
    for (const log of logs) expect(log).not.toHaveBeenCalled();
  });
});

describe('Session pressure and whole-request deadline', () => {
  it('admits only six attempts per minute, retains no identity, and rejects clock regression', () => {
    const admit = createModeratorLoginLimiter();
    for (let i = 0; i < 6; i++) expect(admit(time + i)).toBe(true);
    expect(admit(time + 1000)).toBe(false); expect(admit(time - 60000)).toBe(false);
    expect(admit(time + 60000)).toBe(true);
    for (const bad of [NaN, Infinity, -1, Number.MAX_VALUE]) expect(admit(bad)).toBe(false);
  });
  it('applies pressure before body/Auth IO and never sends credentials to the limiter', async () => {
    const admitAttempt = vi.fn(() => false), transport = vi.fn();
    await expectFailure(await login(request(), transport, {}, { admitAttempt }), 429, 'limited');
    expect(admitAttempt).toHaveBeenCalledExactlyOnceWith(time); expect(transport).not.toHaveBeenCalled();
  });
  it('shares a bounded limiter across wrong-owner attempts rather than keying it by email', async () => {
    const admitAttempt = createModeratorLoginLimiter(), transport = vi.fn();
    for (let i = 0; i < 6; i++) await expectFailure(await login(request('login', {
      body: JSON.stringify({ ...credentials, email: `wrong${i}@example.invalid` }),
    }), transport, {}, { admitAttempt }), 401, 'unauthenticated');
    await expectFailure(await login(request(), transport, {}, { admitAttempt }), 429, 'limited');
    expect(transport).not.toHaveBeenCalled();
  });
  it('bounds a never-ending body independently of its cancel promise', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const transport = vi.fn();
    const pending = login(request('login', { body: new ReadableStream({ pull: () => new Promise(() => {}), cancel }) }), transport);
    await vi.advanceTimersByTimeAsync(MODERATION_REQUEST_TIMEOUT_MS);
    await expectFailure(await pending, 408, 'request_timeout'); expect(transport).not.toHaveBeenCalled(); expect(cancel).toHaveBeenCalled();
  });
  it('does not auto-retry a token request with lost acknowledgement, or call that session cleaned up', async () => {
    vi.useFakeTimers();
    const transport = vi.fn<typeof fetch>(() => new Promise(() => {}));
    const pending = login(request(), transport);
    await vi.advanceTimersByTimeAsync(MODERATION_REQUEST_TIMEOUT_MS);
    await expectFailure(await pending, 408, 'request_timeout'); expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
  it('cancels a late token response and never follows it into Auth or queue', async () => {
    vi.useFakeTimers();
    let resolve!: (value: Response) => void;
    const transport = vi.fn<typeof fetch>(() => new Promise(done => { resolve = done; }));
    const pending = login(request(), transport);
    await vi.advanceTimersByTimeAsync(MODERATION_REQUEST_TIMEOUT_MS);
    await expectFailure(await pending, 408, 'request_timeout');
    const cancel = vi.fn();
    resolve(new Response(new ReadableStream({ cancel })));
    await vi.advanceTimersByTimeAsync(1);
    expect(cancel).toHaveBeenCalled(); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('bounds a streaming token response after a successful HTTP status', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const transport = vi.fn<typeof fetch>(async () => new Response(new ReadableStream({ cancel }), { headers: { 'content-type': 'application/json' } }));
    const pending = login(request(), transport);
    await vi.advanceTimersByTimeAsync(MODERATION_REQUEST_TIMEOUT_MS);
    await expectFailure(await pending, 408, 'request_timeout'); expect(cancel).toHaveBeenCalled();
  });
  it('uses a total deadline across delayed grant, verified Auth, and database authorization', async () => {
    vi.useFakeTimers();
    const fallback = provider();
    const transport = vi.fn<typeof fetch>(async (url, init) => {
      if (String(url) === paths.token) { await new Promise(resolve => setTimeout(resolve, 9000)); return Response.json(tokenBody); }
      if (String(url) === paths.user) { await new Promise(resolve => setTimeout(resolve, 4000)); return Response.json(user); }
      if (String(url) === paths.queue) return new Promise(() => {});
      return fallback(url, init);
    });
    const pending = login(request(), transport);
    await vi.advanceTimersByTimeAsync(MODERATION_REQUEST_TIMEOUT_MS);
    await expectFailure(await pending, 408, 'request_timeout');
    expect(transport.mock.calls.map(c => String(c[0]))).toEqual([paths.token, paths.user, paths.queue]);
    expect(transport.mock.calls[2][1]?.signal?.aborted).toBe(true);
  });
  it('lets the shorter Auth deadline fail without granting a late successful session', async () => {
    vi.useFakeTimers();
    let resolve!: (value: Response) => void;
    const transport = vi.fn<typeof fetch>(async url => String(url) === paths.token ? Response.json(tokenBody)
      : new Promise(done => { resolve = done; }));
    const pending = login(request(), transport);
    await vi.advanceTimersByTimeAsync(5000);
    await expectFailure(await pending, 503, 'unavailable');
    const cancel = vi.fn();
    resolve(new Response(new ReadableStream({ cancel }), { headers: { 'content-type': 'application/json' } }));
    await vi.advanceTimersByTimeAsync(1);
    expect(cancel).toHaveBeenCalled(); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('rejects and cancels empty-progress Auth verification bodies', async () => {
    const fallback = provider();
    const cancel = vi.fn();
    const transport = vi.fn<typeof fetch>(async (url, init) => String(url) !== paths.user ? fallback(url, init)
      : new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array()); }, cancel }),
        { headers: { 'content-type': 'application/json' } }));
    await expectFailure(await login(request(), transport), 503, 'unavailable');
    expect(cancel).toHaveBeenCalled(); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('honors caller abort before and after dispatch with no late success', async () => {
    const aborted = new AbortController(); aborted.abort();
    const transport = vi.fn();
    await expectFailure(await login(request('login', { signal: aborted.signal }), transport), 408, 'request_timeout');
    expect(transport).not.toHaveBeenCalled();
    const controller = new AbortController();
    const slow = vi.fn<typeof fetch>(async () => { controller.abort(); return Response.json(tokenBody); });
    await expectFailure(await login(request('login', { signal: controller.signal }), slow), 408, 'request_timeout');
    expect(slow).toHaveBeenCalledTimes(1);
  });
  it('rechecks token expiry after database authorization', async () => {
    const fallback = provider();
    let expired = false;
    const transport = vi.fn<typeof fetch>(async (url, init) => {
      const response = await fallback(url, init);
      if (String(url) === paths.queue) expired = true;
      return response;
    });
    await expectFailure(await login(request(), transport, {}, { now: () => expired ? time + 600000 : time }), 401, 'unauthenticated');
  });
});

describe('Local-session-only sign-out', () => {
  it('bounds both token attempts and total attempts with bounded hash state and a fresh minute reset', () => {
    const admit = createModeratorLogoutLimiter();
    const hash = createHash('sha256').update('synthetic-token').digest('hex');
    for (let i = 0; i < 6; i++) expect(admit(hash, time + i)).toBe(true);
    expect(admit(hash, time + 1000)).toBe(false);
    for (let i = 0; i < 24; i++) expect(admit(createHash('sha256').update(`token-${i}`).digest('hex'), time)).toBe(true);
    expect(admit(createHash('sha256').update('over-total').digest('hex'), time)).toBe(false);
    expect(admit(hash, time - 60000)).toBe(false);
    expect(admit(hash, time + 60000)).toBe(true);
    for (let i = 0; i < 5; i++) expect(admit(hash, time + 60000)).toBe(true);
    expect(admit(hash, time + 60000)).toBe(false);
  });
  it('rejects invalid limiter keys and clocks without retaining plaintext tokens', () => {
    const admit = createModeratorLogoutLimiter(), hash = createHash('sha256').update(token).digest('hex');
    for (const value of [token, '', 'a'.repeat(63), 'a'.repeat(65), 'g'.repeat(64), 'a'.repeat(64) + '\n']) expect(admit(value, time)).toBe(false);
    for (const invalid of [NaN, Infinity, -1, Number.MAX_VALUE]) expect(admit(hash, invalid)).toBe(false);
    for (let i = 0; i < 6; i++) expect(admit(hash, time)).toBe(true);
  });
  it('stops a repeated syntactically valid fake token before provider dispatch at its cap', async () => {
    const admitLogoutAttempt = createModeratorLogoutLimiter();
    const transport = vi.fn<typeof fetch>(async () => new Response(null, { status: 401 }));
    for (let i = 0; i < 6; i++) await expectFailure(await logout(request('logout', {
      headers: { authorization: 'Bearer synthetic.fake.signature' },
    }), transport, {}, { admitLogoutAttempt }), 503, 'unavailable');
    await expectFailure(await logout(request('logout', {
      headers: { authorization: 'Bearer synthetic.fake.signature' },
    }), transport, {}, { admitLogoutAttempt }), 429, 'limited');
    expect(transport).toHaveBeenCalledTimes(6);
    // A different moderator/token retains its own allowance until the total cap.
    expect((await logout(request('logout'), provider(), { SHIOK_MODERATOR_EMAIL: undefined }, { admitLogoutAttempt })).status).toBe(200);
  });
  it('caps rotating fake tokens without relying on email, allowlist or Auth verification', async () => {
    const admitLogoutAttempt = createModeratorLogoutLimiter();
    const transport = vi.fn<typeof fetch>(async () => new Response(null, { status: 401 }));
    for (let i = 0; i < 30; i++) await expectFailure(await logout(request('logout', {
      headers: { authorization: `Bearer synthetic.fake.signature${i}` },
    }), transport, {}, { admitLogoutAttempt }), 503, 'unavailable');
    await expectFailure(await logout(request('logout', {
      headers: { authorization: 'Bearer synthetic.fake.another' },
    }), transport, {}, { admitLogoutAttempt }), 429, 'limited');
    expect(transport).toHaveBeenCalledTimes(30);
    expect(transport.mock.calls.every(call => call[0] === paths.logout)).toBe(true);
  });
  it('passes only a hash and clock into the logout shield and cancels capped bodies before IO', async () => {
    const admitLogoutAttempt = vi.fn(() => false), transport = vi.fn(), cancel = vi.fn();
    const req = request('logout', { body: new ReadableStream({ cancel }) });
    await expectFailure(await logout(req, transport, {}, { admitLogoutAttempt }), 429, 'limited');
    expect(admitLogoutAttempt).toHaveBeenCalledExactlyOnceWith(createHash('sha256').update(token).digest('hex'), time);
    expect(transport).not.toHaveBeenCalled(); expect(cancel).toHaveBeenCalled();
  });
  it('fails closed if the logout shield throws, without dispatch or false revocation confirmation', async () => {
    const transport = vi.fn();
    await expectFailure(await logout(request('logout'), transport, {}, {
      admitLogoutAttempt: () => { throw Error('synthetic failure'); },
    }), 503, 'unavailable');
    expect(transport).not.toHaveBeenCalled();
  });
  it('does not present a warm-instance shield as a distributed quota', () => {
    const first = createModeratorLogoutLimiter(), second = createModeratorLogoutLimiter();
    const hash = createHash('sha256').update(token).digest('hex');
    for (let i = 0; i < 6; i++) expect(first(hash, time)).toBe(true);
    expect(first(hash, time)).toBe(false);
    expect(second(hash, time)).toBe(true);
  });
  it('lets a revoked moderator sign out without owner-email or allowlist checks', async () => {
    const transport = provider();
    const result = await logout(request('logout'), transport, { SHIOK_MODERATOR_EMAIL: undefined });
    expect(result.status).toBe(200); expect(await result.json()).toEqual({ ok: true });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toBe(paths.logout);
    const init = transport.mock.calls[0][1]!;
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', redirect: 'error', credentials: 'omit' });
    expect(init.body).toBeUndefined();
    expect(new Headers(init.headers).get('authorization')).toBe(`Bearer ${token}`);
    expect(result.headers.has('set-cookie')).toBe(false);
  });
  it('does not reject an expired-shaped token before Auth can handle its session logout', async () => {
    const transport = provider(), expired = jwt({ exp: time / 1000 - 1 });
    expect((await logout(request('logout', { headers: { authorization: `Bearer ${expired}` } }), transport)).status).toBe(200);
    expect(new Headers(transport.mock.calls[0][1]?.headers).get('authorization')).toBe(`Bearer ${expired}`);
  });
  it.each([null, '', 'bearer value', 'Bearer invalid', 'Bearer a.b.c,a.b.c', 'Bearer ' + 'a'.repeat(8193) + '.b.c'])('requires a bounded exact bearer rather than cookies %#', async authorization => {
    const transport = vi.fn();
    await expectFailure(await logout(request('logout', { headers: { authorization, cookie: `session=${token}` } }), transport), 401, 'unauthenticated');
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, [], { email: credentials.email }, { scope: 'global' }, { scope: 'others' }, { actor }, { token }])('requires an exact empty logout body %#', async value => {
    const transport = vi.fn();
    await expectFailure(await logout(request('logout', { body: JSON.stringify(value) }), transport), 400, 'invalid_request');
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([200, 201, 302, 400, 401, 403, 404, 429, 500, 503])('does not claim confirmed revocation on status %s', async status => {
    const transport = vi.fn<typeof fetch>(async () => new Response('private error', { status }));
    await expectFailure(await logout(request('logout'), transport), 503, 'unavailable'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('does not let failed-login throttling prevent sign-out', async () => {
    const admitAttempt = vi.fn(() => false);
    expect((await logout(request('logout'), provider(), {}, { admitAttempt })).status).toBe(200);
    expect(admitAttempt).not.toHaveBeenCalled();
  });
  it('reports uncertain sign-out as unavailable after disconnect, never successful local-only clearing', async () => {
    vi.useFakeTimers();
    let resolve!: (value: Response) => void;
    const transport = vi.fn<typeof fetch>(() => new Promise(done => { resolve = done; }));
    const pending = logout(request('logout'), transport);
    await vi.advanceTimersByTimeAsync(MODERATION_REQUEST_TIMEOUT_MS);
    await expectFailure(await pending, 503, 'unavailable');
    resolve(new Response(null, { status: 204 }));
    await vi.advanceTimersByTimeAsync(1);
    expect(transport).toHaveBeenCalledTimes(1); expect(transport.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
  it('does not accept a redirected 204 or an arbitrary logout target', async () => {
    const transport = vi.fn<typeof fetch>(async () => {
      const response = new Response(null, { status: 204 });
      Object.defineProperty(response, 'redirected', { value: true });
      return response;
    });
    await expectFailure(await logout(request('logout'), transport), 503, 'unavailable');
    expect(transport.mock.calls[0][0]).toBe(paths.logout); expect(transport).toHaveBeenCalledTimes(1);
  });
});

describe('Session route adapters', () => {
  it.each([loginRoute, logoutRoute])('uses node, private dynamic POST and explicit method denials %#', async route => {
    expect(route.runtime).toBe('nodejs'); expect(route.dynamic).toBe('force-dynamic'); expect(route.maxDuration).toBe(20);
    for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'] as const) {
      const result = route[method](new Request(`${origin}/api/moderation/login`, { method }));
      expect(result.status).toBe(405); expect(result.headers.get('allow')).toBe('POST');
      if (method === 'HEAD') expect(await result.text()).toBe('');
      else expect(await result.json()).toEqual({ ok: false, error: 'method_not_allowed' });
    }
  });
  it.each(['login', 'logout'] as const)('denies direct non-POST handler calls: %s', async operation => {
    const send = operation === 'login' ? handleModeratorLogin : handleModeratorLogout;
    const transport = vi.fn();
    expect((await send(new Request(`${origin}/api/moderation/${operation}`), { env, transport })).status).toBe(405);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([loginRoute, logoutRoute])('keeps a route disabled without runtime activation %#', async route => {
    vi.stubEnv('SHIOK_MODERATION_ENABLED', 'false');
    await expectFailure(await route.POST(request()), 503, 'unavailable');
  });
});
