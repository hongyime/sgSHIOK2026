import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { MAX_REPORT_BODY_BYTES, readReportBody } from '../../../lib/reports';
import project from '../../../lib/report-project.json';
import { submitPrivateReport, type ReportAbuseBucket, type ReportStoreConfig } from './store';

export const REPORT_REQUEST_TIMEOUT_MS = 10000;
export const REPORT_RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};
type Environment = Readonly<Record<string, string | undefined>>;
interface Config { store: ReportStoreConfig; origin: string; bucketKey: string }
interface Dependencies { env?: Environment; transport?: typeof fetch; now?: () => number; admitAttempt?: (bucket: string, time: number) => boolean }

/** Bounded warm-instance shield, not a distributed quota or bot challenge. */
export function createReportAttemptLimiter(): (bucket: string, time: number) => boolean {
  let minute = -1;
  let total = 0;
  const networks = new Map<string, number>();
  return (bucket, time) => {
    const current = Math.floor(time / 60000);
    if (!Number.isSafeInteger(current) || current < minute) return false;
    if (current > minute) { minute = current; total = 0; networks.clear(); }
    const count = networks.get(bucket) ?? 0;
    if (total >= 60 || count >= 6) return false;
    total++; networks.set(bucket, count + 1);
    return true;
  };
}
const admitAttempt = createReportAttemptLimiter();

function bucketFor(key: string, network: string, time: number): ReportAbuseBucket {
  if (!Number.isSafeInteger(time)) throw new Error('Invalid bucket time');
  const day = new Date(time).toISOString().slice(0, 10);
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day) || day.startsWith('0000-')) throw new Error('Invalid bucket day');
  const sha256 = createHmac('sha256', Buffer.from(key, 'hex'))
    .update(`shiok-reports-v1\n${day}\n${network}`).digest('hex');
  return Object.freeze({ sha256, day });
}

function response(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: REPORT_RESPONSE_HEADERS });
}

function config(env: Environment): Config | null {
  if (env.SHIOK_REPORTS_ENABLED !== 'true' || env.VERCEL !== '1'
    || env.NODE_ENV !== 'production' || !['production', 'preview'].includes(env.VERCEL_ENV ?? '')
    || env.SHIOK_REPORTS_PROJECT_URL !== project.projectUrl
    || !/^sb_secret_[A-Za-z0-9_-]{16,256}$/.test(env.SHIOK_REPORTS_SECRET_KEY ?? '')
    || /\s/.test(env.SHIOK_REPORTS_SECRET_KEY ?? '')
    || env.SHIOK_REPORTS_BUCKET_KEY?.length !== 64
    || !/^[0-9a-f]{64}$/.test(env.SHIOK_REPORTS_BUCKET_KEY ?? '')) return null;
  const origin = env.SHIOK_REPORTS_ORIGIN;
  try {
    const url = new URL(origin ?? '');
    if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) return null;
  } catch { return null; }
  return {
    store: { projectUrl: project.projectUrl, secretKey: env.SHIOK_REPORTS_SECRET_KEY! },
    origin: origin!, bucketKey: env.SHIOK_REPORTS_BUCKET_KEY!,
  };
}

/** Vercel ingress only. Never fall back to a client-supplied forwarding header. */
function abuseNetwork(headers: Headers): string | null {
  const ip = headers.get('x-vercel-forwarded-for');
  if (!ip || ip.length > 45 || ip.includes('%')) return null;
  const family = isIP(ip);
  if (family === 4) return `v4:${ip}`;
  if (family !== 6) return null;
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const [left, right] = canonical.split('::');
  const prefix = left ? left.split(':') : [];
  const suffix = right ? right.split(':') : [];
  const words = canonical.includes('::')
    ? [...prefix, ...Array(8 - prefix.length - suffix.length).fill('0'), ...suffix]
    : prefix;
  const values = words.map(word => Number.parseInt(word, 16));
  if (values.slice(0, 5).every(value => value === 0) && values[5] === 65535) {
    return `v4:${[values[6] >> 8, values[6] & 255, values[7] >> 8, values[7] & 255].join('.')}`;
  }
  // Group IPv6 privacy addresses in one /64; this is a network cap, not person identity.
  return `v6:${values.slice(0, 4).map(value => value.toString(16).padStart(4, '0')).join(':')}/64`;
}

function cancelBody(request: Request): void {
  if (!request.body?.locked) void request.body?.cancel().catch(() => {});
}

export function reportMethodNotAllowed(request: Request): Response {
  cancelBody(request);
  return new Response(request.method === 'HEAD' ? null : JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405, headers: { ...REPORT_RESPONSE_HEADERS, Allow: 'POST', 'Content-Type': 'application/json' },
  });
}

/** Public, anonymous submission only. No report retrieval or provider error text. */
export async function handleReportPost(request: Request, dependencies: Dependencies = {}): Promise<Response> {
  if (request.method !== 'POST') return reportMethodNotAllowed(request);
  const settings = config(dependencies.env ?? process.env);
  const reject = (status: number, error: string) => { cancelBody(request); return response(status, { ok: false, error }); };
  if (!settings) return reject(503, 'unavailable');
  const url = new URL(request.url);
  const site = request.headers.get('sec-fetch-site');
  if (url.origin !== settings.origin || request.headers.get('origin') !== settings.origin
    || (site !== null && site !== 'same-origin')) return reject(403, 'forbidden');
  if (url.search) return reject(400, 'invalid_request');
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')
    || !['', 'identity'].includes(request.headers.get('content-encoding') ?? '')) return reject(415, 'unsupported_media_type');
  const length = request.headers.get('content-length');
  if (length !== null && !/^(0|[1-9][0-9]{0,8})$/.test(length)) return reject(400, 'invalid_request');
  if (length !== null && Number(length) > MAX_REPORT_BODY_BYTES) return reject(413, 'body_too_large');
  const network = abuseNetwork(request.headers);
  if (!network) return reject(503, 'unavailable');
  if (request.signal.aborted) return reject(408, 'request_timeout');
  let capturedAt: number;
  let bucket: ReportAbuseBucket;
  try {
    capturedAt = (dependencies.now ?? Date.now)();
    bucket = bucketFor(settings.bucketKey, network, capturedAt);
  } catch { return reject(503, 'unavailable'); }
  if (!(dependencies.admitAttempt ?? admitAttempt)(bucket.sha256, capturedAt)) return reject(429, 'limited');
  const proof = request.headers.get('x-shiok-retry-secret') ?? '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(proof)) return reject(400, 'invalid_request');

  const controller = new AbortController();
  let dispatched = false;
  let end!: (value: Response) => void;
  const ended = new Promise<Response>(resolve => { end = resolve; });
  const stop = () => {
    end(response(dispatched ? 503 : 408, { ok: false, error: dispatched ? 'outcome_unknown' : 'request_timeout' }));
    controller.abort();
  };
  request.signal.addEventListener('abort', stop, { once: true });
  const timer = setTimeout(stop, REPORT_REQUEST_TIMEOUT_MS);
  try {
    return await Promise.race([ended, (async () => {
      const parsed = await readReportBody(request.body, controller.signal);
      controller.signal.throwIfAborted();
      if (!parsed.ok) return response(parsed.error === 'body_too_large' ? 413 : 400, { ok: false, error: parsed.error });
      // One post-upload instant binds the HMAC to the date the database checks after its lock.
      const storageBucket = bucketFor(settings.bucketKey, network, (dependencies.now ?? Date.now)());
      dispatched = true;
      const result = await submitPrivateReport(settings.store, parsed.report, proof, storageBucket, controller.signal, dependencies.transport);
      controller.signal.throwIfAborted();
      if (result.ok) return response(result.replayed ? 200 : 201, result);
      const status = result.error === 'conflict' ? 409 : result.error === 'expired' ? 410
        : result.error === 'limited' ? 429 : result.error === 'invalid_request' ? 400 : 503;
      return response(status, { ok: false, error: result.error === 'unconfigured' ? 'unavailable' : result.error });
    })()]);
  } catch {
    return response(503, { ok: false, error: dispatched ? 'outcome_unknown' : 'unavailable' });
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', stop);
  }
}
