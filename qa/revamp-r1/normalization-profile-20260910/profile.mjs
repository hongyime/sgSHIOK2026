import assert from 'node:assert/strict';
import { Session } from 'node:inspector/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { profileCases } from './cases.mjs';

const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/normalization-profile-20260910';
assert.equal(process.cwd(), root);
const [label, compileLabel] = process.argv.slice(2); assert.match(label ?? '', /^[a-z0-9-]+$/);
if (compileLabel) assert.match(compileLabel, /^compile-[a-z0-9-]+$/);
const out = resolve(root, folder, label); mkdirSync(out);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = p => readFileSync(resolve(root, p));
const write = (path, value) => writeFileSync(resolve(out, path), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const compileDir = compileLabel ? folder + '/' + compileLabel : 'qa/revamp-r1/coverage-register-20260909/compile-3';
const compile = JSON.parse(read(compileDir + '/compile.json'));
assert.equal(compile.exitCode, 0); assert.equal(compile.sourcesStable, true);
const fixturePath = 'web/lib/__tests__/fixtures/published-options.json';
const identities = () => [...compile.sources.map(p => ({ path: p.path, expected: p.sha256 })),
  ...compile.compiled.map(p => ({ path: compileDir + '/compiled/' + p.name, expected: p.sha256 })),
  { path: fixturePath, expected: '6c4b0c23329e968489439a4c68329b0acbd4f5719632ae8e2b11e14325fa2ea7' }].map(p => {
    const actual = hash(read(p.path)); assert.equal(actual, p.expected, p.path + ' ' + actual); return { ...p, actual };
  });
const before = identities();
for (const file of ['profile.mjs', 'cases.mjs']) writeFileSync(resolve(out, file), read(folder + '/' + file), { flag: 'wx' });
const require = createRequire(import.meta.url);
const { coverageGapRow } = require(resolve(root, compileDir, 'compiled/coverage-gap-register.js'));
const { encodePolyline } = require(resolve(root, compileDir, 'compiled/polyline.js'));
const cases = profileCases(JSON.parse(read(fixturePath)), encodePolyline), inputHash = hash(Buffer.from(JSON.stringify(cases)));
let networkAttempts = 0;
const previousFetch = globalThis.fetch;
globalThis.fetch = () => { networkAttempts++; throw Error('Fixture profile cannot use network'); };
const report = { root, host: process.env.COMPUTERNAME, base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  before, node: process.version, v8: process.versions.v8, inputHash, cases: [], complete: false,
  limits: { perCaseMs: 400, maxCallsPerCase: 100, maxRssBytes: 256 * 1024 ** 2, totalMs: 30000 },
  scope: 'Retained fixture and separately synthetic geometry CPU diagnosis, not a data scan, browser benchmark or full population projection.' };
const started = performance.now();
try {
  for (const item of cases) {
    const session = new Session(); session.connect();
    let calls = 0, normalizeMs = 0, serializeMs = 0, outputBytes = 0, output, profile;
    let normalizeResult;
    try {
      if (performance.now() - started > report.limits.totalMs || process.memoryUsage.rss() > report.limits.maxRssBytes) throw Error('STOP_PROFILE_BUDGET');
      await session.post('Profiler.enable');
      await session.post('Profiler.start');
      const caseStarted = performance.now();
      do {
        const begin = performance.now(); normalizeResult = coverageGapRow(item.input); const normalized = performance.now();
        output = JSON.stringify(normalizeResult); const serialized = performance.now();
        normalizeMs += normalized - begin; serializeMs += serialized - normalized; outputBytes += Buffer.byteLength(output); calls++;
        if (process.memoryUsage.rss() > report.limits.maxRssBytes) throw Error('STOP_PROFILE_RSS');
      } while (calls < report.limits.maxCallsPerCase && performance.now() - caseStarted < report.limits.perCaseMs);
    } finally {
      try { ({ profile } = await session.post('Profiler.stop')); } finally { session.disconnect(); }
    }
    write(item.name + '.cpuprofile', profile);
    write(item.name + '.output.json', normalizeResult);
    report.cases.push({ name: item.name, origin: item.origin, vertices: item.vertices, segmented: item.segmented, calls, normalizeMs, serializeMs,
      normalizeMsPerCall: normalizeMs / calls, serializeMsPerCall: serializeMs / calls, outputBytes,
      outputSha256: hash(Buffer.from(output)), profile: item.name + '.cpuprofile', profileSamples: profile.samples?.length ?? 0,
      rssBytes: process.memoryUsage.rss(), categories: normalizeResult.categories });
  }
  report.complete = true;
} catch (error) {
  report.error = { message: error.message, stack: error.stack }; process.exitCode = 1;
} finally {
  globalThis.fetch = previousFetch;
  report.networkAttempts = networkAttempts; report.elapsedMs = performance.now() - started;
  report.after = identities(); assert.deepEqual(report.after, before);
  assert.equal(hash(Buffer.from(JSON.stringify(cases))), inputHash);
  report.inputsUnchanged = true; report.sourcesUnchanged = true;
  report.scriptHashes = ['profile.mjs', 'cases.mjs'].map(file => ({ path: folder + '/' + file, sha256: hash(read(folder + '/' + file)) }));
  write('summary.json', report);
  console.log(JSON.stringify({ label, complete: report.complete, cases: report.cases.length, elapsedMs: report.elapsedMs, networkAttempts, error: report.error,
    timings: report.cases.map(({ name, calls, normalizeMsPerCall, serializeMsPerCall, profileSamples }) => ({ name, calls, normalizeMsPerCall, serializeMsPerCall, profileSamples })) }));
}
