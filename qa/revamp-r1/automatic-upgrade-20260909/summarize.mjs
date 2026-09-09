import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const directory = resolve(root, 'qa/revamp-r1/automatic-upgrade-20260909');
const base = 'c658c1ee98f68701bebe8336ec352e2a180e65f4';
const sha = value => createHash('sha256').update(value).digest('hex');
const read = path => JSON.parse(readFileSync(resolve(root, path)));
const browserPath = 'qa/revamp-r1/automatic-upgrade-20260909/observed-1-rOOKcg/browser.json';
const browser = read(browserPath);
const testPath = 'qa/revamp-r1/published-options-20260909/automatic-upgrade-full-1/checks.json';
const tests = read(testPath);
const retirement = read('qa/revamp-r1/automatic-upgrade-20260909/proxy-retired.json');
const retirementConfirmed = read('qa/revamp-r1/automatic-upgrade-20260909/proxy-retirement-confirmed.json');
const buildPath = 'qa/revamp-r1/cached-release-20260908/map-download-20260909-1/build.json';
const build = read(buildPath);
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const original = execFileSync('git', ['show', base + ':' + evidencePath], { cwd: root });
const current = readFileSync(resolve(root, evidencePath));
const output = tests.commands[0].stdout.replace(/\x1b\[[0-9;]*m/g, '');
const passed = Number(/Tests\s+(\d+) passed/.exec(output)?.[1]);
const files = Number(/Test Files\s+(\d+) passed/.exec(output)?.[1]);
const sourceMatches = build.sources.map(source => ({ path: source.path, expected: source.sha256, actual: sha(readFileSync(resolve(root, source.path))) }));
if (!browser.ok || !tests.ok || !retirementConfirmed.ok || !sourceMatches.every(source => source.expected === source.actual)) throw Error('Verification gate failed');
if (passed !== 1441 || files !== 56) throw Error('Unexpected web test totals');
if (!current.subarray(0, original.length).equals(original)) throw Error('Existing evidence prefix changed');
const summary = {
  base, root, hostname: process.env.COMPUTERNAME, at: new Date().toISOString(),
  scope: 'QA acceptance and handoff only; no application source change, rebuild, deployment or pipeline action.',
  browser: { receipt: browserPath, sha256: sha(readFileSync(resolve(root, browserPath))), ok: browser.ok, elapsedMs: browser.elapsedMs,
    checks: browser.checks, captures: browser.captures.map(capture => ({ name: capture.name, path: capture.path, sha256: capture.sha256,
      visuallyInspected: true, before: capture.before, after: capture.after })),
    runnerSha256: browser.runnerSha256, cleanupVerified: browser.cleanup.verified, pageErrors: browser.pageErrors,
    documents: browser.documents.map(document => ({ name: document.name, requestId: document.requestId, loaderId: document.loaderId,
      buildA: document.buildA, buildB: document.buildB, sha256: document.sha256, fromServiceWorker: document.response.fromServiceWorker,
      fromDiskCache: document.response.fromDiskCache, headers: document.response.headers })),
    controller: browser.automaticController, workerHashes: browser.server.workerHashes,
    cachedDataA: browser.cachedDataA, cachedChunksA: browser.cachedChunksA, retained: browser.cacheAfter,
    oldChunkOriginChecks: browser.oldChunkOriginChecks },
  tests: { receipt: testPath, passed, files, ok: tests.ok, commands: tests.commands.map(command => ({ command: command.command, args: command.args, exitCode: command.exitCode })) },
  anchors: tests.inputs,
  build: { receipt: buildPath, reused: true, buildId: build.buildId, sourceMatches },
  evidencePrefix: { bytes: original.length, sha256: sha(original), unchanged: true },
  review: {
    historical: 'A corrected the old root-cache explanation: string cache key resolves to zero freshness; inner fetch may reuse HTTP cache. Old fromServiceWorker alone did not prove CacheStorage behavior.',
    driver: 'C found five pre-run blockers: unbound Document receipt, uncorrelated worker version, lost earlier exceptions, unbounded per-chunk probes, vacuous data retention. Parent corrected all before the single run.',
    documentBinding: 'Exact navigation loaderId/frameId and successful body completion; no failed download counted complete.',
    workerBinding: 'Activated version controls actual page target; scriptResponseTime correlates with proxy response carrying pinned B SHA256 and Service-Worker: script.',
    preservedFailures: 'Earlier acceptance-6 90-second failure remains unchanged. No claim about why that earlier observation differs.',
  },
  findings: [
    'Single same-origin/profile Chromium run passes 27/27 checks with HTTP cache and service worker enabled, without injected registration.update, forced update, clearing or bypass.',
    'The first returning Document remains build A and reports fromDiskCache plus fromServiceWorker. B controls the same page 1405 ms after switching the origin; the next ordinary navigation executes build B. Worker activation is not automatic page replacement.',
    'Six cached data URLs and twelve cached A JS URLs survive. All twelve A JS URLs return404 from B origin. Foreign and future cache sentinels survive. This proves retention, not a retained old tab requesting an uncached lazy chunk.',
    'Four screenshots inspected at390x844: A/B plain map and selected walk; both selected captures have four current-route features and matching before/after state. Approved left stack and compact bottom-right About data/required attribution are visible.',
    'Full isolated web suite remains1441 tests in56 files; TypeScript/integrity and11 protected source anchors pass. No representative timing, physical-device, other-browser or deployed-site claim.',
  ],
  disagreements: [
    'Do not close T01 solely from this pass: retained-old-Document uncached lazy-chunk behavior remains untested. M16 automatic local transition is now evidenced; M17 is partial.',
    'Do not keep T03 blocked by unrelated remaining cache-upgrade acceptance: its prerequisite is the already-landed typed startup/failure recovery. Build identity must remain explicitly unknown unless injected at compile time.',
  ],
  next: 'T03 privacy-safe failure-only diagnostics, then retained-old-tab missing lazy-chunk acceptance and remaining T25 focus/zoom cases. Owner gates remain unchanged.',
  retiredProxyPid: retirement.retired[0].ProcessId, retirementConfirmed, userPreview: 'http://127.0.0.1:4328/',
  operations: { pipelineRuns: 0, installations: 0, deploymentCommands: 0, protectedPayloadMutations: 0, XOperations: 0 },
};
writeFileSync(resolve(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ summary: resolve(directory, 'summary.json'), sha256: sha(readFileSync(resolve(directory, 'summary.json'))),
  checks: browser.checks.length, captures: browser.captures.length, webTests: passed, webTestFiles: files,
  builtSourceMatches: sourceMatches.length, anchors: tests.inputs.length, prefix: summary.evidencePrefix }));
