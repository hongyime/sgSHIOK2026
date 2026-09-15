import { createHash } from 'node:crypto';
import { validateReport } from '../../../lib/reports';
import project from '../../../lib/report-project.json';

export const REPORT_STORE_TIMEOUT_MS = 8000;
const MAX_REPLY_BYTES = 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HEX = /^[0-9a-f]{64}$/;

export interface ReportStoreConfig { projectUrl: string; secretKey: string }
export interface ReportAbuseBucket { readonly sha256: string; readonly day: string }
export type ReportStoreResult =
  | { ok: true; receipt: { receipt_id: string; received_at: string }; replayed: boolean }
  | { ok: false; error: 'invalid_request' | 'unconfigured' | 'conflict' | 'expired' | 'limited' | 'unavailable' | 'outcome_unknown' };

function configured(config: ReportStoreConfig): boolean {
  // An account credential is not authorization to use another project's storage.
  return config.projectUrl === project.projectUrl
    && /^sb_secret_[A-Za-z0-9_-]{16,256}$/.test(config.secretKey);
}

function validatedBucket(value: ReportAbuseBucket): ReportAbuseBucket | null {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const { sha256, day } = value;
    if (typeof sha256 !== 'string' || sha256.length !== 64 || !HEX.test(sha256)
      || typeof day !== 'string' || day.length !== 10 || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day)
      || day.startsWith('0000-')) return null;
    const time = Date.parse(`${day}T00:00:00Z`);
    if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== day) return null;
    return Object.freeze({ sha256, day });
  } catch { return null; }
}

async function receiptBody(response: Response, signal: AbortSignal): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('unavailable');
  const bytes = new Uint8Array(MAX_REPLY_BYTES);
  let length = 0;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const next = await reader.read();
      signal.throwIfAborted();
      if (next.done) return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length)));
      if (next.value.byteLength > MAX_REPLY_BYTES - length) throw new Error('unavailable');
      bytes.set(next.value, length);
      length += next.value.byteLength;
    }
  } finally {
    cancel();
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

/** Server-only adapter, NOT a public endpoint. No read/list/moderation API is exposed. */
export async function submitPrivateReport(
  config: ReportStoreConfig,
  value: unknown,
  retrySecret: string,
  abuseBucket: ReportAbuseBucket,
  caller: AbortSignal,
  transport: typeof fetch = fetch,
): Promise<ReportStoreResult> {
  if (!configured(config)) return { ok: false, error: 'unconfigured' };
  const parsed = validateReport(value);
  const bucket = validatedBucket(abuseBucket);
  if (!parsed.ok || !/^[A-Za-z0-9_-]{43}$/.test(retrySecret) || !bucket) return { ok: false, error: 'invalid_request' };
  if (caller.aborted) return { ok: false, error: 'unavailable' };
  const controller = new AbortController();
  let reject!: (error: Error) => void;
  const ended = new Promise<never>((_, fail) => { reject = fail; });
  const stop = () => { reject(new Error('ended')); controller.abort(); };
  caller.addEventListener('abort', stop, { once: true });
  const timer = setTimeout(stop, REPORT_STORE_TIMEOUT_MS);
  try {
    return await Promise.race([ended, (async (): Promise<ReportStoreResult> => {
      controller.signal.throwIfAborted();
      const response = await transport(`${config.projectUrl}/rest/v1/rpc/shiok_report_submit_v2`, {
        method: 'POST', cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { apikey: config.secretKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_request_id: parsed.report.client_request_id, p_canonical_content: parsed.canonicalContent,
          p_retry_proof_sha256: createHash('sha256').update(retrySecret).digest('hex'),
          p_abuse_bucket_sha256: bucket.sha256, p_abuse_day: bucket.day,
        }),
      });
      if (controller.signal.aborted) {
        void response.body?.cancel().catch(() => {});
        controller.signal.throwIfAborted();
      }
      if (response.status !== 200) {
        if (response.status === 503) {
          const body = await receiptBody(response, controller.signal);
          controller.signal.throwIfAborted();
          const failure = body as Record<string, unknown> | null;
          const rejected = failure && typeof failure === 'object' && !Array.isArray(failure)
            && Object.keys(failure).sort().join(',') === 'code,details,hint,message'
            && failure.code === 'PT503' && failure.message === 'reporting_unavailable'
            && failure.details === null && failure.hint === null;
          return { ok: false, error: rejected ? 'unavailable' : 'outcome_unknown' };
        }
        void response.body?.cancel().catch(() => {});
        const error = response.status === 409 ? 'conflict' : response.status === 410 ? 'expired'
          : response.status === 429 ? 'limited' : response.status === 400 ? 'invalid_request'
          : response.status === 401 || response.status === 403 ? 'unavailable' : 'outcome_unknown';
        return { ok: false, error };
      }
      const body = await receiptBody(response, controller.signal);
      controller.signal.throwIfAborted();
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('unavailable');
      const result = body as Record<string, unknown>;
      if (Object.keys(result).sort().join(',') !== 'receipt_id,received_at,replayed'
        || typeof result.receipt_id !== 'string' || !UUID.test(result.receipt_id)
        || typeof result.received_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(result.received_at)
        || !Number.isFinite(Date.parse(result.received_at)) || typeof result.replayed !== 'boolean') throw new Error('unavailable');
      return { ok: true, receipt: { receipt_id: result.receipt_id, received_at: result.received_at }, replayed: result.replayed };
    })()]);
  } catch {
    // May have committed before timeout/disconnect/malformed reply. Never automatically POST again.
    return { ok: false, error: 'outcome_unknown' };
  } finally {
    clearTimeout(timer);
    caller.removeEventListener('abort', stop);
  }
}
