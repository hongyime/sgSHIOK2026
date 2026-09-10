import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/normalization-profile-20260910', base = 'ffa3fb1d99bf90909137b3df96834cdf0e688a3f';
assert.equal(process.cwd(), root);
const read = p => readFileSync(resolve(root, p));
const json = p => JSON.parse(read(p));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 ** 2 });
const commands = Object.fromEntries(['red-1', 'green-1', 'final-1', 'typecheck-1', 'integrity-1', 'dependencies-1'].map(label => [label, json(folder + '/' + label + '/command.json')]));
for (const [label, report] of Object.entries(commands)) {
  assert.equal(report.base, base); assert.deepEqual(report.before, report.after);
  for (const item of report.before) {
    assert.equal(hash(read(folder + '/' + label + '/' + item.path.split('/').at(-1))), item.sha256);
    if (['final-1', 'typecheck-1', 'integrity-1', 'dependencies-1'].includes(label)) assert.equal(hash(read(item.path)), item.sha256);
  }
}
assert.equal(commands['red-1'].exitCode, 1); assert.match(commands['red-1'].stdout, /AssertionError.*1051642/);
for (const label of ['green-1', 'final-1']) { assert.equal(commands[label].exitCode, 0); assert.match(commands[label].stdout, /pass 37/); assert.match(commands[label].stdout, /fail 0/); }
assert.equal(commands['typecheck-1'].exitCode, 0); assert.equal(commands['typecheck-1'].stdout + commands['typecheck-1'].stderr, '');
assert.equal(commands['integrity-1'].exitCode, 0); assert.equal(commands['integrity-1'].stdout.trim(), 'repo_integrity=ok');
assert.equal(commands['dependencies-1'].exitCode, 1);
const dependencyFailures = commands['dependencies-1'].stderr.trim().split('\n').slice(1).map(line => JSON.parse(line));
assert.deepEqual(dependencyFailures.map(p => p.name), ['maplibre-gl', 'next', 'vitest']);
const compile = json(folder + '/compile-final/compile.json'), scannerCompile = json('qa/revamp-r1/coverage-register-20260909/compile-4/compile.json');
for (const [directory, report] of [[folder + '/compile-final', compile], ['qa/revamp-r1/coverage-register-20260909/compile-4', scannerCompile]]) {
  assert.equal(report.exitCode, 0); assert.equal(report.sourcesStable, true); assert.equal(report.sources.length, 5); assert.equal(report.compiled.length, 5);
  for (const p of report.sources) assert.equal(hash(read(p.path)), p.sha256);
  for (const p of report.compiled) assert.equal(hash(read(directory + '/compiled/' + p.name)), p.sha256);
}
assert.deepEqual(compile.compiled, scannerCompile.compiled.map(({ name, sha256 }) => ({ name, sha256 })));
const profiles = ['fixture-1', 'fixture-2'].map(label => ({ label, report: json(folder + '/' + label + '/summary.json') }));
for (const { label, report } of profiles) {
  assert.equal(report.base, base); assert.equal(report.complete, true); assert.equal(report.networkAttempts, 0); assert.equal(report.inputsUnchanged, true);
  assert.deepEqual(report.before, report.after); assert.equal(report.cases.length, 9);
  for (const script of report.scriptHashes) assert.equal(hash(read(folder + '/' + label + '/' + script.path.split('/').at(-1))), script.sha256);
  for (const item of report.cases) {
    const output = json(folder + '/' + label + '/' + item.name + '.output.json');
    assert.equal(hash(Buffer.from(JSON.stringify(output))), item.outputSha256);
  }
}
const [before, after] = profiles.map(p => p.report);
assert.equal(before.inputHash, after.inputHash);
const comparison = before.cases.map((item, i) => {
  const current = after.cases[i]; assert.equal(item.name, current.name); assert.equal(item.outputSha256, current.outputSha256);
  const profile = json(folder + '/fixture-1/' + item.profile);
  const topSelfSamples = profile.nodes.filter(p => p.hitCount > 0).sort((a, b) => b.hitCount - a.hitCount).slice(0, 8)
    .map(p => ({ name: p.callFrame.functionName, url: p.callFrame.url, zeroBasedLine: p.callFrame.lineNumber, selfSamples: p.hitCount }));
  return { name: item.name, beforeCalls: item.calls, afterCalls: current.calls, beforeNormalizeMs: item.normalizeMsPerCall,
    afterNormalizeMs: current.normalizeMsPerCall, outputUnchanged: true, outputSha256: item.outputSha256, baselineTopSelfSamples: topSelfSamples };
});
const { createContiguousPartMatcher: matcher } = createRequire(import.meta.url)(resolve(root, folder, 'compile-final/compiled/contiguous-route-parts.js'));
let coordinateReads = 0;
const points = Array.from({ length: 1024 }, (_, i) => new Proxy([i, i + 1], { get(target, key, receiver) {
  if (key === '0' || key === '1') coordinateReads++; return Reflect.get(target, key, receiver);
} }));
const match = matcher([points]); for (let i = 1; i < points.length; i++) assert.equal(match([[i - 1, i], [i, i + 1]]), true);
assert.equal(coordinateReads, 6140);
const anchors = json('qa/revamp-r1/coverage-cost-20260910/green-1/command.json').anchorsAfter;
assert.equal(anchors.length, 11); for (const p of anchors) assert.equal(hash(read(p.path)), p.expected, p.path);
assert.equal(json('web/vercel.json').git.deploymentEnabled, false);
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md', prefix = git(['show', base + ':' + evidencePath]), evidence = read(evidencePath);
assert.ok(evidence.subarray(0, prefix.length).equals(prefix)); assert.ok(evidence.length > prefix.length);
const summary = {
  root, host: process.env.COMPUTERNAME, base, pipelineRuns: 0, dataScans: 0, installations: 0, deployments: 0, appBuilds: 0,
  tests: { matcher: 17, integration: 20, totalNative: 37, arithmetic: '17 + 20 = 37', exhaustiveMatcherComparisons: 29282,
    surfaceComparisons: '20 inputs x (bus normalizer + rail normalizer + reduced coverage row)', failures: 0, skips: 0,
    additionalWebCases: 8, webCasesExecution: 'Not run; dependency guard fails on three direct packages. Cases typechecked with installed dependencies.',
    installedTypecheck: 'pass', integrity: 'repo_integrity=ok' },
  operationCounts: { vertices: 1024, segments: 1023, baselineCoordinateReads: 1051642, indexedCoordinateReads: coordinateReads,
    arithmetic: '1051642 - 6140 = 1045502 fewer coordinate reads', limitation: 'Unique-start fixture. Repeated coordinates still require exact candidate checks; no general linear-time guarantee.' },
  comparison, dependencyFailures, protectedAnchorsVerified: 11,
  evidence: { path: evidencePath, appendOnly: true, originalBytes: prefix.length, originalSha256: hash(prefix), appendedBytes: evidence.length - prefix.length },
  findings: [
    'Retained fixtures omit route_segments. Separately synthetic segmented paths exposed repeated all-start matching as a CPU cost; fixture timings cannot represent population or browser latency.',
    'A per-call coordinate index narrows candidate starts, retains every repeated occurrence and exact forward/reverse single-part checks. Empty fragment lists avoid building an unused index. Edge multiplicity and all metric/trust decisions remain unchanged.',
    '37 native tests pass, including29282 exhaustive original-matcher comparisons and20 full-surface differential cases. The old algorithm fails the new operation-count guard; red receipt preserved.',
    '1024-vertex synthetic normalization observed200.3093ms before and37.9728ms after per call, with only3/11 samples and changing host load. Only operation-count reduction is deterministic evidence, not a representative map speedup.',
    'Fresh compile-4 binds all five scanner source/output files; old pilots cannot authorize the new scanner. No data scan or full-scan projection was attempted.',
    'TypeScript and integrity pass; full web suite/build/browser remain blocked by dependency alignment approval. Eight new web cases are typechecked, not executed under Vitest. Peer quota still prevents independent review.',
  ],
  disagreements: [
    'Portable fixture CPU profiles cannot prove the cause of the earlier200-record scan: the fixtures intentionally omit segment payloads. Synthetic stress is a mechanism test, not the actual data workload.',
    'Do not replace exact geometry association with tolerant proximity or weaken segment/fragment validity to make validation faster. The indexed matcher preserves exact associations and part boundaries.',
  ],
  next: 'Approve coordinated locked dependency/MapLibre worker alignment to unblock full isolated tests, current-build preview and browser acceptance. A new current-code read pilot still needs headroom and a passing900s projection before any full register.',
};
writeFileSync(resolve(root, folder, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ok: true, tests: 37, exhaustiveComparisons: 29282, baselineCoordinateReads: 1051642, indexedCoordinateReads: coordinateReads,
  unchangedProfileOutputs: 9, protectedAnchors: 11, appendOnly: true, summary: folder + '/summary.json' }));
