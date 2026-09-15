import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { REPORT_STORE_TIMEOUT_MS, submitPrivateReport, type ReportAbuseBucket } from '../../app/api/reports/store';
import project from '../report-project.json';

const config = { projectUrl: project.projectUrl, secretKey: ['sb', 'secret', 'synthetic'.repeat(4)].join('_') };
const retrySecret = 'a'.repeat(43);
const bucket = Object.freeze({ sha256: 'b'.repeat(64), day: '2026-09-15' });
const fixture = { schema_version: 1, client_request_id: '017f22e2-79b0-7cc3-98c4-dc0c0c07398f', report_type: 'mapping_error', geometry: { type: 'Point', coordinates: [103.85, 1.35] }, referenced_bundle_version: 'synthetic-bundle-v1', note: 'synthetic only' };
const receipt = { receipt_id: '22345678-1234-4123-8123-123456789abc', received_at: '2026-09-14T09:00:00+00:00', replayed: false };
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const send = (transport: typeof fetch, signal = new AbortController().signal, body: unknown = fixture) => submitPrivateReport(config, body, retrySecret, bucket, signal, transport);

describe('Server-only report RPC transport, not a public endpoint', () => {
  it('uses the validated canonical contract and hashes retry proof, returning only receipt fields', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json(receipt));
    expect(await send(transport)).toEqual({ ok: true, receipt: { receipt_id: receipt.receipt_id, received_at: receipt.received_at }, replayed: false });
    const [url, init] = transport.mock.calls[0];
    expect(url).toBe(`${config.projectUrl}/rest/v1/rpc/shiok_report_submit_v2`);
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', redirect: 'error', headers: { apikey: config.secretKey } });
    const body = JSON.parse(init.body);
    expect(body.p_retry_proof_sha256).toBe(createHash('sha256').update(retrySecret).digest('hex'));
    expect(body.p_abuse_bucket_sha256).toBe(bucket.sha256);
    expect(body.p_abuse_day).toBe(bucket.day);
    expect(Object.keys(body).sort()).toEqual(['p_abuse_bucket_sha256', 'p_abuse_day', 'p_canonical_content', 'p_request_id', 'p_retry_proof_sha256']);
    expect(body.p_request_id).toBe(fixture.client_request_id);
    expect(JSON.parse(body.p_canonical_content)).not.toHaveProperty('client_request_id');
    expect(JSON.parse(body.p_canonical_content).note).toBe('synthetic only');
    expect(init.body).not.toContain(config.secretKey);
  });
  it('recovers the same receipt with replayed true without exposing report content', async () => {
    expect(await send(vi.fn().mockResolvedValue(Response.json({ ...receipt, replayed: true })))).toMatchObject({ ok: true, replayed: true });
  });
  it('rejects UUIDv4 requests before any provider IO', async () => {
    const transport = vi.fn();
    expect(await send(transport, undefined, { ...fixture, client_request_id: '12345678-1234-4123-8123-123456789abc' }))
      .toEqual({ ok: false, error: 'invalid_request' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('still requires a UUIDv4 receipt, not a UUIDv7 request identity', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({ ...receipt, receipt_id: fixture.client_request_id }));
    expect(await send(transport)).toEqual({ ok: false, error: 'outcome_unknown' });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each(['http://localhost', `${config.projectUrl}/other`, `${config.projectUrl}@example.test`, `${config.projectUrl}?token=x`])('rejects credential destinations %s before IO', async projectUrl => {
    const transport = vi.fn();
    expect(await submitPrivateReport({ ...config, projectUrl }, fixture, retrySecret, bucket, new AbortController().signal, transport)).toEqual({ ok: false, error: 'unconfigured' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('does not accept a Supabase personal access token as a runtime secret key', async () => {
    const transport = vi.fn();
    expect(await submitPrivateReport({ ...config, secretKey: ['sbp', 'synthetic'].join('_') }, fixture, retrySecret, bucket, new AbortController().signal, transport)).toEqual({ ok: false, error: 'unconfigured' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([`https://${'a'.repeat(20)}.supabase.co`, `${config.projectUrl}/`, `${config.projectUrl}\n`])('only permits the exact owner-approved project origin %#', async projectUrl => {
    const transport = vi.fn();
    expect(await submitPrivateReport({ ...config, projectUrl }, fixture, retrySecret, bucket, new AbortController().signal, transport)).toEqual({ ok: false, error: 'unconfigured' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('never treats a publishable key as a server secret', async () => {
    const transport = vi.fn();
    expect(await submitPrivateReport({ ...config, secretKey: ['sb', 'publishable', 'synthetic'].join('_') }, fixture, retrySecret, bucket, new AbortController().signal, transport)).toEqual({ ok: false, error: 'unconfigured' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['', '\n', '\r', '\r\n'])('never sends SHIOK reports to the unrelated sgbuslaobu project %#', async suffix => {
    const transport = vi.fn();
    const projectUrl = `https://ajvenxqkedajbrbnnfko.supabase.co${suffix}`;
    expect(await submitPrivateReport({ ...config, projectUrl }, fixture, retrySecret, bucket, new AbortController().signal, transport)).toEqual({ ok: false, error: 'unconfigured' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, {}, { ...fixture, email: 'not-allowed' }, { ...fixture, note: 'a'.repeat(1001) }])('validates before persistence %#', async body => {
    const transport = vi.fn();
    expect(await send(transport, undefined, body)).toEqual({ ok: false, error: 'invalid_request' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([['bad', bucket.sha256], [retrySecret, 'raw-ip-not-allowed']])('rejects unbounded retry/bucket identifiers %#', async (proof, key) => {
    const transport = vi.fn();
    expect(await submitPrivateReport(config, fixture, proof, { ...bucket, sha256: key }, new AbortController().signal, transport)).toEqual({ ok: false, error: 'invalid_request' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    undefined, null, 20260915, new Date('2026-09-15'), '', '2026-9-15', '26-09-15',
    '2026-09-15\n', '2026-09-15\r\n', ' 2026-09-15', '2026-09-15 ', '2026-09-15T00:00:00Z',
    '2026-00-15', '2026-13-15', '2026-09-00', '2026-09-31', '2026-02-29', '1900-02-29',
    '2100-02-29', '0000-01-01', '10000-01-01', '2026-01-1\n',
  ])('rejects malformed or nonexistent bucket date before IO: %j', async day => {
    const transport = vi.fn();
    expect(await submitPrivateReport(config, fixture, retrySecret, { ...bucket, day } as unknown as ReportAbuseBucket,
      new AbortController().signal, transport)).toEqual({ ok: false, error: 'invalid_request' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['0001-01-01', '1900-02-28', '2000-02-29', '2024-02-29', '9999-12-31'])(
    'passes an exact valid date without checking admission age: %s', async day => {
      const transport = vi.fn().mockResolvedValue(Response.json({ ...receipt, replayed: true }));
      const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Use the bound date, not a fresh clock'); });
      expect(await submitPrivateReport(config, fixture, retrySecret, { ...bucket, day }, new AbortController().signal, transport))
        .toMatchObject({ ok: true, replayed: true });
      expect(JSON.parse(transport.mock.calls[0][1].body).p_abuse_day).toBe(day);
      expect(clock).not.toHaveBeenCalled();
    },
  );
  it.each([undefined, null, bucket.sha256, [], {}, { day: bucket.day }, { sha256: bucket.sha256 },
    { ...bucket, sha256: `${bucket.sha256}\n` }, { ...bucket, sha256: bucket.sha256.toUpperCase() }])(
    'requires the complete bound bucket object before IO: %j', async value => {
      const transport = vi.fn();
      expect(await submitPrivateReport(config, fixture, retrySecret, value as ReportAbuseBucket, new AbortController().signal, transport))
        .toEqual({ ok: false, error: 'invalid_request' });
      expect(transport).not.toHaveBeenCalled();
    },
  );
  it('contains bucket accessor failures without sending a provider request', async () => {
    const transport = vi.fn();
    const value = Object.defineProperty({ ...bucket }, 'day', { get: () => { throw new Error('private failure'); } });
    expect(await submitPrivateReport(config, fixture, retrySecret, value, new AbortController().signal, transport))
      .toEqual({ ok: false, error: 'invalid_request' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('snapshots the validated bucket and date instead of reading changing accessors again', async () => {
    const day = vi.fn().mockReturnValueOnce('2026-09-15').mockReturnValue('2026-09-16');
    const value = Object.defineProperty({ ...bucket }, 'day', { get: day });
    const transport = vi.fn().mockResolvedValue(Response.json(receipt));
    expect(await submitPrivateReport(config, fixture, retrySecret, value, new AbortController().signal, transport)).toMatchObject({ ok: true });
    expect(JSON.parse(transport.mock.calls[0][1].body)).toMatchObject({ p_abuse_day: bucket.day, p_abuse_bucket_sha256: bucket.sha256 });
    expect(day).toHaveBeenCalledTimes(1);
  });
  it.each([[400, 'invalid_request'], [401, 'unavailable'], [403, 'unavailable'], [409, 'conflict'], [410, 'expired'], [429, 'limited'], [503, 'outcome_unknown'], [500, 'outcome_unknown'], [202, 'outcome_unknown']])('handles HTTP %s without leaking provider error body', async (status, error) => {
    const transport = vi.fn().mockResolvedValue(new Response('private provider detail', { status: Number(status) }));
    expect(await send(transport)).toEqual({ ok: false, error });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('only treats the bounded exact RPC admission rejection as definitely unavailable', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({ code: 'PT503', message: 'reporting_unavailable', details: null, hint: null }, { status: 503 }));
    expect(await send(transport)).toEqual({ ok: false, error: 'unavailable' });
  });
  it.each([
    { code: 'PT503', message: 'gateway unavailable', details: null, hint: null },
    { code: 'PT503', message: 'reporting_unavailable', details: 'private', hint: null },
    { code: 'PT503', message: 'reporting_unavailable' },
  ])('preserves uncertainty for unverified 503 envelope %#', async body => {
    expect(await send(vi.fn().mockResolvedValue(Response.json(body, { status: 503 })))).toEqual({ ok: false, error: 'outcome_unknown' });
  });
  it('recovers a commit followed by gateway503 using the same identity and proof exactly once', async () => {
    const requests: string[] = [];
    const transport = vi.fn(async (_url, init) => {
      requests.push(init.body);
      return requests.length === 1 ? new Response('gateway failure after commit', { status: 503 })
        : Response.json({ ...receipt, replayed: true });
    });
    expect(await send(transport)).toEqual({ ok: false, error: 'outcome_unknown' });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(await send(transport)).toMatchObject({ ok: true, replayed: true });
    expect(requests[0]).toBe(requests[1]);
  });
  it.each(['x'.repeat(1025), new Uint8Array([0xff])])('bounds and rejects invalid503 response bytes %#', async body => {
    const transport = vi.fn().mockResolvedValue(new Response(body, { status: 503 }));
    expect(await send(transport)).toEqual({ ok: false, error: 'outcome_unknown' });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('bounds a stalled503 response body inside the original store deadline', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const transport = vi.fn().mockResolvedValue(new Response(new ReadableStream({ cancel }), { status: 503 }));
    const result = send(transport);
    await vi.advanceTimersByTimeAsync(REPORT_STORE_TIMEOUT_MS);
    expect(await result).toEqual({ ok: false, error: 'outcome_unknown' });
    expect(cancel).toHaveBeenCalled();
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([{}, [], null, { ...receipt, note: 'private' }, { ...receipt, received_at: 'yesterday' }, { ...receipt, receipt_id: 'invalid' }, { ...receipt, replayed: 'true' }])('rejects malformed success %# without inventing a receipt', async body => {
    expect(await send(vi.fn().mockResolvedValue(Response.json(body)))).toEqual({ ok: false, error: 'outcome_unknown' });
  });
  it.each(['<html>provider error</html>', 'x'.repeat(1025)])('bounds/rejects non-JSON successful replies %#', async body => {
    expect(await send(vi.fn().mockResolvedValue(new Response(body)))).toEqual({ ok: false, error: 'outcome_unknown' });
  });
  it('does not send an already-cancelled request', async () => {
    const controller = new AbortController(); controller.abort();
    const transport = vi.fn();
    expect(await send(transport, controller.signal)).toEqual({ ok: false, error: 'unavailable' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('preserves unknown commit outcome on disconnect and never retries', async () => {
    const controller = new AbortController();
    const transport = vi.fn(() => new Promise<Response>(() => {}));
    const result = send(transport, controller.signal); controller.abort();
    expect(await result).toEqual({ ok: false, error: 'outcome_unknown' });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('bounds a transport ignoring abort', async () => {
    vi.useFakeTimers();
    const transport = vi.fn(() => new Promise<Response>(() => {}));
    const result = send(transport);
    await vi.advanceTimersByTimeAsync(REPORT_STORE_TIMEOUT_MS);
    expect(await result).toEqual({ ok: false, error: 'outcome_unknown' });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('shares the same deadline with response body consumption', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const transport = vi.fn().mockResolvedValue(new Response(new ReadableStream({ pull() {}, cancel })));
    const result = send(transport);
    await vi.advanceTimersByTimeAsync(REPORT_STORE_TIMEOUT_MS);
    expect(await result).toEqual({ ok: false, error: 'outcome_unknown' });
    expect(cancel).toHaveBeenCalled();
  });
  it('cancels a late successful response and cannot replace a timed-out outcome', async () => {
    vi.useFakeTimers();
    let complete!: (response: Response) => void;
    const cancel = vi.fn();
    const transport = vi.fn(() => new Promise<Response>(resolve => { complete = resolve; }));
    const result = send(transport);
    await vi.advanceTimersByTimeAsync(REPORT_STORE_TIMEOUT_MS);
    expect(await result).toEqual({ ok: false, error: 'outcome_unknown' });
    complete(new Response(new ReadableStream({ pull() {}, cancel })));
    await vi.advanceTimersByTimeAsync(0);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
