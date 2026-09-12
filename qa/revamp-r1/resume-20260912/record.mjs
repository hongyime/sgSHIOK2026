import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { auditErrors } from './error-audit.mjs';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const directory = 'qa/revamp-r1/resume-20260912';
const load = path => JSON.parse(readFileSync(resolve(root, path)));
const hash = path => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
const mapPath = 'qa/revamp-r1/map-stall-20260910/probe-3/result.json';
const pilotPath = 'qa/revamp-r1/coverage-register-20260909/resume-20260912-pilot/summary.json';
const firstPath = 'qa/revamp-r1/cross-feature-motion-20260910/acceptance-20260912-NDm9VU/browser.json';
const finalPath = 'qa/revamp-r1/cross-feature-motion-20260910/correlated-20260912-0IxBOI/browser.json';
const map = load(mapPath), pilot = load(pilotPath), first = load(firstPath), browser = load(finalPath);
// Recompute from the preserved trace instead of trusting the stored pass label.
const audit = auditErrors(browser.entries, browser.errors, browser.pageSession);
assert.equal(audit.ok, true);
assert.equal(audit.explained.length, 4);
assert.equal(audit.unclassified.length, 0);
assert.equal(audit.transport.ok, false);
const http = audit.transport.httpFailures.map(event => {
  const { requestId, response } = event.params;
  return { requestId, url: response.url, status: response.status,
    failures: audit.transport.networkFailures.filter(e => e.params.requestId === requestId).map(e => e.params),
    plainResponses: browser.responses.filter(r => r.url === response.url.replace(/\.gz$/, '')).map(r => ({ id: r.id, status: r.status })),
  };
});
assert.equal(http.length, 6);
assert.ok(http.every(item => item.status === 404 && item.url.endsWith('.json.gz')));
assert.equal(http.filter(item => item.plainResponses.some(r => r.status === 200)).length, 5);
assert.deepEqual(http.filter(item => !item.plainResponses.length).map(item => new URL(item.url).pathname),
  ['/data/generated_20260805_prefer_scored_routed/transit/h3/886520db3dfffff.json.gz']);
assert.equal(audit.transport.pendingNetworkRequests.length, 1);
const sources = load(directory + '/source-check.json');
const build = load('qa/revamp-r1/cached-release-20260908/worker-alignment-20260910/build.json');
assert.ok(build.sources.every(s => hash(s.path) === s.sha256));
const fixture = load('web/lib/__tests__/fixtures/published-walks.provenance.json');
assert.ok(Object.values(fixture.sources).every(s => hash(s.path) === s.sha256));
const captures = browser.captures.map(c => {
  const path = finalPath.replace('browser.json', c.file), actual = hash(path);
  assert.equal(actual, c.sha256);
  const prior = first.captures.find(p => p.file === c.file);
  assert.equal(hash(firstPath.replace('browser.json', c.file)), actual);
  assert.equal(prior.sha256, actual);
  return { path, sha256: actual, stable: c.stable, sameAsFirstRun: true };
});
assert.equal(pilot.rows, 200);
assert.equal(pilot.rawOutput.sha256, '9cb1e4b0fcb9d43b6f6913c6de7ca39fa559f86a764fbb4a775f2238ce4dd144');
const checks = Object.fromEntries(['web', 'types', 'integrity', 'diagnostics'].map(mode => {
  const r = load(directory + '/' + mode + '/command.json'); assert.equal(r.exitCode, 0); return [mode, r];
}));
const evidence = 'qa/verification/REVAMP-R1-core-walk.md';
const prefix = execFileSync('git', ['show', '454d8ff:' + evidence], { cwd: root, maxBuffer: 16 * 1024 * 1024 });
assert.ok(readFileSync(resolve(root, evidence)).subarray(0, prefix.length).equals(prefix));
const report = {
  root, hostname: process.env.COMPUTERNAME, base: '454d8ff72a8bc178c5f2a111b405a91e3fe06abf',
  createdAt: new Date().toISOString(), preview: load(directory + '/preview.json'), sources,
  map: { path: mapPath, ok: map.ok, checks: map.viewportChecks.length, captures: map.captures.length, cleanup: map.cleanup },
  browser: { first: { path: firstPath, ok: first.ok, checks: first.checks.length, passed: first.checks.filter(c => c.pass).length, errors: first.errors, cleanup: first.cleanup.verified },
    final: { path: finalPath, ok: browser.ok, checks: browser.checks.length, passed: browser.checks.filter(c => c.pass).length,
      rawErrors: browser.errors, explained: audit.explained, http, transportOk: audit.transport.ok,
      pendingNetworkRequests: audit.transport.pendingNetworkRequests.map(e => ({ sessionId: e.sessionId, requestId: e.params.requestId, url: e.params.request.url })),
      cleanup: browser.cleanup.verified, anchorsUnchanged: browser.anchorsUnchanged, captures } },
  visual: { reviewer: 'parent only; peer quota unavailable until September15',
    inspected: 'Four map loaded captures plus14 broad-flow captures. Four broad screenshots inspected from first run,10 from correlated run; all14 are byte-identical between runs as checked above.',
    result: 'Visible map/selected route, usable left stack and comparison inner scroll, keyboard focus and enlarged-text end cell, About expandable. Not physical-device/native-zoom or representative-speed acceptance.' },
  pilot: { path: pilotPath, rows: pilot.rows, states: pilot.totals.state, rawOutput: pilot.rawOutput,
    fixedSeconds: pilot.fixedMs / 1000, readPassSeconds: pilot.readPassMs / 1000,
    finalizationSeconds: (pilot.elapsedMs - pilot.fixedMs - pilot.readPassMs) / 1000,
    totalSeconds: pilot.elapsedMs / 1000, peakRssMiB: pilot.maxRssFromProcessResourceUsageKiB / 1024,
    projection: pilot.projection, fullScanStarted: false, sourcesStable: pilot.sourcesStable },
  checks, evidencePrefix: { bytes: prefix.length, sha256: createHash('sha256').update(prefix).digest('hex'), unchanged: true },
  findings: [
    'Headroom recovered; the old preview was absent. Restarted the verified build with read-only data, no rebuild or copying.',
    'Four-viewports current map acceptance passes. Full isolated web1785/65 plus42 guard contracts, TypeScript and integrity pass;45 diagnostic contracts pass.',
    'The first broad run remains failed52/53. New identity-correlated run passes53/53 runtime/Fetch checks; four raw command errors match canceled OneMap tiles, not unclassified app faults.',
    'Transport audit remains incomplete: six gzip404 probes; five have plain200 responses, one transit probe has no plain request. Six canceled response bodies and one worker entry without a page-session terminal remain recorded. Do not promote runtime/Fetch acceptance into transport, retained-client, release or speed acceptance.',
    'Current indexed classifier reproduces the prior200-record register bytes. Its9111-second projected budget exceeds900seconds; no full scan or pipeline execution.',
  ],
  disagreements: [
    'The old blocked-by-memory status is no longer current. Conversely, a passing current-build browser run does not close retained-client or publication gates.',
    'Old uncorrelated CDP errors cannot be retroactively relabeled. Only the new trace supports its four exact cancellation joins.',
    'Initial summary generation failed at record.mjs:31 because it asserted all six gzip404 probes had plain200 fallbacks. Actual trace proves five; the optional transit probe had no plain response. The failed assertion produced no summary file and no browser rerun followed.',
  ],
  next: ['T01/M17 retained-old-client with current build and explicit old-release identity/security bounds', 'T25 complete transport lifecycle and remaining platform acceptance', 'T19 fixture-only cost work before any newly authorized bounded full read scan'],
  pipelineRuns: 0, installations: 0, deployments: 0, productComplete: false,
};
writeFileSync(resolve(root, directory, 'summary.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report, null, 2));
