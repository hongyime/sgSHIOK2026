import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { REPORT_STORE_TIMEOUT_MS, submitPrivateReport } from '../../app/api/reports/store';

const config = { projectUrl: `https://${'a'.repeat(20)}.supabase.co`, secretKey: ['sb', 'secret', 'synthetic'.repeat(4)].join('_') };
const retrySecret = 'a'.repeat(43);
const bucket = 'b'.repeat(64);
const fixture = { schema_version: 1, client_request_id: '12345678-1234-4123-8123-123456789abc', report_type: 'mapping_error', geometry: { type: 'Point', coordinates: [103.85, 1.35] }, referenced_bundle_version: 'synthetic-bundle-v1', note: 'synthetic only' };
const receipt = { receipt_id: '22345678-1234-4123-8123-123456789abc', received_at: '2026-09-14T09:00:00+00:00', replayed: false };
afterEach(() => vi.useRealTimers());
const send = (transport: typeof fetch, signal = new AbortController().signal, body: unknown = fixture) => submitPrivateReport(config, body, retrySecret, bucket, signal, transport);

describe('Server-only report RPC transport, not a public endpoint', () => {
  it('uses the validated canonical contract and hashes retry proof, returning only receipt fields', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json(receipt));
    expect(await send(transport)).toEqual({ ok: true, receipt: { receipt_id: receipt.receipt_id, received_at: receipt.received_at }, replayed: false });
    const [url, init] = transport.mock.calls[0];
    expect(url).toBe(`${config.projectUrl}/rest/v1/rpc/shiok_report_submit_v1`);
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', redirect: 'error', headers: { apikey: config.secretKey } });
    const body = JSON.parse(init.body);
    expect(body.p_retry_proof_sha256).toBe(createHash('sha256').update(retrySecret).digest('hex'));
    expect(body.p_abuse_bucket_sha256).toBe(bucket);
    expect(body.p_request_id).toBe(fixture.client_request_id);
    expect(JSON.parse(body.p_canonical_content)).not.toHaveProperty('client_request_id');
    expect(JSON.parse(body.p_canonical_content).note).toBe('synthetic only');
    expect(init.body).not.toContain(config.secretKey);
  });
  it('recovers the same receipt with replayed true without exposing report content', async () => {
    expect(await send(vi.fn().mockResolvedValue(Response.json({ ...receipt, replayed: true })))).toMatchObject({ ok: true, replayed: true });
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
  it.each([null, {}, { ...fixture, email: 'not-allowed' }, { ...fixture, note: 'a'.repeat(1001) }])('validates before persistence %#', async body => {
    const transport = vi.fn();
    expect(await send(transport, undefined, body)).toEqual({ ok: false, error: 'invalid_request' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([['bad', bucket], [retrySecret, 'raw-ip-not-allowed']])('rejects unbounded retry/bucket identifiers %#', async (proof, key) => {
    const transport = vi.fn();
    expect(await submitPrivateReport(config, fixture, proof, key, new AbortController().signal, transport)).toEqual({ ok: false, error: 'invalid_request' });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([[400, 'invalid_request'], [401, 'unavailable'], [403, 'unavailable'], [409, 'conflict'], [410, 'expired'], [429, 'limited'], [503, 'unavailable'], [500, 'outcome_unknown'], [202, 'outcome_unknown']])('handles HTTP %s without leaking provider error body', async (status, error) => {
    const transport = vi.fn().mockResolvedValue(new Response('private provider detail', { status: Number(status) }));
    expect(await send(transport)).toEqual({ ok: false, error });
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
