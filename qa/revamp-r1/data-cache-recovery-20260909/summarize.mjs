import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const folder = resolve(root, 'qa/revamp-r1/data-cache-recovery-20260909');
const output = resolve(folder, 'summary.json');
if (existsSync(output)) throw Error('Preserve earlier summary');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const validation = json('qa/revamp-r1/data-cache-recovery-20260909/full-2/checks.json');
const browserPath = 'qa/revamp-r1/data-cache-recovery-20260909/bounded-2-1788886047048-c5632c71/browser.json';
const browser = json(browserPath);
const earlierPath = 'qa/revamp-r1/cached-release-20260908/data-recovery-explicit-20260909-1/browser.json';
const earlier = json(earlierPath);
const buildPath = 'qa/revamp-r1/cached-release-20260908/data-recovery-20260909-2/build.json';
const build = json(buildPath);
const paths = ['web/lib/data.ts', 'web/public/sw.js', 'web/components/route-evidence-map.tsx'];
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const sourceIdentity = paths.map(path => {
  const current = sha(resolve(root, path));
  const built = build.sources.find(source => source.path === path)?.sha256;
  const snapshot = sha(resolve(build.snapshot, path));
  return { path, current, built, snapshot, match: current === built && built === snapshot };
});
if (!validation.ok || sourceIdentity.some(source => !source.match)) throw Error('Do not claim validation of a different source');
const workerFailures = [...new Map(browser.proxySnapshots.flatMap(item => item.value?.requests || [])
  .filter(item => item.offline && item.path.includes('/maplibre/'))
  .map(item => [item.at + item.path, item])).values()];
const processChecks = [99604, 48340].map(pid => {
  try { process.kill(pid, 0); return { pid, alive: true }; }
  catch (error) { return { pid, alive: error.code !== 'ESRCH', code: error.code }; }
});
const report = {
  root, hostname: 'PRAWN-E14', task: 'T02', status: 'PARTIAL',
  implementation: 'Cache-only alternate-format reader recovery is implemented and independently reviewed. Whole-walk outage and performance acceptance remain open.',
  pipelineRuns: 0, installations: 0, deployment: false,
  validation: { path: 'qa/revamp-r1/data-cache-recovery-20260909/full-2/checks.json',
    ok: validation.ok, inputAnchorsMatched: validation.inputs.filter(input => input.match).length,
    commands: validation.commands.map(command => ({ command: command.command, args: command.args, exitCode: command.exitCode })),
    testArithmetic: '289 + 19 data recovery + 10 worker isolation = 318 tests; 34 + 1 = 35 files',
    focusedArithmetic: '19 recovery + 5 compression = 24; 39 previous worker + 10 isolation = 49',
    baseline: 'baseline-1/checks.json: 6 failed + 14 passed = 20 tests; no reader fix present.',
    independentReview: 'Parfit approved final runtime source; independently executed 49 worker tests. Review identified cache-policy races, cancellation, URL-parser error preservation and concurrency coverage; all were addressed.',
  },
  build: { path: buildPath, buildId: build.buildId, exitCode: build.exitCode, sourceIdentity },
  firstBrowser: { path: earlierPath, build: earlier.server.buildB,
    interpretation: 'Before the final cancellation and request-policy hardening, actual gzip503 to cached-plain200 recovery restored four metrics. All four online viewport captures were inspected with four current features; origin-outage map still stalled.',
    captures: earlier.captures.filter(item => item.label.startsWith('B-')).map(item => ({ label: item.label, stable: item.stable, features: item.after.routeCount })),
    failure: earlier.failure, state: earlier.failureState },
  finalBrowser: { path: browserPath, build: browser.expectedBuildB, fullAcceptance: browser.ok,
    checked: browser.checks.map(check => ({ name: check.name, pass: check.pass })),
    onlineMilliseconds: browser.onlineElapsedMs, outageMilliseconds: browser.outageElapsedMs,
    sourceAndDataRecovery: browser.outageDataResponses.map(item => ({ url: item.url, status: item.status, fromServiceWorker: item.fromServiceWorker, artifact: item.artifact })),
    workerFailures, captures: browser.captures.map(item => ({ label: item.label, path: item.path, stable: item.stable, beforeFeatures: item.before?.routeCount, afterFeatures: item.after?.routeCount })),
    limitations: [
      'Final online screenshot was inspected with four selected features. This is not an automatic-upgrade test or a phone/performance benchmark.',
      'Outage capture exhausted its budget; actual HTML body and four UI metrics were not verified in that final capture. Do not count those failed assertions as product regressions or as passes.',
      'Final origin-outage score/geometry responses are 200 from CacheStorage after gzip503; worker-module request is independently recorded as503 by the proxy.',
      '88.146 s online and45.156 s outage are harness-phase observations, not comparable page-load timings; outage exceeded its45 s gate by0.156 s.',
      'bounded-1 ended at the harness five-second Page.navigate timeout. The retry raised only that sub-timeout within the same overall budget; earlier evidence is retained.',
      'Both browser cleanup reports failed to observe Chrome exit within their short wait. Subsequent parent process checks are recorded separately below.',
    ] },
  laterProcessChecks: processChecks,
  supportingSources: ['https://developer.mozilla.org/en-US/docs/Web/API/Request/cache'],
  QAReceiptCorrection: 'The reused static-overlay reason originally mentioned a race fix after compilation. For the final snapshot, recorded source/current/snapshot hashes are identical; no post-build worker byte change occurred. The helper now records the previous hash and neutral copy reason.',
  FINDINGS: [
    'The gzip503 reader failure is fixed without a fresh plain-JSON network fallback. A cache miss preserves the original failure; cancellation, corrupt payloads, compressed-only shards and 4xx remain bounded failures.',
    'Request deduplication now separates only-if-cached from network-allowed reads in both arrival orders. Ten executed worker tests cover native-cache and CacheStorage semantics.',
    'The final built app renders the approved top-left layout and current walk online. All318 isolated tests, TypeScript, integrity and11 source anchors pass.',
    'Origin-outage proxy receipts show /maplibre/6.1.0/maplibre-gl-worker.mjs returning503. Worker modules are not in the SW allowlist; bootstrap failure handling and worker caching are the next narrow work.',
    'Source review found no watchdog before MapLibre load; a bootstrap failure without a handled error can remain initializing indefinitely, and partial retry before load does not execute. This is a source finding, not a claim that every bootstrap error hangs.',
  ],
  DISAGREEMENTS: [
    'Cached data recovery does not establish offline-map acceptance or resolve the separate automatic legacy-upgrade failure. T01 and T02 remain partial; no measured speedup or all-goal-complete claim.',
    'The final outage screenshot/timing failures are not reliable evidence of new data or score defects. Preserve the successful transport observations and failed capture boundaries separately.',
  ],
};
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ output, status: report.status, tests: 318, sourceIdentity, workerFailures, processChecks }, null, 2));
