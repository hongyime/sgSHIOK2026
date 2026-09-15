import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticateModerator, MODERATOR_AUTH_TIMEOUT_MS } from '../../app/api/moderation/auth';
import project from '../report-project.json';

const now = Date.parse('2026-09-15T04:00:00Z');
const actor = '11111111-1111-4111-8111-111111111111';
const session = '22222222-2222-4222-8222-222222222222';
const config = { projectUrl: project.projectUrl, secretKey: ['sb', 'secret', 'synthetic'.repeat(4)].join('_') };
const base = { sub: actor, session_id: session, iss: `${project.projectUrl}/auth/v1`, aud: 'authenticated',
  role: 'authenticated', is_anonymous: false, exp: now / 1000 + 1200, iat: now / 1000 - 60 };
const user = { id: actor, aud: 'authenticated', role: 'authenticated', is_anonymous: false,
  email: 'private@example.test', user_metadata: { moderator: true }, app_metadata: { role: 'owner' } };
const jwt = (changes = {}, alg = 'ES256') => [Buffer.from(JSON.stringify({ alg })).toString('base64url'),
  Buffer.from(JSON.stringify({ ...base, ...changes })).toString('base64url'), 'syntheticSignature'].join('.');
const run = (transport: typeof fetch, token: unknown = jwt(), signal = new AbortController().signal, clock = () => now) =>
  authenticateModerator(config, token, signal, transport, clock);
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Moderator authentication before independent database authorization', () => {
  it('verifies the exact token with pinned Auth and returns only minimal identity', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json(user));
    expect(await run(transport)).toEqual({ ok: true, identity: { actor, session, tokenExpiresAt: '2026-09-15T04:20:00.000Z' } });
    expect(transport).toHaveBeenCalledExactlyOnceWith(`${project.projectUrl}/auth/v1/user`, expect.objectContaining({
      method: 'GET', cache: 'no-store', redirect: 'error', headers: { apikey: config.secretKey, Authorization: `Bearer ${jwt()}` },
    }));
  });
  it.each(['none', 'HS512', '', 'es256'])('rejects unsupported/unsigned algorithm %s before IO', async alg => {
    const transport = vi.fn();
    expect(await run(transport, jwt({}, alg))).toEqual({ ok: false, error: 'unauthenticated' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    { sub: 'invalid' }, { session_id: 'invalid' }, { iss: 'https://other.supabase.co/auth/v1' },
    { role: 'service_role' }, { aud: ['authenticated'] }, { is_anonymous: true }, { is_anonymous: undefined },
    { exp: now / 1000 }, { exp: now / 1000 + 3601 }, { iat: now / 1000 + 1 }, { iat: undefined },
    { nbf: now / 1000 + 1 }, { exp: '9999999999' }, { exp: null }, { session_id: undefined },
  ])('rejects invalid claims %# without trusting metadata', async changes => {
    const transport = vi.fn();
    expect(await run(transport, jwt(changes))).toEqual({ ok: false, error: 'unauthenticated' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, {}, '', 'a.b', 'a.b.c.d', 'a'.repeat(8193), 'a.b.c\n'])('rejects malformed token %#', async token => {
    const transport = vi.fn();
    expect(await run(transport, token)).toEqual({ ok: false, error: 'unauthenticated' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['http://localhost', `${project.projectUrl}/`, 'https://ajvenxqkedajbrbnnfko.supabase.co'])('never sends keys to a different target %s', async projectUrl => {
    const transport = vi.fn();
    expect(await authenticateModerator({ ...config, projectUrl }, jwt(), new AbortController().signal, transport, () => now))
      .toEqual({ ok: false, error: 'unavailable' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('rejects a PAT as runtime key', async () => {
    const transport = vi.fn();
    expect(await authenticateModerator({ ...config, secretKey: 'sbp_synthetic' }, jwt(), new AbortController().signal, transport, () => now))
      .toEqual({ ok: false, error: 'unavailable' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([401, 403, 429, 500, 302])('fails closed on Auth %s without retry or provider text', async status => {
    const transport = vi.fn().mockResolvedValue(new Response('private provider text', { status }));
    const result = await run(transport);
    expect(result).toEqual({ ok: false, error: status === 401 || status === 403 ? 'unauthenticated' : 'unavailable' });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([{ id: session }, { is_anonymous: true }, { is_anonymous: undefined }, { role: 'service_role' },
    { aud: 'other' }, { deleted_at: '2026-09-14T00:00:00Z' }])('rejects mismatched verified user %#', async change => {
    expect(await run(vi.fn().mockResolvedValue(Response.json({ ...user, ...change })))).toEqual({ ok: false, error: 'unauthenticated' });
  });
  it('does not authorize user metadata in place of a valid signature', async () => {
    const transport = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    expect(await run(transport, jwt({ user_metadata: { moderator: true }, app_metadata: { moderator: true } })))
      .toEqual({ ok: false, error: 'unauthenticated' });
  });
  it('checks token expiry again after Auth finishes', async () => {
    let current = now;
    const transport = vi.fn().mockImplementation(async () => { current = now + 1200000; return Response.json(user); });
    expect(await run(transport, jwt(), undefined, () => current)).toEqual({ ok: false, error: 'unauthenticated' });
  });
  it('rejects oversized Auth replies', async () => {
    expect(await run(vi.fn().mockResolvedValue(Response.json({ ...user, padding: 'x'.repeat(16384) })))).toEqual({ ok: false, error: 'unavailable' });
  });
  it('rejects zero-progress Auth body chunks and cancels the reader', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({ start(c) {
      c.enqueue(new Uint8Array(0)); c.enqueue(new TextEncoder().encode(JSON.stringify(user))); c.close();
    }, cancel });
    expect(await run(vi.fn().mockResolvedValue(new Response(body)))).toEqual({ ok: false, error: 'unavailable' });
    expect(cancel).toHaveBeenCalled();
  });
  it('rejects invalid UTF8 and malformed JSON', async () => {
    for (const body of [new Uint8Array([255]), '{']) {
      expect(await run(vi.fn().mockResolvedValue(new Response(body)))).toEqual({ ok: false, error: 'unavailable' });
    }
  });
  it('does no IO for an already cancelled request', async () => {
    const controller = new AbortController(); controller.abort(); const transport = vi.fn();
    expect(await run(transport, jwt(), controller.signal)).toEqual({ ok: false, error: 'unavailable' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('bounds uncooperative transport and never retries', async () => {
    vi.useFakeTimers();
    const transport = vi.fn().mockImplementation(() => new Promise(() => {}));
    const pending = run(transport);
    await vi.advanceTimersByTimeAsync(MODERATOR_AUTH_TIMEOUT_MS);
    expect(await pending).toEqual({ ok: false, error: 'unavailable' });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it('bounds a response body that never finishes', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const stream = new ReadableStream({ start() {}, cancel });
    const pending = run(vi.fn().mockResolvedValue(new Response(stream)));
    await vi.advanceTimersByTimeAsync(MODERATOR_AUTH_TIMEOUT_MS);
    expect(await pending).toEqual({ ok: false, error: 'unavailable' });
    expect(cancel).toHaveBeenCalled();
  });
});
