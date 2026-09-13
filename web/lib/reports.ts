import { haversineMeters } from './nearest-transit';
import type { PublishedTransitCategory } from './published-transit-options';

// Local proposed contract only. No submission, persistence, receipt, auth or privacy guarantee.
export const REPORT_SCHEMA_VERSION = 1;
export const MAX_REPORT_VERTICES = 32;
export const MAX_REPORT_SEGMENT_METERS = 1200;
export const MAX_REPORT_NOTE_CHARACTERS = 1000;
export const MAX_REPORT_BODY_BYTES = 8192;

// Matches app/api/onemap-route's sanity box, not a reviewed jurisdiction/service polygon.
export const REPORT_SINGAPORE_BOUNDS = Object.freeze({
  minLat: 1.15, maxLat: 1.48, minLng: 103.58, maxLng: 104.08,
});

export type ReportPosition = readonly [longitude: number, latitude: number];
export type ReportGeometry =
  | { readonly type: 'Point'; readonly coordinates: ReportPosition }
  | { readonly type: 'LineString'; readonly coordinates: readonly ReportPosition[] };

export interface ReportContext {
  readonly postal_code?: string;
  readonly destination_id?: string;
  readonly transit_category?: PublishedTransitCategory;
  readonly published_route_id?: string;
}

interface ReportFields {
  readonly schema_version: typeof REPORT_SCHEMA_VERSION;
  readonly client_request_id: string;
  readonly geometry: ReportGeometry;
  readonly referenced_bundle_version: string;
  readonly context?: ReportContext;
  readonly note?: string;
}

export interface MappingErrorReport extends ReportFields { readonly report_type: 'mapping_error' }
export interface ShelterRequestReport extends ReportFields { readonly report_type: 'shelter_request' }
export type Report = MappingErrorReport | ShelterRequestReport;
export type ReportValidationError =
  | 'invalid_report' | 'invalid_geometry' | 'invalid_context' | 'invalid_note'
  | 'invalid_body' | 'body_too_large' | 'invalid_utf8' | 'invalid_json'
  | 'duplicate_fields' | 'body_read_failed' | 'body_aborted';
export type ReportValidationResult =
  | { readonly ok: true; readonly report: Report; readonly canonicalContent: string }
  | { readonly ok: false; readonly error: ReportValidationError };

const REQUIRED_FIELDS = ['schema_version', 'client_request_id', 'report_type', 'geometry', 'referenced_bundle_version'];
const REPORT_FIELDS = [...REQUIRED_FIELDS, 'context', 'note'];
const CONTEXT_FIELDS = ['postal_code', 'destination_id', 'transit_category', 'published_route_id'];
// Proposed syntax, not proof of randomness, bundle existence or a published destination/route.
const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const encoder = new TextEncoder();
const invalid = (error: ReportValidationError): ReportValidationResult => ({ ok: false, error });

function record(value: unknown, allowed: readonly string[], required: readonly string[] = []): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Reflect.ownKeys(value).every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    return typeof key === 'string' && allowed.includes(key) && descriptor.enumerable && 'value' in descriptor;
  }) && required.every(key => Object.prototype.hasOwnProperty.call(value, key));
}

function array(value: unknown, min: number, max: number): value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length < min || value.length > max || Reflect.ownKeys(value).length !== value.length + 1) return false;
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    if (!descriptor?.enumerable || !('value' in descriptor)) return false;
  }
  return true;
}

function identifier(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 128 && IDENTIFIER.test(value)
    && !/[\r\n]/.test(value);
}

function position(value: unknown): ReportPosition | null {
  if (!array(value, 2, 2)) return null;
  const [lng, lat] = value;
  const bounds = REPORT_SINGAPORE_BOUNDS;
  if (typeof lng !== 'number' || typeof lat !== 'number' || !Number.isFinite(lng) || !Number.isFinite(lat)
    || lng < bounds.minLng || lng > bounds.maxLng || lat < bounds.minLat || lat > bounds.maxLat) return null;
  return Object.freeze([lng, lat]);
}

function geometry(value: unknown): ReportGeometry | null {
  if (!record(value, ['type', 'coordinates'], ['type', 'coordinates'])) return null;
  if (value.type === 'Point') {
    const coordinates = position(value.coordinates);
    return coordinates ? Object.freeze({ type: 'Point', coordinates }) : null;
  }
  if (value.type !== 'LineString' || !array(value.coordinates, 2, MAX_REPORT_VERTICES)) return null;
  const coordinates: ReportPosition[] = [];
  let length = 0;
  for (const raw of value.coordinates) {
    const point = position(raw);
    if (!point) return null;
    const previous = coordinates[coordinates.length - 1];
    if (previous) length += haversineMeters(previous[1], previous[0], point[1], point[0]);
    if (length > MAX_REPORT_SEGMENT_METERS) return null;
    coordinates.push(point);
  }
  // A zero-length trace must be represented as a Point; no rounding or endpoint-only shortcut.
  return length > 0 ? Object.freeze({ type: 'LineString', coordinates: Object.freeze(coordinates) }) : null;
}

function context(value: unknown): ReportContext | null {
  if (!record(value, CONTEXT_FIELDS)) return null;
  const result: { -readonly [K in keyof ReportContext]: ReportContext[K] } = {};
  if ('postal_code' in value) {
    if (typeof value.postal_code !== 'string' || value.postal_code.length !== 6 || !/^[0-9]{6}$/.test(value.postal_code)) return null;
    result.postal_code = value.postal_code;
  }
  if ('destination_id' in value) {
    if (!identifier(value.destination_id)) return null;
    result.destination_id = value.destination_id;
  }
  if ('transit_category' in value) {
    if (value.transit_category !== 'bus' && value.transit_category !== 'mrt_lrt') return null;
    result.transit_category = value.transit_category;
  }
  if ('published_route_id' in value) {
    if (!identifier(value.published_route_id)) return null;
    result.published_route_id = value.published_route_id;
  }
  return Object.freeze(result);
}

function note(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > MAX_REPORT_NOTE_CHARACTERS * 2) return false;
  let characters = 0;
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (++characters > MAX_REPORT_NOTE_CHARACTERS || (code >= 0xd800 && code <= 0xdfff)) return false;
  }
  return true;
}

/** Validates JSON-shaped local data; callers with wire bytes must use parse/readReportBody. */
export function validateReport(value: unknown): ReportValidationResult {
  try {
    if (!record(value, REPORT_FIELDS, REQUIRED_FIELDS) || value.schema_version !== REPORT_SCHEMA_VERSION
      || typeof value.client_request_id !== 'string' || value.client_request_id.length !== 36 || !REQUEST_ID.test(value.client_request_id)
      || (value.report_type !== 'mapping_error' && value.report_type !== 'shelter_request')
      || !identifier(value.referenced_bundle_version)) return invalid('invalid_report');
    const validatedGeometry = geometry(value.geometry);
    if (!validatedGeometry) return invalid('invalid_geometry');
    const validatedContext = 'context' in value ? context(value.context) : undefined;
    if (validatedContext === null) return invalid('invalid_context');
    if ('note' in value && !note(value.note)) return invalid('invalid_note');

    // Fixed schema order, no coercion/rounding/trimming/Unicode normalization. Text remains untrusted.
    // Request identity is separate from content identity; no challenge/retry secrets belong here.
    const content = {
      schema_version: REPORT_SCHEMA_VERSION,
      report_type: value.report_type,
      geometry: validatedGeometry,
      referenced_bundle_version: value.referenced_bundle_version,
      ...(validatedContext !== undefined ? { context: validatedContext } : {}),
      ...('note' in value ? { note: value.note as string } : {}),
    } as const;
    const report: Report = Object.freeze({ ...content, client_request_id: value.client_request_id });
    if (encoder.encode(JSON.stringify(report)).byteLength > MAX_REPORT_BODY_BYTES) return invalid('body_too_large');
    return Object.freeze({ ok: true, report, canonicalContent: JSON.stringify(content) });
  } catch {
    return invalid('invalid_report');
  }
}

// Native JSON.parse validates syntax but silently drops duplicate keys. Count members outside
// strings before/after parsing to reject that information loss, including escaped duplicate names.
function memberCount(json: string): number {
  let count = 0;
  for (const match of json.matchAll(/"(?:[^"\\]|\\[\s\S])*"|(:)/g)) if (match[1]) count++;
  return count;
}

/** The entire supplied body counts, including whitespace and escape spelling. UTF-8 must be valid. */
export function parseReportBody(body: unknown): ReportValidationResult {
  if (!(body instanceof Uint8Array)) return invalid('invalid_body');
  if (body.byteLength > MAX_REPORT_BODY_BYTES) return invalid('body_too_large');
  let text: string;
  try {
    // Preserve a BOM so JSON.parse rejects it rather than silently changing the wire representation.
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body);
  } catch {
    return invalid('invalid_utf8');
  }
  try {
    const value: unknown = JSON.parse(text);
    if (memberCount(text) !== memberCount(JSON.stringify(value))) return invalid('duplicate_fields');
    return validateReport(value);
  } catch {
    return invalid('invalid_json');
  }
}

/** Bounded stream adapter, not an endpoint. A future transport must supply its deadline signal. */
export async function readReportBody(
  body: ReadableStream<Uint8Array> | null,
  signal?: AbortSignal,
): Promise<ReportValidationResult> {
  if (!body) return invalid('invalid_body');
  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try { reader = body.getReader(); } catch { return invalid('body_read_failed'); }
  // Cancellation may itself stall/reject; never await it or expose a transport exception.
  const cancel = () => { void reader.cancel().catch(() => {}); };
  const bytes = new Uint8Array(MAX_REPORT_BODY_BYTES);
  let length = 0;
  try {
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) { cancel(); return invalid('body_aborted'); }
    while (true) {
      const chunk = await reader.read();
      if (signal?.aborted) return invalid('body_aborted');
      if (chunk.done) return parseReportBody(bytes.subarray(0, length));
      if (!(chunk.value instanceof Uint8Array)) { cancel(); return invalid('invalid_body'); }
      if (chunk.value.byteLength > MAX_REPORT_BODY_BYTES - length) { cancel(); return invalid('body_too_large'); }
      bytes.set(chunk.value, length);
      length += chunk.value.byteLength;
    }
  } catch {
    cancel();
    return invalid(signal?.aborted ? 'body_aborted' : 'body_read_failed');
  } finally {
    signal?.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}
