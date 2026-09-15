import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { createReportAttemptLimiter, handleReportPost, REPORT_REQUEST_TIMEOUT_MS } from '../../app/api/reports/http';
import * as route from '../../app/api/reports/route';
import project from '../report-project.json';

const origin = 'https://shiok.example';
const proof = 'a'.repeat(43);
const env = {
  VERCEL: '1', VERCEL_ENV: 'production', NODE_ENV: 'production', SHIOK_REPORTS_ENABLED: 'true',
  SHIOK_REPORTS_PROJECT_URL: project.projectUrl, SHIOK_REPORTS_ORIGIN: origin,
  SHIOK_REPORTS_SECRET_KEY: ['sb', 'secret', 'synthetic'.repeat(4)].join('_'),
  SHIOK_REPORTS_BUCKET_KEY: 'ab'.repeat(32),
};
const fixture = {
  schema_version: 1, client_request_id: '017f22e2-79b0-7cc3-98c4-dc0c0c07398f', report_type: 'mapping_error',
  geometry: { type: 'Point', coordinates: [103.85, 1.35] }, referenced_bundle_version: 'synthetic-bundle-v1', note: 'private synthetic note',
};
const receipt = { receipt_id: '22345678-1234-4123-8123-123456789abc', received_at: '2026-09-15T01:00:00Z', replayed: false };
const now = () => Date.parse(receipt.received_at);
function request(options: { headers?: Record<string, string | null>; body?: BodyInit; signal?: AbortSignal; url?: string } = {}): Request {
  const headers = new Headers({ origin, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin',
    'x-shiok-retry-secret': proof, 'x-vercel-forwarded-for': '192.0.2.1' });
  for (const [key, value] of Object.entries(options.headers ?? {})) {
    if (value === null) headers.delete(key); else headers.set(key, value);
  }
  return new Request(options.url ?? `${origin}/api/reports`, {
    method: 'POST', headers, body: options.body ?? JSON.stringify(fixture), signal: options.signal,
    duplex: 'half',
  } as RequestInit);
}
const send = (req = request(), transport: typeof fetch = vi.fn().mockResolvedValue(Response.json(receipt)), overrides = {}) =>
  handleReportPost(req, { env: { ...env, ...overrides }, transport, now, admitAttempt: createReportAttemptLimiter() });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Anonymous report HTTP boundary', () => {
  it('rejects UUIDv4 request identities before provider IO', async () => {
    const transport = vi.fn();
    const result = await send(request({ body: JSON.stringify({ ...fixture, client_request_id: '12345678-1234-4123-8123-123456789abc' }) }), transport);
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ ok: false, error: 'invalid_report' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('persists once and returns only an opaque receipt with no-store on every cache layer', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json(receipt));
    const result = await send(request(), transport);
    expect(result.status).toBe(201);
    expect(await result.json()).toEqual({ ok: true, receipt: { receipt_id: receipt.receipt_id, received_at: receipt.received_at }, replayed: false });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(result.headers.get('cache-control')).toBe('private, no-store');
    expect(result.headers.get('cdn-cache-control')).toBe('no-store');
    expect(result.headers.get('vercel-cdn-cache-control')).toBe('no-store');
    expect(result.headers.get('access-control-allow-origin')).toBeNull();
    expect(result.headers.get('set-cookie')).toBeNull();
  });
  it.each(Object.keys(env))('missing configuration %s refuses before persistence', async key => {
    const transport = vi.fn();
    const result = await send(request(), transport, { [key]: undefined });
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ ok: false, error: 'unavailable' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    ['SHIOK_REPORTS_ENABLED', 'false'], ['VERCEL', 'true'], ['VERCEL_ENV', 'development'], ['NODE_ENV', 'test'],
    ['SHIOK_REPORTS_PROJECT_URL', 'https://ajvenxqkedajbrbnnfko.supabase.co'],
    ['SHIOK_REPORTS_PROJECT_URL', `${project.projectUrl}/`],
    ['SHIOK_REPORTS_SECRET_KEY', ['sbp', 'synthetic'].join('_')],
    ['SHIOK_REPORTS_SECRET_KEY', `${env.SHIOK_REPORTS_SECRET_KEY}\n`],
    ['SHIOK_REPORTS_BUCKET_KEY', `${env.SHIOK_REPORTS_BUCKET_KEY}\n`],
    ['SHIOK_REPORTS_BUCKET_KEY', 'short'], ['SHIOK_REPORTS_ORIGIN', '*'],
    ['SHIOK_REPORTS_ORIGIN', `${origin}/`], ['SHIOK_REPORTS_ORIGIN', `${origin}/path`],
    ['SHIOK_REPORTS_ORIGIN', 'http://shiok.example'], ['SHIOK_REPORTS_ORIGIN', 'https://user:pass@shiok.example'],
  ])('invalid server configuration %s case %# fails closed', async (key, value) => {
    const transport = vi.fn();
    expect((await send(request(), transport, { [key]: value })).status).toBe(503);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, 'null', 'https://other.example', `${origin}/`, `${origin},https://other.example`])('rejects absent or foreign Origin %#', async value => {
    const transport = vi.fn();
    expect((await send(request({ headers: { origin: value } }), transport)).status).toBe(403);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['cross-site', 'same-site', 'none'])('rejects fetch site %s', async site => {
    const transport = vi.fn();
    expect((await send(request({ headers: { 'sec-fetch-site': site } }), transport)).status).toBe(403);
    expect(transport).not.toHaveBeenCalled();
  });
  it('supports browsers without fetch metadata but still requires Origin and JSON custom header', async () => {
    expect((await send(request({ headers: { 'sec-fetch-site': null } }))).status).toBe(201);
  });
  it('never trusts forwarded host to authorize an unexpected request URL', async () => {
    const transport = vi.fn();
    expect((await send(request({ url: 'https://foreign.example/api/reports', headers: { 'x-forwarded-host': 'shiok.example' } }), transport)).status).toBe(403);
    expect(transport).not.toHaveBeenCalled();
  });
  it('rejects query-string submission identifiers without echoing them', async () => {
    const transport = vi.fn();
    const result = await send(request({ url: `${origin}/api/reports?note=private` }), transport);
    expect(result.status).toBe(400);
    expect(await result.text()).not.toContain('private');
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, 'text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', 'application/json; charset=latin1', 'application/json, text/plain'])('rejects media type %#', async type => {
    const transport = vi.fn();
    expect((await send(request({ headers: { 'content-type': type } }), transport)).status).toBe(415);
    expect(transport).not.toHaveBeenCalled();
  });
  it('accepts explicit UTF-8 JSON', async () => {
    expect((await send(request({ headers: { 'content-type': 'application/json; charset=UTF-8' } }))).status).toBe(201);
  });
  it('does not decompress compressed uploads', async () => {
    expect((await send(request({ headers: { 'content-encoding': 'gzip' } }))).status).toBe(415);
  });
  it.each(['-1', '+1', '1e3', '0001', '1, 1', '1000000000'])('rejects ambiguous Content-Length %s', async length => {
    expect((await send(request({ headers: { 'content-length': length } }))).status).toBe(400);
  });
  it('rejects oversized declared body without pulling it', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({ cancel }, { highWaterMark: 0 });
    const transport = vi.fn();
    expect((await send(request({ headers: { 'content-length': '8193' }, body }), transport)).status).toBe(413);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(transport).not.toHaveBeenCalled();
  });
  it('enforces actual wire bytes even with an understated Content-Length', async () => {
    const transport = vi.fn();
    expect((await send(request({ headers: { 'content-length': '1' }, body: ' '.repeat(8193) }), transport)).status).toBe(413);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, '', 'a'.repeat(42), 'a'.repeat(44), '!'.repeat(43)])('requires bounded retry proof %#', async value => {
    const transport = vi.fn();
    expect((await send(request({ headers: { 'x-shiok-retry-secret': value } }), transport)).status).toBe(400);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, 'unknown', '192.0.2.1, 192.0.2.2', '::1%eth0', '[2001:db8::1]', '192.0.2.1:1234', '012.0.2.1'])('requires a single trusted Vercel IP %# with no fallback', async ip => {
    const transport = vi.fn();
    expect((await send(request({ headers: { 'x-vercel-forwarded-for': ip, 'x-forwarded-for': '192.0.2.2', 'x-real-ip': '192.0.2.3' } }), transport)).status).toBe(503);
    expect(transport).not.toHaveBeenCalled();
  });
  it('derives a daily server-HMAC bucket, never sends IP, forwarding headers or raw proof to Supabase', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json(receipt));
    await send(request(), transport);
    const init = transport.mock.calls[0][1];
    const body = JSON.parse(init.body);
    expect(body.p_abuse_day).toBe('2026-09-15');
    expect(transport.mock.calls[0][0]).toBe(`${project.projectUrl}/rest/v1/rpc/shiok_report_submit_v2`);
    expect(body.p_abuse_bucket_sha256).toBe(createHmac('sha256', Buffer.from(env.SHIOK_REPORTS_BUCKET_KEY, 'hex')).update('shiok-reports-v1\n2026-09-15\nv4:192.0.2.1').digest('hex'));
    expect(JSON.stringify(init)).not.toContain('192.0.2.1');
    expect(init.body).not.toContain(proof);
    expect(init.headers).not.toHaveProperty('cookie');
  });
  it.each([
    ['192.0.2.1', '::ffff:192.0.2.1'], ['192.0.2.1', '0:0:0:0:0:ffff:c000:201'],
    ['2001:db8:abcd:1234::1', '2001:0DB8:ABCD:1234:ffff:ffff:ffff:ffff'],
    ['::1', '0:0:0:0:0:0:0:1'],
  ])('canonicalizes equivalent networks and IPv6 privacy addresses %#', async (a, b) => {
    const buckets: string[] = [];
    for (const ip of [a, b]) {
      const transport = vi.fn().mockResolvedValue(Response.json(receipt));
      expect((await send(request({ headers: { 'x-vercel-forwarded-for': ip } }), transport)).status).toBe(201);
      buckets.push(JSON.parse(transport.mock.calls[0][1].body).p_abuse_bucket_sha256);
    }
    expect(buckets[0]).toBe(buckets[1]);
  });
  it('rotates buckets by UTC day and isolates different networks', async () => {
    const buckets: string[] = [];
    for (const [ip, date] of [['192.0.2.1', '2026-09-15'], ['192.0.2.1', '2026-09-16'], ['192.0.2.2', '2026-09-15']]) {
      const transport = vi.fn().mockResolvedValue(Response.json(receipt));
      await handleReportPost(request({ headers: { 'x-vercel-forwarded-for': ip } }), { env, transport, now: () => Date.parse(date), admitAttempt: createReportAttemptLimiter() });
      buckets.push(JSON.parse(transport.mock.calls[0][1].body).p_abuse_bucket_sha256);
    }
    expect(new Set(buckets).size).toBe(3);
  });
  it('binds storage date and HMAC to one post-upload clock read across UTC midnight', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json(receipt));
    const clock = vi.fn().mockReturnValueOnce(Date.parse('2026-09-15T23:59:59Z'))
      .mockReturnValueOnce(Date.parse('2026-09-16T00:00:01Z'))
      .mockImplementation(() => { throw new Error('Unexpected independent bucket/day clock read'); });
    let upload!: ReadableStreamDefaultController<Uint8Array>;
    const pending = handleReportPost(request({ body: new ReadableStream({ start(controller) { upload = controller; } }) }),
      { env, transport, now: clock, admitAttempt: createReportAttemptLimiter() });
    expect(clock).toHaveBeenCalledTimes(1);
    expect(transport).not.toHaveBeenCalled();
    upload.enqueue(new TextEncoder().encode(JSON.stringify(fixture))); upload.close();
    expect((await pending).status).toBe(201);
    const body = JSON.parse(transport.mock.calls[0][1].body);
    expect(body.p_abuse_day).toBe('2026-09-16');
    expect(body.p_abuse_bucket_sha256).toBe(
      createHmac('sha256', Buffer.from(env.SHIOK_REPORTS_BUCKET_KEY, 'hex')).update('shiok-reports-v1\n2026-09-16\nv4:192.0.2.1').digest('hex'),
    );
    expect(clock).toHaveBeenCalledTimes(2);
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([false, true])('models UTC rollover while the DB lock is held, existing receipt=%s', async replayed => {
    let time = Date.parse('2026-09-15T23:59:59.999Z');
    const clock = vi.fn(() => time);
    let release!: () => void;
    const lock = new Promise<void>(resolve => { release = resolve; });
    let entered!: () => void;
    const locked = new Promise<void>(resolve => { entered = resolve; });
    const bodies: Record<string, unknown>[] = [];
    const transport = vi.fn<typeof fetch>(async (_url, init) => {
      const body = JSON.parse(String(init?.body)); bodies.push(body);
      entered(); await lock;
      const databaseDay = new Date(time).toISOString().slice(0, 10);
      // Mock the parent's proposed SQL contract; this is not database verification.
      if (!replayed && body.p_abuse_day !== databaseDay) {
        return Response.json({ code: 'PT503', message: 'reporting_unavailable', details: null, hint: null }, { status: 503 });
      }
      return Response.json({ ...receipt, replayed });
    });
    const admitAttempt = createReportAttemptLimiter();
    const pending = handleReportPost(request(), { env, transport, now: clock, admitAttempt });
    await locked;
    time = Date.parse('2026-09-16T00:00:00.001Z');
    release();
    const result = await pending;
    expect(result.status).toBe(replayed ? 200 : 503);
    expect(await result.json()).toEqual(replayed
      ? { ok: true, receipt: { receipt_id: receipt.receipt_id, received_at: receipt.received_at }, replayed: true }
      : { ok: false, error: 'unavailable' });
    expect(bodies[0].p_abuse_day).toBe('2026-09-15');
    expect(bodies[0].p_abuse_bucket_sha256).toBe(createHmac('sha256', Buffer.from(env.SHIOK_REPORTS_BUCKET_KEY, 'hex'))
      .update('shiok-reports-v1\n2026-09-15\nv4:192.0.2.1').digest('hex'));
    expect(clock).toHaveBeenCalledTimes(2);
    expect(transport).toHaveBeenCalledTimes(1);
    if (!replayed) {
      // Only a separate explicit HTTP attempt refreshes the bucket; request identity/proof/content stay fixed.
      expect((await handleReportPost(request(), { env, transport, now: clock, admitAttempt })).status).toBe(201);
      expect(bodies[1].p_abuse_day).toBe('2026-09-16');
      expect(bodies[1].p_abuse_bucket_sha256).toBe(createHmac('sha256', Buffer.from(env.SHIOK_REPORTS_BUCKET_KEY, 'hex'))
        .update('shiok-reports-v1\n2026-09-16\nv4:192.0.2.1').digest('hex'));
      for (const key of ['p_request_id', 'p_canonical_content', 'p_retry_proof_sha256']) expect(bodies[1][key]).toBe(bodies[0][key]);
      expect(transport).toHaveBeenCalledTimes(2);
    }
  });
  it.each([NaN, Infinity, 1.5, 8640000000000001])('fails closed on invalid pre-upload time %s', async time => {
    const transport = vi.fn();
    const result = await handleReportPost(request(), { env, transport, now: () => time, admitAttempt: createReportAttemptLimiter() });
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ ok: false, error: 'unavailable' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([NaN, Infinity, 1.5, 8640000000000001])('fails closed on invalid post-upload time %s', async time => {
    const transport = vi.fn();
    const clock = vi.fn().mockReturnValueOnce(now()).mockReturnValue(time);
    const result = await handleReportPost(request(), { env, transport, now: clock, admitAttempt: createReportAttemptLimiter() });
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ ok: false, error: 'unavailable' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    ['{"schema_version":1,"schema_version":1}', 'duplicate_fields'], ['{"x":', 'invalid_json'],
    [JSON.stringify({ ...fixture, note: '\u0000' }), 'invalid_note'],
    [JSON.stringify({ ...fixture, email: 'private@example.test' }), 'invalid_report'],
    [JSON.stringify({ ...fixture, geometry: { type: 'Point', coordinates: [0, 0] } }), 'invalid_geometry'],
  ])('preserves strict contract validation %# before writing', async (body, error) => {
    const transport = vi.fn();
    const result = await send(request({ body }), transport);
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ ok: false, error });
    expect(transport).not.toHaveBeenCalled();
  });
  it('rejects malformed UTF-8', async () => {
    const result = await send(request({ body: new Uint8Array([0xff]) }));
    expect(await result.json()).toEqual({ ok: false, error: 'invalid_utf8' });
  });
  it('returns the same receipt on replay without inventing a new one', async () => {
    const result = await send(request(), vi.fn().mockResolvedValue(Response.json({ ...receipt, replayed: true })));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ ok: true, receipt: { receipt_id: receipt.receipt_id, received_at: receipt.received_at }, replayed: true });
  });
  it.each([[400, 400, 'invalid_request'], [401, 503, 'unavailable'], [403, 503, 'unavailable'], [409, 409, 'conflict'],
    [410, 410, 'expired'], [429, 429, 'limited'], [503, 503, 'outcome_unknown'], [500, 503, 'outcome_unknown']])('redacts provider HTTP %s', async (upstream, status, error) => {
    const transport = vi.fn().mockResolvedValue(new Response('private provider details', { status: Number(upstream) }));
    const result = await send(request(), transport);
    expect(result.status).toBe(status);
    expect(await result.json()).toEqual({ ok: false, error });
    expect(result.headers.get('cache-control')).toContain('no-store');
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('does not log report contents, secrets, provider responses or exceptions', async () => {
    const logs = [vi.spyOn(console, 'log'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')];
    const result = await send(request(), vi.fn().mockRejectedValue(new Error('private transport detail')));
    expect(await result.json()).toEqual({ ok: false, error: 'outcome_unknown' });
    for (const log of logs) expect(log).not.toHaveBeenCalled();
  });
  it.each([200, 409])('throttles replay/conflict traffic before provider IO, upstream %s', async status => {
    const admitAttempt = createReportAttemptLimiter();
    const transport = vi.fn(async () => status === 200 ? Response.json({ ...receipt, replayed: true }) : new Response(null, { status }));
    for (let i = 0; i < 6; i++) {
      expect((await handleReportPost(request(), { env, now, transport, admitAttempt })).status).toBe(status);
    }
    expect((await handleReportPost(request(), { env, now, transport, admitAttempt })).status).toBe(429);
    expect(transport).toHaveBeenCalledTimes(6);
  });
  it('counts invalid proof and body attempts without reaching storage', async () => {
    const admitAttempt = createReportAttemptLimiter(), transport = vi.fn();
    for (let i = 0; i < 6; i++) {
      const req = i % 2 === 0 ? request({ headers: { 'x-shiok-retry-secret': 'invalid' } }) : request({ body: '{}' });
      expect((await handleReportPost(req, { env, now, transport, admitAttempt })).status).toBe(400);
    }
    expect((await handleReportPost(request(), { env, now, transport, admitAttempt })).status).toBe(429);
    expect(transport).not.toHaveBeenCalled();
  });
  it('bounds unique-network state by the global attempt cap and expires the entire window', () => {
    const admit = createReportAttemptLimiter(), time = now();
    for (let i = 0; i < 60; i++) expect(admit(`bucket-${i}`, time)).toBe(true);
    for (let i = 0; i < 1000; i++) expect(admit(`other-${i}`, time)).toBe(false);
    expect(admit('new', time + 60000)).toBe(true);
    expect(admit('new', time)).toBe(false);
    expect(admit('new', Number.NaN)).toBe(false);
  });
  it('does not write when already aborted', async () => {
    const controller = new AbortController(); controller.abort();
    const transport = vi.fn();
    expect((await send(request({ signal: controller.signal }), transport)).status).toBe(408);
    expect(transport).not.toHaveBeenCalled();
  });
  it('cancels a stalled body within the whole-request deadline without writing', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const transport = vi.fn();
    const pending = send(request({ body: new ReadableStream({ cancel }) }), transport);
    await vi.advanceTimersByTimeAsync(REPORT_REQUEST_TIMEOUT_MS);
    const result = await pending;
    expect(result.status).toBe(408);
    expect(await result.json()).toEqual({ ok: false, error: 'request_timeout' });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(transport).not.toHaveBeenCalled();
  });
  it('cancels caller-aborted upload immediately without waiting for the deadline or writing', async () => {
    const controller = new AbortController(), cancel = vi.fn(), transport = vi.fn();
    const pending = send(request({ signal: controller.signal, body: new ReadableStream({ cancel }) }), transport);
    controller.abort();
    const result = await pending;
    expect(result.status).toBe(408);
    expect(await result.json()).toEqual({ ok: false, error: 'request_timeout' });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(transport).not.toHaveBeenCalled();
  });
  it('shares the upload deadline with persistence, not ten seconds plus eight more', async () => {
    vi.useFakeTimers();
    let upload!: ReadableStreamDefaultController<Uint8Array>;
    const transport = vi.fn(() => new Promise<Response>(() => {}));
    const pending = send(request({ body: new ReadableStream({ start(controller) { upload = controller; } }) }), transport);
    await vi.advanceTimersByTimeAsync(9000);
    upload.enqueue(new TextEncoder().encode(JSON.stringify(fixture))); upload.close();
    await vi.advanceTimersByTimeAsync(0);
    expect(transport).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await pending;
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ ok: false, error: 'outcome_unknown' });
    expect(transport.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it('does not retry on caller disconnect after dispatch or accept a late receipt', async () => {
    const controller = new AbortController();
    let deliver!: (response: Response) => void;
    let started!: () => void;
    const dispatched = new Promise<void>(resolve => { started = resolve; });
    const transport = vi.fn(() => { started(); return new Promise<Response>(resolve => { deliver = resolve; }); });
    const pending = send(request({ signal: controller.signal }), transport);
    await dispatched; controller.abort();
    expect(await (await pending).json()).toEqual({ ok: false, error: 'outcome_unknown' });
    const cancel = vi.fn();
    deliver(new Response(new ReadableStream({ cancel })));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
  });
});

describe('Actual Next route exports', () => {
  it('is a dynamic Node endpoint with a platform budget greater than its own deadline', () => {
    expect(route.runtime).toBe('nodejs'); expect(route.dynamic).toBe('force-dynamic');
    expect(route.maxDuration * 1000).toBeGreaterThan(REPORT_REQUEST_TIMEOUT_MS);
  });
  it('is disabled with missing deployment configuration, no network side effects', async () => {
    vi.stubEnv('SHIOK_REPORTS_ENABLED', undefined);
    const transport = vi.fn(); vi.stubGlobal('fetch', transport);
    expect((await route.POST(request())).status).toBe(503);
    expect(transport).not.toHaveBeenCalled();
  });
  it('uses the endpoint from POST with complete explicit server configuration', async () => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const transport = vi.fn().mockResolvedValue(Response.json(receipt)); vi.stubGlobal('fetch', transport);
    expect((await route.POST(request())).status).toBe(201);
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each(['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'] as const)('rejects %s, no enumeration or CORS preflight', async method => {
    const result = route[method](new Request(`${origin}/api/reports`, { method }));
    expect(result.status).toBe(405);
    expect(result.headers.get('allow')).toBe('POST');
    expect(result.headers.get('cache-control')).toContain('no-store');
    expect(result.headers.get('access-control-allow-origin')).toBeNull();
    if (method === 'HEAD') expect(await result.text()).toBe('');
  });
});
