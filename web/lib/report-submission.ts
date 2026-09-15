'use client';

import { validateReport, type Report, type ReportValidationError } from './reports';

export const REPORT_SUBMISSION_TIMEOUT_MS = 12_000;
export const MAX_REPORT_RESPONSE_BYTES = 1024;

export interface ReportSubmissionEnvelope {
  readonly report: Report;
  readonly canonicalContent: string;
  readonly retrySecret: string;
}

export type ReportSubmissionPreparation =
  | { readonly ok: true; readonly envelope: ReportSubmissionEnvelope }
  | { readonly ok: false; readonly error: ReportValidationError | 'crypto_unavailable' };

export type ReportSubmissionError = ReportValidationError | 'invalid_request' | 'forbidden'
  | 'unsupported_media_type' | 'method_not_allowed' | 'request_timeout'
  | 'conflict' | 'expired' | 'limited' | 'unavailable' | 'outcome_unknown';
export type ReportSubmissionResult =
  | { readonly ok: true; readonly receipt: { readonly receipt_id: string; readonly received_at: string }; readonly replayed: boolean }
  | { readonly ok: false; readonly error: ReportSubmissionError };

interface SubmissionState {
  body: string;
  mayHaveCommitted?: boolean;
  inFlight?: Promise<ReportSubmissionResult>;
  confirmed?: Extract<ReportSubmissionResult, { ok: true }>;
}

const submissions = new WeakMap<ReportSubmissionEnvelope, SubmissionState>();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const VALIDATION_ID = '00000000-0000-4000-8000-000000000000';
const fail = (error: ReportSubmissionError): ReportSubmissionResult => Object.freeze({ ok: false, error });
const errorStatuses: Readonly<Record<string, number>> = Object.freeze({
  invalid_report: 400, invalid_geometry: 400, invalid_context: 400, invalid_note: 400,
  invalid_body: 400, invalid_utf8: 400, invalid_json: 400, duplicate_fields: 400,
  body_read_failed: 400, body_aborted: 400, invalid_request: 400,
  forbidden: 403, method_not_allowed: 405, request_timeout: 408, conflict: 409,
  expired: 410, body_too_large: 413, unsupported_media_type: 415, limited: 429,
  unavailable: 503, outcome_unknown: 503,
});

/** Prepare once from a draft without client_request_id. The caller must hold this private envelope before sending. */
export function prepareReportSubmission(
  draft: unknown,
  random: Pick<Crypto, 'randomUUID' | 'getRandomValues'> = globalThis.crypto,
): ReportSubmissionPreparation {
  let parsed;
  try {
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(draft))
      || Object.prototype.hasOwnProperty.call(draft, 'client_request_id')) return { ok: false, error: 'invalid_report' };
    // Preserve descriptors so strict validation rejects accessors, symbols and hidden fields without invoking them.
    const candidate = Object.defineProperties(Object.create(null), Object.getOwnPropertyDescriptors(draft));
    candidate.client_request_id = VALIDATION_ID;
    parsed = validateReport(candidate);
    if (!parsed.ok) return parsed;
  } catch {
    return { ok: false, error: 'invalid_report' };
  }
  try {
    const client_request_id = random.randomUUID();
    const bytes = new Uint8Array(32);
    random.getRandomValues(bytes);
    const validated = validateReport({ ...parsed.report, client_request_id });
    if (!validated.ok) return { ok: false, error: 'crypto_unavailable' };
    const retrySecret = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const envelope = Object.freeze({ report: validated.report, canonicalContent: validated.canonicalContent, retrySecret });
    submissions.set(envelope, { body: JSON.stringify(validated.report) });
    return Object.freeze({ ok: true, envelope });
  } catch {
    return { ok: false, error: 'crypto_unavailable' };
  }
}

function cancelBody(response: Response): void {
  if (!response.body?.locked) void response.body?.cancel().catch(() => {});
}

async function responseBody(response: Response, signal: AbortSignal): Promise<unknown> {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type') ?? '')) throw new Error();
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^(0|[1-9][0-9]{0,8})$/.test(declared) || Number(declared) > MAX_REPORT_RESPONSE_BYTES)) throw new Error();
  const reader = response.body?.getReader();
  if (!reader) throw new Error();
  const bytes = new Uint8Array(MAX_REPORT_RESPONSE_BYTES);
  let length = 0;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) {
        const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, length));
        const value: unknown = JSON.parse(text);
        // Match the report-body contract's duplicate-key rejection rather than accepting JSON.parse's last value.
        const members = (json: string) => [...json.matchAll(/"(?:[^"\\]|\\[\s\S])*"|(:)/g)].filter(match => match[1]).length;
        if (members(text) !== members(JSON.stringify(value))) throw new Error();
        return value;
      }
      if (!(chunk.value instanceof Uint8Array) || chunk.value.byteLength > bytes.length - length) throw new Error();
      bytes.set(chunk.value, length);
      length += chunk.value.byteLength;
    }
  } finally {
    cancel();
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

function fields(value: unknown, names: string): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === names;
}

function timestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 32
    || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)
    || !Number.isFinite(Date.parse(value))) return false;
  const date = value.slice(0, 10);
  return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}

function resultFromBody(status: number, body: unknown): ReportSubmissionResult {
  if (fields(body, 'ok,receipt,replayed') && body.ok === true && typeof body.replayed === 'boolean'
    && status === (body.replayed ? 200 : 201) && fields(body.receipt, 'receipt_id,received_at')
    && typeof body.receipt.receipt_id === 'string' && body.receipt.receipt_id.length === 36
    && UUID.test(body.receipt.receipt_id) && timestamp(body.receipt.received_at)) {
    return Object.freeze({ ok: true, receipt: Object.freeze({
      receipt_id: body.receipt.receipt_id, received_at: body.receipt.received_at,
    }), replayed: body.replayed });
  }
  if (fields(body, 'error,ok') && body.ok === false && typeof body.error === 'string'
    && Object.prototype.hasOwnProperty.call(errorStatuses, body.error) && errorStatuses[body.error] === status) {
    return fail(body.error as ReportSubmissionError);
  }
  return fail('outcome_unknown');
}

async function attempt(envelope: ReportSubmissionEnvelope, body: string, transport: typeof fetch): Promise<ReportSubmissionResult> {
  const controller = new AbortController();
  let end!: (value: ReportSubmissionResult) => void;
  const ended = new Promise<ReportSubmissionResult>(resolve => { end = resolve; });
  const timer = setTimeout(() => {
    end(fail('outcome_unknown'));
    controller.abort();
  }, REPORT_SUBMISSION_TIMEOUT_MS);
  try {
    return await Promise.race([ended, (async () => {
      const response = await transport('/api/reports', {
        method: 'POST', mode: 'same-origin', credentials: 'omit', redirect: 'error', cache: 'no-store',
        referrer: '', referrerPolicy: 'same-origin', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-shiok-retry-secret': envelope.retrySecret }, body,
      });
      try {
        controller.signal.throwIfAborted();
        if (response.redirected || (response.status !== 200 && response.status !== 201 && !Object.values(errorStatuses).includes(response.status))) throw new Error();
        const value = await responseBody(response, controller.signal);
        controller.signal.throwIfAborted();
        return resultFromBody(response.status, value);
      } finally { cancelBody(response); }
    })()]);
  } catch {
    // Timeout, malformed response or disconnect may follow a committed write. Only retry this envelope explicitly.
    return fail('outcome_unknown');
  } finally { clearTimeout(timer); }
}

/** One bounded POST; concurrent callers share it. Confirmed receipts are reused. No automatic retry or persistence. */
export function submitReport(
  envelope: ReportSubmissionEnvelope,
  transport: typeof fetch = globalThis.fetch,
): Promise<ReportSubmissionResult> {
  const state = submissions.get(envelope);
  if (!state) return Promise.resolve(fail('invalid_request'));
  if (state.confirmed) return Promise.resolve(state.confirmed);
  if (state.inFlight) return state.inFlight;
  // Publish the pending promise before invoking even a synchronous transport double.
  state.inFlight = Promise.resolve().then(() => attempt(envelope, state.body, transport)).then(result => {
    state.inFlight = undefined;
    if (result.ok) {
      state.confirmed = result;
      state.mayHaveCommitted = false;
    } else {
      if (result.error === 'outcome_unknown') state.mayHaveCommitted = true;
      // A later rejected attempt says nothing about an earlier unconfirmed commit.
      if (state.mayHaveCommitted) return fail('outcome_unknown');
    }
    return result;
  });
  return state.inFlight;
}
