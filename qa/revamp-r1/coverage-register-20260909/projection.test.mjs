import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = 'C:\\sgSHIOK2026';
if (process.cwd() !== ROOT) throw new Error('Wrong working root');
const self = fileURLToPath(import.meta.url);
const directory = dirname(self);

if (process.argv[2] === '--capture') {
  const label = process.argv[3];
  if (!/^projection-test-[a-z0-9-]+$/.test(label ?? '')) throw new Error('Invalid receipt label');
  const outputDirectory = join(directory, label);
  mkdirSync(outputDirectory);
  const identities = () => Object.fromEntries(['projection.mjs', 'projection.test.mjs'].map((name) => {
    try {
      const bytes = readFileSync(join(directory, name));
      return [name, { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }];
    } catch (error) {
      if (error.code === 'ENOENT') return [name, { missing: true }];
      throw error;
    }
  }));
  const before = identities();
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const args = ['--test', self];
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT, windowsHide: true, encoding: 'utf8', timeout: 60_000, maxBuffer: 8 * 1024 ** 2,
  });
  const elapsedMs = performance.now() - started;
  const after = identities();
  const sourcesUnchanged = JSON.stringify(before) === JSON.stringify(after);
  const receipt = {
    command: [process.execPath, ...args], cwd: ROOT, node: process.version, startedAt, elapsedMs,
    before, after, sourcesUnchanged, exitCode: result.status, signal: result.signal,
    error: result.error?.message ?? null, stdout: result.stdout, stderr: result.stderr,
  };
  const receiptPath = join(outputDirectory, 'checks.json');
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  console.log(`RECEIPT=${receiptPath}`);
  console.log(`SOURCES_UNCHANGED=${sourcesUnchanged}`);
  process.exit(sourcesUnchanged && !result.error ? (result.status ?? 1) : 1);
}

const { projectScan } = await import('./projection.mjs');

function sample() {
  return {
    fixedMs: 1000,
    recordCount: 100,
    sampleNormalizationMs: [1, 2, 3, 4],
    sampleSerializationMs: [0.25, 0.5, 0.75, 1],
    io: {
      rawBytes: 1000, decodedBytes: 2000, reads: 10, lookupCalls: 20,
      timingsMs: { read: 10, hash: 20, decode: 30, parse: 40, lookup: 50 },
    },
    plannedRawBytes: 10_000,
    plannedDecodedBytes: 40_000,
    plannedLookupCalls: 200,
  };
}

function set(input, field, value) {
  const keys = field.split('.');
  const target = keys.slice(0, -1).reduce((object, key) => object[key], input);
  target[keys.at(-1)] = value;
  return input;
}

function rejects(input, code, field) {
  assert.throws(() => projectScan(input), (error) => {
    assert.equal(error.code, code);
    assert.equal(error.field, field);
    return true;
  });
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('separates fixed, byte, lookup, normalization and serialization arithmetic', () => {
  const result = projectScan(sample());
  assert.deepEqual(result.components, {
    fixedMs: 1000, readMs: 100, hashMs: 200, decodeMs: 600, parseMs: 800,
    lookupMs: 500, normalizationMs: 400, serializationMs: 100,
  });
  assert.deepEqual(result.rates, {
    readMsPerRawByte: 0.01, hashMsPerRawByte: 0.02, decodeMsPerDecodedByte: 0.015,
    parseMsPerDecodedByte: 0.02, lookupMsPerCall: 2.5,
  });
  assert.deepEqual(result.samples, {
    normalization: { count: 4, meanMs: 2.5, p95Ms: 4, msPerRecord: 4 },
    serialization: { count: 4, meanMs: 0.625, p95Ms: 1, msPerRecord: 1 },
  });
  assert.equal(result.projectedMs, 1000 + 100 + 200 + 600 + 800 + 500 + 400 + 100);
  assert.equal(result.budgetSeconds, Math.ceil(3700 * 1.25 / 1000 + 30));
  assert.equal(result.maxSeconds, 900);
  assert.equal(result.gate, 'pass');
});

test('explicitly labels estimate limits and caller-owned planned IO assumptions', () => {
  const result = projectScan(sample());
  assert.equal(result.estimateOnly, true);
  assert.equal(result.p95Method, 'nearest-rank');
  assert.match(result.assumptions, /caller/i);
  assert.match(result.assumptions, /planned IO/i);
  assert.match(result.assumptions, /not a guarantee/i);
});

test('nearest-rank p95 uses the 19th of 20 observations, not the maximum', () => {
  const input = sample();
  input.sampleNormalizationMs = Array.from({ length: 20 }, (_, index) => 20 - index);
  assert.deepEqual(projectScan(input).samples.normalization, {
    count: 20, meanMs: 10.5, p95Ms: 19, msPerRecord: 19,
  });
});

test('rare outlier makes mean more conservative than p95 in both sample streams', () => {
  const input = sample();
  input.sampleNormalizationMs = [...Array(99).fill(0), 1000];
  input.sampleSerializationMs = [2000, ...Array(99).fill(0)];
  const result = projectScan(input);
  assert.deepEqual(result.samples.normalization, { count: 100, meanMs: 10, p95Ms: 0, msPerRecord: 10 });
  assert.deepEqual(result.samples.serialization, { count: 100, meanMs: 20, p95Ms: 0, msPerRecord: 20 });
  assert.equal(result.components.normalizationMs, 1000);
  assert.equal(result.components.serializationMs, 2000);
});

test('single positive observation is usable without claiming statistical confidence', () => {
  const input = sample();
  input.sampleNormalizationMs = [2];
  input.sampleSerializationMs = [3];
  const result = projectScan(input);
  assert.deepEqual(result.samples.normalization, { count: 1, meanMs: 2, p95Ms: 2, msPerRecord: 2 });
  assert.equal(result.estimateOnly, true);
});

test('frozen inputs remain unchanged and sample order does not change estimates', () => {
  const input = sample();
  input.sampleNormalizationMs.reverse();
  input.sampleSerializationMs.reverse();
  freeze(input);
  const before = JSON.stringify(input);
  assert.deepEqual(projectScan(input), projectScan(sample()));
  assert.equal(JSON.stringify(input), before);
});

test('fixed startup is added once even when record count increases one thousand fold', () => {
  const input = sample();
  const before = projectScan(input);
  input.recordCount *= 1000;
  const after = projectScan(input);
  for (const field of ['fixedMs', 'readMs', 'hashMs', 'decodeMs', 'parseMs', 'lookupMs']) {
    assert.equal(after.components[field], before.components[field]);
  }
  assert.equal(after.components.normalizationMs, before.components.normalizationMs * 1000);
  assert.equal(after.components.serializationMs, before.components.serializationMs * 1000);
});

for (const [planned, affected] of [
  ['plannedRawBytes', ['readMs', 'hashMs']],
  ['plannedDecodedBytes', ['decodeMs', 'parseMs']],
  ['plannedLookupCalls', ['lookupMs']],
]) {
  test(`${planned} scales only its corresponding IO components`, () => {
    const input = sample();
    const before = projectScan(input);
    input[planned] *= 3;
    const after = projectScan(input);
    for (const field of Object.keys(before.components)) {
      assert.equal(after.components[field], before.components[field] * (affected.includes(field) ? 3 : 1));
    }
  });
}

test('plain UTF-8 decode cost is retained without a gzip flag', () => {
  const input = sample();
  input.io.decodedBytes = input.io.rawBytes;
  input.plannedDecodedBytes = input.plannedRawBytes;
  const result = projectScan(input);
  assert.equal(result.components.decodeMs, 300);
  assert.equal(result.components.parseMs, 400);
});

test('zero fixed cost and no planned IO are valid for already in-memory planned work', () => {
  const input = sample();
  input.fixedMs = 0;
  input.plannedRawBytes = input.plannedDecodedBytes = input.plannedLookupCalls = 0;
  const result = projectScan(input);
  assert.equal(result.projectedMs, 400 + 100);
  assert.equal(result.budgetSeconds, 31);
});

test('exact inclusive buffered gate boundary passes, the next millisecond stops', () => {
  const input = sample();
  input.fixedMs = 693300;
  const at = projectScan(input);
  assert.equal(at.projectedMs, 696000);
  assert.equal(at.budgetSeconds, 900);
  assert.equal(at.gate, 'pass');
  input.fixedMs += 1;
  const over = projectScan(input);
  assert.equal(over.budgetSeconds, 901);
  assert.equal(over.gate, 'stop');
});

test('unbuffered estimate fitting maxSeconds does not override a failed buffered gate', () => {
  const input = sample();
  input.fixedMs = 750000;
  const result = projectScan(input);
  assert.ok(result.projectedMs / 1000 < 900);
  assert.ok(result.budgetSeconds > 900);
  assert.equal(result.gate, 'stop');
});

test('explicit caller budget changes only the gate and limit', () => {
  const input = sample();
  input.maxSeconds = 34;
  const result = projectScan(input);
  assert.equal(result.projectedMs, 3700);
  assert.equal(result.budgetSeconds, 35);
  assert.equal(result.maxSeconds, 34);
  assert.equal(result.gate, 'stop');
});

for (const value of [undefined, null, [], 1]) {
  test(`invalid root input ${String(value)} is rejected`, () => {
    rejects(value, 'INVALID_PROJECTION_INPUT', 'input');
  });
}

for (const field of ['io', 'io.timingsMs']) {
  test(`missing ${field} is rejected instead of zero cost`, () => {
    rejects(set(sample(), field, undefined), 'INVALID_PROJECTION_INPUT', field);
  });
}

for (const field of ['fixedMs', 'recordCount', 'plannedRawBytes', 'plannedDecodedBytes', 'plannedLookupCalls', 'maxSeconds']) {
  test(`invalid finite/count values for ${field} are rejected without coercion`, () => {
    for (const value of [NaN, Infinity, -Infinity, -1, null, '10']) {
      rejects(set(sample(), field, value), 'INVALID_PROJECTION_INPUT', field);
    }
    if (field !== 'fixedMs') {
      for (const value of [1.5, Number.MAX_SAFE_INTEGER + 1]) {
        rejects(set(sample(), field, value), 'INVALID_PROJECTION_INPUT', field);
      }
    }
  });
}

for (const field of ['recordCount', 'maxSeconds']) {
  test(`${field} must be positive`, () => {
    rejects(set(sample(), field, 0), 'INVALID_PROJECTION_INPUT', field);
  });
}

for (const field of ['io.rawBytes', 'io.decodedBytes', 'io.reads', 'io.lookupCalls']) {
  test(`${field} is a required positive integer denominator`, () => {
    for (const value of [undefined, null, NaN, Infinity, -1, 1.5, '10', Number.MAX_SAFE_INTEGER + 1]) {
      rejects(set(sample(), field, value), 'INVALID_PROJECTION_INPUT', field);
    }
    rejects(set(sample(), field, 0), 'INSUFFICIENT_PROJECTION_DATA', field);
  });
}

for (const name of ['read', 'hash', 'decode', 'parse', 'lookup']) {
  const field = `io.timingsMs.${name}`;
  test(`${field} must include positive measured time, including decode for plain JSON`, () => {
    for (const value of [undefined, null, NaN, Infinity, -1, '10']) {
      rejects(set(sample(), field, value), 'INVALID_PROJECTION_INPUT', field);
    }
    rejects(set(sample(), field, 0), 'INSUFFICIENT_PROJECTION_DATA', field);
  });
}

for (const field of ['sampleNormalizationMs', 'sampleSerializationMs']) {
  test(`${field} rejects missing, empty, sparse, non-finite and unmeasurable samples`, () => {
    for (const value of [undefined, null, {}, '1']) {
      rejects(set(sample(), field, value), 'INVALID_PROJECTION_INPUT', field);
    }
    rejects(set(sample(), field, []), 'INSUFFICIENT_PROJECTION_DATA', field);
    rejects(set(sample(), field, [0, 0]), 'INSUFFICIENT_PROJECTION_DATA', field);
    for (const value of [[-1], [NaN], [Infinity], ['1'], [null], Array(1)]) {
      rejects(set(sample(), field, value), 'INVALID_PROJECTION_INPUT', `${field}[0]`);
    }
  });
}

test('rate overflow cannot produce a finite-looking gate', () => {
  const input = sample();
  input.io.timingsMs.read = Number.MAX_VALUE;
  input.io.rawBytes = 1;
  rejects(input, 'INVALID_PROJECTION_INPUT', 'components.readMs');
});

test('component sum overflow is rejected explicitly', () => {
  const input = sample();
  input.fixedMs = Number.MAX_VALUE;
  input.recordCount = 1;
  input.sampleNormalizationMs = [Number.MAX_VALUE];
  rejects(input, 'INVALID_PROJECTION_INPUT', 'projectedMs');
});

test('buffer overflow and unsafe integer budgets are rejected', () => {
  const input = sample();
  input.fixedMs = Number.MAX_VALUE;
  rejects(input, 'INVALID_PROJECTION_INPUT', 'budgetSeconds');
  input.fixedMs = Number.MAX_SAFE_INTEGER * 1000;
  rejects(input, 'INVALID_PROJECTION_INPUT', 'budgetSeconds');
});

test('lookup projection uses encoding probes including cache/misses, not physical reads', () => {
  const input = sample();
  const before = projectScan(input);
  input.io.reads = 1;
  const after = projectScan(input);
  assert.equal(after.rates.lookupMsPerCall, 50 / 20);
  assert.equal(after.components.lookupMs, before.components.lookupMs);
  assert.equal(after.projectedMs, before.projectedMs);
  input.io.lookupCalls *= 2;
  assert.equal(projectScan(input).components.lookupMs, before.components.lookupMs / 2);
});

test('old plannedReads or missing lookupCalls cannot silently reuse mismatched units', () => {
  const input = sample();
  input.plannedReads = 200;
  delete input.plannedLookupCalls;
  rejects(input, 'INVALID_PROJECTION_INPUT', 'plannedLookupCalls');
  const missing = sample();
  delete missing.io.lookupCalls;
  rejects(missing, 'INVALID_PROJECTION_INPUT', 'io.lookupCalls');
});
