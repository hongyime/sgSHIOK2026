function reject(field, message, code = 'INVALID_PROJECTION_INPUT') {
  const error = new RangeError(`${field}: ${message}`);
  error.code = code;
  error.field = field;
  throw error;
}

function object(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    reject(field, 'expected an object');
  }
}

function nonnegative(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    reject(field, 'expected a finite nonnegative number');
  }
  return value;
}

function count(value, field, positive = false) {
  nonnegative(value, field);
  if (!Number.isSafeInteger(value) || (positive && value === 0)) {
    reject(field, `expected a ${positive ? 'positive' : 'nonnegative'} safe integer`);
  }
  return value;
}

function measured(value, field) {
  nonnegative(value, field);
  if (value === 0) reject(field, 'no positive measurement', 'INSUFFICIENT_PROJECTION_DATA');
  return value;
}

function summarize(samples, field) {
  if (!Array.isArray(samples)) reject(field, 'expected an array of per-record milliseconds');
  if (samples.length === 0) reject(field, 'no observations', 'INSUFFICIENT_PROJECTION_DATA');
  const values = Array.from(samples, (value, index) => nonnegative(value, `${field}[${index}]`));
  const sum = values.reduce((total, value) => total + value, 0);
  const meanMs = Number.isFinite(sum)
    ? sum / values.length
    : values.reduce((total, value) => total + value / values.length, 0);
  const sorted = values.sort((a, b) => a - b);
  const p95Ms = sorted[Math.ceil(sorted.length * 0.95) - 1];
  nonnegative(meanMs, `${field}.meanMs`);
  const msPerRecord = measured(Math.max(meanMs, p95Ms), field);
  return { count: sorted.length, meanMs, p95Ms, msPerRecord };
}

/**
 * @typedef {Object} ScanProjectionInput
 * @property {number} fixedMs Non-overlapping startup cost, added exactly once.
 * @property {number} recordCount Total planned records, not the pilot count.
 * @property {number[]} sampleNormalizationMs Individually timed records, excluding IO.
 * @property {number[]} sampleSerializationMs Individually timed records, excluding IO.
 * @property {{rawBytes:number, decodedBytes:number, reads:number, lookupCalls:number, timingsMs:{read:number, hash:number, decode:number, parse:number, lookup:number}}} io
 * @property {number} plannedRawBytes Expected physical bytes actually read, accounting for cache/eviction.
 * @property {number} plannedDecodedBytes Expected decoded bytes, including plain UTF-8 JSON.
 * @property {number} plannedLookupCalls Expected encoding probes, including cache checks, missing paths and metadata.
 * @property {number} [maxSeconds=900] Inclusive buffered wall-clock gate.
 */

/**
 * Pure estimate, not a deadline enforcer or a statistical confidence bound.
 * IO timings must be disjoint: decode includes decoded hashing/UTF-8, parse is JSON.parse only.
 * Caller must supply comparable pilot/plan workloads and account for cache hit patterns.
 * @param {ScanProjectionInput} input
 */
export function projectScan(input) {
  object(input, 'input');
  const fixedMs = nonnegative(input.fixedMs, 'fixedMs');
  const recordCount = count(input.recordCount, 'recordCount', true);
  const plannedRawBytes = count(input.plannedRawBytes, 'plannedRawBytes');
  const plannedDecodedBytes = count(input.plannedDecodedBytes, 'plannedDecodedBytes');
  const plannedLookupCalls = count(input.plannedLookupCalls, 'plannedLookupCalls');
  const maxSeconds = count(input.maxSeconds === undefined ? 900 : input.maxSeconds, 'maxSeconds', true);
  object(input.io, 'io');
  object(input.io.timingsMs, 'io.timingsMs');
  for (const field of ['rawBytes', 'decodedBytes', 'reads', 'lookupCalls']) {
    count(input.io[field], `io.${field}`);
    measured(input.io[field], `io.${field}`);
  }
  for (const field of ['read', 'hash', 'decode', 'parse', 'lookup']) {
    measured(input.io.timingsMs[field], `io.timingsMs.${field}`);
  }
  const samples = {
    normalization: summarize(input.sampleNormalizationMs, 'sampleNormalizationMs'),
    serialization: summarize(input.sampleSerializationMs, 'sampleSerializationMs'),
  };
  const { io } = input;
  const rates = {
    readMsPerRawByte: io.timingsMs.read / io.rawBytes,
    hashMsPerRawByte: io.timingsMs.hash / io.rawBytes,
    decodeMsPerDecodedByte: io.timingsMs.decode / io.decodedBytes,
    parseMsPerDecodedByte: io.timingsMs.parse / io.decodedBytes,
    lookupMsPerCall: io.timingsMs.lookup / io.lookupCalls,
  };
  for (const [field, value] of Object.entries(rates)) measured(value, `rates.${field}`);
  const components = {
    fixedMs,
    readMs: rates.readMsPerRawByte * plannedRawBytes,
    hashMs: rates.hashMsPerRawByte * plannedRawBytes,
    decodeMs: rates.decodeMsPerDecodedByte * plannedDecodedBytes,
    parseMs: rates.parseMsPerDecodedByte * plannedDecodedBytes,
    lookupMs: rates.lookupMsPerCall * plannedLookupCalls,
    normalizationMs: samples.normalization.msPerRecord * recordCount,
    serializationMs: samples.serialization.msPerRecord * recordCount,
  };
  for (const [field, value] of Object.entries(components)) nonnegative(value, `components.${field}`);
  const projectedMs = nonnegative(Object.values(components).reduce((sum, value) => sum + value, 0), 'projectedMs');
  const budgetSeconds = count(Math.ceil(projectedMs * 1.25 / 1000 + 30), 'budgetSeconds', true);
  return {
    estimateOnly: true,
    assumptions: 'Estimate, not a guarantee. Caller owns planned IO volumes/encoding probe counts, representative samples, and non-overlapping fixed/IO/record timings; cache and workload changes can invalidate it.',
    p95Method: 'nearest-rank',
    components,
    rates,
    samples,
    projectedMs,
    budgetSeconds,
    maxSeconds,
    gate: budgetSeconds <= maxSeconds ? 'pass' : 'stop',
  };
}
