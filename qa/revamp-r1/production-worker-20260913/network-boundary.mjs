import { createHash } from 'node:crypto';
import { createServer, validateHeaderValue } from 'node:http';
import { performance } from 'node:perf_hooks';

export const DATA_PREFIX = '/data/generated_20260805_prefer_scored_routed/';

const DEFAULT_LIMITS = Object.freeze({
  wallMs: 110_000,
  maxRequests: 300,
  maxResponseBytes: 100 * 1024 * 1024,
  maxDataFileBytes: 8 * 1024 * 1024,
});
const RESPONSE_HEADERS = new Set([
  'content-type', 'content-language',
  'content-security-policy', 'content-security-policy-report-only',
  'cross-origin-embedder-policy', 'cross-origin-opener-policy',
  'cross-origin-resource-policy', 'referrer-policy', 'x-content-type-options',
]);
const MAX_TARGET_LENGTH = 4096;
const MAX_RECEIPT_PATH = 512;
const EMPTY = Buffer.alloc(0);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const now = () => new Date().toISOString();

/** @typedef {{bytes: Buffer, headers?: Record<string, string>, sha256: string}} Asset */
/** @typedef {{status: number, headers?: Record<string, string>, bytes: Buffer}} DataResponse */

function checkedLimits(overrides) {
  const limits = { ...DEFAULT_LIMITS, ...overrides };
  for (const [name, value] of Object.entries(limits)) {
    if (!Object.hasOwn(DEFAULT_LIMITS, name) || !Number.isSafeInteger(value) || value <= 0) {
      throw new TypeError(`Invalid boundary limit: ${name}`);
    }
  }
  if (limits.wallMs > 2_147_483_647) throw new TypeError('wallMs exceeds timer range');
  return limits;
}

function safeHeaders(headers = {}, rawData = false) {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    throw new TypeError('Response headers must be an object');
  }
  const selected = {};
  let size = 0;
  for (const [name, value] of Object.entries(headers)) {
    const lower = name.toLowerCase();
    if (!RESPONSE_HEADERS.has(lower) && !(rawData && lower === 'content-encoding')) continue;
    if (typeof value !== 'string') throw new TypeError('Response header must be a string');
    size += Buffer.byteLength(lower) + Buffer.byteLength(value);
    if (size > 8192) throw new TypeError('Response headers exceed boundary limit');
    validateHeaderValue(lower, value);
    selected[lower] = value;
  }
  return selected;
}

// Check the raw spelling before WHATWG URL parsing can erase dot segments or slashes.
function safePath(path) {
  if (typeof path !== 'string' || path.length > MAX_TARGET_LENGTH ||
      !path.startsWith('/') || /[^\x21-\x7e]|[?#\\]/.test(path) ||
      /%(?:2f|5c)/i.test(path)) return false;
  let decoded;
  try { decoded = decodeURIComponent(path); } catch { return false; }
  if (/[\x00-\x20\x7f\\?#%:]/.test(decoded)) return false;
  if (decoded === '/') return true;
  return decoded.slice(1).replace(/\/$/, '').split('/').every((part) => part && part !== '.' && part !== '..');
}

function dataPath(path) {
  return path.startsWith(DATA_PREFIX) && path.length > DATA_PREFIX.length &&
    !path.endsWith('/') && /^[A-Za-z0-9_./-]+$/.test(path) && safePath(path);
}

function targetPath(target) {
  if (typeof target !== 'string' || target.length > MAX_TARGET_LENGTH) return null;
  if (target.startsWith('/')) return target;
  return /^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/?#]*(.*)$/.exec(target)?.[1] || null;
}

function targetIdentity(request, event) {
  const target = request?.url;
  const identity = { authority: null, targetOrigin: null, targetAuthority: null };
  if (typeof target !== 'string' || target.length > MAX_TARGET_LENGTH) return identity;
  if (event === 'connect') {
    if (/^[A-Za-z0-9.-]+:[0-9]{1,5}$/.test(target) && target.length <= 256 &&
        Number(target.slice(target.lastIndexOf(':') + 1)) <= 65535) {
      identity.targetAuthority = target.toLowerCase();
      identity.authority = identity.targetAuthority;
    }
  } else if (/^https?:\/\//i.test(target)) {
    try {
      const url = new URL(target);
      if (url.origin.length <= 256) {
        identity.targetOrigin = url.origin;
        identity.authority = url.host;
      }
    } catch { /* Malformed targets are still counted, without retaining their text. */ }
  } else if (target.startsWith('/')) {
    const host = request.headers.host;
    if (typeof host === 'string' && host.length <= 256 && /^[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/.test(host)) {
      identity.authority = host.toLowerCase();
    }
  }
  return identity;
}

function safeRootQuery(query) {
  const params = new URLSearchParams(query);
  if (!params.size || params.size > 2 || params.toString() !== query) return false;
  return [...params].every(([key, value]) => params.getAll(key).length === 1 &&
    ((key === 'postal' && /^[0-9]{6}$/.test(value)) || (key === 'debugMap' && value === '1')));
}

function requestPath(request, origin) {
  const target = request.url;
  if (typeof target !== 'string' || target.length > MAX_TARGET_LENGTH ||
      /[^\x21-\x7e]|\\/.test(target)) return { reason: 'unsafe-target' };
  const absolute = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/([^/?#]*)(.*)$/.exec(target);
  const suffix = absolute ? (absolute[2] || '/') : target;
  const path = suffix.split('?', 1)[0];
  if (!safePath(path) || suffix.includes('#') || (suffix.includes('?') && path !== '/')) {
    return { reason: 'unsafe-path' };
  }
  if (suffix.includes('?') && !safeRootQuery(suffix.slice(suffix.indexOf('?') + 1))) {
    return { reason: 'unsafe-root-query' };
  }
  if (absolute) {
    let url;
    try { url = new URL(target); } catch { return { reason: 'unsafe-target' }; }
    if (url.origin !== origin || url.username || url.password ||
        absolute[1] !== new URL(origin).host) return { reason: 'foreign-origin' };
  } else if (!target.startsWith('/')) {
    return { reason: 'unsafe-target' };
  }
  const hostCount = request.rawHeaders.filter((_, index) =>
    index % 2 === 0 && request.rawHeaders[index].toLowerCase() === 'host').length;
  if (hostCount !== 1 || request.headers.host !== new URL(origin).host) {
    return { reason: 'foreign-host' };
  }
  return { path };
}

function abortableRead(readData, path, signal) {
  return new Promise((resolve, reject) => {
    const cleanup = () => signal.removeEventListener('abort', abort);
    const abort = () => { cleanup(); reject(signal.reason); };
    signal.addEventListener('abort', abort, { once: true });
    // The rejection handler also consumes a late rejection from a non-cooperative reader.
    Promise.resolve().then(() => {
      signal.throwIfAborted();
      return readData(path, signal);
    }).then((result) => { cleanup(); resolve(result); }, (error) => { cleanup(); reject(error); });
    if (signal.aborted) abort();
  });
}

/**
 * Offline capture boundary. There is deliberately no HTTP client, DNS, filesystem,
 * CONNECT tunnel, upgrade handler, redirect replay, or proxy forwarding fallback.
 * readData must itself bound file allocation and cooperate with its AbortSignal.
 * HTML/assets contain decoded bodies: content-encoding is NOT replayed. readData
 * returns raw wire bytes, so its content-encoding IS preserved. Framing/cookie/
 * redirect headers are never replayed; content-length is always recomputed.
 * Only root HTML accepts queries: postal=6 digits, debugMap=1, no duplicate or
 * unknown keys. Queries are not recorded; assets and data require query-free paths.
 * responseBytes counts reserved body bytes, even if a peer subsequently disconnects.
 * A receipt's sha256 is populated only on completed writes (HEAD hashes zero bytes).
 *
 * Returned interface: { origin, requests: Receipt[], stats, close(): Promise<void> }.
 * Receipts (at most maxRequests): id; startedAt/respondedAt/finishedAt (ISO or null);
 * event (request/connect/upgrade/client-error); method; path (query-free, <=512 chars);
 * pathTruncated; secFetchDest (<=64 chars); authority (sanitized host[:port], <=256
 * chars, including CONNECT); targetOrigin (absolute HTTP(S) origin,
 * <=256 chars, no credentials); targetAuthority (CONNECT host:port, <=256 chars);
 * status (null if no response started); sourceKind (html/asset/data/observed404/
 * uncaptured/blocked); disposition (served/observed404/uncaptured/blocked); reason;
 * isData; bodyBytes (reserved bytes); sha256 (completed body only); completed; aborted.
 * Canary matchers must use DISTINCT receipt ids: event=request + targetOrigin for
 * HTTP, event=connect + targetAuthority for HTTPS, plus status=403 and completed=true.
 * Stats: requestCount counts requests AND CONNECT/upgrade/parser-error events;
 * receiptsDropped counts overflow events; responseBytes/completedBodyBytes count
 * reserved/completed body bytes; dataReads/activeReads, activeResponses/activeSockets;
 * clientErrors/connectRequests/upgradeRequests, completedResponses/abortedResponses,
 * droppedConnections, startedAt/closedAt, closing/closed/closeReason.
 *
 * @param {{html: Buffer, htmlHeaders?: Record<string, string>,
 * assets?: Map<string, Asset>, observed404?: Set<string>,
 * readData: (path: string, signal: AbortSignal) => Promise<DataResponse>,
 * limits?: Partial<typeof DEFAULT_LIMITS>}} options
 */
export async function startBoundary({
  html, htmlHeaders = {}, assets = new Map(), observed404 = new Set(), readData, limits: overrides = {},
}) {
  const started = performance.now();
  const limits = checkedLimits(overrides);
  const deadline = started + limits.wallMs;
  if (!Buffer.isBuffer(html) || !(assets instanceof Map) || !(observed404 instanceof Set) ||
      typeof readData !== 'function') throw new TypeError('Invalid boundary inputs');
  const root = { bytes: Buffer.from(html), headers: safeHeaders(htmlHeaders) };
  const captured = new Map();
  for (const [path, asset] of assets) {
    if (!safePath(path) || path === '/' || !Buffer.isBuffer(asset?.bytes) ||
        !/^[a-f0-9]{64}$/i.test(asset.sha256) || hash(asset.bytes) !== asset.sha256.toLowerCase()) {
      throw new TypeError('Invalid captured asset path, bytes, or SHA-256');
    }
    captured.set(path, { bytes: Buffer.from(asset.bytes), headers: safeHeaders(asset.headers) });
  }
  const missing = new Set(observed404);
  for (const path of missing) {
    if (!safePath(path) || path === '/' || captured.has(path)) {
      throw new TypeError('Invalid or conflicting observed-404 path');
    }
  }

  const requests = [];
  const stats = {
    startedAt: now(), closedAt: null, closing: false, closed: false, closeReason: null,
    requestCount: 0, receiptsDropped: 0, clientErrors: 0, connectRequests: 0, upgradeRequests: 0,
    completedResponses: 0, abortedResponses: 0, responseBytes: 0, completedBodyBytes: 0,
    dataReads: 0, activeReads: 0, activeResponses: 0, activeSockets: 0, droppedConnections: 0,
  };
  const sockets = new Set();
  const socketClosures = new Set();
  const contexts = new Set();
  const tasks = new Set();
  const controllers = new Set();
  const server = createServer({ maxHeaderSize: 16 * 1024, insecureHTTPParser: false });
  let origin;
  let timer;
  let closePromise;

  function finish(context, completed, reason = null) {
    if (context.done) return;
    context.done = true;
    contexts.delete(context);
    stats.activeResponses = contexts.size;
    Object.assign(context.receipt, { finishedAt: now(), completed, aborted: !completed });
    if (reason) context.receipt.reason = reason;
    if (completed) {
      context.receipt.sha256 = context.bodyHash;
      stats.completedResponses += 1;
      stats.completedBodyBytes += context.receipt.bodyBytes;
    } else {
      stats.abortedResponses += 1;
      context.controller?.abort(new Error(reason || 'client-disconnected'));
    }
  }

  function shutdown(reason) {
    if (closePromise) return closePromise;
    stats.closing = true;
    stats.closeReason = reason;
    clearTimeout(timer);
    // Defer completion until the current request task has entered the tracked set.
    closePromise = Promise.resolve().then(async () => {
      await Promise.allSettled([...tasks]);
      await Promise.all([...socketClosures]);
      await serverClosed;
      stats.closed = true;
      stats.closedAt = now();
    });
    const serverClosed = new Promise((resolve) => server.close(resolve));
    for (const controller of controllers) controller.abort(new Error(reason));
    for (const context of contexts) finish(context, false, reason);
    for (const socket of sockets) socket.destroy();
    server.closeIdleConnections();
    server.closeAllConnections();
    return closePromise;
  }

  function withinDeadline() {
    if (stats.closing) return false;
    if (performance.now() >= deadline) {
      void shutdown('wall-limit');
      return false;
    }
    return true;
  }

  function admit(request, destination, event) {
    stats.requestCount += 1;
    if (event === 'client-error') stats.clientErrors += 1;
    if (event === 'connect') stats.connectRequests += 1;
    if (event === 'upgrade') stats.upgradeRequests += 1;
    if (requests.length >= limits.maxRequests) {
      stats.receiptsDropped += 1;
      void shutdown('request-limit');
      destination.destroy();
      return null;
    }
    const rawPath = targetPath(request?.url);
    const path = rawPath?.split(/[?#]/, 1)[0] ?? null;
    const receipt = {
      id: stats.requestCount, startedAt: now(), respondedAt: null, finishedAt: null, event,
      method: request?.method?.slice(0, 32) ?? null,
      path: path?.slice(0, MAX_RECEIPT_PATH) ?? null,
      pathTruncated: (path?.length ?? 0) > MAX_RECEIPT_PATH,
      secFetchDest: request?.headers['sec-fetch-dest']?.slice(0, 64) ?? null,
      ...targetIdentity(request, event),
      status: null, sourceKind: 'blocked', disposition: 'blocked', reason: null,
      isData: path !== null && dataPath(path), bodyBytes: 0, sha256: null,
      completed: false, aborted: false,
    };
    requests.push(receipt);
    const context = { receipt, destination, raw: event !== 'request', done: false, bodyHash: null };
    contexts.add(context);
    stats.activeResponses = contexts.size;
    destination.once('finish', () => finish(context, true));
    destination.once('close', () => finish(context, false, 'client-disconnected'));
    destination.once('error', () => finish(context, false, 'client-error'));
    if (!withinDeadline()) {
      finish(context, false, stats.closeReason);
      destination.destroy();
      return null;
    }
    return context;
  }

  function respond(context, status, bytes, headers, sourceKind, disposition, reason = null) {
    Object.assign(context.receipt, { sourceKind, disposition, reason });
    if (context.done || !withinDeadline()) return;
    if (context.receipt.isData && (sourceKind === 'data' || sourceKind === 'asset') &&
        bytes.length > limits.maxDataFileBytes) {
      void shutdown('data-file-limit');
      return;
    }
    const body = context.receipt.method === 'HEAD' ? EMPTY : bytes;
    if (body.length > limits.maxResponseBytes - stats.responseBytes) {
      void shutdown('response-byte-limit');
      return;
    }
    const bodyHash = hash(body);
    if (!withinDeadline()) return;
    const selected = {
      ...headers, 'content-length': String(bytes.length), 'cache-control': 'no-store',
      connection: 'close', 'x-capture-boundary': disposition, 'x-capture-source': sourceKind,
    };
    stats.responseBytes += body.length;
    context.bodyHash = bodyHash;
    Object.assign(context.receipt, { status, bodyBytes: body.length, respondedAt: now() });
    if (context.raw) {
      const lines = Object.entries(selected).map(([name, value]) => `${name}: ${value}`);
      context.destination.end(Buffer.concat([
        Buffer.from(`HTTP/1.1 ${status} Blocked\r\n${lines.join('\r\n')}\r\n\r\n`), body,
      ]));
    } else {
      context.destination.writeHead(status, selected);
      context.destination.end(body);
    }
  }

  function synthetic(context, status, kind, reason) {
    respond(context, status, Buffer.from(`capture-boundary:${kind}:${reason}\n`),
      { 'content-type': 'text/plain; charset=utf-8' }, kind, kind, reason);
  }

  async function handle(request, response) {
    const context = admit(request, response, 'request');
    if (!context) return;
    try {
      const parsed = requestPath(request, origin);
      if (parsed.reason) {
        synthetic(context, 403, 'blocked', parsed.reason);
        return;
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        synthetic(context, 405, 'blocked', 'method');
        return;
      }
      if (request.headers.expect || request.headers['transfer-encoding'] ||
          (request.headers['content-length'] && request.headers['content-length'] !== '0')) {
        synthetic(context, 403, 'blocked', 'request-body-or-expectation');
        return;
      }
      const { path } = parsed;
      if (path === '/' || captured.has(path)) {
        const value = path === '/' ? root : captured.get(path);
        respond(context, 200, value.bytes, value.headers, path === '/' ? 'html' : 'asset', 'served');
      } else if (missing.has(path)) {
        synthetic(context, 404, 'observed404', 'captured-missing');
      } else if (dataPath(path)) {
        context.receipt.sourceKind = 'data';
        const controller = new AbortController();
        context.controller = controller;
        controllers.add(controller);
        stats.dataReads += 1;
        stats.activeReads += 1;
        let result;
        try {
          result = await abortableRead(readData, path, controller.signal);
        } finally {
          controllers.delete(controller);
          stats.activeReads -= 1;
        }
        if (context.done || !withinDeadline()) return;
        if (!result || !Buffer.isBuffer(result.bytes) || !Number.isInteger(result.status) ||
            (result.status !== 200 && (result.status < 400 || result.status > 599))) {
          synthetic(context, 503, 'uncaptured', 'invalid-data-response');
          return;
        }
        if (result.bytes.length > limits.maxDataFileBytes) {
          void shutdown('data-file-limit');
          return;
        }
        respond(context, result.status, result.bytes, safeHeaders(result.headers, true), 'data',
          result.status === 200 ? 'served' : 'uncaptured',
          result.status === 200 ? null : `data-status-${result.status}`);
      } else if (path.startsWith(DATA_PREFIX)) {
        synthetic(context, 403, 'blocked', 'unsafe-data-path');
      } else {
        synthetic(context, 503, 'uncaptured', 'not-captured');
      }
    } catch {
      if (!context.done && withinDeadline()) synthetic(context, 503, 'uncaptured', 'data-read-failed');
    }
  }

  function dispatch(request, response) {
    const task = handle(request, response).finally(() => tasks.delete(task));
    tasks.add(task);
  }
  server.on('request', dispatch);
  server.on('checkContinue', dispatch);
  server.on('checkExpectation', dispatch);
  for (const event of ['connect', 'upgrade']) {
    server.on(event, (request, socket) => {
      const context = admit(request, socket, event);
      if (context) synthetic(context, 403, 'blocked', event);
    });
  }
  server.on('clientError', (_error, socket) => {
    const context = admit(null, socket, 'client-error');
    if (context) synthetic(context, 400, 'blocked', 'malformed-request');
  });
  server.on('connection', (socket) => {
    if (stats.closing) return socket.destroy();
    sockets.add(socket);
    stats.activeSockets = sockets.size;
    const closed = new Promise((resolve) => socket.once('close', () => {
      sockets.delete(socket);
      socketClosures.delete(closed);
      stats.activeSockets = sockets.size;
      resolve();
    }));
    socketClosures.add(closed);
    socket.on('error', () => {});
  });
  server.maxConnections = limits.maxRequests;
  server.on('drop', () => {
    stats.droppedConnections += 1;
    void shutdown('connection-limit');
  });
  server.on('error', () => { void shutdown('server-error'); });
  server.headersTimeout = Math.min(limits.wallMs, 10_000);
  server.requestTimeout = limits.wallMs;
  server.keepAliveTimeout = 1000;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  timer = setTimeout(() => { void shutdown('wall-limit'); }, Math.max(1, deadline - performance.now()));
  return { origin, requests, stats, close: () => shutdown('manual-close') };
}
