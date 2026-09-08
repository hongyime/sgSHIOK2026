import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { hostname } from 'node:os';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const folder = resolve(root, 'qa/revamp-r1/map-startup-20260909');
const browserPath = resolve(root, process.argv[2] || '');
if (!browserPath.startsWith(folder + sep) || !browserPath.endsWith(sep + 'browser.json')) throw Error('Browser receipt required');
const output = resolve(folder, 'summary.json');
if (existsSync(output)) throw Error('Preserve existing receipt');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const identity = path => {
  const bytes = readFileSync(path);
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
};
const checksPath = 'qa/revamp-r1/data-cache-recovery-20260909/startup-full-4/checks.json';
const buildPath = 'qa/revamp-r1/cached-release-20260908/startup-20260909-3/build.json';
const checks = json(resolve(root, checksPath)), build = json(resolve(root, buildPath)), browser = json(browserPath);
const sources = ['web/app/page.tsx', 'web/components/route-evidence-map.tsx', 'web/lib/__tests__/route-source-lifecycle.test.ts', 'web/lib/__tests__/map-startup-import.test.ts'].map(path => {
  const current = identity(resolve(root, path)), snapshot = identity(resolve(build.snapshot, path));
  const recorded = build.sources.find(source => source.path === path)?.sha256;
  const match = current.sha256 === recorded && current.sha256 === snapshot.sha256;
  if (!match) throw Error('STOP_SOURCE_MISMATCH ' + JSON.stringify({ path, current, snapshot, recorded }));
  return { path, current, snapshot, recorded, match };
});
const anchors = checks.inputs.map(anchor => {
  const actual = identity(resolve(root, anchor.path));
  if (actual.sha256 !== anchor.expected || actual.bytes !== anchor.bytes) throw Error('STOP_INPUT_MISMATCH ' + JSON.stringify({ anchor, actual }));
  return { ...anchor, final: actual, match: true };
});
const images = browser.captures.filter(capture => capture.path).map(capture => ({
  path: capture.path, ...identity(capture.path), stable: capture.stable,
  before: { status: capture.before?.status, routeCount: capture.before?.routeCount, metrics: capture.before?.metrics },
  after: { status: capture.after?.status, routeCount: capture.after?.routeCount, metrics: capture.after?.metrics },
}));
const report = {
  root, hostname: hostname(), task: 'T01 map-component startup and retry',
  wholeT01: 'PARTIAL', pipelineRuns: 0, installations: 0, deploymentCommand: false,
  checksPath, buildPath, browserPath, sources, anchors,
  testArithmetic: '333 prior + 13 lifecycle regressions + 5 controlled-import cases + 7 page-action cases = 358; 35 prior files + 2 = 37',
  testOnlyAfterBuild: { path: 'web/lib/__tests__/map-recovery-actions.test.tsx', ...identity(resolve(root, 'web/lib/__tests__/map-recovery-actions.test.tsx')) },
  tests: checks.commands.map(command => ({ command: command.command, args: command.args, exitCode: command.exitCode })),
  validationOK: checks.ok, buildId: build.buildId, buildExitCode: build.exitCode,
  review: 'Parfit rejected the first early-tile teardown and non-exception-safe removal; parent corrected both. Final source approved. Hook tests are not React DOM or GPU acceptance.',
  browser: { ok: browser.ok, checks: browser.checks.map(check => ({ name: check.name, pass: check.pass })),
    timeoutEvidence: browser.timeoutEvidence, failureMetrics: browser.failureMetrics,
    responsive: browser.responsive, cleanup: browser.cleanup, images, exceptions: browser.exceptions,
    freshWorkerResponses: browser.freshWorkerResponses,
    visualInspection: 'Parent inspected all five PNGs. Failure shows available metrics and Reload page; recovered route is visible at all four sizes with four current features. First390x844 recovery capture includes a raster-tile crossfade; subsequent desktop/mobile captures are sharp. Not a latency or full-offline claim.',
    failureElapsedMs: browser.failureElapsedMs, recoveryElapsedMs: browser.recoveryElapsedMs },
  earlierAttempts: [
    'startup-baseline-1: 6 failed + 12 passed before implementation.',
    'startup-fixed-1/full-1/build-1 passed tests but were superseded after source review found an early-tile regression. Not final acceptance.',
    'silent-worker-1: page-target Fetch never intercepted the worker. App rendered four features; fault injection failed. Original runner and output preserved. Chrome99288 was subsequently absent (ESRCH).',
    'held-worker-1: real proxy-held worker caused the 30-second error, preserving four metrics. In-page remount failed to recover and issued no new worker request. MapLibre page-global dispatcher retains the worker. Terminal startup recovery changed to an explicit page reload; no automatic reload or library patch. Chrome95092 subsequently absent (ESRCH).',
    'Reviewer page-action run: 7 harness failures caused by recursive default traversal of undefined children. Corrected traversal; parent reruns are recorded separately. Not an application failure.',
  ],
  FINDINGS: [
    'The old selected-route deadline was unreachable until load; silent map startup could stay initializing indefinitely.',
    'A separate 30-second startup deadline now covers the component MapLibre import and first load. Recoverable tile errors remain partial; pre-load Retry starts a fresh owned attempt.',
    'Cleanup detaches ownership before teardown. Late imports/events, constructor rejection and throwing remove cannot suppress Retry or corrupt a newer attempt.',
    'A page-wide worker can survive map remounts. Terminal startup failure offers Reload page; recoverable tile errors retain Retry map. Reload preserves the URL and asks before discarding unsent feedback.',
    'Final isolated tests, TypeScript, direct build, integrity and source anchors pass. Browser acceptance is stated separately by its actual checks.',
  ],
  DISAGREEMENTS: [
    'A tile error before load is not necessarily fatal. MapLibre can settle errored tiles and still render; the first patch was corrected before landing.',
    'This component deadline does not cover failure of the outer Next lazy-component chunk, automatic legacy-client upgrades or numerical/physical-phone performance acceptance. T01 and the full goal remain incomplete.',
  ],
};
writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, validationOK: report.validationOK, browserOK: browser.ok, buildId: build.buildId, images: images.length }));
