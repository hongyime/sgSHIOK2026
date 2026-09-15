import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createModeratorClient, validateModeratorDecision, MODERATOR_CLIENT_TIMEOUT_MS, MAX_MODERATOR_CLIENT_REPLY_BYTES,
  type ModeratorClient, type ModeratorClientFailure,
} from '../moderator-client';
import type { ModerationCommand, ModerationQueueRequest } from '../../app/api/moderation/store';

vi.mock('../../app/api/moderation/store', () => { throw Error('Browser must not load the server store'); });

// Synthetic browser responses mirror the installed HTTP projections; no Auth/DB/network IO.
const id = (n: number) => `${n.toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`;
const receipt = id(1), target = id(2), actor = id(3);
const NOW = Date.parse('2026-09-15T10:00:00Z');
const expiry = '2026-09-15T10:30:00.000Z';
const received = '2026-09-14T06:00:00.123456+00:00';
const expires = '2026-10-14T06:00:00.123456+00:00';
const observed = '2026-09-15T10:00:00.123456+00:00';
const moderated = '2026-09-15T10:00:00.123457+00:00';
const base64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (exp = Date.parse(expiry) / 1000, extra = {}) => `${base64({ alg: 'ES256' })}.${base64({ exp, ...extra })}.c2lnbmF0dXJl`;
const loginBody = (changes = {}) => ({ ok: true, accessToken: jwt(), expiresAt: expiry, ...changes });
const loginResponse = () => Response.json(loginBody());
const credentials = ['moderator@example.test', 'synthetic password'] as const;
const command: ModerationCommand = { receipt_id: receipt, expected_revision: 1, action: 'accepted', reason: 'Reviewed privately' };
const content = () => ({ schema_version: 1, report_type: 'mapping_error', referenced_bundle_version: 'synthetic_bundle',
  geometry: { type: 'Point', coordinates: [103.8, 1.3] },
  context: { postal_code: '123456', destination_id: 'stop', transit_category: 'bus', published_route_id: 'route' },
  note: 'Synthetic report',
});
const audit = (changes = {}) => ({ moderated_at: moderated, moderator_id: actor, reason: 'Private review', duplicate_of: null, ...changes });
const row = (changes = {}) => ({ receipt_id: receipt, report_type: 'mapping_error', state: 'pending', revision: 1,
  received_at: received, expires_at: expires, content: content(), moderation: null, ...changes });
const source = (changes = {}) => ({ receipt_id: receipt, report_type: 'mapping_error', state: 'pending', revision: 1,
  received_at: received, moderated_at: null, moderator_id: null, reason: null, duplicate_of: null, ...changes });
const queueBody = (reports: unknown[] = [row()], changes = {}) => ({ ok: true, queue: { reports, page_limit: 25 }, ...changes });
const contextBody = (changes = {}) => ({ ok: true, context: { source: source(), observed_at: observed, ...changes } });
const decisionBody = (changes = {}) => ({ ok: true, decision: { receipt_id: receipt, state: 'accepted', revision: 2, moderated_at: moderated, ...changes } });
const fail = (error: ModeratorClientFailure['error'] = 'unavailable') => ({ ok: false, error });
const deferred = <T>() => {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const setup = async (response: Response | Promise<Response> = Response.json(queueBody())) => {
  const transport = vi.fn().mockResolvedValueOnce(loginResponse()).mockImplementation(() => response);
  const client = createModeratorClient({ transport });
  expect(await client.login(...credentials)).toEqual({ ok: true, expiresAt: expiry });
  return { client, transport };
};
const headers = (transport: ReturnType<typeof vi.fn>, index: number) => new Headers(transport.mock.calls[index][1].headers);
const body = (transport: ReturnType<typeof vi.fn>, index: number) => JSON.parse(transport.mock.calls[index][1].body);
const signal = (transport: ReturnType<typeof vi.fn>, index: number): AbortSignal => transport.mock.calls[index][1].signal;
const read = (client: ModeratorClient) => client.queue({ state: 'pending' });

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Browser moderator session contract', () => {
  it('returns exactly the seven methods and stores no enumerable session fields', () => {
    const client = createModeratorClient({ transport: vi.fn() });
    expect(Object.keys(client).sort()).toEqual(['clear', 'context', 'decide', 'expiresAt', 'login', 'logout', 'queue']);
    expect(client.expiresAt()).toBeNull(); expect(JSON.stringify(client)).toBe('{}');
    expect(Object.isFrozen(client)).toBe(true);
  });
  it('uses the exact local login endpoint and exposes only expiry', async () => {
    const transport = vi.fn().mockResolvedValue(loginResponse());
    const client = createModeratorClient({ transport });
    const result = await client.login(...credentials);
    expect(result).toEqual({ ok: true, expiresAt: expiry }); expect(Object.isFrozen(result)).toBe(true);
    expect(client.expiresAt()).toBe(Date.parse(expiry));
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toBe('/api/moderation/login');
    expect(body(transport, 0)).toEqual({ email: credentials[0], password: credentials[1] });
    expect(headers(transport, 0).has('authorization')).toBe(false);
    expect(JSON.stringify(result)).not.toContain(jwt());
    expect(vi.getTimerCount()).toBe(0);
  });
  it('does not infer authorization from claims or leak their arbitrary fields', async () => {
    const token = jwt(undefined, { role: 'untrusted', url: 'https://private.invalid', email: 'private@example.test' });
    const transport = vi.fn().mockResolvedValueOnce(Response.json(loginBody({ accessToken: token }))).mockResolvedValue(Response.json(queueBody()));
    const client = createModeratorClient({ transport });
    expect(await client.login(...credentials)).toEqual({ ok: true, expiresAt: expiry });
    expect((await read(client)).ok).toBe(true);
    expect(headers(transport, 1).get('authorization')).toBe(`Bearer ${token}`);
  });
  it.each([
    null, [], {}, { ok: false }, { ...loginBody(), refreshToken: 'private' }, { ...loginBody(), user: {} },
    loginBody({ expiresAt: received }), loginBody({ expiresAt: '2026-02-30T10:30:00Z' }), loginBody({ expiresAt: '2026-09-15T10:30:00.000001Z' }),
    loginBody({ expiresAt: '2026-09-15T11:30:00Z', accessToken: jwt(NOW / 1000 + 5400) }),
    loginBody({ expiresAt: expiry, accessToken: jwt(NOW / 1000 + 1200) }), loginBody({ accessToken: jwt(1.5) }),
    loginBody({ accessToken: jwt(undefined, { exp: '123' }) }), loginBody({ accessToken: 'aaa.bbb.ccc' }),
    loginBody({ accessToken: '.abc.abc' }), loginBody({ accessToken: `${jwt()}.extra` }), loginBody({ accessToken: `${jwt()}\n` }),
    loginBody({ accessToken: `${'a'.repeat(8192)}.e30.c2ln` }), loginBody({ accessToken: 'a.e30.c2ln' }),
    loginBody({ accessToken: 'e30.____.c2ln' }), loginBody({ accessToken: 'e30.W10.c2ln' }),
  ])('fails closed on malformed/mismatched/expired login %#', async value => {
    const transport = vi.fn().mockResolvedValue(Response.json(value));
    const client = createModeratorClient({ transport });
    expect(await client.login(...credentials)).toEqual(fail());
    expect(client.expiresAt()).toBeNull();
    expect(await read(client)).toEqual(fail('unauthenticated'));
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([['', 'password'], ['bad', 'password'], ['x\ny@example.test', 'password'], ['x@example.test', ''],
    ['x@example.test', 'secret\0'], ['x@example.test', '\ud800'], ['x'.repeat(321), 'password'],
    ['x@example.test', 'a'.repeat(4097)], ['x@example.test', '\u0001'.repeat(2000)],
  ])('rejects invalid/bound-exceeding credentials without IO %#', async (email, password) => {
    const transport = vi.fn(), client = createModeratorClient({ transport });
    expect(await client.login(email, password)).toEqual(fail('invalid_request'));
    expect(transport).not.toHaveBeenCalled(); expect(client.expiresAt()).toBeNull();
  });
  it('trims/lowercases email like the server while preserving password bytes exactly', async () => {
    const password = ' \t MixedCASE \u00e9 e\u0301 \n';
    const transport = vi.fn().mockResolvedValue(loginResponse());
    const client = createModeratorClient({ transport });
    expect((await client.login(' \tMODERATOR@EXAMPLE.TEST\n ', password)).ok).toBe(true);
    expect(body(transport, 0)).toEqual({ email: credentials[0], password });
  });
  it('accepts an email of exactly 254 characters', async () => {
    const suffix = '@example.test', email = 'a'.repeat(254 - suffix.length) + suffix;
    expect(email.length).toBe(254);
    const transport = vi.fn().mockResolvedValue(loginResponse());
    expect((await createModeratorClient({ transport }).login(email, credentials[1])).ok).toBe(true);
    expect(body(transport, 0).email).toBe(email);
  });
  it.each([
    'a'.repeat(255 - '@example.test'.length) + '@example.test',
    ' '.repeat(255 - credentials[0].length) + credentials[0],
    '\ud800@example.test', 'name\0@example.test',
    '\u0130'.repeat(130) + '@example.test',
  ])('rejects raw/normalized oversized or invalid scalar email %# before IO', async email => {
    const transport = vi.fn();
    expect(await createModeratorClient({ transport }).login(email, credentials[1])).toEqual(fail('invalid_request'));
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['a'.repeat(1024), '\u00e9'.repeat(512), '\u{1f600}'.repeat(256), '\u4e2d'.repeat(341) + 'x'])
  ('accepts a password of exactly 1024 UTF-8 bytes %# without normalization', async password => {
    expect(new TextEncoder().encode(password).length).toBe(1024);
    const transport = vi.fn().mockResolvedValue(loginResponse());
    expect((await createModeratorClient({ transport }).login(...[credentials[0], password] as const)).ok).toBe(true);
    expect(body(transport, 0).password).toBe(password);
  });
  it.each(['a'.repeat(1025), '\u00e9'.repeat(512) + 'x', '\u{1f600}'.repeat(256) + 'x', '\u4e2d'.repeat(341) + 'xx'])
  ('rejects a password of 1025 UTF-8 bytes %# before transport', async password => {
    expect(new TextEncoder().encode(password).length).toBe(1025);
    const transport = vi.fn();
    expect(await createModeratorClient({ transport }).login(credentials[0], password)).toEqual(fail('invalid_request'));
    expect(transport).not.toHaveBeenCalled();
  });
  it('never reads browser storage, cookies or logs credentials/session/data', async () => {
    for (const name of ['localStorage', 'sessionStorage', 'indexedDB', 'document']) {
      vi.stubGlobal(name, new Proxy({}, { get() { throw Error('storage forbidden'); } }));
    }
    const log = vi.spyOn(console, 'log'), warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
    const { client, transport } = await setup();
    const result = await read(client);
    expect(result.ok).toBe(true);
    expect(log).not.toHaveBeenCalled(); expect(warn).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    expect(transport.mock.calls[1][0]).not.toContain(jwt());
  });
  it.each(['queue', 'context', 'decide'] as const)('does not dispatch %s without a session', async method => {
    const transport = vi.fn(), client = createModeratorClient({ transport });
    const result = method === 'queue' ? read(client) : method === 'context' ? client.context(receipt) : client.decide(command);
    expect(await result).toEqual(fail('unauthenticated')); expect(transport).not.toHaveBeenCalled();
  });
  it('expires without refreshing or retrying', async () => {
    const { client, transport } = await setup();
    vi.setSystemTime(Date.parse(expiry));
    expect(client.expiresAt()).toBeNull(); expect(await read(client)).toEqual(fail('unauthenticated'));
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([NaN, Infinity, -1, 1.5])('fails closed when injected clock is invalid %#', async value => {
    const transport = vi.fn().mockResolvedValue(loginResponse());
    const client = createModeratorClient({ transport, now: () => value });
    expect(await client.login(...credentials)).toEqual(fail()); expect(client.expiresAt()).toBeNull();
  });
});

describe('Session epochs and cross-call races', () => {
  it('clear immediately aborts all readers, invalidates pending login and prevents late session restoration', async () => {
    const late = deferred<Response>(), transport = vi.fn().mockReturnValue(late.promise);
    const client = createModeratorClient({ transport });
    const pending = client.login(...credentials);
    expect(transport).toHaveBeenCalledTimes(1); client.clear();
    expect(signal(transport, 0).aborted).toBe(true); expect(client.expiresAt()).toBeNull();
    expect(await pending).toEqual(fail('unauthenticated'));
    late.resolve(loginResponse()); await flush(); expect(client.expiresAt()).toBeNull();
  });
  it('new login replaces the epoch, late old login cannot replace the new token', async () => {
    const late = deferred<Response>(), nextToken = jwt(undefined, { nonce: 2 });
    const transport = vi.fn().mockReturnValueOnce(late.promise).mockResolvedValueOnce(Response.json(loginBody({ accessToken: nextToken })))
      .mockResolvedValueOnce(Response.json(queueBody()));
    const client = createModeratorClient({ transport });
    const old = client.login(...credentials);
    expect(await client.login(...credentials)).toEqual({ ok: true, expiresAt: expiry });
    late.resolve(loginResponse()); expect(await old).toEqual(fail('unauthenticated'));
    expect((await read(client)).ok).toBe(true); expect(headers(transport, 2).get('authorization')).toBe(`Bearer ${nextToken}`);
  });
  it('invalid login also discards the prior local session', async () => {
    const { client, transport } = await setup();
    expect(await client.login('', 'bad')).toEqual(fail('invalid_request'));
    expect(client.expiresAt()).toBeNull(); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('logout clears and aborts immediately then attempts server revocation once with captured token', async () => {
    const pendingRead = deferred<Response>(), pendingLogout = deferred<Response>();
    const { client, transport } = await setup(pendingRead.promise);
    const readResult = read(client), contextResult = client.context(receipt);
    transport.mockImplementationOnce(() => pendingLogout.promise);
    const loggedOut = client.logout();
    expect(client.expiresAt()).toBeNull(); expect(signal(transport, 1).aborted).toBe(true); expect(signal(transport, 2).aborted).toBe(true);
    expect(transport.mock.calls[3][0]).toBe('/api/moderation/logout'); expect(body(transport, 3)).toEqual({});
    expect(headers(transport, 3).get('authorization')).toBe(`Bearer ${jwt()}`);
    expect(await readResult).toEqual(fail('unauthenticated')); expect(await contextResult).toEqual(fail('unauthenticated'));
    pendingLogout.resolve(Response.json({ ok: true })); expect(await loggedOut).toEqual({ ok: true });
    pendingRead.resolve(Response.json(queueBody())); await flush();
    expect(client.expiresAt()).toBeNull(); expect(transport).toHaveBeenCalledTimes(4);
  });
  it('reports server logout failure while preserving immediate local signout', async () => {
    const { client, transport } = await setup(Response.json(fail(), { status: 503 }));
    expect(await client.logout()).toEqual(fail()); expect(client.expiresAt()).toBeNull();
    expect(await client.logout()).toEqual({ ok: true }); expect(transport).toHaveBeenCalledTimes(2);
  });
  it.each([{ ok: true, url: 'https://private.invalid' }, {}, { ok: false }, null])('rejects malformed logout acknowledgement %#', async value => {
    const { client } = await setup(Response.json(value));
    expect(await client.logout()).toEqual(fail()); expect(client.expiresAt()).toBeNull();
  });
  it('a late logout denial cannot clear a newly logged-in session', async () => {
    const late = deferred<Response>(), { client, transport } = await setup(late.promise);
    const logout = client.logout(); transport.mockResolvedValueOnce(loginResponse());
    expect((await client.login(...credentials)).ok).toBe(true);
    late.resolve(Response.json(fail('forbidden'), { status: 403 }));
    expect(await logout).toEqual(fail('unauthenticated')); expect(client.expiresAt()).toBe(Date.parse(expiry));
  });
  it('logout during login aborts it even before any token has been received', async () => {
    const late = deferred<Response>(), transport = vi.fn().mockReturnValue(late.promise), client = createModeratorClient({ transport });
    const pending = client.login(...credentials);
    expect(await client.logout()).toEqual({ ok: true }); expect(await pending).toEqual(fail('unauthenticated'));
    late.resolve(loginResponse()); await flush(); expect(client.expiresAt()).toBeNull();
  });
  it.each([401, 403])('status %i clears/aborts all outstanding calls even with malformed body', async status => {
    const late = deferred<Response>(), { client, transport } = await setup(late.promise);
    const first = read(client);
    transport.mockResolvedValueOnce(new Response('private provider error', { status }));
    expect(await client.context(receipt)).toEqual(fail(status === 401 ? 'unauthenticated' : 'forbidden'));
    expect(await first).toEqual(fail(status === 401 ? 'unauthenticated' : 'forbidden'));
    expect(client.expiresAt()).toBeNull(); expect(signal(transport, 1).aborted).toBe(true);
    late.resolve(Response.json(queueBody())); await flush(); expect(client.expiresAt()).toBeNull();
  });
  it('late reader auth failure does not clear the replacement login', async () => {
    const late = deferred<Response>(), { client, transport } = await setup(late.promise);
    const old = read(client); transport.mockResolvedValueOnce(loginResponse());
    expect((await client.login(...credentials)).ok).toBe(true);
    late.resolve(new Response('private', { status: 401 })); expect(await old).toEqual(fail('unauthenticated'));
    expect(client.expiresAt()).toBe(Date.parse(expiry));
  });
  it('session expiry aborts an uncooperative in-flight read before the aggregate deadline', async () => {
    const transport = vi.fn().mockResolvedValueOnce(Response.json(loginBody({ expiresAt: new Date(NOW + 1000).toISOString(), accessToken: jwt((NOW + 1000) / 1000) })))
      .mockImplementation(() => new Promise(() => {}));
    const client = createModeratorClient({ transport }); expect((await client.login(...credentials)).ok).toBe(true);
    const pending = read(client); await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual(fail('unauthenticated')); expect(client.expiresAt()).toBeNull(); expect(signal(transport, 1).aborted).toBe(true);
  });
  it('session expiry after decision dispatch preserves outcome_unknown', async () => {
    const transport = vi.fn().mockResolvedValueOnce(Response.json(loginBody({ expiresAt: new Date(NOW + 1000).toISOString(), accessToken: jwt((NOW + 1000) / 1000) })))
      .mockImplementation(() => new Promise(() => {}));
    const client = createModeratorClient({ transport }); expect((await client.login(...credentials)).ok).toBe(true);
    const pending = client.decide(command); await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual(fail('outcome_unknown')); expect(client.expiresAt()).toBeNull();
  });
  it('clearing while a response body is pending aborts its reader and never returns the old report', async () => {
    const chunks = deferred<ReadableStreamReadResult<Uint8Array>>(), cancel = vi.fn(() => Promise.resolve());
    const reader = { read: () => chunks.promise, cancel, releaseLock: vi.fn() };
    const response = Response.json(queueBody()); Object.defineProperty(response, 'body', { value: { getReader: () => reader } });
    const { client } = await setup(response); const pending = read(client); await flush();
    client.clear(); expect(await pending).toEqual(fail('unauthenticated'));
    expect(cancel).toHaveBeenCalled(); chunks.resolve({ done: true, value: undefined }); await flush();
    expect(client.expiresAt()).toBeNull();
  });
  it('cannot restore login if a reentrant clock clears its epoch during response validation', async () => {
    let armed = false;
    const transport = vi.fn().mockResolvedValue(loginResponse());
    const client = createModeratorClient({ transport, now: () => { if (armed) client.clear(); return NOW; } });
    armed = true;
    expect(await client.login(...credentials)).toEqual(fail('unauthenticated')); expect(client.expiresAt()).toBeNull();
  });
});

describe('Safe local requests and API response projection', () => {
  it('posts queue/context/decision to exact relative paths with no cookies, redirects or cache', async () => {
    const { client, transport } = await setup();
    expect((await read(client)).ok).toBe(true);
    transport.mockResolvedValueOnce(Response.json(contextBody())); expect((await client.context(receipt)).ok).toBe(true);
    transport.mockResolvedValueOnce(Response.json(decisionBody())); expect((await client.decide(command)).ok).toBe(true);
    expect(transport.mock.calls.map(call => call[0])).toEqual(['/api/moderation/login', '/api/moderation/queue', '/api/moderation/context', '/api/moderation/decision']);
    for (let i = 0; i < 4; i++) {
      expect(transport.mock.calls[i][1]).toMatchObject({ method: 'POST', credentials: 'omit', redirect: 'error', cache: 'no-store', referrerPolicy: 'same-origin' });
      expect(headers(transport, i).get('content-type')).toBe('application/json'); expect(headers(transport, i).get('accept')).toBe('application/json');
      expect(headers(transport, i).has('cookie')).toBe(false);
    }
    for (let i = 1; i < 4; i++) expect(headers(transport, i).get('authorization')).toBe(`Bearer ${jwt()}`);
    expect(body(transport, 2)).toEqual({ receipt_id: receipt }); expect(body(transport, 3)).toEqual(command);
  });
  it('preserves microsecond cursor spelling and snapshots the request', async () => {
    const late = deferred<Response>(), { client, transport } = await setup(late.promise);
    const request: ModerationQueueRequest = { state: 'pending', after: { received_at: received, receipt_id: id(0) } };
    const pending = client.queue(request); request.state = 'accepted'; request.after!.received_at = observed;
    late.resolve(Response.json(queueBody(Array.from({ length: 25 }, (_, i) => row({ receipt_id: id(i + 1) })))));
    const result = await pending; expect(result.ok).toBe(true);
    expect(body(transport, 1)).toEqual({ state: 'pending', after: { received_at: received, receipt_id: id(0) } });
    if (result.ok) {
      expect(result.queue.reports).toHaveLength(25); expect(result.queue.reports[24].received_at).toBe(received);
      transport.mockResolvedValueOnce(Response.json(queueBody([row({ receipt_id: id(26) })])));
      expect((await client.queue({ state: 'pending', after: { received_at: result.queue.reports[24].received_at, receipt_id: id(25) } })).ok).toBe(true);
      expect(body(transport, 2).after.received_at).toBe(received);
    }
  });
  it.each(['pending', 'accepted', 'rejected', 'duplicate'] as const)('accepts validated %s rows with only safe content/audit fields', async state => {
    const raw = row({ state, revision: state === 'pending' ? 1 : 2, moderation: state === 'pending' ? null : audit({ duplicate_of: state === 'duplicate' ? target : null }) });
    const { client } = await setup(Response.json(queueBody([raw])));
    const result = await client.queue({ state }); expect(result).toEqual(queueBody([raw]));
    if (result.ok) {
      expect(Object.isFrozen(result.queue.reports)).toBe(true); expect(Object.isFrozen(result.queue.reports[0])).toBe(true);
      expect(Object.isFrozen(result.queue.reports[0].content.geometry)).toBe(true);
      expect(result.queue.reports[0].content).not.toHaveProperty('client_request_id');
    }
  });
  it.each([null, {}, [], { state: 'all' }, { state: 'pending', limit: 50 }, { state: 'pending', after: undefined },
    { state: 'pending', after: { received_at: received, receipt_id: 'bad' } }, { state: 'pending', after: { received_at: '2026-02-30T00:00:00Z', receipt_id: receipt } },
    { state: 'pending', after: { received_at: received, receipt_id: receipt, secret: 'no' } },
  ])('rejects malformed queue request %# without dispatch', async input => {
    const { client, transport } = await setup();
    expect(await client.queue(input as ModerationQueueRequest)).toEqual(fail('invalid_request')); expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each(['bad', `${receipt}\n`, 'https://private.invalid/', '', null, {}, 123])('rejects bad context receipt %# without dispatch', async input => {
    const { client, transport } = await setup();
    expect(await client.context(input as string)).toEqual(fail('invalid_request')); expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([
    { root: true }, { ok: true, queue: { reports: [], page_limit: 100 } }, { ok: true, queue: { reports: [], page_limit: 25, next: 'https://private.invalid' } },
    queueBody([row(), row()]), queueBody(Array.from({ length: 26 }, (_, i) => row({ receipt_id: id(i + 1) }))),
    queueBody([row({ state: 'accepted' })]), queueBody([row({ receipt_id: 'bad' })]), queueBody([row({ revision: 0 })]),
    queueBody([row({ report_type: 'shelter_request' })]), queueBody([row({ request_hash: 'private' })]),
    queueBody([row({ content: { ...content(), client_request_id: 'secret' } })]),
    queueBody([row({ content: { ...content(), url: 'https://private.invalid' } })]),
    queueBody([row({ content: { ...content(), context: { destination_id: 'https://private.invalid' } } })]),
    queueBody([row({ content: { ...content(), geometry: { type: 'Point', coordinates: [0, 0] } } })]),
    queueBody([row({ content: { ...content(), note: 'bad\0' } })]), queueBody([row({ moderation: audit() })]),
    queueBody([row({ expires_at: '2026-10-14T06:00:00.123455+00:00' })]),
    queueBody([row({ received_at: '2026-08-01T00:00:00Z', expires_at: '2026-08-31T00:00:00Z' })]),
    queueBody([row({ received_at: '2026-02-30T00:00:00Z' })]), queueBody([row({ receipt_id: id(2) }), row({ receipt_id: id(1) })]),
    queueBody([], { url: 'https://private.invalid' }),
  ])('rejects unsafe/inconsistent queue response %# without exposing fields', async response => {
    const { client } = await setup(Response.json(response));
    expect(await read(client)).toEqual(fail());
  });
  it('enforces exact cursor order, including sub-millisecond differences and offsets', async () => {
    const { client } = await setup(Response.json(queueBody()));
    expect(await client.queue({ state: 'pending', after: { received_at: '2026-09-14T14:00:00.123457+08:00', receipt_id: id(0) } })).toEqual(fail());
  });
  it.each(['pending', 'accepted', 'rejected', 'duplicate'] as const)('accepts receipt-specific %s reconciliation without traversing old targets', async state => {
    const raw = source({ state, revision: state === 'pending' ? 1 : 2, ...(state === 'pending' ? {} : audit({ moderated_at: observed, duplicate_of: state === 'duplicate' ? target : null })) });
    const { client } = await setup(Response.json(contextBody({ source: raw })));
    expect(await client.context(receipt)).toEqual(contextBody({ source: raw }));
  });
  it.each([
    { source: source({ receipt_id: target }) }, { source: source({ reason: 'not pending' }) },
    { source: source({ state: 'accepted', revision: 1, ...audit() }) },
    { source: source({ state: 'accepted', revision: 2, ...audit({ moderated_at: observed, duplicate_of: target }) }) },
    { source: source({ state: 'duplicate', revision: 2, ...audit({ moderated_at: observed, duplicate_of: receipt }) }) },
    { source: source({ state: 'rejected', revision: 2, ...audit({ moderated_at: observed, reason: '\ud800' }) }) },
    { source: source({ state: 'accepted', revision: 2, ...audit({ moderated_at: moderated }) }) },
    { source: source({ received_at: expires }) }, { source: source({ state: 'other' }) },
    { observed_at: expires }, { observed_at: 'https://private.invalid' }, { target_chain: [] }, { url: 'https://private.invalid' },
  ])('rejects mismatched/expired/unsafe context %#', async changes => {
    const { client } = await setup(Response.json(contextBody(changes)));
    expect(await client.context(receipt)).toEqual(fail());
  });
  it.each([[400, 'invalid_request'], [408, 'request_timeout'], [409, 'conflict'], [429, 'limited'], [503, 'unavailable'], [503, 'outcome_unknown']] as const)
  ('projects only exact known failure %i/%s without retry', async (status, error) => {
    const { client, transport } = await setup(Response.json(fail(error), { status }));
    expect(await read(client)).toEqual(fail(error)); expect(transport).toHaveBeenCalledTimes(2);
  });
  it.each([[500, fail()], [200, fail('forbidden')], [503, { ...fail(), message: 'private' }], [409, fail('limited')], [400, { error: 'private' }]])
  ('suppresses unknown or mismatched failures %#', async (status, value) => {
    const { client } = await setup(Response.json(value, { status: status as number }));
    expect(await read(client)).toEqual(fail());
  });
});

describe('Mutation snapshots and uncertain outcomes', () => {
  it.each(['accepted', 'rejected', 'duplicate'] as const)('validates and acknowledges exactly the requested %s mutation', async action => {
    const input = { ...command, action, ...(action === 'duplicate' ? { duplicate_of: target } : {}) };
    expect(validateModeratorDecision(input)).toBe(true);
    const { client, transport } = await setup(Response.json(decisionBody({ state: action })));
    expect(await client.decide(input)).toEqual(decisionBody({ state: action })); expect(body(transport, 1)).toEqual(input);
  });
  it.each([null, [], {}, { ...command, actor }, { ...command, session: id(6) }, { ...command, expected_revision: 0 },
    { ...command, expected_revision: 1.5 }, { ...command, expected_revision: Number.MAX_SAFE_INTEGER }, { ...command, action: 'pending' },
    { ...command, reason: '' }, { ...command, reason: ' \t\u00a0\ufeff' }, { ...command, reason: 'x\0y' }, { ...command, reason: '\ud800' },
    { ...command, reason: '\u{1f600}'.repeat(1001) }, { ...command, duplicate_of: null }, { ...command, duplicate_of: undefined },
    { ...command, action: 'duplicate' }, { ...command, action: 'duplicate', duplicate_of: receipt },
    { ...command, action: 'duplicate', duplicate_of: 'https://private.invalid' },
  ])('rejects bad decision %# locally with zero mutating calls', async input => {
    expect(validateModeratorDecision(input)).toBe(false);
    const { client, transport } = await setup();
    expect(await client.decide(input as ModerationCommand)).toEqual(fail('invalid_request')); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('rejects getters/proxies/nonenumerable and inherited/symbol fields without evaluating a getter', () => {
    const getter = vi.fn(() => 'reason');
    expect(validateModeratorDecision(Object.defineProperty({ ...command }, 'reason', { enumerable: true, get: getter }))).toBe(false);
    expect(validateModeratorDecision(Object.create(command))).toBe(false);
    expect(validateModeratorDecision({ ...command, [Symbol('private')]: true })).toBe(false);
    expect(validateModeratorDecision(Object.defineProperty({ ...command }, 'reason', { value: 'x', enumerable: false }))).toBe(false);
    expect(validateModeratorDecision(new Proxy({}, { ownKeys() { throw Error('private'); } }))).toBe(false);
    expect(getter).not.toHaveBeenCalled();
  });
  it('snapshots the command and limits any concurrent second mutation instead of aliasing its promise', async () => {
    const late = deferred<Response>(), { client, transport } = await setup(late.promise), input = { ...command };
    const first = client.decide(input); input.receipt_id = target; input.action = 'rejected'; input.reason = 'changed';
    expect(await client.decide(input)).toEqual(fail('limited'));
    expect(await client.decide(command)).toEqual(fail('limited')); expect(transport).toHaveBeenCalledTimes(2);
    expect(body(transport, 1)).toEqual(command);
    late.resolve(Response.json(decisionBody())); expect(await first).toEqual(decisionBody());
    transport.mockResolvedValueOnce(Response.json(decisionBody({ receipt_id: target, state: 'rejected' })));
    expect((await client.decide(input)).ok).toBe(true);
  });
  it.each([{ receipt_id: target }, { state: 'rejected' }, { revision: 3 }, { moderated_at: 'invalid' },
    { moderated_at: '2026-02-30T00:00:00Z' }, { url: 'https://private.invalid' }])('treats malformed acknowledgement %# as unknown, never success', async changes => {
    const { client, transport } = await setup(Response.json(decisionBody(changes)));
    expect(await client.decide(command)).toEqual(fail('outcome_unknown')); expect(transport).toHaveBeenCalledTimes(2);
  });
  it.each([new TypeError('private network detail'), new Error('private upstream detail')])('treats thrown transport failure after dispatch as unknown %#', async error => {
    const { client, transport } = await setup(); transport.mockImplementationOnce(() => { throw error; });
    expect(await client.decide(command)).toEqual(fail('outcome_unknown')); expect(transport).toHaveBeenCalledTimes(2);
  });
  it.each(['clear', 'logout', 'login'] as const)('%s after decision dispatch preserves uncertainty', async operation => {
    const late = deferred<Response>(), { client, transport } = await setup(late.promise);
    const decision = client.decide(command);
    if (operation === 'clear') client.clear();
    if (operation === 'logout') { transport.mockResolvedValueOnce(Response.json({ ok: true })); expect((await client.logout()).ok).toBe(true); }
    if (operation === 'login') { transport.mockResolvedValueOnce(loginResponse()); expect((await client.login(...credentials)).ok).toBe(true); }
    expect(await decision).toEqual(fail('outcome_unknown'));
    late.resolve(Response.json(decisionBody())); await flush();
    expect(signal(transport, 1).aborted).toBe(true);
  });
  it.each([401, 403])('auth status %i on a dispatched decision clears session but keeps the outcome unknown', async status => {
    const { client } = await setup(Response.json(fail(status === 401 ? 'unauthenticated' : 'forbidden'), { status }));
    expect(await client.decide(command)).toEqual(fail('outcome_unknown')); expect(client.expiresAt()).toBeNull();
  });
  it('auth loss from another request aborts a pending decision as unknown', async () => {
    const late = deferred<Response>(), { client, transport } = await setup(late.promise);
    const decision = client.decide(command);
    transport.mockResolvedValueOnce(Response.json(fail('forbidden'), { status: 403 }));
    expect(await read(client)).toEqual(fail('forbidden')); expect(await decision).toEqual(fail('outcome_unknown'));
  });
  it('preserves the lost-ack outcome for UI reconciliation; retry conflict is not a receipt', async () => {
    const { client, transport } = await setup();
    transport.mockRejectedValueOnce(Error('commit happened; acknowledgement lost'));
    const uncertain = await client.decide(command); expect(uncertain).toEqual(fail('outcome_unknown'));
    transport.mockResolvedValueOnce(Response.json(fail('conflict'), { status: 409 }));
    expect(await client.decide(command)).toEqual(fail('conflict'));
    expect(uncertain).toEqual(fail('outcome_unknown'));
    transport.mockResolvedValueOnce(Response.json(contextBody({ source: source({ state: 'accepted', revision: 2, ...audit({ moderated_at: observed }) }) })));
    const reread = await client.context(receipt); expect(reread.ok && reread.context.source.state).toBe('accepted');
    expect(transport.mock.calls.map(call => call[0])).toEqual(['/api/moderation/login', '/api/moderation/decision', '/api/moderation/decision', '/api/moderation/context']);
  });
  it.each([[409, fail('conflict')], [400, fail('invalid_request')], [429, fail('limited')], [503, fail('unavailable')]] as const)
  ('returns exact server rejection %i without claiming a successful decision', async (status, value) => {
    const { client, transport } = await setup(Response.json(value, { status }));
    expect(await client.decide(command)).toEqual(value); expect(transport).toHaveBeenCalledTimes(2);
  });
  it.each([Response.json(fail(), { status: 500 }), Response.json(fail('conflict')), new Response('private error', { status: 503 }),
    Response.json({ ...fail('conflict'), reason: 'private provider reason' }, { status: 409 })])
  ('keeps uncertain or malformed decision failures unknown %#', async response => {
    const { client } = await setup(response); expect(await client.decide(command)).toEqual(fail('outcome_unknown'));
  });
});

describe('Bounded hostile transport and response handling', () => {
  it.each(['login', 'logout', 'queue', 'context', 'decide'] as const)('bounds stalled %s transport by one aggregate 18-second deadline', async method => {
    const transport = vi.fn().mockResolvedValueOnce(loginResponse()), client = createModeratorClient({ transport });
    if (method !== 'login') expect((await client.login(...credentials)).ok).toBe(true);
    transport.mockImplementation(() => new Promise(() => {}));
    if (method === 'login') transport.mockReset().mockImplementation(() => new Promise(() => {}));
    const pending = method === 'login' ? client.login(...credentials) : method === 'logout' ? client.logout()
      : method === 'queue' ? read(client) : method === 'context' ? client.context(receipt) : client.decide(command);
    await vi.advanceTimersByTimeAsync(MODERATOR_CLIENT_TIMEOUT_MS);
    expect(await pending).toEqual(fail(method === 'decide' ? 'outcome_unknown' : 'request_timeout'));
    expect(signal(transport, transport.mock.calls.length - 1).aborted).toBe(true); expect(vi.getTimerCount()).toBe(0);
  });
  it('includes both delayed headers and a stalled reader in the same deadline and never awaits cancellation', async () => {
    const late = deferred<Response>(), { client } = await setup(late.promise);
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const reader = { read: () => new Promise(() => {}), cancel, releaseLock: vi.fn() };
    const response = new Response(); Object.defineProperty(response, 'body', { value: { getReader: () => reader } });
    const pending = read(client); await vi.advanceTimersByTimeAsync(17000); late.resolve(response); await flush();
    await vi.advanceTimersByTimeAsync(1000); expect(await pending).toEqual(fail('request_timeout')); expect(cancel).toHaveBeenCalled();
  });
  it('marks a stalled decision body unknown and aborts it at deadline', async () => {
    const { client } = await setup(new Response(new ReadableStream({ pull: () => new Promise(() => {}) })));
    const pending = client.decide(command); await vi.advanceTimersByTimeAsync(MODERATOR_CLIENT_TIMEOUT_MS);
    expect(await pending).toEqual(fail('outcome_unknown'));
  });
  it('cancels a body arriving after timeout without accepting private data', async () => {
    const late = deferred<Response>(), { client } = await setup(late.promise);
    const pending = read(client); await vi.advanceTimersByTimeAsync(MODERATOR_CLIENT_TIMEOUT_MS);
    expect(await pending).toEqual(fail('request_timeout'));
    const cancel = vi.fn(); late.resolve(new Response(new ReadableStream({ cancel })));
    await flush(); expect(cancel).toHaveBeenCalledTimes(1);
  });
  it.each(['queue', 'decide'] as const)('rejects empty progress chunks immediately for %s', async method => {
    const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array()); } }));
    const { client } = await setup(response);
    expect(await (method === 'queue' ? read(client) : client.decide(command))).toEqual(fail(method === 'decide' ? 'outcome_unknown' : 'unavailable'));
    expect(vi.getTimerCount()).toBe(0);
  });
  it('accepts a 384 KiB body at the exact byte boundary and rejects one extra byte', async () => {
    const valid = JSON.stringify(queueBody()), padding = ' '.repeat(MAX_MODERATOR_CLIENT_REPLY_BYTES - new TextEncoder().encode(valid).length);
    const { client, transport } = await setup(new Response(valid + padding));
    expect((await read(client)).ok).toBe(true);
    transport.mockResolvedValueOnce(new Response(valid + padding + ' ')); expect(await read(client)).toEqual(fail());
  });
  it('accepts a legal 25-report escaped-content/reason page larger than 256 KiB', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => row({ receipt_id: id(i + 1), state: 'accepted', revision: 2,
      content: { ...content(), note: '\u0001'.repeat(1000) }, moderation: audit({ reason: `x${'\u0001'.repeat(999)}` }) }));
    const wire = JSON.stringify(queueBody(rows)); expect(new TextEncoder().encode(wire).length).toBeGreaterThan(256 * 1024);
    expect(new TextEncoder().encode(wire).length).toBeLessThan(MAX_MODERATOR_CLIENT_REPLY_BYTES);
    const { client } = await setup(new Response(wire)); expect((await client.queue({ state: 'accepted' })).ok).toBe(true);
  });
  it.each(['393217', '999999999', '-1', '1.5', '01', 'invalid'])('rejects invalid/excessive advertised body size %s', async length => {
    const { client } = await setup(new Response(JSON.stringify(queueBody()), { headers: { 'Content-Length': length } }));
    expect(await read(client)).toEqual(fail());
  });
  it('counts all bytes across split chunks without trusting a short content-length', async () => {
    const raw = new TextEncoder().encode(JSON.stringify(queueBody()) + ' '.repeat(MAX_MODERATOR_CLIENT_REPLY_BYTES));
    const { client } = await setup(new Response(new ReadableStream({ start(controller) {
      controller.enqueue(raw.subarray(0, 200)); controller.enqueue(raw.subarray(200)); controller.close();
    } }), { headers: { 'Content-Length': '1' } }));
    expect(await read(client)).toEqual(fail());
  });
  it('applies the byte cap before EOF even when UTF-16 character count is below the cap', async () => {
    const raw = JSON.stringify(queueBody([row({ content: { ...content(), note: '\u{1f600}'.repeat(100000) } })]));
    expect(raw.length).toBeLessThan(MAX_MODERATOR_CLIENT_REPLY_BYTES);
    const bytes = new TextEncoder().encode(raw); expect(bytes.length).toBeGreaterThan(MAX_MODERATOR_CLIENT_REPLY_BYTES);
    const reader = { read: vi.fn().mockResolvedValueOnce({ done: false, value: bytes }).mockResolvedValue({ done: true }),
      cancel: vi.fn().mockResolvedValue(undefined), releaseLock: vi.fn() };
    const response = new Response(); Object.defineProperty(response, 'body', { value: { getReader: () => reader } });
    const { client } = await setup(response); expect(await read(client)).toEqual(fail());
    expect(reader.read).toHaveBeenCalledTimes(1); expect(reader.cancel).toHaveBeenCalled();
  });
  it('handles a multibyte UTF-8 scalar split between chunks without changing its text', async () => {
    const value = queueBody([row({ content: { ...content(), note: '\u{1f600}' } })]);
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const split = bytes.indexOf(0xf0) + 1;
    const { client } = await setup(new Response(new ReadableStream({ start(controller) {
      controller.enqueue(bytes.subarray(0, split)); controller.enqueue(bytes.subarray(split)); controller.close();
    } })));
    expect(await read(client)).toEqual(value);
  });
  it('does not let immediate progressing chunks starve the aggregate deadline', async () => {
    let elapsed = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => elapsed);
    const reader = { read: vi.fn().mockImplementation(() => { elapsed += 9000; return Promise.resolve({ done: false, value: new Uint8Array([32]) }); }),
      cancel: vi.fn().mockResolvedValue(undefined), releaseLock: vi.fn() };
    const response = new Response(); Object.defineProperty(response, 'body', { value: { getReader: () => reader } });
    const { client } = await setup(response); expect(await read(client)).toEqual(fail('request_timeout'));
    expect(reader.read).toHaveBeenCalledTimes(2); expect(reader.cancel).toHaveBeenCalled();
  });
  it('cleans up even when the stream cannot release or cancel its lock', async () => {
    const reader = { read: vi.fn().mockRejectedValue(Error('private read failure')), cancel() { throw Error('private cancel'); }, releaseLock() { throw Error('private lock'); } };
    const response = new Response(); Object.defineProperty(response, 'body', { value: { getReader: () => reader } });
    const { client } = await setup(response); expect(await client.decide(command)).toEqual(fail('outcome_unknown'));
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['{"ok":true,"ok":true,"queue":{"reports":[],"page_limit":25}}',
    '{"ok":true,"\\u006fk":true,"queue":{"reports":[],"page_limit":25}}',
    '{"ok":true,"queue":{"reports":[],"page_limit":25,"page_limit":25}}',
    '\ufeff{"ok":true}', '{"ok":NaN}', '', '<html>private upstream error</html>',
  ])('rejects duplicate/malformed JSON %#', async wire => {
    const { client } = await setup(new Response(wire)); expect(await read(client)).toEqual(fail());
  });
  it('rejects duplicate JWT expiry keys too', async () => {
    const encoded = btoa(`{"exp":${Date.parse(expiry) / 1000},"exp":${Date.parse(expiry) / 1000}}`).replace(/=/g, '');
    const transport = vi.fn().mockResolvedValue(Response.json(loginBody({ accessToken: `e30.${encoded}.c2ln` })));
    expect(await createModeratorClient({ transport }).login(...credentials)).toEqual(fail());
  });
  it('accepts escaped field-looking text without falsely detecting duplicate members', async () => {
    const { client } = await setup(Response.json(queueBody([row({ content: { ...content(), note: 'Text: "ok": true, "ok": false' } })])));
    expect((await read(client)).ok).toBe(true);
  });
  it('rejects invalid UTF-8 rather than replacing bytes', async () => {
    const { client } = await setup(new Response(new Uint8Array([0xc3, 0x28]))); expect(await read(client)).toEqual(fail());
  });
  it.each(['https://evil.invalid/api/moderation/queue', 'https://shiok.test/api/moderation/queue?token=private',
    'https://shiok.test/api/moderation/queue#private', 'https://shiok.test/api/moderation/context'])('rejects a redirected/mismatched response URL %s', async url => {
    vi.stubGlobal('location', { origin: 'https://shiok.test' });
    const response = Response.json(queueBody()); Object.defineProperty(response, 'url', { value: url });
    const { client } = await setup(response); expect(await read(client)).toEqual(fail());
  });
  it('accepts only the current-origin absolute response URL', async () => {
    vi.stubGlobal('location', { origin: 'https://shiok.test' });
    const response = Response.json(queueBody()); Object.defineProperty(response, 'url', { value: 'https://shiok.test/api/moderation/queue' });
    const { client } = await setup(response); expect((await read(client)).ok).toBe(true);
  });
  it('rejects even same-origin redirected responses', async () => {
    const response = Response.json(queueBody()); Object.defineProperty(response, 'redirected', { value: true });
    const { client } = await setup(response); expect(await read(client)).toEqual(fail());
  });
});
