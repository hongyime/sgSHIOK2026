import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateReport } from '../reports';
import {
  MAX_REPORT_RESPONSE_BYTES, REPORT_SUBMISSION_TIMEOUT_MS, prepareReportSubmission, submitReport,
  type ReportSubmissionEnvelope,
} from '../report-submission';

const requestId = '12345678-1234-4123-8123-123456789abc';
const receipt = { receipt_id: '22345678-1234-4123-8123-123456789abc', received_at: '2026-09-15T09:00:00.123456+00:00' };
const success = (replayed = false) => ({ ok: true, receipt: { ...receipt }, replayed });
const reply = (replayed = false) => Response.json(success(replayed), { status: replayed ? 200 : 201 });
const draft = (overrides: Record<string, unknown> = {}) => ({
  schema_version: 1, report_type: 'mapping_error', geometry: { type: 'Point', coordinates: [103.85, 1.35] },
  referenced_bundle_version: 'synthetic-bundle-v1', context: { postal_code: '001001', transit_category: 'bus' },
  note: '  Synthetic note, unchanged.  ', ...overrides,
});
function fakeCrypto() {
  return {
    randomUUID: vi.fn(() => requestId),
    getRandomValues: vi.fn((bytes: Uint8Array) => { bytes.set(Array.from({ length: 32 }, (_, i) => i)); return bytes; }),
  };
}
const asCrypto = (random: ReturnType<typeof fakeCrypto>) => random as unknown as Pick<Crypto, 'randomUUID' | 'getRandomValues'>;
function prepare(value: unknown = draft(), random = fakeCrypto()) {
  const result = prepareReportSubmission(value, asCrypto(random));
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('fixture');
  return result.envelope;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const unknown = { ok: false, error: 'outcome_unknown' };
const jsonText = (text: string, status = 201) => new Response(text, { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected real fetch'); }));
  vi.stubGlobal('crypto', asCrypto(fakeCrypto()));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('private in-memory report retry envelope', () => {
  it('prepares random UUID and 32-byte base64url proof before any POST', () => {
    const random = fakeCrypto();
    const envelope = prepare(draft(), random);
    expect(random.randomUUID).toHaveBeenCalledTimes(1);
    expect(random.getRandomValues).toHaveBeenCalledTimes(1);
    expect(random.getRandomValues.mock.calls[0][0]).toHaveLength(32);
    expect(envelope.report.client_request_id).toBe(requestId);
    expect(envelope.retrySecret).toBe('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8');
    expect(envelope.retrySecret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses browser crypto by default, never weak fallback randomness', () => {
    const weak = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('weak'); });
    expect(prepareReportSubmission(draft()).ok).toBe(true);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(weak).not.toHaveBeenCalled();
  });

  it('encodes all proof bytes as unpadded URL-safe base64', () => {
    const random = fakeCrypto();
    random.getRandomValues.mockImplementation(bytes => { bytes.fill(255); return bytes; });
    expect(prepare(draft(), random).retrySecret).toBe('_'.repeat(42) + '8');
  });

  it('copies and freezes canonical report content without normalization', () => {
    const value = draft();
    const envelope = prepare(value);
    const validated = validateReport({ ...value, client_request_id: requestId });
    expect(validated.ok && validated.canonicalContent).toBe(envelope.canonicalContent);
    value.geometry.coordinates[0] = 104;
    value.context.postal_code = '002002';
    value.note = 'changed';
    expect(envelope.report.geometry.coordinates).toEqual([103.85, 1.35]);
    expect(envelope.report.context?.postal_code).toBe('001001');
    expect(envelope.report.note).toBe('  Synthetic note, unchanged.  ');
    for (const frozen of [envelope, envelope.report, envelope.report.geometry, envelope.report.geometry.coordinates, envelope.report.context]) {
      expect(Object.isFrozen(frozen)).toBe(true);
    }
    expect(() => { (envelope as { retrySecret: string }).retrySecret = 'changed'; }).toThrow();
  });

  it.each([
    null, [], { ...draft(), client_request_id: requestId }, draft({ extra: 'private' }),
    draft({ note: '\u0000' }), draft({ geometry: { type: 'Point', coordinates: [0, 0] } }),
    draft({ context: { email: 'synthetic' } }), draft({ schema_version: 2 }),
  ])('rejects invalid or already-identified drafts without consuming randomness: %j', value => {
    const random = fakeCrypto();
    expect(prepareReportSubmission(value, asCrypto(random)).ok).toBe(false);
    expect(random.randomUUID).not.toHaveBeenCalled();
    expect(random.getRandomValues).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects accessors, hidden and symbol fields without invoking getters', () => {
    const getter = vi.fn(() => 'secret');
    const accessor = Object.defineProperty(draft(), 'note', { enumerable: true, get: getter });
    const hidden = Object.defineProperty(draft(), 'hidden', { value: 1 });
    for (const value of [accessor, hidden, { ...draft(), [Symbol('extra')]: 1 }]) {
      expect(prepareReportSubmission(value)).toEqual({ ok: false, error: 'invalid_report' });
    }
    expect(getter).not.toHaveBeenCalled();
  });

  it.each(['absent', 'uuid throws', 'bytes throw', 'invalid uuid'])('fails closed when crypto is %s', kind => {
    const random = fakeCrypto();
    if (kind === 'uuid throws') random.randomUUID.mockImplementation(() => { throw new Error('private crypto failure'); });
    if (kind === 'bytes throw') random.getRandomValues.mockImplementation(() => { throw new Error('private crypto failure'); });
    if (kind === 'invalid uuid') random.randomUUID.mockReturnValue('not-a-uuid');
    if (kind === 'absent') vi.stubGlobal('crypto', undefined);
    const result = kind === 'absent' ? prepareReportSubmission(draft()) : prepareReportSubmission(draft(), asCrypto(random));
    expect(result).toEqual({ ok: false, error: 'crypto_unavailable' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('never persists or logs private envelope content', async () => {
    const storage = vi.fn(() => { throw new Error('storage must stay untouched'); });
    vi.stubGlobal('localStorage', { getItem: storage, setItem: storage });
    vi.stubGlobal('sessionStorage', { getItem: storage, setItem: storage });
    const log = vi.spyOn(console, 'log');
    const error = vi.spyOn(console, 'error');
    await submitReport(prepare(), vi.fn().mockRejectedValue(new Error('private failure')));
    expect(storage).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});

describe('one bounded same-origin report attempt', () => {
  it.each([false, true])('accepts validated receipt, replayed=%s', async replayed => {
    const envelope = prepare();
    const transport = vi.fn().mockResolvedValue(reply(replayed));
    const result = await submitReport(envelope, transport);
    expect(result).toEqual(success(replayed));
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.ok && Object.isFrozen(result.receipt)).toBe(true);
    expect(transport).toHaveBeenCalledTimes(1);
    const [url, init] = transport.mock.calls[0];
    expect(url).toBe('/api/reports');
    expect(init).toMatchObject({ method: 'POST', mode: 'same-origin', credentials: 'omit', redirect: 'error',
      cache: 'no-store', referrer: '', referrerPolicy: 'same-origin', headers: {
        'Content-Type': 'application/json', 'x-shiok-retry-secret': envelope.retrySecret,
      } });
    expect(init.body).toBe(JSON.stringify(envelope.report));
    expect(init.body).not.toContain(envelope.retrySecret);
    expect(Object.keys(init.headers).sort()).toEqual(['Content-Type', 'x-shiok-retry-secret']);
  });

  it('coalesces simultaneous callers and reuses a confirmed receipt without another POST', async () => {
    const response = deferred<Response>();
    const transport = vi.fn(() => response.promise);
    const envelope = prepare();
    const first = submitReport(envelope, transport);
    expect(submitReport(envelope, transport)).toBe(first);
    await Promise.resolve();
    expect(transport).toHaveBeenCalledTimes(1);
    response.resolve(reply());
    const result = await first;
    expect(await submitReport(envelope, transport)).toBe(result);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('publishes the pending attempt before a transport can synchronously re-enter', async () => {
    const envelope = prepare();
    let reentered: ReturnType<typeof submitReport> | undefined;
    const transport = vi.fn<typeof fetch>(() => {
      reentered = submitReport(envelope, transport);
      return Promise.resolve(reply());
    });
    const pending = submitReport(envelope, transport);
    expect(await pending).toEqual(success());
    expect(reentered).toBe(pending);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('rejects copied or forged envelopes before sending', async () => {
    const envelope = prepare();
    const transport = vi.fn();
    for (const value of [{ ...envelope }, {}, null]) {
      expect(await submitReport(value as ReportSubmissionEnvelope, transport)).toEqual({ ok: false, error: 'invalid_request' });
    }
    expect(transport).not.toHaveBeenCalled();
  });

  it('retries explicitly after disconnect with byte-identical content, identity and proof', async () => {
    const random = fakeCrypto();
    const value = draft();
    const envelope = prepare(value, random);
    const transport = vi.fn().mockRejectedValueOnce(new Error('private socket detail')).mockResolvedValueOnce(reply(true));
    expect(await submitReport(envelope, transport)).toEqual(unknown);
    expect(transport).toHaveBeenCalledTimes(1);
    value.note = 'mutation after unknown outcome';
    expect(await submitReport(envelope, transport)).toEqual(success(true));
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[0][1].body).toBe(transport.mock.calls[1][1].body);
    expect(transport.mock.calls[0][1].headers).toEqual(transport.mock.calls[1][1].headers);
    expect(random.randomUUID).toHaveBeenCalledTimes(1);
    expect(random.getRandomValues).toHaveBeenCalledTimes(1);
  });
  it.each([[429, 'limited'], [503, 'unavailable'], [408, 'request_timeout'], [403, 'forbidden'], [409, 'conflict'], [410, 'expired']])(
    'retains prior uncertainty when the next attempt is rejected with %s', async (status, error) => {
      const envelope = prepare();
      const transport = vi.fn().mockRejectedValueOnce(new Error('disconnect after possible commit'))
        .mockResolvedValueOnce(Response.json({ ok: false, error }, { status: Number(status) }))
        .mockResolvedValueOnce(reply(true));
      expect(await submitReport(envelope, transport)).toEqual(unknown);
      expect(await submitReport(envelope, transport)).toEqual(unknown);
      expect(transport).toHaveBeenCalledTimes(2);
      expect(await submitReport(envelope, transport)).toEqual(success(true));
      expect(await submitReport(envelope, transport)).toEqual(success(true));
      expect(transport).toHaveBeenCalledTimes(3);
      const [first, second, third] = transport.mock.calls;
      expect(first[1].body).toBe(second[1].body); expect(second[1].body).toBe(third[1].body);
      expect(first[1].headers).toEqual(third[1].headers);
    },
  );

  it.each([[409, 'conflict'], [410, 'expired'], [429, 'limited'], [503, 'unavailable'],
    [503, 'outcome_unknown'], [408, 'request_timeout'], [400, 'invalid_request'], [400, 'invalid_geometry'],
    [403, 'forbidden'], [413, 'body_too_large'], [415, 'unsupported_media_type'], [405, 'method_not_allowed']])(
    'returns only fixed error for HTTP %i %s, without automatic retries', async (status, error) => {
      vi.useFakeTimers();
      const transport = vi.fn().mockResolvedValue(Response.json({ ok: false, error }, { status: Number(status) }));
      expect(await submitReport(prepare(), transport)).toEqual({ ok: false, error });
      await vi.advanceTimersByTimeAsync(120_000);
      expect(transport).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it.each([
    [201, { ...success(), receipt: { ...receipt, receipt_id: requestId.replace('-4123-', '-1123-') } }],
    [201, { ...success(), receipt: { ...receipt, received_at: '2026-02-30T00:00:00Z' } }],
    [201, { ...success(), receipt: { ...receipt, received_at: '2026-09-15' } }],
    [201, { ...success(), receipt: { ...receipt, received_at: '2026-09-15T09:00:00' } }],
    [201, { ...success(), receipt: { ...receipt, received_at: '2026-09-15T24:00:00Z' } }],
    [201, { ...success(), receipt: { ...receipt, note: 'private' } }],
    [201, { ...success(), extra: 'private' }], [201, { ...success(), replayed: 'false' }],
    [200, success()], [201, success(true)], [202, success()], [500, success()],
    [429, { ok: false, error: 'private database error' }], [429, { ok: false, error: 'conflict' }],
    [503, { ok: false, error: 'unavailable', message: 'private' }], [201, []], [201, null],
  ])('treats malformed or inconsistent HTTP %i replies as unknown', async (status, body) => {
    const transport = vi.fn().mockResolvedValue(Response.json(body, { status: Number(status) }));
    expect(await submitReport(prepare(), transport)).toEqual(unknown);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it.each(['{', '{"ok":false,"ok":true,"receipt":' + JSON.stringify(receipt) + ',"replayed":false}',
    '\ufeff' + JSON.stringify(success())])('rejects malformed, duplicate-field or BOM JSON', async text => {
    expect(await submitReport(prepare(), vi.fn().mockResolvedValue(jsonText(text)))).toEqual(unknown);
  });

  it('rejects invalid UTF-8 and missing or wrong response content type', async () => {
    for (const response of [new Response(new Uint8Array([0xff]), { status: 201, headers: { 'Content-Type': 'application/json' } }),
      new Response(JSON.stringify(success()), { status: 201 }),
      new Response(null, { status: 201, headers: { 'Content-Type': 'application/json' } })]) {
      expect(await submitReport(prepare(), vi.fn().mockResolvedValue(response))).toEqual(unknown);
    }
  });

  it('rejects a redirect even if transport ignores redirect:error', async () => {
    const response = reply();
    Object.defineProperty(response, 'redirected', { value: true });
    expect(await submitReport(prepare(), vi.fn().mockResolvedValue(response))).toEqual(unknown);
  });

  it.each(['declared', 'one chunk', 'multiple chunks'])('caps response bytes: %s', async kind => {
    const cancel = vi.fn();
    const chunks = kind === 'multiple chunks'
      ? [new Uint8Array(MAX_REPORT_RESPONSE_BYTES), new Uint8Array([32])]
      : [new Uint8Array(MAX_REPORT_RESPONSE_BYTES + 1)];
    const body = new ReadableStream<Uint8Array>({ pull(controller) {
      if (chunks.length) controller.enqueue(chunks.shift()!);
    }, cancel });
    const response = new Response(body, { status: 201, headers: {
      'Content-Type': 'application/json', ...(kind === 'declared' ? { 'Content-Length': '1025' } : {}),
    } });
    expect(await submitReport(prepare(), vi.fn().mockResolvedValue(response))).toEqual(unknown);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('accepts a receipt at the exact byte bound', async () => {
    const text = JSON.stringify(success()).padEnd(MAX_REPORT_RESPONSE_BYTES, ' ');
    expect(await submitReport(prepare(), vi.fn().mockResolvedValue(jsonText(text)))).toEqual(success());
  });

  it('bounds an abort-ignoring connection and ignores a late success', async () => {
    vi.useFakeTimers();
    const old = deferred<Response>();
    const transport = vi.fn().mockImplementationOnce(() => old.promise).mockResolvedValueOnce(reply(true));
    const envelope = prepare();
    const pending = submitReport(envelope, transport);
    await vi.advanceTimersByTimeAsync(REPORT_SUBMISSION_TIMEOUT_MS - 1);
    expect(transport.mock.calls[0][1].signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual(unknown);
    expect(transport.mock.calls[0][1].signal.aborted).toBe(true);
    expect(transport).toHaveBeenCalledTimes(1);
    const canceled = vi.fn();
    old.resolve(new Response(new ReadableStream({ cancel: canceled }), { status: 201 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(canceled).toHaveBeenCalledTimes(1);
    expect(await submitReport(envelope, transport)).toEqual(success(true));
    expect(transport).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses one 12-second budget across headers and a stalled response body', async () => {
    vi.useFakeTimers();
    const response = deferred<Response>();
    const transport = vi.fn<typeof fetch>(() => response.promise);
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const pending = submitReport(prepare(), transport);
    await vi.advanceTimersByTimeAsync(11_000);
    response.resolve(new Response(new ReadableStream({ cancel }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    }));
    await vi.advanceTimersByTimeAsync(999);
    expect(transport.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual(unknown);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects a mid-body disconnect without leaking the exception', async () => {
    const response = new Response(new ReadableStream({ start(controller) { controller.error(new Error('secret details')); } }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
    expect(await submitReport(prepare(), vi.fn().mockResolvedValue(response))).toEqual(unknown);
  });

  it('cannot confirm a late body from an earlier timed-out attempt', async () => {
    vi.useFakeTimers();
    const read = deferred<ReadableStreamReadResult<Uint8Array>>();
    const cancel = vi.fn(async () => {});
    const reader = { read: vi.fn(() => read.promise), cancel, releaseLock: vi.fn() };
    const response = { status: 201, redirected: false, headers: new Headers({ 'Content-Type': 'application/json' }),
      body: { getReader: () => reader, locked: true } } as unknown as Response;
    const transport = vi.fn().mockResolvedValueOnce(response).mockResolvedValueOnce(reply(true));
    const envelope = prepare();
    const first = submitReport(envelope, transport);
    await vi.advanceTimersByTimeAsync(REPORT_SUBMISSION_TIMEOUT_MS);
    expect(await first).toEqual(unknown);
    expect(await submitReport(envelope, transport)).toEqual(success(true));
    read.resolve({ done: false, value: new TextEncoder().encode(JSON.stringify(success())) });
    await vi.advanceTimersByTimeAsync(0);
    expect(await submitReport(envelope, transport)).toEqual(success(true));
    expect(transport).toHaveBeenCalledTimes(2);
    expect(reader.releaseLock).toHaveBeenCalledTimes(1);
  });
});
