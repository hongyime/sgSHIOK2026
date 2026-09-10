import { lstatSync, readlinkSync, realpathSync, statSync, openSync, fstatSync, readSync, closeSync } from 'node:fs';
import { resolve, relative, isAbsolute, join, dirname, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';

const ROOT = 'C:\\sgSHIOK2026';
const MiB = 1024 ** 2;
const GiB = 1024 ** 3;
const stop = (code, details = {}) => {
  throw Object.assign(new Error(`${code}: ${JSON.stringify(details)}`), { code, ...details });
};
const within = (root, path) => {
  const rel = relative(root, path);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
};

// Resolve each link before following it, including links whose targets are missing.
function confinedPath(root, parts) {
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    const info = lstatSync(current);
    if (info.isSymbolicLink()) {
      const target = resolve(dirname(current), readlinkSync(current));
      if (!within(root, target)) stop('STOP_PATH_ESCAPE');
      current = realpathSync(current);
      if (!within(root, current)) stop('STOP_PATH_ESCAPE');
    }
  }
  return current;
}

function validateLogicalPath(path) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\\')
    || /[\x00-\x1f\x7f:*?"<>|]/.test(path)
    || path.split('/').some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part)
      || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) stop('STOP_INVALID_PATH');
}

const fingerprint = info => [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs].join(':');

export function createJsonReader({ bundleRoot, checksums, maxRawBytes = 8 * MiB,
  maxDecodedBytes = 16 * MiB, maxTotalReadBytes = 24 * GiB, maxTotalDecodedBytes = 24 * GiB,
  maxRssBytes = 768 * MiB, deadline, cacheBytes = 24 * MiB } = {}) {
  if (process.cwd() !== ROOT) stop('STOP_WRONG_ROOT');
  if (typeof bundleRoot !== 'string' || !isAbsolute(bundleRoot) || !within(ROOT, resolve(bundleRoot))) stop('STOP_PATH_ESCAPE');
  if (!checksums || typeof checksums !== 'object' || Array.isArray(checksums)) stop('STOP_INVALID_CONFIG', { option: 'checksums' });
  for (const [option, value] of Object.entries({ maxRawBytes, maxDecodedBytes, maxTotalReadBytes, maxTotalDecodedBytes, maxRssBytes, cacheBytes })) {
    if (!Number.isSafeInteger(value) || value < (option === 'cacheBytes' ? 0 : 1)) stop('STOP_INVALID_CONFIG', { option });
  }
  if (!Number.isFinite(deadline)) stop('STOP_INVALID_CONFIG', { option: 'deadline' });
  const anchors = new Map(Object.entries(checksums));
  const cache = new Map(), files = new Map(), missingGzip = new Set(), missingLogical = new Set();
  let retainedBytes = 0;
  const stats = { reads: 0, lookupCalls: 0, logicalReads: 0, cacheHits: 0, rawBytes: 0, decodedBytes: 0,
    missingGzipLookups: 0, logicalMissing: 0, maxObservedRssBytes: 0,
    timingsMs: { lookup: 0, read: 0, hash: 0, decode: 0, parse: 0 } };
  function checkBudget() {
    const rssBytes = process.memoryUsage.rss();
    stats.maxObservedRssBytes = Math.max(stats.maxObservedRssBytes, rssBytes);
    if (Date.now() >= deadline) stop('STOP_DEADLINE', { deadline });
    if (rssBytes > maxRssBytes) stop('STOP_RSS_LIMIT', { rssBytes, limit: maxRssBytes });
    if (stats.rawBytes > maxTotalReadBytes) stop('STOP_TOTAL_READ_BYTES', { actual: stats.rawBytes, limit: maxTotalReadBytes });
    if (stats.decodedBytes > maxTotalDecodedBytes) stop('STOP_TOTAL_DECODED_BYTES', { actual: stats.decodedBytes, limit: maxTotalDecodedBytes });
    return { rssBytes, rawBytes: stats.rawBytes, decodedBytes: stats.decodedBytes };
  }
  function timed(name, fn) {
    const started = performance.now();
    try { return fn(); } finally { stats.timingsMs[name] += performance.now() - started; }
  }
  checkBudget();
  let root;
  try {
    const parts = relative(ROOT, resolve(bundleRoot)).split(sep).filter(Boolean);
    root = confinedPath(ROOT, parts);
    if (!statSync(root).isDirectory()) stop('STOP_INVALID_BUNDLE_ROOT');
  } catch (error) {
    if (error.code?.startsWith('STOP_')) throw error;
    stop('STOP_INPUT_IO', { operation: 'bundle-root', ioCode: error.code ?? 'unknown' });
  }

  function probe(physicalPath) {
    checkBudget();
    stats.lookupCalls++;
    return timed('lookup', () => {
      try {
        const absolute = confinedPath(root, physicalPath.split('/'));
        const info = statSync(absolute, { bigint: true });
        if (!info.isFile()) stop('STOP_NOT_FILE', { physicalPath });
        return { absolute, info };
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        if (error.code?.startsWith('STOP_')) throw error;
        stop('STOP_INPUT_IO', { physicalPath, ioCode: error.code ?? 'unknown' });
      }
    });
  }
  function evict(physicalPath) {
    const existing = cache.get(physicalPath);
    if (existing) { retainedBytes -= existing.result.decodedBytes; cache.delete(physicalPath); }
  }
  function getStats() {
    return { ...stats, timingsMs: { ...stats.timingsMs }, cacheEntries: cache.size,
      cacheBytes: retainedBytes, cacheAccounting: 'decoded-bytes-not-heap',
      missingGzipEncodings: [...missingGzip], logicalMissingPaths: [...missingLogical],
      files: Object.fromEntries([...files].map(([path, receipt]) => [path, { ...receipt }])) };
  }
  function select(logicalPath) {
    checkBudget();
    validateLogicalPath(logicalPath);
    let physicalPath = `${logicalPath}.gz`, selected = probe(physicalPath);
    if (!selected) {
      missingGzip.add(physicalPath); stats.missingGzipLookups++;
      physicalPath = logicalPath; selected = probe(physicalPath);
    }
    if (!selected) {
      missingLogical.add(logicalPath); stats.logicalMissing++;
      checkBudget();
      return null;
    }
    const anchor = anchors.get(physicalPath);
    if (typeof anchor !== 'string' || !/^[a-f0-9]{64}$/i.test(anchor)) stop('STOP_UNANCHORED_INPUT', { physicalPath });
    return { physicalPath, selected, expectedSha256: anchor.toLowerCase() };
  }
  // Metadata is not verification: only read() hashes the selected file's bytes.
  function inspect(logicalPath) {
    const choice = select(logicalPath);
    if (!choice) return { status: 'missing', value: null };
    const { physicalPath, selected, expectedSha256 } = choice;
    const plain = physicalPath === logicalPath ? selected : probe(logicalPath);
    const bytes = Number(selected.info.size), plainBytes = plain ? Number(plain.info.size) : null;
    if (!Number.isSafeInteger(bytes) || (plainBytes !== null && !Number.isSafeInteger(plainBytes))) {
      stop('STOP_INPUT_SIZE', { physicalPath });
    }
    checkBudget();
    return { status: 'present', physicalPath, bytes, plainBytes, expectedSha256 };
  }
  function read(logicalPath, { cache: useCache = true } = {}) {
    checkBudget();
    validateLogicalPath(logicalPath);
    stats.logicalReads++;
    const choice = select(logicalPath);
    if (!choice) return { status: 'missing', value: null };
    const { physicalPath, selected, expectedSha256: expected } = choice;
    const id = fingerprint(selected.info), cached = cache.get(physicalPath);
    if (cached && cached.fingerprint !== id) evict(physicalPath);
    if (useCache && cached?.fingerprint === id) {
      checkBudget();
      cache.delete(physicalPath); cache.set(physicalPath, cached);
      stats.cacheHits++;
      return cached.result;
    }

    const size = Number(selected.info.size);
    if (!Number.isSafeInteger(size) || size > maxRawBytes) stop('STOP_RAW_BYTES', { physicalPath, actual: size, limit: maxRawBytes });
    if (stats.rawBytes + size > maxTotalReadBytes) stop('STOP_TOTAL_READ_BYTES', { physicalPath, actual: stats.rawBytes + size, limit: maxTotalReadBytes });
    const prior = files.get(physicalPath);
    const receipt = { physicalPath, expectedSha256: expected, sha256: null, decodedSha256: null, verified: false,
      bytes: size, decodedBytes: null, readCount: (prior?.readCount ?? 0) + 1,
      mtimeNs: String(selected.info.mtimeNs) };
    let raw;
    try {
      raw = timed('read', () => {
        const fd = openSync(selected.absolute, 'r');
        try {
          if (!within(root, realpathSync(selected.absolute))) stop('STOP_PATH_ESCAPE');
          if (fingerprint(fstatSync(fd, { bigint: true })) !== id) stop('STOP_INPUT_CHANGED', { physicalPath });
          const buffer = Buffer.allocUnsafe(size);
          checkBudget();
          stats.reads++; files.set(physicalPath, receipt);
          let offset = 0;
          while (offset < size) {
            checkBudget();
            const count = readSync(fd, buffer, offset, Math.min(MiB, size - offset), offset);
            if (!count) stop('STOP_INPUT_CHANGED', { physicalPath });
            offset += count; stats.rawBytes += count;
            checkBudget();
          }
          if (fingerprint(fstatSync(fd, { bigint: true })) !== id) stop('STOP_INPUT_CHANGED', { physicalPath });
          return buffer;
        } finally { closeSync(fd); }
      });
    } catch (error) {
      if (error.code?.startsWith('STOP_')) throw error;
      stop('STOP_INPUT_IO', { physicalPath, ioCode: error.code ?? 'unknown' });
    }
    checkBudget();
    const actual = timed('hash', () => createHash('sha256').update(raw).digest('hex'));
    receipt.sha256 = actual;
    if (actual !== expected) stop('STOP_INPUT_MISMATCH', { physicalPath, expected, actual });
    receipt.verified = true;
    checkBudget();

    const remaining = maxTotalDecodedBytes - stats.decodedBytes;
    if (remaining <= 0) stop('STOP_TOTAL_DECODED_BYTES', { physicalPath, limit: maxTotalDecodedBytes });
    const decodedLimit = Math.min(maxDecodedBytes, remaining);
    let decoded;
    try {
      decoded = timed('decode', () => {
        if (!physicalPath.endsWith('.gz')) {
          if (raw.length > decodedLimit) {
            stop(remaining < maxDecodedBytes ? 'STOP_TOTAL_DECODED_BYTES' : 'STOP_DECODED_BYTES', { physicalPath, limit: decodedLimit });
          }
          return raw;
        }
        return gunzipSync(raw, { maxOutputLength: decodedLimit });
      });
    } catch (error) {
      if (error.code?.startsWith('STOP_')) throw error;
      if (error.code === 'ERR_BUFFER_TOO_LARGE') stop(remaining < maxDecodedBytes ? 'STOP_TOTAL_DECODED_BYTES' : 'STOP_DECODED_BYTES', { physicalPath, limit: decodedLimit });
      stop('STOP_DECODE_ERROR', { physicalPath, decodeCode: error.code ?? 'unknown' });
    }
    stats.decodedBytes += decoded.length; receipt.decodedBytes = decoded.length;
    checkBudget();
    let text, value;
    try {
      text = timed('decode', () => {
        receipt.decodedSha256 = createHash('sha256').update(decoded).digest('hex');
        return new TextDecoder('utf-8', { fatal: true }).decode(decoded);
      });
    } catch { stop('STOP_PARSE_ERROR', { physicalPath }); }
    checkBudget();
    try { value = timed('parse', () => JSON.parse(text)); }
    catch { stop('STOP_PARSE_ERROR', { physicalPath }); }
    checkBudget();
    const result = { status: 'present', value, physicalPath, sha256: actual,
      decodedSha256: receipt.decodedSha256, bytes: raw.length, decodedBytes: decoded.length };
    if (useCache && decoded.length <= cacheBytes) {
      evict(physicalPath);
      while (retainedBytes + decoded.length > cacheBytes) evict(cache.keys().next().value);
      cache.set(physicalPath, { fingerprint: id, result }); retainedBytes += decoded.length;
    }
    checkBudget();
    return result;
  }
  return { read, inspect, checkBudget, getStats };
}
