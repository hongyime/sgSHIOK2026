import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { verifyFrontendRetention } from '../../../web/scripts/frontend-retention.mjs';
import { auditErrors } from '../resume-20260912/error-audit.mjs';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const dir = 'qa/revamp-r1/retained-current-20260912';
const read = p => JSON.parse(readFileSync(resolve(root, p)));
const hash = p => createHash('sha256').update(readFileSync(resolve(root, p))).digest('hex');
const build = read(dir + '/build-1/build.json');
assert.equal(build.exitCode, 0);
assert.ok(build.sources.every(s => hash(s.path) === s.sha256));
const retention = verifyFrontendRetention(resolve(build.snapshot, 'web'), { requireBuild: true });
assert.deepEqual(retention, build.verifiedRetention);
const first = read(dir + '/observed-EAV2hq/browser.json'), final = read(dir + '/observed-NdLU98/browser.json');
assert.equal(first.exitCode, 1); assert.equal(final.exitCode, 0);
assert.equal(final.checks.length, 27); assert.ok(final.checks.every(c => c.pass));
assert.equal(final.errors.length, 0); assert.equal(auditErrors(final.entries, final.errors, final.pageSession).ok, true);
assert.ok(final.cleanup.verified && first.cleanup.verified);
assert.equal(final.proxyStopStatus, 204); assert.equal(first.proxyStopStatus, 204);
const captures = final.captures.map(c => {
  const path = dir + '/observed-NdLU98/' + c.file;
  assert.equal(hash(path), c.sha256);
  return { path, sha256: c.sha256, stable: c.stable, before: { status: c.before.status, count: c.before.featureCount, key: c.before.routeKey, timeOrigin: c.before.timeOrigin }, after: { status: c.after.status, count: c.after.featureCount, key: c.after.routeKey, timeOrigin: c.after.timeOrigin } };
});
const anchors = Object.values(read('web/lib/__tests__/fixtures/published-walks.provenance.json').sources).map(s => ({ path: s.path, expected: s.sha256, actual: hash(s.path) }));
assert.ok(anchors.every(s => s.expected === s.actual));
const terminals = ['server-1', 'server-2'].map(name => read(dir + '/' + name + '/terminal.json'));
assert.ok(terminals.every(t => t.childExit && t.requests.at(-1).path === '/__qa/stop'));
const live = execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process -Filter "ProcessId = 7656 OR ProcessId = 20392 OR ProcessId = 13320 OR ProcessId = 24792" | Select-Object ProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress'], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 }).trim();
assert.equal(live, '');
const mainPreview = await (await fetch('http://127.0.0.1:4362/__qa/status', { signal: AbortSignal.timeout(5000) })).json();
assert.equal(mainPreview.buildId, 'sou6pZfEMMmsCl52vdXg4');
const prefixPath = 'qa/verification/REVAMP-R1-core-walk.md';
const prefix = execFileSync('git', ['show', '1fb93aa:' + prefixPath], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
assert.ok(readFileSync(resolve(root, prefixPath)).subarray(0, prefix.length).equals(prefix));
const contracts = read(dir + '/checks.json'); assert.ok(contracts.every(c => c.exitCode === 0));
const priorWeb = read('qa/revamp-r1/resume-20260912/web/command.json');
const priorBuild = read('qa/revamp-r1/cached-release-20260908/worker-alignment-20260910/build.json');
assert.deepEqual(build.sources, priorBuild.sources);
const summary = { root, hostname: process.env.COMPUTERNAME, base: '1fb93aa9a282c8cbc8ac0c8201c427106fd2f5cc',
  createdAt: new Date().toISOString(), build: { path: dir + '/build-1/build.json', id: build.buildId, seconds: (Date.parse(build.finishedAt) - Date.parse(build.startedAt)) / 1000, sourceCount: build.sources.length, sourcesUnchanged: true, retention },
  first: { path: dir + '/observed-EAV2hq/browser.json', exitCode: first.exitCode, checks: first.checks.length, failed: first.checks.filter(c => !c.pass).map(c => c.name), captures: first.captures.length, cleanup: first.cleanup.verified,
    cause: '320px resize: before screenshot status initializing, after ready; both had4same-key route features and same Document. Failed capture barrier preserved; new settling helper tested against this trace.' },
  final: { path: dir + '/observed-NdLU98/browser.json', checks: final.checks.length, exitCode: final.exitCode, seconds: final.elapsedSeconds,
    oldModule: final.oldModule, captures, errors: final.errors, runtimeFetchAudit: final.errorAudit.ok,
    transportOk: final.errorAudit.transport.ok, http: final.errorAudit.transport.httpFailures.map(e => ({ url: e.params.response.url, status: e.params.response.status })),
    pendingNetwork: final.errorAudit.transport.pendingNetworkRequests.map(e => ({ requestId: e.params.requestId, url: e.params.request.url })),
    cachedSamples: final.cachesBefore.flatMap(c => c.samples), beforeCaches: final.cachesBefore, finalCaches: final.cachesFinal,
    cleanup: final.cleanup.verified, proxyStop: final.proxyStopStatus },
  visual: { reviewed: 7, reviewer: 'parent only', failedAttemptAdditionalReviewed: ['retained-A-on-B-320x667.png'],
    result: 'Retained A map/route visible across4viewports; current B route visible desktop/mobile with the current controls. Pending A deliberately defers its map script while preserving walk metrics. Not physical-device/native-zoom or latency acceptance.' },
  anchors, contracts, priorWeb: { path: 'qa/revamp-r1/resume-20260912/web/command.json', exitCode: priorWeb.exitCode, tests: 1785, files: 65, guardTests: 42, same156Sources: true, rerunThisTurn: false },
  ownedCleanup: { remainingProcesses: [], proxyPids: terminals.map(t => t.pid), nextPids: terminals.map(t => t.nextPid), terminalPaths: ['server-1', 'server-2'].map(n => dir + '/' + n + '/terminal.json'), mainPreview },
  evidencePrefix: { path: prefixPath, bytes: prefix.length, sha256: createHash('sha256').update(prefix).digest('hex'), unchanged: true },
  findings: [
    'Controlled retained-tab/current-build path now completes: old Document/postal survives new-worker control and uncached39556-byte map chunk served by real Next fallback; four viewport routes match.',
    'Ordinary navigation reaches new B HTML and renders the selected route on desktop/mobile. Both cache sentinels and four cached data samples retain their original bytes.',
    'Fresh isolated156-source build passes retention guards and TypeScript; eleven new capture contracts and integrity pass. Existing1785/65+42suite still matches these application source identities.',
    'The first attempt fails a transitional resize capture, not a demonstrated map disappearance. It remains exit1; final run uses three consecutive ready samples and validates both screenshot boundaries.',
    'No unexpected runtime/Fetch errors in final run. Complete transport is not accepted: eight gzip404 probes plus two old-static icon404s and two worker entries without page terminal are retained.',
    'This tests an explicitly pinned local A, not the live deployment identity or approval to retain its6.1.0 runtime in production. Seven final captures inspected, owned QA servers/browser stopped, normal preview unchanged.',
  ],
  disagreements: [
    'A passing local M17 sequence is meaningful progress, but cannot authorize retaining an unidentified production release or an old runtime without security disposition.',
    'Waiting for a single ready observation is not sufficient screenshot synchronization across resize. The corrected barrier must preserve transitional captures and remain bounded.',
  ],
  limits: { pipelineRuns: 0, installations: 0, deployments: 0, dataCopies: 0, protectedMutations: 0, independentReview: false, productComplete: false },
};
writeFileSync(resolve(root, dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ build: summary.build, checks: summary.final.checks, errors: summary.final.errors.length, captures: captures.length, anchors: anchors.length, ownedProcessesRemaining: live, productComplete: false }));
