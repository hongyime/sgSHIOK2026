import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const dir = resolve(root, 'qa/revamp-r1/production-worker-20260913');
const read = name => JSON.parse(readFileSync(resolve(dir, name)));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const counts = values => values.reduce((out, value) => { out[value] = (out[value] ?? 0) + 1; return out; }, {});
const runs = ['observed-pA46WF', 'observed-bf5YuS'].map(name => {
  const o = read(name + '/observation.json'), s = read(name + '/supervisor.json');
  assert.equal(s.runCompleted, true); assert.equal(s.childStatus, 0);
  assert.equal(o.appAcceptance, false); assert.equal(o.anchorsUnchanged, true);
  assert.equal(o.boundary.stats.closed, true); assert.equal(o.boundary.stats.receiptsDropped, 0);
  assert.equal(s.cleanup.verified, true);
  assert.equal(sha(readFileSync(resolve(dir, name, 'observed.png'))), o.screenshot.sha256);
  assert.ok(o.checks.every(c => c.pass));
  const workerRequests = o.boundary.requests.filter(r => r.secFetchDest === 'worker' && r.path !== '/__qa/probe-worker.js');
  const workerLogs = o.events.filter(e => e.atMs >= o.applicationStartMs && e.kind === 'Log.entryAdded' && e.params.entry.source === 'worker');
  const dataIdentities = o.dataReads.filter(r => r.status === 200).map(r => {
    assert.ok(r.path.startsWith('/data/generated_20260805_prefer_scored_routed/'));
    const source = resolve(root, 'web/public' + r.path);
    const body = readFileSync(source);
    assert.equal(sha(body), r.sha256, 'STOP data identity mismatch: ' + r.path);
    assert.equal(body.length, r.bytes);
    return { path: r.path, bytes: body.length, sha256: r.sha256, matchesDisk: true };
  });
  return {
    name, outcome: o.outcome, driverElapsedMs: o.elapsedMs, supervisorElapsedMs: s.elapsedMs,
    hardBudgetMs: s.totalBudgetMs, cleanupVerified: s.cleanup.verified,
    diagnosticChecksPassed: o.checks.length, applicationAcceptance: false,
    search: o.search ?? null, workerEvents: o.workerEvents, workerRequests,
    workerLogs, canvasCount: o.document.canvasCount,
    producerFeatureCounts: o.document.routeDebug?.sourceFeatureCounts ?? null,
    dataReadStatuses: counts(o.dataReads.map(r => r.status)), dataIdentities,
    boundary: o.boundary.stats, screenshot: o.screenshot, parentVisuallyInspected: true,
    visualFinding: name === 'observed-pA46WF'
      ? 'Only the initial old UI shell, empty postal input, no map or result.'
      : 'Postal018956 result and old controls visible. Map area blank; intentional blocked-tile error visible. Producer feature counts do not establish rendered route features.'
  };
});
assert.deepEqual(runs[0].workerEvents, []);
assert.equal(runs[1].workerEvents[0].url, '');
assert.ok(runs[1].workerEvents.some(e => e.kind === 'error'));
assert.equal(runs[1].workerRequests.length, 1);
assert.equal(runs[1].workerRequests[0].sourceKind, 'html');
assert.equal(runs[1].workerRequests[0].status, 200);
assert.ok(runs[1].workerLogs.some(e => e.params.entry.text.includes('non-JavaScript MIME type')));
const tests = [['boundary-tests.txt', 24], ['observer-tests.txt', 9]].map(([file, expected]) => {
  const body = readFileSync(resolve(dir, file)); const text = body.toString('utf8');
  const count = key => Number(new RegExp('(?:^|\\n)[^\\n]*? '+key+' ([0-9]+)(?:\\r?\\n|$)').exec(text)?.[1]);
  for (const key of ['tests', 'pass']) assert.equal(count(key), expected);
  for (const key of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(count(key), 0);
  return { file, tests: expected, pass: expected, fail: 0, sha256: sha(body) };
});
const verification = resolve(root, 'qa/verification/REVAMP-R1-core-walk.md');
const prefix = readFileSync(verification).subarray(0, 396996);
assert.equal(sha(prefix), 'caa0988bdd12db7a40f1363ad5a1d2cf7d2e906bb0e693cc01dd59e2f06b871d');
const weightSha = sha(readFileSync(resolve(root, 'pipeline/config/weights.yaml')));
assert.equal(weightSha, '5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
const integrity = spawnSync('python', ['-B', 'scripts/check_repo_integrity.py'], {
  cwd: root, windowsHide: true, encoding: 'utf8', timeout: 30000,
  env: { ...process.env, TEMP: resolve(root, 'tmp'), TMP: resolve(root, 'tmp') }
});
assert.equal(integrity.status, 0); assert.match(integrity.stdout, /repo_integrity=ok/);
const report = {
  root, hostname: process.env.COMPUTERNAME, base: '451dcfe37b1715e0ea170bd5b873dc7b4b850112',
  buildId: 'UzVn3WiWA2GW7dtvN27rN', runs, tests,
  uniqueDiagnosticTests: '24 boundary + 9 transparent observer = 33 in 2 files; the peer rerun is not counted again',
  observationArithmetic: `${runs[0].supervisorElapsedMs} + ${runs[1].supervisorElapsedMs} = ${runs.reduce((n,r)=>n+r.supervisorElapsedMs,0)} ms across two sequential diagnostics, each below210000ms`,
  integrity: { command: 'python -B scripts/check_repo_integrity.py', exitCode: integrity.status, stdout: integrity.stdout, stderr: integrity.stderr },
  verificationPrefix: { bytes: prefix.length, sha256: sha(prefix), preserved: true }, lockedWeightsSha256: weightSha,
  findings: [
    'The corrected captured-production run passes an empty string to native Worker; receipt58 returns captured HTML to that worker URL, then Chromium records module MIME rejection and the native worker emits error.',
    'The original no-worker run omitted the real search action. This production build does not read postal from the query; the inconclusive result is preserved, not counted as an app failure.',
    'Current source already sets the versioned6.4.1 worker URL before Map construction; this task does not change or newly deploy the app. Retaining old chunks preserves old behavior, not a worker repair.',
    '24 boundary and9 observer tests pass. Three worker proxy canaries are blocked in both runs, no direct local canary hits, no dropped receipts or remaining owned handles. Two screenshots inspected by parent.',
    'Reporting infrastructure/policy, maintenance destination/scheduler, physical-device acceptance and exact release approval remain open. No absent saved route was generated.'
  ],
  disagreements: [
    'A postal query is not sufficient to exercise this captured build. Native Search was required; prior query-only observation cannot establish a worker startup defect.',
    'The captured diagnostic establishes a specific worker mechanism, not the sole cause of a live blank map. External tiles are deliberately blocked, origin/cache/SW behavior is constrained, and source counts are not rendered-pixel evidence.'
  ],
  next: 'Use a truthful old-client failure/reload transition in release acceptance. Do not rewrite captured assets or demand that a broken old worker renders correctly. Current-source visual acceptance and owner release gates remain separate.',
  limitations: ['instrumented Worker constructor identity', 'local HTTP origin, not live HTTPS', 'local published data responses, no upstream data refresh', 'all external tile traffic blocked', 'no representative performance result', 'no returned-client upgrade or physical-device acceptance', 'no complete runtime/rollback archive claim'],
  costs: { pipelineRuns: 0, pipelineSeconds: 0, installations: 0, deployments: 0, sourceActivations: 0 }
};
writeFileSync(resolve(dir, 'summary.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ root, hostname: report.hostname, outcomes: runs.map(r=>({name:r.name,outcome:r.outcome,elapsedMs:r.supervisorElapsedMs,cleanup:r.cleanupVerified,dataReadStatuses:r.dataReadStatuses})), tests:report.uniqueDiagnosticTests, arithmetic:report.observationArithmetic, integrity:report.integrity, verificationPrefix:report.verificationPrefix, findings:report.findings, disagreements:report.disagreements, costs:report.costs }, null, 2));
