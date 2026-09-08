import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const output = resolve(root, 'qa/revamp-r1/worker-cache-20260909/summary.json');
if (existsSync(output)) throw Error('Preserve previous summary');
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const browserPath = 'qa/revamp-r1/data-cache-recovery-20260909/worker-fixed-1-1788887576565-2b9a4b4f/browser.json';
const browser = read(browserPath);
const validationPath = 'qa/revamp-r1/data-cache-recovery-20260909/worker-full-1/checks.json';
const validation = read(validationPath);
const buildPath = 'qa/revamp-r1/cached-release-20260908/worker-cache-20260909-1/build.json';
const build = read(buildPath);
const identities = ['web/public/sw.js', 'web/next.config.js', 'web/lib/data.ts', 'web/components/route-evidence-map.tsx'].map(path => {
  const current = sha(resolve(root, path));
  const recorded = build.sources.find(source => source.path === path)?.sha256;
  const snapshot = sha(resolve(build.snapshot, path === 'web/next.config.js' ? 'web/next.qa-base.cjs' : path));
  return { path, current, recorded, snapshot, match: current === recorded && recorded === snapshot };
});
if (!browser.ok || !validation.ok || identities.some(item => !item.match)) throw Error('Acceptance or source identity failed');
const origin = browser.origin;
const proxy = await (await fetch(origin + '/__qa/status')).json();
if (proxy.active !== 'B' || proxy.offline || proxy.buildB !== build.buildId) throw Error('Wrong preview state');
const headers = [];
for (const module of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  const path = '/maplibre/6.1.0/' + module;
  const response = await fetch(origin + path, { method: 'HEAD' });
  const item = { path, status: response.status, headers: Object.fromEntries(response.headers) };
  if (response.status !== 200 || item.headers['cache-control'] !== 'public, max-age=31536000, immutable') throw Error('Module header mismatch');
  headers.push(item);
}
const images = browser.captures.map(capture => {
  const bytes = readFileSync(capture.path);
  return { label: capture.label, path: capture.path, bytes: bytes.length, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20),
    sha256: sha(capture.path), stable: capture.stable, beforeFeatures: capture.before.routeCount, afterFeatures: capture.after.routeCount };
});
const report = {
  root, hostname: 'PRAWN-E14', task: 'T01 worker dependency recovery', status: 'SUBTASK_DONE', wholeT01: 'PARTIAL',
  pipelineRuns: 0, installations: 0, deployment: false, preview: origin,
  build: { path: buildPath, buildId: build.buildId, exitCode: build.exitCode, identities },
  validation: { path: validationPath, ok: validation.ok, inputAnchorsMatched: validation.inputs.filter(item => item.match).length,
    testArithmetic: '318 + 14 worker cases + 1 header case = 333 tests; 35 files unchanged',
    focusedArithmetic: '49 prior worker + 14 new = 63; 30 prior deployment + 1 new = 31; 63 + 31 = 94',
    commands: validation.commands.map(command => ({ command: command.command, args: command.args, exitCode: command.exitCode })),
    baseline: 'worker-baseline-2/checks.json: 10 failed + 84 passed = 94. worker-baseline-1 omitted Vitest globals and is not a valid deployment-suite baseline.',
    treatment: 'worker-fixed-1/checks.json: 94/94 passed',
    independentReview: 'Parfit authored and ran the red baseline, then approved the narrow runtime prefix/header change at source-review level. Parent executed treatment and full suite.',
  },
  browser: { path: browserPath, ok: browser.ok, checks: browser.checks.map(item => ({ name: item.name, pass: item.pass })),
    onlineMs: browser.onlineElapsedMs, originOutageMs: browser.outageElapsedMs,
    recovery: browser.recovery, cleanup: browser.cleanup, images,
    cachedWorkerModules: browser.cacheInspection.flatMap(cache => cache.relevantUrls.filter(url => url.includes('/maplibre/'))),
    outageWorkerOriginRequests: browser.proxySnapshots.filter(item => item.label === 'outage-end')
      .flatMap(item => item.value?.requests || []).filter(item => item.offline && item.path.includes('/maplibre/')),
    visualInspection: 'Parent inspected the online and origin-outage PNGs. Both are390x844, stable, four selected route features; the requested left stack and bottom-right About data remain visible. Images are byte-identical.',
    limits: 'Fresh-profile B-only Chromium/software-GPU test of a previously visited walk, not automatic A-to-B upgrade, whole-device offline, a physical phone, uncached-postal availability, or a speedup benchmark.',
  },
  actualModuleHeaders: headers,
  QAChanges: 'Reuse the project test runner for globals. Poll only small state and keep full diagnostics for captures; print check names rather than huge JSON. Reserve20s of the same45s outage budget for image/body evidence. No prior failed report was overwritten.',
  FINDINGS: [
    'The two shipped MapLibre modules were excluded from the immutable cache. The version-pinned SW allowlist and HTTP headers now cover them without broadening arbitrary or unversioned paths.',
    'Actual browser origin outage now preserves the cached B document, score/geometry, four identical metrics and four current rendered route features. Both worker modules appear in CacheStorage; no worker request reaches the unavailable origin in this run.',
    'All333 isolated web tests, TypeScript/build/integrity and11 source anchors pass. No scoring, export, input changes, installations or deployment.',
    'Automatic legacy upgrade and the independently identified pre-load watchdog/retry gap remain open. This successful bounded scenario does not complete T01 or the whole product backlog.',
  ],
  DISAGREEMENTS: [
    'These harness phase times do not establish a latency improvement; the harness was made lighter and host load is uncontrolled.',
    'Origin outage with external tiles reachable is not a promise of full offline navigation or support for an unvisited postal.',
  ],
};
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ output, build: build.buildId, status: report.status, tests: 333,
  cacheModules: report.browser.cachedWorkerModules, outageWorkerRequests: report.browser.outageWorkerOriginRequests,
  moduleHeaders: headers.map(item => ({ path: item.path, status: item.status, cacheControl: item.headers['cache-control'] })),
  images }, null, 2));
