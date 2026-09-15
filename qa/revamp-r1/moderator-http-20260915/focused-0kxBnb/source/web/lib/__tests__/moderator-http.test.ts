import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { createModeratorAttemptLimiter, handleModerationPost, MODERATION_REQUEST_TIMEOUT_MS } from '../../app/api/moderation/http';
import * as queueRoute from '../../app/api/moderation/queue/route';
import * as decisionRoute from '../../app/api/moderation/decision/route';
import * as contextRoute from '../../app/api/moderation/context/route';
import project from '../report-project.json';

const origin = 'https://shiok.example';
const actor = '22345678-1234-4123-8123-123456789abc';
const session = '32345678-1234-4123-8123-123456789abc';
const receipt = '42345678-1234-4123-8123-123456789abc';
const time = Date.parse('2026-09-15T10:00:00Z');
const now = () => time;
const env = {
  VERCEL: '1', VERCEL_ENV: 'production', NODE_ENV: 'production', SHIOK_MODERATION_ENABLED: 'true',
  SHIOK_REPORTS_PROJECT_URL: project.projectUrl, SHIOK_REPORTS_ORIGIN: origin,
  SHIOK_REPORTS_SECRET_KEY: ['sb', 'secret', 'synthetic'.repeat(4)].join('_'),
};
const token = [
  { alg: 'ES256' }, { sub: actor, session_id: session, exp: time / 1000 + 600, iat: time / 1000 - 60,
    iss: `${project.projectUrl}/auth/v1`, aud: 'authenticated', role: 'authenticated', is_anonymous: false },
].map(x => Buffer.from(JSON.stringify(x)).toString('base64url')).join('.') + '.syntheticSignature';
const user = { id: actor, aud: 'authenticated', role: 'authenticated', is_anonymous: false };
const command = { receipt_id: receipt, expected_revision: 1, action: 'accepted', reason: 'Synthetic review' };
const context = {
  source: { receipt_id: receipt, report_type: 'mapping_error', state: 'pending', revision: 1,
    received_at: '2026-09-15T09:00:00.123456+00:00', moderated_at: null, moderator_id: null, reason: null, duplicate_of: null },
  target_chain: [], observed_at: '2026-09-15T10:00:00.654321+00:00',
};
const decision = { receipt_id: receipt, state: 'accepted', revision: 2, moderated_at: '2026-09-15T10:00:01.123456+00:00' };
type Operation = 'queue' | 'decision' | 'context';
function request(operation: Operation = 'queue', options: {
  headers?: Record<string, string | null>; body?: BodyInit; signal?: AbortSignal; url?: string;
} = {}): Request {
  const headers = new Headers({ origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', authorization: `Bearer ${token}` });
  for (const [key, value] of Object.entries(options.headers ?? {})) {
    if (value === null) headers.delete(key); else headers.set(key, value);
  }
  return new Request(options.url ?? `${origin}/api/moderation/${operation}`, {
    method: 'POST', headers, body: options.body ?? JSON.stringify(operation === 'queue' ? { state: 'pending' }
      : operation === 'context' ? { receipt_id: receipt } : command),
    signal: options.signal, duplex: 'half',
  } as RequestInit);
}
function provider() {
  return vi.fn<typeof fetch>(async url => {
    if (String(url).endsWith('/auth/v1/user')) return Response.json(user);
    if (String(url).endsWith('/shiok_moderator_queue_v1')) return Response.json({ reports: [], page_limit: 25 });
    if (String(url).endsWith('/shiok_moderator_context_v1')) return Response.json(context);
    if (String(url).endsWith('/shiok_moderator_decide_v1')) return Response.json(decision);
    throw Error('Unexpected provider route');
  });
}
const send = (req = request(), operation: Operation = 'queue', transport: typeof fetch = provider(), overrides = {}) =>
  handleModerationPost(req, operation, { env: { ...env, ...overrides }, transport, now, admitAttempt: createModeratorAttemptLimiter() });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(time); });

describe('Private moderator HTTP boundary', () => {
  it('authenticates the exact bearer before independently authorized queue RPC, with resident intake disabled', async () => {
    const transport = provider();
    const result = await send(request(), 'queue', transport, { SHIOK_REPORTS_ENABLED: 'false' });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ ok: true, queue: { reports: [], page_limit: 25 } });
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[0][0]).toBe(`${project.projectUrl}/auth/v1/user`);
    expect(transport.mock.calls[0][1]?.headers).toEqual({ apikey: env.SHIOK_REPORTS_SECRET_KEY, Authorization: `Bearer ${token}` });
    const rpc = transport.mock.calls[1][1]!;
    expect(JSON.parse(String(rpc.body))).toEqual({ p_actor: actor, p_session: session,
      p_token_expires_at: '2026-09-15T10:10:00.000Z', p_state: 'pending', p_after_received_at: null, p_after_receipt_id: null });
    expect(JSON.stringify(rpc)).not.toContain(token);
    for (const layer of ['cache-control', 'cdn-cache-control', 'vercel-cdn-cache-control']) expect(result.headers.get(layer)).toContain('no-store');
    expect(result.headers.get('vary')).toBe('Authorization, Origin');
    expect(result.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(result.headers.get('set-cookie')).toBeNull();
    expect(result.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('plans from server context and commits once with the whole revision read set', async () => {
    const transport = provider();
    const result = await send(request('decision'), 'decision', transport);
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ ok: true, decision });
    expect(transport).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(transport.mock.calls[2][1]?.body))).toEqual({ p_actor: actor, p_session: session,
      p_token_expires_at: '2026-09-15T10:10:00.000Z', p_receipt: receipt, p_revision: 1, p_action: 'accepted',
      p_reason: command.reason, p_duplicate: null, p_read_set: [{ receipt_id: receipt, revision: 1 }] });
  });
  it('reconciles a lost acknowledgement with an authenticated read, without a second decision write', async () => {
    let stored = false;
    const transport = vi.fn<typeof fetch>(async url => {
      if (String(url).endsWith('/auth/v1/user')) return Response.json(user);
      if (String(url).endsWith('/shiok_moderator_context_v1')) return Response.json(stored ? {
        ...context, observed_at: '2026-09-15T10:00:02.123456+00:00', source: { ...context.source,
          state: 'accepted', revision: 2, moderated_at: decision.moderated_at, moderator_id: actor, reason: command.reason },
      } : context);
      if (String(url).endsWith('/shiok_moderator_decide_v1')) { stored = true; return new Response('lost acknowledgement'); }
      throw Error('Unexpected provider route');
    });
    const uncertain = await send(request('decision'), 'decision', transport);
    expect(await uncertain.json()).toEqual({ ok: false, error: 'outcome_unknown' });
    const retry = await send(request('decision'), 'decision', transport);
    expect(retry.status).toBe(409);
    const reconciled = await send(request('context'), 'context', transport);
    expect(reconciled.status).toBe(200);
    const body = await reconciled.json();
    expect(body.ok).toBe(true); expect(body.context.source.state).toBe('accepted'); expect(body.context.source.revision).toBe(2);
    expect(transport.mock.calls.filter(c => String(c[0]).endsWith('/shiok_moderator_decide_v1'))).toHaveLength(1);
    expect(transport.mock.calls.filter(c => String(c[0]).endsWith('/auth/v1/user'))).toHaveLength(3);
    expect(JSON.stringify(body)).not.toContain(token);
    // Client-side preservation of uncertainty remains a separate queue-UI acceptance requirement.
  });
  it('rejects NUL reasons and forged reconciliation identities without Auth IO', async () => {
    const transport = vi.fn();
    const result = await send(request('decision', { body: JSON.stringify({ ...command, reason: 'review\u0000note' }) }), 'decision', transport);
    expect(result.status).toBe(400);
    expect((await send(request('context', { body: JSON.stringify({ receipt_id: receipt, actor }) }), 'context', transport)).status).toBe(400);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(Object.keys(env))('missing %s refuses before provider IO', async key => {
    const transport = vi.fn();
    expect((await send(request(), 'queue', transport, { [key]: undefined })).status).toBe(503);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    ['SHIOK_MODERATION_ENABLED', 'false'], ['VERCEL', 'true'], ['VERCEL_ENV', 'development'], ['NODE_ENV', 'test'],
    ['SHIOK_REPORTS_PROJECT_URL', 'https://other-project.supabase.co'], ['SHIOK_REPORTS_PROJECT_URL', project.projectUrl + '/'],
    ['SHIOK_REPORTS_SECRET_KEY', ['sbp', 'synthetic'].join('_')], ['SHIOK_REPORTS_SECRET_KEY', env.SHIOK_REPORTS_SECRET_KEY + '\n'],
    ['SHIOK_REPORTS_ORIGIN', '*'], ['SHIOK_REPORTS_ORIGIN', origin + '/'], ['SHIOK_REPORTS_ORIGIN', origin + '/path'],
    ['SHIOK_REPORTS_ORIGIN', 'http://shiok.example'], ['SHIOK_REPORTS_ORIGIN', 'https://user:password@shiok.example'],
  ])('invalid %s case %# refuses before provider IO', async (key, value) => {
    const transport = vi.fn();
    expect((await send(request(), 'queue', transport, { [key]: value })).status).toBe(503);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, 'null', 'https://other.example', origin + '/', origin + ',https://other.example'])('rejects missing or foreign Origin %#', async value => {
    const transport = vi.fn();
    expect((await send(request('queue', { headers: { origin: value } }), 'queue', transport)).status).toBe(403);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['cross-site', 'same-site', 'none'])('rejects fetch-site %s', async site => {
    expect((await send(request('queue', { headers: { 'sec-fetch-site': site } }))).status).toBe(403);
  });
  it('supports missing fetch metadata while still requiring exact Origin and bearer', async () => {
    expect((await send(request('queue', { headers: { 'sec-fetch-site': null } }))).status).toBe(200);
  });
  it('does not trust forwarded host or accept cookie-only authentication', async () => {
    const transport = vi.fn();
    expect((await send(request('queue', { url: 'https://other.example/api/moderation/queue',
      headers: { 'x-forwarded-host': 'shiok.example' } }), 'queue', transport)).status).toBe(403);
    expect((await send(request('queue', { headers: { authorization: null, cookie: `session=${token}` } }), 'queue', transport)).status).toBe(401);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['?token=private', '?note=private'])('rejects query-string data %s without echoing it', async suffix => {
    const result = await send(request('queue', { url: `${origin}/api/moderation/queue${suffix}` }));
    expect(result.status).toBe(400); expect(await result.text()).not.toContain('private');
  });
  it('rejects operation/path mismatches', async () => {
    expect((await send(request('decision'), 'queue')).status).toBe(400);
  });
  it.each([null, 'Basic abc', `Bearer ${token}, ${token}`, `Bearer ${'a'.repeat(8193)}.b.c`, 'Bearer malformed'])('rejects malformed bearer %#', async authorization => {
    const transport = vi.fn();
    expect((await send(request('queue', { headers: { authorization } }), 'queue', transport)).status).toBe(401);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, 'text/plain', 'application/x-www-form-urlencoded', 'application/json; charset=iso-8859-1'])('rejects content-type %#', async value => {
    expect((await send(request('queue', { headers: { 'content-type': value } }))).status).toBe(415);
  });
  it('rejects compressed bodies', async () => {
    expect((await send(request('queue', { headers: { 'content-encoding': 'gzip' } }))).status).toBe(415);
  });
  it.each(['-1', '8192.0', '1e3', '999999999999', '01'])('rejects invalid length %s', async length => {
    expect((await send(request('queue', { headers: { 'content-length': length } }))).status).toBe(400);
  });
  it('bounds advertised and actual wire bytes independently', async () => {
    const transport = vi.fn();
    expect((await send(request('queue', { headers: { 'content-length': '8193' } }), 'queue', transport)).status).toBe(413);
    expect((await send(request('queue', { body: ' '.repeat(8193), headers: { 'content-length': '2' } }), 'queue', transport)).status).toBe(413);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['{}', '[]', 'null', '{', '{"state":"pending","state":"accepted"}', '{"state":"pending","st\\u0061te":"accepted"}',
    '{"state":"pending","actor":"forged"}', '{"state":"pending","limit":1000}', '\uFEFF{"state":"pending"}'])('rejects invalid JSON/shape %# before Auth', async body => {
    const transport = vi.fn();
    expect((await send(request('queue', { body }), 'queue', transport)).status).toBe(400);
    expect(transport).not.toHaveBeenCalled();
  });
  it('rejects malformed UTF-8 instead of replacing it', async () => {
    expect((await send(request('queue', { body: new Uint8Array([0xc3, 0x28]) }))).status).toBe(400);
  });
  it('accepts fragmented JSON and counts bytes including whitespace', async () => {
    const text = new TextEncoder().encode('{"state":"pending"}');
    const body = new ReadableStream({ start(c) { for (const byte of text) c.enqueue(new Uint8Array([byte])); c.close(); } });
    expect((await send(request('queue', { body }))).status).toBe(200);
  });
  it('rejects zero-progress upload chunks instead of allowing an unbounded empty-read loop', async () => {
    const transport = vi.fn(); const cancel = vi.fn();
    const body = new ReadableStream({ start(c) {
      c.enqueue(new Uint8Array(0)); c.enqueue(new TextEncoder().encode('{"state":"pending"}')); c.close();
    }, cancel });
    const pending = send(request('queue', { body }), 'queue', transport);
    const result = await pending;
    expect(result.status).toBe(400); expect(cancel).toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled();
    expect(body.locked).toBe(false);
  });
  it.each(['p_actor', 'moderator_id', 'p_read_set', 'moderated_at', 'user_metadata'])('rejects client authority field %s', async key => {
    const transport = vi.fn();
    expect((await send(request('decision', { body: JSON.stringify({ ...command, [key]: actor }) }), 'decision', transport)).status).toBe(400);
    expect(transport).not.toHaveBeenCalled();
  });
  it('Auth denial never reaches database, even with user metadata claiming moderator', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({ error: 'private provider detail', user_metadata: { moderator: true } }, { status: 401 }));
    const result = await send(request(), 'queue', transport);
    expect(result.status).toBe(401); expect(await result.json()).toEqual({ ok: false, error: 'unauthenticated' });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('a valid token does not bypass the database allowlist or live-session denial', async () => {
    const transport = vi.fn().mockResolvedValueOnce(Response.json(user)).mockResolvedValueOnce(Response.json({
      code: 'PT403', message: 'moderator_unavailable', details: null, hint: null,
    }, { status: 403 }));
    const result = await send(request(), 'queue', transport);
    expect(result.status).toBe(403); expect(await result.json()).toEqual({ ok: false, error: 'forbidden' });
    expect(transport).toHaveBeenCalledTimes(2);
  });
  it('stale revision refuses before mutation', async () => {
    const transport = provider();
    const result = await send(request('decision', { body: JSON.stringify({ ...command, expected_revision: 2 }) }), 'decision', transport);
    expect(result.status).toBe(409); expect(await result.json()).toEqual({ ok: false, error: 'conflict' });
    expect(transport).toHaveBeenCalledTimes(2);
  });
  it('a post-dispatch malformed reply is unknown, never a receipt or automatic retry', async () => {
    const transport = vi.fn().mockResolvedValueOnce(Response.json(user)).mockResolvedValueOnce(Response.json(context))
      .mockResolvedValueOnce(Response.json({ private: 'provider detail', ok: true }));
    const result = await send(request('decision'), 'decision', transport);
    expect(result.status).toBe(503); expect(await result.json()).toEqual({ ok: false, error: 'outcome_unknown' });
    expect(transport).toHaveBeenCalledTimes(3);
  });
  it('hashes bearer tokens for the bounded in-memory pressure limiter', async () => {
    const admit = vi.fn().mockReturnValue(false); const transport = vi.fn();
    const result = await handleModerationPost(request(), 'queue', { env, now, transport, admitAttempt: admit });
    expect(result.status).toBe(429);
    expect(admit).toHaveBeenCalledWith(createHash('sha256').update(token).digest('hex'), time);
    expect(transport).not.toHaveBeenCalled();
  });
  it('bounds tokens and total attempts, resets per minute and fails closed on clock reversal', () => {
    const admit = createModeratorAttemptLimiter();
    for (let n = 0; n < 30; n++) expect(admit('one', time)).toBe(true);
    expect(admit('one', time)).toBe(false);
    for (let n = 0; n < 30; n++) expect(admit(`other${n}`, time)).toBe(true);
    expect(admit('next', time)).toBe(false);
    expect(admit('one', time + 60000)).toBe(true);
    expect(admit('one', time)).toBe(false);
    expect(admit('one', NaN)).toBe(false); expect(admit('one', -1)).toBe(false);
  });
  it('aborted requests do not authenticate', async () => {
    const controller = new AbortController(); controller.abort(); const transport = vi.fn();
    expect((await send(request('queue', { signal: controller.signal }), 'queue', transport)).status).toBe(408);
    expect(transport).not.toHaveBeenCalled();
  });
  it('bounds stalled body and cancels it without Auth', async () => {
    vi.useFakeTimers({ now: time }); const cancel = vi.fn(); const transport = vi.fn();
    const pending = send(request('queue', { body: new ReadableStream({ cancel }) }), 'queue', transport);
    await vi.advanceTimersByTimeAsync(MODERATION_REQUEST_TIMEOUT_MS);
    const result = await pending;
    expect(result.status).toBe(408); expect(await result.json()).toEqual({ ok: false, error: 'request_timeout' });
    expect(cancel).toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled();
  });
  it('late Auth after caller cancellation cannot start a queue read', async () => {
    const controller = new AbortController(); let resolve!: (r: Response) => void;
    const transport = vi.fn<typeof fetch>(() => new Promise(r => { resolve = r; }));
    const pending = send(request('queue', { signal: controller.signal }), 'queue', transport);
    for (let n = 0; n < 30 && !transport.mock.calls.length; n++) await Promise.resolve();
    expect(transport).toHaveBeenCalledTimes(1); controller.abort();
    const result = await pending; expect(result.status).toBe(408);
    const cancel = vi.fn(); resolve(new Response(new ReadableStream({ cancel })));
    for (let n = 0; n < 30; n++) await Promise.resolve();
    expect(transport).toHaveBeenCalledTimes(1); expect(cancel).toHaveBeenCalled();
  });
  it('one aggregate deadline covers upload, Auth, context and a possibly committed decision', async () => {
    vi.useFakeTimers({ now: time }); let count = 0;
    const transport = vi.fn<typeof fetch>(() => {
      count++;
      if (count < 3) return new Promise(resolve => setTimeout(() => resolve(Response.json(count === 1 ? user : context)), 4000));
      return new Promise(() => {});
    });
    const upload = new ReadableStream({ start(c) {
      setTimeout(() => { c.enqueue(new TextEncoder().encode(JSON.stringify(command))); c.close(); }, 4000);
    } });
    const pending = send(request('decision', { body: upload }), 'decision', transport);
    let settled = false; void pending.then(() => { settled = true; });
    await vi.advanceTimersByTimeAsync(12001);
    expect(transport).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(2998);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const result = await pending;
    expect(result.status).toBe(503); expect(await result.json()).toEqual({ ok: false, error: 'outcome_unknown' });
    expect((transport.mock.calls[2][1]?.signal as AbortSignal).aborted).toBe(true);
  });
  it('exports real POST routes, default disabled, and rejects every other supported method', async () => {
    vi.stubEnv('SHIOK_MODERATION_ENABLED', 'false');
    for (const [operation, route] of [['queue', queueRoute], ['decision', decisionRoute], ['context', contextRoute]] as const) {
      expect(route.runtime).toBe('nodejs'); expect(route.dynamic).toBe('force-dynamic'); expect(route.maxDuration).toBe(20);
      expect((await route.POST(request(operation))).status).toBe(503);
      for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'] as const) {
        const result = route[method](new Request(`${origin}/api/moderation/${operation}`, { method }));
        expect(result.status).toBe(405); expect(result.headers.get('allow')).toBe('POST');
        if (method === 'HEAD') expect(await result.text()).toBe('');
      }
    }
  });
});
