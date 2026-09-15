import { describe, expect, it, vi } from 'vitest';
import { haversineMeters } from '../nearest-transit';
import {
  MAX_REPORT_BODY_BYTES, MAX_REPORT_NOTE_CHARACTERS, MAX_REPORT_SEGMENT_METERS,
  MAX_REPORT_VERTICES, REPORT_SCHEMA_VERSION, REPORT_SINGAPORE_BOUNDS,
  parseReportBody, readReportBody, validateReport,
  type Report, type ReportValidationResult,
} from '../reports';

const encoder = new TextEncoder();
const requestId = '017f22e2-79b0-7cc3-98c4-dc0c0c07398f';
const point = [103.85, 1.35];
const fixture = (overrides: Record<string, unknown> = {}) => ({
  schema_version: 1, client_request_id: requestId, report_type: 'mapping_error',
  geometry: { type: 'Point', coordinates: [...point] }, referenced_bundle_version: 'synthetic-bundle-v1',
  ...overrides,
});
const line = (coordinates: unknown) => fixture({ geometry: { type: 'LineString', coordinates } });
const bytes = (value: unknown) => encoder.encode(JSON.stringify(value));
function valid(result: ReportValidationResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  return result;
}
function stream(chunks: Uint8Array[], cancel = vi.fn()) {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      else controller.close();
    },
    cancel,
  }, { highWaterMark: 0 });
}

describe('Proposed report contract: F01/F13 data preparation only', () => {
  it('rejects an actual NUL before PostgreSQL storage but preserves literal escape text', () => {
    expect(validateReport(fixture({ note: '\u0000' }))).toEqual({ ok: false, error: 'invalid_note' });
    expect(valid(validateReport(fixture({ note: '\\u0000' }))).report.note).toBe('\\u0000');
  });
  it('pins the proposed caps and existing Singapore sanity box', () => {
    expect([REPORT_SCHEMA_VERSION, MAX_REPORT_VERTICES, MAX_REPORT_SEGMENT_METERS,
      MAX_REPORT_NOTE_CHARACTERS, MAX_REPORT_BODY_BYTES]).toEqual([1, 32, 1200, 1000, 8192]);
    expect(REPORT_SINGAPORE_BOUNDS).toEqual({ minLat: 1.15, maxLat: 1.48, minLng: 103.58, maxLng: 104.08 });
  });

  it.each(['mapping_error', 'shelter_request'] as const)('keeps %s distinct without requiring contact or context', report_type => {
    const report: Report = valid(validateReport(fixture({ report_type }))).report;
    expect(report.report_type).toBe(report_type);
    expect(report).not.toHaveProperty('context');
    expect(report).not.toHaveProperty('note');
    expect(valid(validateReport(line([point, [103.851, 1.351]]))).report.geometry.type).toBe('LineString');
    expect(valid(validateReport({ ...line([point, [103.851, 1.351]]), report_type })).report.report_type).toBe(report_type);
  });

  it('accepts only explicit optional context, retaining a leading-zero postal', () => {
    const context = { postal_code: '001001', destination_id: 'bus:12345', transit_category: 'bus', published_route_id: 'candidate:12345' };
    expect(valid(validateReport(fixture({ context }))).report.context).toEqual(context);
    expect(valid(validateReport(fixture({ context: { transit_category: 'mrt_lrt' } }))).report.context)
      .toEqual({ transit_category: 'mrt_lrt' });
  });

  it('rejects missing required fields, wrong versions, types and request identities without coercion', () => {
    for (const key of Object.keys(fixture())) {
      const value: Record<string, unknown> = fixture();
      delete value[key];
      expect(validateReport(value).ok, key).toBe(false);
    }
    for (const value of [null, [], 'report', 1, undefined,
      fixture({ schema_version: '1' }), fixture({ schema_version: 2 }),
      fixture({ report_type: 'correction' }), fixture({ report_type: ['mapping_error', 'shelter_request'] }),
      ...['', 'random', requestId.toUpperCase(), `${requestId}\n`, requestId.replace('-7cc3-', '-1cc3-')]
        .map(client_request_id => fixture({ client_request_id })),
    ]) expect(validateReport(value)).toEqual({ ok: false, error: 'invalid_report' });
  });

  it('rejects UUIDv4 request admission in both object and wire validation', () => {
    const value = fixture({ client_request_id: '12345678-1234-4123-8123-123456789abc' });
    expect(validateReport(value)).toEqual({ ok: false, error: 'invalid_report' });
    expect(parseReportBody(bytes(value))).toEqual({ ok: false, error: 'invalid_report' });
  });

  it('validates UUIDv7 syntax without imposing a clock, admission age or replay expiry', () => {
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('SQL owns admission'); });
    try {
      for (const client_request_id of ['00000000-0000-7000-8000-000000000000', 'ffffffff-ffff-7fff-bfff-ffffffffffff']) {
        expect(valid(validateReport(fixture({ client_request_id }))).report.client_request_id).toBe(client_request_id);
        expect(valid(parseReportBody(bytes(fixture({ client_request_id })))).report.client_request_id).toBe(client_request_id);
      }
      expect(clock).not.toHaveBeenCalled();
    } finally { clock.mockRestore(); }
  });

  it('rejects unknown, server-owned, contact, upload and transport fields at every object level', () => {
    for (const key of ['extra', 'id', 'receipt', 'received_at', 'created_at', 'state', 'status', 'moderation_state',
      'email', 'phone', 'name', 'contact', 'user_id', 'ip', 'user_agent', 'files', 'photos', 'uploads',
      'current_total', 'current_best_node', 'current_paths', 'retry_secret', 'challenge_token', '__proto__', 'constructor']) {
      expect(validateReport({ ...fixture(), [key]: 'untrusted' }).ok, key).toBe(false);
      expect(validateReport(fixture({ context: { [key]: 'untrusted' } })).ok, `context.${key}`).toBe(false);
      expect(validateReport(fixture({ geometry: { type: 'Point', coordinates: point, [key]: 'untrusted' } })).ok, `geometry.${key}`).toBe(false);
    }
  });

  it('rejects explicit null/undefined context values and malformed context fields', () => {
    for (const context of [null, undefined, [], 'postal', { postal_code: 1001 }, { postal_code: '001001\n' },
      { postal_code: ' 001001' }, { postal_code: '00100' }, { postal_code: '0010010' },
      { postal_code: '\uff10\uff10\uff11\uff10\uff10\uff11' }, { transit_category: 'best_transit' },
      { destination_id: null }, { published_route_id: undefined }]) {
      expect(validateReport(fixture({ context }))).toEqual({ ok: false, error: 'invalid_context' });
    }
  });

  it('bounds opaque identifiers without trimming, accepting URLs or asserting referenced data exists', () => {
    const max = 'a'.repeat(128);
    expect(validateReport(fixture({ referenced_bundle_version: max, context: { destination_id: max, published_route_id: max } })).ok).toBe(true);
    for (const token of ['', 'a'.repeat(129), ' bundle', 'bundle ', 'bundle\n', 'bundle\r\n', 'a\0b',
      'https://example.test', '../bundle', '\u4e00', 1, null]) {
      expect(validateReport(fixture({ referenced_bundle_version: token })).ok).toBe(false);
      expect(validateReport(fixture({ context: { destination_id: token } })).ok).toBe(false);
      expect(validateReport(fixture({ context: { published_route_id: token } })).ok).toBe(false);
    }
  });

  it('rejects non-JSON objects, hidden/symbol properties, getters and sparse/decorated arrays', () => {
    const getter = vi.fn(() => 'private');
    const accessor = Object.defineProperty(fixture(), 'note', { enumerable: true, get: getter });
    const hidden = Object.defineProperty(fixture(), 'email', { value: 'private' });
    const decorated = Object.assign([...point], { email: 'private' });
    const sparse = [103.85, ,];
    for (const value of [new Date(), Object.create(fixture()), accessor, hidden,
      { ...fixture(), [Symbol('contact')]: 'private' }, fixture({ toJSON: () => fixture() }),
      fixture({ geometry: { type: 'Point', coordinates: decorated } }),
      fixture({ geometry: { type: 'Point', coordinates: sparse } })]) expect(validateReport(value).ok).toBe(false);
    expect(getter).not.toHaveBeenCalled();
    expect(validateReport(Object.assign(Object.create(null), fixture())).ok).toBe(true);
  });
});

describe('Proposed report geometry: F02 validation preparation', () => {
  it('accepts each inclusive box boundary in longitude/latitude order', () => {
    for (const lng of [103.58, 104.08]) for (const lat of [1.15, 1.48]) {
      expect(validateReport(fixture({ geometry: { type: 'Point', coordinates: [lng, lat] } })).ok).toBe(true);
    }
  });

  it('rejects nonfinite, coerced, swapped, out-of-box and non-2D coordinates for points and segments', () => {
    for (const coordinates of [[NaN, 1.35], [Infinity, 1.35], [103.85, -Infinity], ['103.85', 1.35],
      [103.85, null], [1.35, 103.85], [103.579999, 1.35], [104.080001, 1.35],
      [103.85, 1.149999], [103.85, 1.480001], [], [103.85], [...point, 0], { lng: 103.85, lat: 1.35 }]) {
      expect(validateReport(fixture({ geometry: { type: 'Point', coordinates } }))).toEqual({ ok: false, error: 'invalid_geometry' });
      expect(validateReport(line([point, coordinates]))).toEqual({ ok: false, error: 'invalid_geometry' });
    }
  });

  it('rejects unsupported geometry shapes and missing fields', () => {
    for (const geometry of [null, undefined, [], {}, { type: 'Point' }, { coordinates: point },
      { type: 'MultiPoint', coordinates: [point] }, { type: 'Polygon', coordinates: [[point]] },
      { type: 'Feature', geometry: { type: 'Point', coordinates: point } }]) {
      expect(validateReport(fixture({ geometry })).ok).toBe(false);
    }
  });

  it('accepts 32 vertices but rejects 33, fewer than two and zero-length traces', () => {
    const coordinates = Array.from({ length: 33 }, (_, index) => [103.85 + index * 0.00001, 1.35]);
    expect(validateReport(line(coordinates.slice(0, 32))).ok).toBe(true);
    for (const invalidCoordinates of [coordinates, [], [point], [point, point], [point, point, point], new Array(3)]) {
      expect(validateReport(line(invalidCoordinates))).toEqual({ ok: false, error: 'invalid_geometry' });
    }
  });

  it('checks the unrounded 1200-metre boundary using the shared haversine helper', () => {
    const delta = 1200 / haversineMeters(1.35, 103.85, 2.35, 103.85);
    const below = [103.85, 1.35 + delta * (1 - 1e-9)];
    const above = [103.85, 1.35 + delta * (1 + 1e-9)];
    expect(haversineMeters(point[1], point[0], below[1], below[0])).toBeLessThan(1200);
    expect(haversineMeters(point[1], point[0], above[1], above[0])).toBeGreaterThan(1200);
    expect(validateReport(line([point, below])).ok).toBe(true);
    expect(validateReport(line([point, above]))).toEqual({ ok: false, error: 'invalid_geometry' });
  });

  it('bounds cumulative trace length even when endpoints coincide and each leg is short', () => {
    const turn = [103.85, 1.357];
    expect(haversineMeters(point[1], point[0], turn[1], turn[0])).toBeLessThan(1200);
    expect(validateReport(line([point, turn, point]))).toEqual({ ok: false, error: 'invalid_geometry' });
  });
});

describe('Proposed text and canonical content: F03 preparation, not safe rendering', () => {
  it('preserves markup, whitespace, newlines and possible personal text without a sanitization claim', () => {
    const note = '  <script>alert("x")</script><img src=x onerror=alert(1)>\ncontact@example.test\r\n\t';
    const result = valid(validateReport(fixture({ note })));
    expect(result.report.note).toBe(note);
    expect(JSON.parse(result.canonicalContent).note).toBe(note);
  });

  it('counts at most 1000 Unicode code points, not UTF-16 units, and rejects lone surrogates', () => {
    for (const character of ['a', '\u4e00', '\ud83d\ude80']) {
      expect(validateReport(fixture({ note: character.repeat(1000) })).ok).toBe(true);
      expect(validateReport(fixture({ note: character.repeat(1001) }))).toEqual({ ok: false, error: 'invalid_note' });
    }
    for (const note of [null, undefined, 10, {}, '\ud800', '\udc00', 'a\ud800b', '\udc00\ud800']) {
      expect(validateReport(fixture({ note }))).toEqual({ ok: false, error: 'invalid_note' });
    }
  });

  it('canonicalizes property order and JSON spellings while keeping request identity out of content', () => {
    const input = fixture({ context: { transit_category: 'bus', postal_code: '001001' }, note: 'text' });
    const reversed: Record<string, unknown> = Object.fromEntries(Object.entries(input).reverse());
    reversed.context = { postal_code: '001001', transit_category: 'bus' };
    reversed.geometry = { coordinates: point, type: 'Point' };
    reversed.client_request_id = '87654321-4321-7321-9321-cba987654321';
    const canonical = valid(validateReport(input)).canonicalContent;
    expect(valid(validateReport(reversed)).canonicalContent).toBe(canonical);
    expect(valid(parseReportBody(encoder.encode(JSON.stringify(reversed, null, 2)
      .replace('103.85', '1.0385e2').replace('text', '\\u0074ext')))).canonicalContent).toBe(canonical);
    expect(canonical).toBe('{"schema_version":1,"report_type":"mapping_error","geometry":{"type":"Point","coordinates":[103.85,1.35]},"referenced_bundle_version":"synthetic-bundle-v1","context":{"postal_code":"001001","transit_category":"bus"},"note":"text"}');
    expect(canonical).not.toContain(requestId);
  });

  it('keeps meaningful content edits, omitted/empty fields and Unicode spellings distinct', () => {
    const inputs = [fixture(), fixture({ report_type: 'shelter_request' }), fixture({ note: '' }),
      fixture({ context: {} }), fixture({ note: 'x' }), fixture({ note: ' x' }),
      fixture({ note: '\u00e9' }), fixture({ note: 'e\u0301' }), fixture({ referenced_bundle_version: 'other' }),
      fixture({ geometry: { type: 'Point', coordinates: [103.8500000001, 1.35] } }),
      fixture({ context: { postal_code: '001001' } })];
    expect(new Set(inputs.map(input => valid(validateReport(input)).canonicalContent)).size).toBe(inputs.length);
  });

  it('returns deeply frozen independent data without changing the input', () => {
    const input = line([point, [103.851, 1.351]]);
    const snapshot = JSON.stringify(input);
    const result = valid(validateReport({ ...input, context: { postal_code: '001001' } }));
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(result.report.geometry).not.toBe(input.geometry);
    expect(Object.isFrozen(result.report)).toBe(true);
    expect(Object.isFrozen(result.report.context)).toBe(true);
    expect(Object.isFrozen(result.report.geometry)).toBe(true);
    expect(Object.isFrozen(result.report.geometry.coordinates)).toBe(true);
    expect(Object.isFrozen(result.report.geometry.coordinates[0])).toBe(true);
  });
});

describe('Report UTF-8 body boundary', () => {
  it('counts complete wire bytes including whitespace, accepting 8192 but rejecting 8193', () => {
    const raw = JSON.stringify(fixture({ note: '\u4e00'.repeat(1000) }));
    const padding = MAX_REPORT_BODY_BYTES - encoder.encode(raw).byteLength;
    const exact = encoder.encode(raw + ' '.repeat(padding));
    expect(exact.byteLength).toBe(8192);
    expect(parseReportBody(exact).ok).toBe(true);
    expect(parseReportBody(encoder.encode(raw + ' '.repeat(padding + 1)))).toEqual({ ok: false, error: 'body_too_large' });
  });

  it('counts JSON escapes on the wire before canonicalization', () => {
    const raw = JSON.stringify(fixture({ note: '\ud83d\ude80'.repeat(1000) })).replaceAll('\ud83d\ude80', '\\ud83d\\ude80');
    expect(validateReport(JSON.parse(raw)).ok).toBe(true);
    expect(parseReportBody(encoder.encode(raw))).toEqual({ ok: false, error: 'body_too_large' });
  });

  it('keeps dense, individually maximum-sized fields within the complete canonical request cap', () => {
    const input = { ...line(Array.from({ length: 32 }, (_, i) => [103.85000000000001 + i * 0.000000000001, 1.3500000000000001 + i * 0.000000000001])),
      note: '\u0001'.repeat(1000), referenced_bundle_version: 'b'.repeat(128),
      context: { postal_code: '001001', destination_id: 'd'.repeat(128), transit_category: 'mrt_lrt', published_route_id: 'r'.repeat(128) } };
    const result = valid(validateReport(input));
    expect(bytes(result.report).byteLength).toBe(bytes(input).byteLength);
    expect(bytes(result.report).byteLength).toBeLessThanOrEqual(8192);
  });

  it('rejects malformed UTF-8 instead of inserting replacement characters', () => {
    for (const bad of [[0xff], [0xc0, 0xaf], [0xe2, 0x82], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80]]) {
      const prefix = encoder.encode(JSON.stringify(fixture()).slice(0, -1) + ',"note":"');
      expect(parseReportBody(new Uint8Array([...prefix, ...bad, 34, 125]))).toEqual({ ok: false, error: 'invalid_utf8' });
    }
    expect(parseReportBody(bytes(fixture({ note: '\ufffd' }))).ok).toBe(true);
  });

  it('rejects empty/malformed JSON, trailing data, BOM and non-byte inputs without echoing content', () => {
    for (const raw of ['', ' ', '{', '{}{}', JSON.stringify(fixture()) + 'garbage', '\ufeff' + JSON.stringify(fixture())]) {
      expect(parseReportBody(encoder.encode(raw))).toEqual({ ok: false, error: 'invalid_json' });
    }
    for (const value of [null, 'raw json', new ArrayBuffer(1), new Uint16Array(1), [123, 125]]) {
      expect(parseReportBody(value)).toEqual({ ok: false, error: 'invalid_body' });
    }
    for (const value of [null, [], true, 'text']) expect(parseReportBody(bytes(value)).ok).toBe(false);
    expect(parseReportBody(encoder.encode(JSON.stringify(fixture()).replace('103.85', '1e999')))).toEqual({ ok: false, error: 'invalid_geometry' });
  });

  it('rejects duplicate keys including escaped names and nested replacements', () => {
    const raw = JSON.stringify(fixture());
    for (const changed of [raw.replace('"schema_version":1', '"schema_version":1,"schema_version":1'),
      raw.replace('"report_type":', '"report_type":"shelter_request","report_type":'),
      raw.replace('"geometry":', '"geometry":{"type":"Point","coordinates":[103.85,1.35]},"geometry":'),
      raw.replace('"type":"Point"', '"type":"LineString","t\\u0079pe":"Point"'),
      raw.slice(0, -1) + ',"context":{"postal_code":"001001","postal_code":"001001"}}']) {
      expect(parseReportBody(encoder.encode(changed))).toEqual({ ok: false, error: 'duplicate_fields' });
    }
    expect(parseReportBody(bytes(fixture({ note: '"note": "x", {"note": "y"} \\ :',
      context: { destination_id: 'bus:12345', published_route_id: 'bus:12345' } }))).ok).toBe(true);
  });

  it('rejects escaped lone surrogates and parses only the supplied byte view', () => {
    expect(parseReportBody(bytes(fixture({ note: '\ud800' })))).toEqual({ ok: false, error: 'invalid_note' });
    const raw = bytes(fixture());
    const padded = new Uint8Array(raw.length + 2);
    padded[0] = 255;
    padded.set(raw, 1);
    padded[padded.length - 1] = 255;
    expect(parseReportBody(padded.subarray(1, -1)).ok).toBe(true);
  });
});

describe('Bounded report stream adapter, with no HTTP/service activation', () => {
  it('parses split multibyte UTF-8 and releases the reader lock', async () => {
    const body = stream(Array.from(bytes(fixture({ note: '\u4e00\ud83d\ude80' })), byte => new Uint8Array([byte])));
    expect(valid(await readReportBody(body)).report.note).toBe('\u4e00\ud83d\ude80');
    expect(body.locked).toBe(false);
  });

  it('accepts an exact-limit stream and rejects overflow without consuming the rest', async () => {
    const raw = bytes(fixture());
    const exact = new Uint8Array(8192).fill(32);
    exact.set(raw);
    expect((await readReportBody(stream([exact.subarray(0, 4096), exact.subarray(4096)]))).ok).toBe(true);
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const body = stream([exact, new Uint8Array([32]), bytes(fixture())], cancel);
    expect(await readReportBody(body)).toEqual({ ok: false, error: 'body_too_large' });
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it('rejects a single oversized chunk even when cancellation rejects', async () => {
    const cancel = vi.fn(async () => { throw new Error('private transport failure'); });
    expect(await readReportBody(stream([new Uint8Array(8193)], cancel))).toEqual({ ok: false, error: 'body_too_large' });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('copies incoming chunks before a producer can reuse their memory', async () => {
    const raw = bytes(fixture());
    let pulls = 0;
    const body = new ReadableStream<Uint8Array>({ pull(controller) {
      if (pulls++ === 0) controller.enqueue(raw);
      else { raw.fill(255); controller.close(); }
    } }, { highWaterMark: 0 });
    expect((await readReportBody(body)).ok).toBe(true);
  });

  it('handles empty, missing, locked, errored and non-byte streams with fixed errors', async () => {
    expect(await readReportBody(null)).toEqual({ ok: false, error: 'invalid_body' });
    expect(await readReportBody(stream([]))).toEqual({ ok: false, error: 'invalid_json' });
    const locked = stream([]);
    const reader = locked.getReader();
    expect(await readReportBody(locked)).toEqual({ ok: false, error: 'body_read_failed' });
    reader.releaseLock();
    const failed = new ReadableStream<Uint8Array>({ pull(controller) { controller.error(new Error('private')); } });
    expect(await readReportBody(failed)).toEqual({ ok: false, error: 'body_read_failed' });
    expect(failed.locked).toBe(false);
    const wrong = stream(['not bytes' as unknown as Uint8Array]);
    expect(await readReportBody(wrong)).toEqual({ ok: false, error: 'invalid_body' });
  });

  it('cancels an already aborted body without reading it', async () => {
    const abort = new AbortController();
    abort.abort();
    const cancel = vi.fn();
    const body = stream([bytes(fixture())], cancel);
    expect(await readReportBody(body, abort.signal)).toEqual({ ok: false, error: 'body_aborted' });
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it('lets a caller deadline abort a stalled read without waiting for cancellation', async () => {
    const abort = new AbortController();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const body = new ReadableStream<Uint8Array>({ cancel });
    const result = readReportBody(body, abort.signal);
    abort.abort();
    expect(await result).toEqual({ ok: false, error: 'body_aborted' });
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });
});
