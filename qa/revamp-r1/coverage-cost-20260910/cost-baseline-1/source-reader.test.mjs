import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, statSync, symlinkSync, utimesSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { createJsonReader } from './reader.mjs';

const ROOT = 'C:\\sgSHIOK2026';
if (process.cwd() !== ROOT) throw Error('Wrong working root');
const self = fileURLToPath(import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv[2] === '--capture') {
  const label = process.argv[3];
  if (process.argv.length !== 4 || !/^io-test-\d+$/.test(label ?? '')) throw Error('Fresh io-test-N label required');
  const out = join(dirname(self), label);
  mkdirSync(out);
  const identities = () => ['reader.mjs', 'reader.test.mjs'].map(path => ({ path, sha256: sha(readFileSync(join(dirname(self), path))) }));
  const before = identities(), args = ['--test', self], started = Date.now();
  const result = spawnSync(process.execPath, args, { cwd: ROOT, windowsHide: true, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 });
  const after = identities();
  const report = { command: process.execPath, args, cwd: ROOT, exitCode: result.status,
    stdout: result.stdout, stderr: result.stderr, error: result.error?.message,
    elapsedMs: Date.now() - started, before, after, identitiesStable: JSON.stringify(before) === JSON.stringify(after) };
  writeFileSync(join(out, 'checks.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  process.stdout.write(JSON.stringify({ out, ...report }) + '\n');
  process.exit(result.status === 0 && report.identitiesStable ? 0 : 1);
}

function fixture(entries = {}) {
  mkdirSync(join(ROOT, 'tmp'), { recursive: true });
  const root = mkdtempSync(join(ROOT, 'tmp', 'coverage-reader-'));
  const bundleRoot = join(root, 'bundle');
  mkdirSync(bundleRoot);
  const checksums = {};
  for (const [path, content] of Object.entries(entries)) {
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(JSON.stringify(content));
    mkdirSync(dirname(join(bundleRoot, path)), { recursive: true });
    writeFileSync(join(bundleRoot, path), bytes, { flag: 'wx' });
    checksums[path] = sha(bytes);
  }
  return { root, bundleRoot, checksums,
    reader: (options = {}) => createJsonReader({ bundleRoot, checksums, deadline: Date.now() + 300_000, ...options }) };
}
function stopped(code, fn, details = {}) {
  assert.throws(fn, error => {
    assert.equal(error.code, code);
    for (const [key, expected] of Object.entries(details)) assert.deepEqual(error[key], expected);
    return true;
  });
}

test('plain fallback is anchored and separates missing gzip from missing logical JSON', () => {
  const f = fixture({ 'scores/a.json': [{ postal: '018956' }] }), r = f.reader();
  const result = r.read('scores/a.json');
  assert.deepEqual(result, { status: 'present', value: [{ postal: '018956' }], physicalPath: 'scores/a.json',
    sha256: f.checksums['scores/a.json'], decodedSha256: f.checksums['scores/a.json'], bytes: 21, decodedBytes: 21 });
  assert.deepEqual(r.read('scores/missing.json'), { status: 'missing', value: null });
  const stats = r.getStats();
  assert.deepEqual(stats.missingGzipEncodings, ['scores/a.json.gz', 'scores/missing.json.gz']);
  assert.deepEqual(stats.logicalMissingPaths, ['scores/missing.json']);
  assert.equal(stats.logicalMissing, 1); assert.equal(stats.reads, 1);
});

test('valid gzip is preferred over different plain content and hashes the physical compressed bytes', () => {
  const bytes = Buffer.from('{"chosen":"gzip"}');
  const gz = gzipSync(bytes), f = fixture({ 'a.json.gz': gz, 'a.json': { chosen: 'plain' } }), r = f.reader();
  const result = r.read('a.json');
  assert.deepEqual(result.value, { chosen: 'gzip' });
  assert.equal(result.physicalPath, 'a.json.gz'); assert.equal(result.sha256, sha(gz));
  assert.equal(result.bytes, gz.length); assert.equal(result.decodedBytes, bytes.length);
  assert.deepEqual(Object.keys(r.getStats().files), ['a.json.gz']);
});

test('corrupt gzip stops without consulting valid plain JSON', () => {
  const f = fixture({ 'a.json.gz': Buffer.from('broken gzip'), 'a.json': { ok: true } }), r = f.reader();
  stopped('STOP_DECODE_ERROR', () => r.read('a.json'));
  assert.equal(r.getStats().reads, 1); assert.equal(r.getStats().files['a.json.gz'].verified, true);
  assert.equal(r.getStats().files['a.json'], undefined);
});

test('a gzip candidate which is a directory is not ENOENT and cannot permit fallback', () => {
  const f = fixture({ 'a.json': { ok: true } }), r = f.reader();
  mkdirSync(join(f.bundleRoot, 'a.json.gz'));
  stopped('STOP_NOT_FILE', () => r.read('a.json'));
  assert.equal(r.getStats().reads, 0);
});

test('hash mismatch reports expected/actual before decode or JSON parse', () => {
  const bytes = Buffer.from('not JSON'), f = fixture({ 'a.json': bytes });
  const r = f.reader({ checksums: { 'a.json': '0'.repeat(64) } });
  stopped('STOP_INPUT_MISMATCH', () => r.read('a.json'), { expected: '0'.repeat(64), actual: sha(bytes), physicalPath: 'a.json' });
  const stats = r.getStats();
  assert.equal(stats.timingsMs.decode, 0); assert.equal(stats.timingsMs.parse, 0);
  assert.equal(stats.files['a.json'].verified, false); assert.equal(stats.files['a.json'].sha256, sha(bytes));
});

test('an unanchored compressed candidate blocks anchored plain fallback before reading', () => {
  const f = fixture({ 'a.json.gz': gzipSync('{}'), 'a.json': {} });
  const r = f.reader({ checksums: { 'a.json': f.checksums['a.json'] } });
  stopped('STOP_UNANCHORED_INPUT', () => r.read('a.json'), { physicalPath: 'a.json.gz' });
  assert.equal(r.getStats().reads, 0);
});

for (const anchor of [undefined, 'not-a-hash', 'f'.repeat(63)]) {
  test(`plain input with ${String(anchor)} anchor is not treated as verified`, () => {
    const f = fixture({ 'a.json': {} }), r = f.reader({ checksums: { 'a.json': anchor } });
    stopped('STOP_UNANCHORED_INPUT', () => r.read('a.json'));
    assert.equal(r.getStats().reads, 0);
  });
}

test('raw file cap stops before reading bytes', () => {
  const r = fixture({ 'a.json': { text: 'large' } }).reader({ maxRawBytes: 4 });
  stopped('STOP_RAW_BYTES', () => r.read('a.json'));
  assert.equal(r.getStats().rawBytes, 0);
});

for (const gzip of [false, true]) {
  test(`per-file decoded cap bounds ${gzip ? 'gzip expansion' : 'plain input'}`, () => {
    const bytes = Buffer.from(JSON.stringify({ text: 'x'.repeat(65_536) }));
    const r = fixture({ [gzip ? 'a.json.gz' : 'a.json']: gzip ? gzipSync(bytes) : bytes }).reader({ maxDecodedBytes: 1024 });
    stopped('STOP_DECODED_BYTES', () => r.read('a.json'));
    assert.equal(r.getStats().timingsMs.parse, 0);
  });
}

test('cumulative raw cap includes repeated uncached reads', () => {
  const f = fixture({ 'a.json': { x: 1 } }), size = 7, r = f.reader({ maxTotalReadBytes: size * 2 });
  r.read('a.json', { cache: false }); r.read('a.json', { cache: false });
  stopped('STOP_TOTAL_READ_BYTES', () => r.read('a.json', { cache: false }));
  assert.equal(r.getStats().rawBytes, 14); assert.equal(r.getStats().reads, 2);
  assert.equal(r.getStats().files['a.json'].readCount, 2); assert.equal(r.getStats().cacheEntries, 0);
});

for (const gzip of [false, true]) {
  test(`cumulative decoded cap bounds the remaining ${gzip ? 'gzip' : 'plain'} output`, () => {
    const content = Buffer.from('{"x":1}');
    const f = fixture({ [gzip ? 'a.json.gz' : 'a.json']: gzip ? gzipSync(content) : content });
    const r = f.reader({ maxTotalDecodedBytes: 10 });
    r.read('a.json', { cache: false });
    stopped('STOP_TOTAL_DECODED_BYTES', () => r.read('a.json', { cache: false }));
    assert.equal(r.getStats().decodedBytes, 7);
  });
}

test('expired deadline stops before file reads', () => {
  const f = fixture({ 'a.json': {} });
  stopped('STOP_DEADLINE', () => f.reader({ deadline: Date.now() - 1 }));
});

test('checkBudget enforces the live deadline after reader creation', t => {
  const deadline = Date.now() + 300_000, r = fixture({ 'a.json': {} }).reader({ deadline });
  t.mock.method(Date, 'now', () => deadline);
  stopped('STOP_DEADLINE', () => r.checkBudget());
  stopped('STOP_DEADLINE', () => r.read('a.json'));
  assert.equal(r.getStats().reads, 0);
});

test('RSS cap measures the actual Node process rather than estimating file size', () => {
  stopped('STOP_RSS_LIMIT', () => fixture().reader({ maxRssBytes: 1 }));
  const r = fixture().reader(), budget = r.checkBudget();
  assert.ok(budget.rssBytes > 0); assert.ok(r.getStats().maxObservedRssBytes >= budget.rssBytes);
});

for (const path of ['../a.json', 'nested/../../a.json', '/a.json', 'C:/a.json', 'nested\\a.json',
  './a.json', 'nested//a.json', 'a.json:stream', 'nested./a.json', 'nul.json', 'a\0.json']) {
  test(`rejects unsafe logical path ${JSON.stringify(path)}`, () => {
    const r = fixture({ 'a.json': {} }).reader();
    stopped('STOP_INVALID_PATH', () => r.read(path)); assert.equal(r.getStats().reads, 0);
  });
}

test('bundle root outside the C repository is rejected before lookup', () => {
  stopped('STOP_PATH_ESCAPE', () => createJsonReader({ bundleRoot: 'C:\\Windows', checksums: {}, deadline: Date.now() + 1000 }));
});

test('junction escape to a sibling fixture is rejected with no input read', () => {
  const f = fixture(), sibling = join(f.root, 'sibling'); mkdirSync(sibling);
  writeFileSync(join(sibling, 'a.json'), '{}', { flag: 'wx' });
  symlinkSync(sibling, join(f.bundleRoot, 'escape'), 'junction');
  const r = f.reader({ checksums: { 'escape/a.json': sha('{}') } });
  stopped('STOP_PATH_ESCAPE', () => r.read('escape/a.json')); assert.equal(r.getStats().reads, 0);
});

test('internal junction is permitted but still needs an anchor for its physical relative name', () => {
  const f = fixture({ 'inside/a.json': { x: 1 } });
  symlinkSync(join(f.bundleRoot, 'inside'), join(f.bundleRoot, 'alias'), 'junction');
  const r = f.reader({ checksums: { 'alias/a.json': f.checksums['inside/a.json'] } });
  assert.equal(r.read('alias/a.json').physicalPath, 'alias/a.json');
});

test('decoded-byte LRU evicts the least recently used parsed entry', () => {
  const f = fixture({ 'a.json': { x: 1 }, 'b.json': { x: 2 }, 'c.json': { x: 3 } }), r = f.reader({ cacheBytes: 14 });
  const first = r.read('a.json'); r.read('b.json');
  assert.equal(r.read('a.json').value, first.value);
  r.read('c.json'); r.read('b.json');
  const stats = r.getStats();
  assert.equal(stats.reads, 4); assert.equal(stats.cacheHits, 1); assert.equal(stats.cacheEntries, 2);
  assert.equal(stats.cacheBytes, 14); assert.equal(stats.cacheAccounting, 'decoded-bytes-not-heap');
  assert.equal(stats.files['b.json'].readCount, 2);
});

test('an entry larger than the cache budget is never retained', () => {
  const r = fixture({ 'a.json': { x: 1 } }).reader({ cacheBytes: 6 });
  r.read('a.json'); r.read('a.json');
  assert.equal(r.getStats().cacheEntries, 0); assert.equal(r.getStats().reads, 2);
});

test('cache hits do not consume raw/decoded cumulative budgets again', () => {
  const r = fixture({ 'a.json': { x: 1 } }).reader({ maxTotalReadBytes: 7, maxTotalDecodedBytes: 7 });
  r.read('a.json'); r.read('a.json');
  assert.equal(r.getStats().cacheHits, 1); assert.equal(r.getStats().rawBytes, 7); assert.equal(r.getStats().decodedBytes, 7);
});

test('same-size content change invalidates cache and is rehashed against the original anchor', () => {
  const f = fixture({ 'a.json': { x: 1 } }), r = f.reader(); r.read('a.json');
  writeFileSync(join(f.bundleRoot, 'a.json'), '{"x":2}');
  const later = new Date(Date.now() + 2000); utimesSync(join(f.bundleRoot, 'a.json'), later, later);
  stopped('STOP_INPUT_MISMATCH', () => r.read('a.json'), { expected: f.checksums['a.json'], actual: sha('{"x":2}') });
  assert.equal(r.getStats().cacheHits, 0); assert.equal(r.getStats().reads, 2);
});

test('a newly appearing gzip cannot be hidden by a cached plain response', () => {
  const f = fixture({ 'a.json': { x: 1 } }), r = f.reader(); r.read('a.json');
  writeFileSync(join(f.bundleRoot, 'a.json.gz'), gzipSync('{"x":2}'), { flag: 'wx' });
  stopped('STOP_UNANCHORED_INPUT', () => r.read('a.json'), { physicalPath: 'a.json.gz' });
});

test('verified malformed JSON and malformed UTF-8 stop without caching', () => {
  for (const bytes of [Buffer.from('{invalid'), Buffer.from([0x22, 0xff, 0x22])]) {
    const r = fixture({ 'a.json': bytes }).reader();
    stopped('STOP_PARSE_ERROR', () => r.read('a.json'));
    assert.equal(r.getStats().files['a.json'].verified, true); assert.equal(r.getStats().cacheEntries, 0);
  }
});

test('input fixture hashes and modification times remain unchanged; stats are detached', () => {
  const f = fixture({ 'a.json.gz': gzipSync('{"x":1}'), 'b.json': { x: 2 } }), r = f.reader();
  const identities = () => Object.keys(f.checksums).map(path => ({ path, sha256: sha(readFileSync(join(f.bundleRoot, path))),
    mtime: String(statSync(join(f.bundleRoot, path), { bigint: true }).mtimeNs) }));
  const before = identities(); r.read('a.json'); r.read('b.json'); r.read('a.json');
  assert.deepEqual(identities(), before);
  const stats = r.getStats();
  for (const name of ['lookup', 'read', 'hash', 'decode', 'parse']) assert.ok(Number.isFinite(stats.timingsMs[name]) && stats.timingsMs[name] >= 0);
  stats.files['a.json.gz'].readCount = 900; stats.timingsMs.read = -1;
  assert.equal(r.getStats().files['a.json.gz'].readCount, 1); assert.ok(r.getStats().timingsMs.read >= 0);
});

test('inspect chooses gzip metadata with optional plain size but reads and hashes neither file', () => {
  const gz = gzipSync('{"chosen":"compressed"}');
  const f = fixture({ 'a.json.gz': gz, 'a.json': Buffer.from('not even JSON') });
  const expected = '0'.repeat(64), r = f.reader({ checksums: { 'a.json.gz': expected } });
  assert.deepEqual(r.inspect('a.json'), {
    status: 'present', physicalPath: 'a.json.gz', bytes: gz.length,
    plainBytes: Buffer.byteLength('not even JSON'), expectedSha256: expected,
  });
  const stats = r.getStats();
  assert.equal(stats.reads, 0); assert.equal(stats.rawBytes, 0); assert.equal(stats.decodedBytes, 0);
  assert.equal(stats.lookupCalls, 2); assert.equal(stats.cacheEntries, 0);
  assert.deepEqual(stats.files, {});
  for (const field of ['read', 'hash', 'decode', 'parse']) assert.equal(stats.timingsMs[field], 0);
  stopped('STOP_INPUT_MISMATCH', () => r.read('a.json'), { expected, actual: sha(gz) });
});

test('inspect permits anchored gzip with absent plain sibling', () => {
  const gz = gzipSync('{"x":1}'), f = fixture({ 'a.json.gz': gz }), r = f.reader();
  assert.deepEqual(r.inspect('a.json'), {
    status: 'present', physicalPath: 'a.json.gz', bytes: gz.length, plainBytes: null,
    expectedSha256: sha(gz),
  });
  assert.equal(r.getStats().lookupCalls, 2);
  assert.equal(r.getStats().logicalMissing, 0);
  assert.deepEqual(r.getStats().missingGzipEncodings, []);
  assert.deepEqual(r.read('a.json').value, { x: 1 });
});

test('inspect plain fallback and logical miss account for both encoding probes', () => {
  const f = fixture({ 'a.json': { x: 1 } }), r = f.reader();
  assert.deepEqual(r.inspect('a.json'), {
    status: 'present', physicalPath: 'a.json', bytes: 7, plainBytes: 7,
    expectedSha256: f.checksums['a.json'],
  });
  assert.deepEqual(r.inspect('absent.json'), { status: 'missing', value: null });
  const stats = r.getStats();
  assert.equal(stats.lookupCalls, 4); assert.equal(stats.missingGzipLookups, 2);
  assert.equal(stats.logicalMissing, 1); assert.equal(stats.reads, 0);
});

test('lookupCalls includes physical misses, cache hits and metadata, not just physical reads', () => {
  const r = fixture({ 'a.json': { x: 1 }, 'b.json.gz': gzipSync('{"x":2}') }).reader();
  r.read('a.json'); // Two probes, one physical read.
  r.read('a.json'); // Two probes, cache hit.
  r.read('b.json'); // One probe, one physical read.
  r.read('b.json'); // One probe, cache hit.
  r.read('missing.json'); // Two absent probes.
  r.inspect('b.json'); // Selected gzip and absent plain metadata probe.
  const stats = r.getStats();
  assert.equal(stats.lookupCalls, 2 + 2 + 1 + 1 + 2 + 2);
  assert.equal(stats.reads, 2); assert.equal(stats.cacheHits, 2);
  assert.equal(stats.missingGzipLookups, 3); assert.equal(stats.logicalMissing, 1);
  stats.lookupCalls = 99;
  assert.equal(r.getStats().lookupCalls, 10);
});

test('inspect checks the selected anchor and never falls back from an unanchored gzip', () => {
  const f = fixture({ 'a.json.gz': gzipSync('{}'), 'a.json': {} });
  const r = f.reader({ checksums: { 'a.json': f.checksums['a.json'] } });
  stopped('STOP_UNANCHORED_INPUT', () => r.inspect('a.json'), { physicalPath: 'a.json.gz' });
  assert.equal(r.getStats().lookupCalls, 1); assert.equal(r.getStats().reads, 0);
  const plain = fixture({ 'b.json': {} }).reader({ checksums: {} });
  stopped('STOP_UNANCHORED_INPUT', () => plain.inspect('b.json'), { physicalPath: 'b.json' });
});

test('metadata-only inspection does not promise gzip validity or enforce a byte-read cap', () => {
  const bytes = Buffer.from('not gzip'), f = fixture({ 'a.json.gz': bytes }), r = f.reader({ maxRawBytes: 1 });
  assert.equal(r.inspect('a.json').bytes, bytes.length);
  assert.equal(r.getStats().reads, 0);
  stopped('STOP_RAW_BYTES', () => r.read('a.json'));
});

test('metadata selection stops on non-ENOENT gzip failure instead of plain fallback', () => {
  const f = fixture({ 'a.json': {} }), r = f.reader();
  mkdirSync(join(f.bundleRoot, 'a.json.gz'));
  stopped('STOP_NOT_FILE', () => r.inspect('a.json'));
  assert.equal(r.getStats().lookupCalls, 1); assert.equal(r.getStats().reads, 0);
});

test('inspect rejects traversal and junction escape without input reads', () => {
  const f = fixture(), sibling = join(f.root, 'sibling'); mkdirSync(sibling);
  writeFileSync(join(sibling, 'a.json'), '{}', { flag: 'wx' });
  symlinkSync(sibling, join(f.bundleRoot, 'escape'), 'junction');
  const r = f.reader({ checksums: { 'escape/a.json': sha('{}') } });
  stopped('STOP_INVALID_PATH', () => r.inspect('../a.json'));
  assert.equal(r.getStats().lookupCalls, 0);
  stopped('STOP_PATH_ESCAPE', () => r.inspect('escape/a.json'));
  assert.equal(r.getStats().lookupCalls, 1); assert.equal(r.getStats().reads, 0);
});

test('internal junction metadata still uses the requested relative physical anchor', () => {
  const f = fixture({ 'inside/a.json': { x: 1 } });
  symlinkSync(join(f.bundleRoot, 'inside'), join(f.bundleRoot, 'alias'), 'junction');
  const r = f.reader({ checksums: { 'alias/a.json': f.checksums['inside/a.json'] } });
  assert.deepEqual(r.inspect('alias/a.json'), {
    status: 'present', physicalPath: 'alias/a.json', bytes: 7, plainBytes: 7,
    expectedSha256: f.checksums['inside/a.json'],
  });
  assert.equal(r.getStats().reads, 0);
});

test('metadata inspection honors deadline and live RSS checks', t => {
  const deadline = Date.now() + 300_000, r = fixture({ 'a.json': {} }).reader({ deadline });
  t.mock.method(Date, 'now', () => deadline);
  stopped('STOP_DEADLINE', () => r.inspect('a.json'));
  assert.equal(r.getStats().lookupCalls, 0); assert.equal(r.getStats().reads, 0);
  t.mock.restoreAll();
  const memory = process.memoryUsage();
  t.mock.method(process, 'memoryUsage', () => ({ ...memory, rss: 1024 ** 3 }));
  stopped('STOP_RSS_LIMIT', () => r.inspect('a.json'));
});

test('gzip and plain manifest reads bind the same exact decoded bytes, not JSON reserialization', () => {
  const bytes = Buffer.from('{\n  "z": 1, "a": "caf\u00e9"\n}\n', 'utf8');
  const gz = gzipSync(bytes);
  const plainReader = fixture({ 'manifest.json': bytes }).reader();
  const gzipReader = fixture({ 'manifest.json.gz': gz }).reader();
  const plain = plainReader.read('manifest.json'), compressed = gzipReader.read('manifest.json');
  assert.deepEqual(compressed.value, plain.value);
  assert.equal(plain.decodedSha256, sha(bytes)); assert.equal(compressed.decodedSha256, sha(bytes));
  assert.notEqual(compressed.sha256, compressed.decodedSha256);
  assert.notEqual(plain.decodedSha256, sha(JSON.stringify(plain.value)));
  assert.equal(gzipReader.getStats().files['manifest.json.gz'].decodedSha256, sha(bytes));
  assert.equal(plainReader.getStats().files['manifest.json'].decodedSha256, sha(bytes));
  assert.equal(gzipReader.read('manifest.json').decodedSha256, sha(bytes));
  assert.equal(gzipReader.getStats().reads, 1);
});

test('decoded hash remains available in the ledger on subsequent UTF-8 or JSON parse failure', () => {
  for (const bytes of [Buffer.from('{invalid'), Buffer.from([0x22, 0xff, 0x22])]) {
    const r = fixture({ 'a.json.gz': gzipSync(bytes) }).reader();
    stopped('STOP_PARSE_ERROR', () => r.read('a.json'));
    assert.equal(r.getStats().files['a.json.gz'].decodedSha256, sha(bytes));
  }
});

test('decoded hashing and UTF-8 work contribute to decode timing, not the raw hash timing', t => {
  const bytes = Buffer.from('{"x":1}'), r = fixture({ 'a.json': bytes }).reader();
  let time = 0;
  t.mock.method(performance, 'now', () => ++time);
  r.read('a.json');
  const timings = r.getStats().timingsMs;
  assert.equal(timings.hash, 1);
  assert.equal(timings.parse, 1);
  assert.ok(timings.decode >= 2, 'decode includes bounded buffer preparation and decoded hashing/UTF-8 conversion');
});

test('metadata plus data reads preserve all fixture hashes and mtimes', () => {
  const f = fixture({ 'a.json.gz': gzipSync('{"x":1}'), 'b.json': { x: 2 } }), r = f.reader();
  const identity = () => Object.keys(f.checksums).map(path => ({ path, sha256: sha(readFileSync(join(f.bundleRoot, path))),
    mtime: String(statSync(join(f.bundleRoot, path), { bigint: true }).mtimeNs) }));
  const before = identity();
  r.inspect('a.json'); r.inspect('b.json'); r.inspect('absent.json'); r.read('a.json'); r.read('b.json');
  assert.deepEqual(identity(), before);
});
