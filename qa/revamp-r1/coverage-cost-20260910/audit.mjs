import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/coverage-cost-20260910', old = 'qa/revamp-r1/coverage-register-20260909';
const base = '2e60b0e4d2b7af3b6e04b0c6b14a09c56bd8e03d';
assert.equal(process.cwd(), root);
const read = p => readFileSync(resolve(root, p));
const json = p => JSON.parse(read(p));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 ** 2 });
const commands = Object.fromEntries(['red-1', 'green-1', 'cost-baseline-1', 'cost-rss-1', 'integrity-1'].map(label => [label, json(folder + '/' + label + '/command.json')]));
for (const [label, command] of Object.entries(commands)) {
  assert.equal(command.base, base);
  assert.deepEqual(command.before, command.after);
  assert.deepEqual(command.anchorsBefore, command.anchorsAfter);
  for (const p of command.before) {
    const archived = p.path.startsWith(old) ? 'source-' + p.path.split('/').at(-1) : p.path.split('/').at(-1);
    assert.equal(hash(read(folder + '/' + label + '/' + archived)), p.sha256);
    if (['green-1', 'cost-rss-1', 'integrity-1'].includes(label)) assert.equal(hash(read(p.path)), p.sha256);
  }
}
assert.equal(commands['red-1'].exitCode, 1); assert.match(commands['red-1'].stdout, /pass 139/); assert.match(commands['red-1'].stdout, /fail 4/);
assert.equal(commands['green-1'].exitCode, 0); assert.match(commands['green-1'].stdout, /pass 143/); assert.match(commands['green-1'].stdout, /fail 0/); assert.match(commands['green-1'].stdout, /skipped 0/);
assert.equal(commands['integrity-1'].exitCode, 0); assert.equal(commands['integrity-1'].stdout.trim(), 'repo_integrity=ok');
const anchors = commands['green-1'].anchorsAfter;
assert.equal(anchors.length, 11);
for (const p of anchors) assert.equal(hash(read(p.path)), p.expected, p.path);
const previous = json(old + '/pilot-1/summary.json'), baseline = json(old + '/cost-baseline-1/summary.json'), treatment = json(old + '/cost-rss-1/summary.json');
assert.equal(commands['cost-baseline-1'].exitCode, 0); assert.equal(baseline.complete, true); assert.equal(baseline.rows, 200);
assert.equal(baseline.projection.gate, 'stop'); assert.equal(baseline.projection.maxSeconds, 900);
assert.deepEqual(baseline.selection, previous.selection); assert.deepEqual(baseline.totals, previous.totals);
assert.deepEqual(baseline.rawOutput, previous.rawOutput); assert.deepEqual(baseline.compressedOutput, previous.compressedOutput);
const compressed = read(old + '/cost-baseline-1/register.jsonl.gz'), decoded = gunzipSync(compressed);
assert.equal(hash(compressed), baseline.compressedOutput.sha256); assert.equal(hash(decoded), baseline.rawOutput.sha256);
const rows = decoded.toString().trimEnd().split('\n').map(line => JSON.parse(line));
assert.equal(rows.length, 200); assert.equal(new Set(rows.map(p => p.postal)).size, 200);
assert.equal(commands['cost-rss-1'].exitCode, 1); assert.equal(treatment.error.code, 'STOP_HEADROOM');
assert.equal(treatment.rows, 0); assert.equal(treatment.complete, false); assert.equal(treatment.coverageComplete, false);
assert.ok(treatment.freeMemoryBefore < 1024 ** 3); assert.equal(treatment.classifier, undefined);
for (const report of [baseline, treatment]) { assert.equal(report.sourcesStable, true); assert.deepEqual(report.finalizationFailures, []); }
const ledger = json(old + '/cost-baseline-1/input-ledger.json');
assert.equal(Object.keys(ledger.files).length, 49);
for (const [path, item] of Object.entries(ledger.files)) { assert.equal(item.verified, true); assert.equal(item.sha256, item.expectedSha256); }
const memoryBaseline = json(folder + '/cost-baseline-1/memory-profile.json'), memoryTreatment = json(folder + '/cost-rss-1/memory-profile.json');
assert.equal(memoryBaseline.full.calls, 21426); assert.equal(memoryBaseline.rss.calls, 0);
assert.equal(memoryTreatment.full.calls + memoryTreatment.rss.calls, 0);
const readerPath = old + '/reader.mjs';
const beforeReader = git(['show', base + ':' + readerPath]).toString().replaceAll('\r\n', '\n');
assert.equal(read(readerPath).toString().replaceAll('\r\n', '\n'), beforeReader.replace('const rssBytes = process.memoryUsage().rss;', 'const rssBytes = process.memoryUsage.rss();'));
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md', prefix = git(['show', base + ':' + evidencePath]), evidence = read(evidencePath);
assert.ok(evidence.subarray(0, prefix.length).equals(prefix));
assert.ok(evidence.length > prefix.length);
const changed = git(['diff', '--name-only', base, '--']).toString().trim().split('\n').filter(Boolean);
assert.deepEqual(changed.filter(p => /^(web\/|pipeline\/|raw\/|processed\/|checksums\.json$|qa\/(p[6-9]_|p10_|p11\/d_|releases\/))/.test(p)), []);
const summary = {
  root, host: process.env.COMPUTERNAME, base, pipelineRuns: 0, installs: 0, deployments: 0, fullScans: 0,
  change: 'Reader budget observations use RSS-only API; every guard frequency, threshold, source lookup, hash and classification remains unchanged.',
  tests: { original: 138, added: 5, total: 143, arithmetic: '53 + 23 + 17 + 45 + 5 = 143', files: 5, failures: 0, skips: 0,
    red: { passed: 139, failed: 4 }, integrity: 'repo_integrity=ok', webSuite: 'Not run; dependency version guard remains blocking.' },
  baseline: { records: baseline.rows, elapsedSeconds: baseline.elapsedMs / 1000, fixedSeconds: baseline.fixedMs / 1000,
    remainingSeconds: (baseline.elapsedMs - baseline.fixedMs) / 1000,
    wallArithmetic: `${baseline.fixedMs / 1000} + ${(baseline.elapsedMs - baseline.fixedMs) / 1000} = ${baseline.elapsedMs / 1000} seconds`,
    projectedSeconds: baseline.projection.projectedMs / 1000, budgetSeconds: baseline.projection.budgetSeconds,
    gateArithmetic: `ceil(${baseline.projection.projectedMs / 1000} * 1.25 + 30) = ${baseline.projection.budgetSeconds} > 900 seconds: STOP`,
    memory: memoryBaseline, maxObservedRssBytes: ledger.maxObservedRssBytes, physicalFilesVerified: 49,
    rawOutput: baseline.rawOutput, identicalToPreviousPilot: true, counts: baseline.totals.state, countArithmetic: '5 + 160 + 35 = 200' },
  treatment: { records: 0, exitCode: 1, code: treatment.error.code, freeMemoryBytes: treatment.freeMemoryBefore,
    freeMemoryMiB: treatment.freeMemoryBefore / 1024 ** 2, requiredMemoryMiB: 1024,
    readerStarted: false, memory: memoryTreatment, retried: false, speedupMeasured: false },
  protectedAnchorsVerified: 11,
  evidence: { path: evidencePath, originalBytes: prefix.length, originalSha256: hash(prefix), appendOnly: true, appendedBytes: evidence.length - prefix.length },
  findings: [
    'All 143 scanner contracts pass with five new RSS/deadline tests; no check frequency or threshold was reduced.',
    'Fresh baseline output exactly matches the earlier 200-record output, raw and compressed hashes and counts. Its 3842-second projected budget exceeds the 900-second gate.',
    '21426 full memory observations cost 234.3026ms in the baseline. Geometry lookup CPU was also small in the original timing. Neither establishes the dominant bottleneck; normalization/output warrant attention.',
    'Treatment stopped before data access with only 740.23828125MiB free against required1024MiB. No retry, full scan or performance improvement is claimed.',
    '11 protected anchors match; 49 baseline selected physical files were hash-verified by the reader. No app/classifier/pipeline changes, installation or deployment. Parent-only review.',
  ],
  disagreements: [
    'Repeated locator work was not the dominant measured cost. Keep the RSS-only change as bounded guard overhead reduction, not a coverage-scan speedup claim.',
    'A faster small-pilot elapsed time does not imply a passing full-scan estimate: p95 output cost and loaded-host variability produced a larger baseline projection. Keep the900s gate; do not extrapolate pilot wall times linearly.',
  ],
  next: 'No further data pilot until headroom is available. The full register still needs a passing projection. Profile normalization/output on retained fixture inputs next; current-lock app validation separately needs approved dependency alignment.',
};
writeFileSync(resolve(root, folder, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ok: true, tests: 143, baselineRecords: 200, baselineOutputIdentical: true, treatmentStop: treatment.error.code,
  fullScans: 0, protectedAnchors: 11, appendOnly: true, summary: folder + '/summary.json' }));
