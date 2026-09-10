import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Working root guard');
const folder = 'qa/revamp-r1/worker-alignment-20260910';
const read = p => readFileSync(resolve(root, p));
const json = p => JSON.parse(read(p));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const commands = Object.fromEntries(['install', 'red', 'full-tests', 'full-tests-bounded', 'typecheck', 'integrity', 'audit'].map(label => [label, json(`${folder}/${label}/result.json`)]));
for (const label of ['install', 'full-tests-bounded', 'typecheck', 'integrity', 'audit']) if (commands[label].exitCode !== 0) throw Error(`${label} did not pass`);
if (Object.values(commands).some(r => r.lockBefore !== r.lockAfter)) throw Error('Lock changed');
const full = read(`${folder}/full-tests-bounded/stdout.txt`).toString();
if (!/Tests\s+1785 passed \(1785\)/.test(full) || !/Test Files\s+65 passed/.test(full)) throw Error('Unexpected full test result');
const build = json('qa/revamp-r1/cached-release-20260908/worker-alignment-20260910/build.json');
if (build.exitCode !== 0 || !build.protectedDataAbsent) throw Error('Build failed');
const sourceDrift = build.sources.filter(s => hash(read(s.path)) !== s.sha256);
if (sourceDrift.length) throw Error('Current/build source drift: ' + JSON.stringify(sourceDrift));
const protectedSources = Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources);
const anchors = protectedSources.map(s => ({ path: s.path, expected: s.sha256, actual: hash(read(s.path)) }));
if (anchors.some(s => s.expected !== s.actual)) throw Error('Protected anchor mismatch: ' + JSON.stringify(anchors.filter(s => s.expected !== s.actual)));
const vendor = json(`${folder}/vendor.json`);
if (vendor.retained.some(s => hash(readFileSync(s.path)) !== s.sha256)) throw Error('Retained worker changed');
const servedAssets = [];
for (const version of ['6.1.0', '6.4.1']) for (const name of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  const response = await fetch(`http://127.0.0.1:4362/maplibre/${version}/${name}`, { signal: AbortSignal.timeout(30000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  servedAssets.push({ version, name, status: response.status, sha256: hash(bytes), matches: bytes.equals(read(`web/public/maplibre/${version}/${name}`)), cacheControl: response.headers.get('cache-control') });
}
if (servedAssets.some(r => r.status !== 200 || !r.matches || !r.cacheControl?.includes('immutable'))) throw Error('Served worker validation failed');
const browser = ['browser', 'browser-2', 'browser-3', 'browser-4'].map(label => {
  const r = json(`${folder}/${label}/result.json`);
  return { label, ok: r.ok, captures: r.captures.length, error: r.error, cleanupVerified: r.cleanup.verified, renderer: r.renderer ?? null, graphicsMode: r.graphicsMode ?? 'forced SwiftShader' };
});
const path = 'qa/verification/REVAMP-R1-core-walk.md';
const prefix = execFileSync('git', ['show', `4d7391b:${path}`], { cwd: root, maxBuffer: 10 * 1024 * 1024 });
if (!read(path).subarray(0, prefix.length).equals(prefix)) throw Error('Evidence prefix altered');
const summary = { root, host: process.env.COMPUTERNAME, base: '4d7391b', commands, buildId: build.buildId, sourceFilesMatched: build.sources.length,
  tests: { before: 1765, matcherAdded: 8, workerSelectionAdded: 1, workerCacheAdded: 8, hostilePopupAdded: 3, total: 1785, files: 65, guardTests: 42, timeoutMs: 15000, firstFullRun: '1784 passed +1 default-five-second timeout', assertionsRelaxed: false },
  audit: json(`${folder}/audit/stdout.txt`).metadata.vulnerabilities, vendor, servedAssets, anchors, browser,
  sourceCaveat: 'The final next.config.js indentation differs from the test snapshot; evaluated headers and rewrites are equal. Build captures current bytes.',
  evidencePrefix: { path, bytes: prefix.length, sha256: hash(prefix), preserved: true },
  pipelineRuns: 0, dataPreparation: 0, deployments: 0, preview: 'http://127.0.0.1:4362/',
  findings: ['Approved exact-lock installation completed without lifecycle scripts or lock changes.', 'Current versioned worker/shared/license match MapLibre6.4.1;6.1.0 retained byte-identically.', '1785 isolated web tests/65files pass with15s test timeout;42 native guard tests,TypeScript,build,integrity pass. First full run had one5s timeout.', 'npm audit reports zero known vulnerabilities at this check, not a blanket security guarantee.', 'Visual acceptance FAILED: two harness startup races followed by Runtime.evaluate timeouts in both forced software and default graphics modes. Zero screenshots; no current visual or latency PASS.', 'Static OneMap attribution is a local constant; popup text is escaped and three hostile-attribute fixtures pass. Current production and already-open old clients are not upgraded by this work.'],
  disagreements: ['A successful build and unit suite do not establish that the map renders correctly. T25/T29 visual acceptance remains open.', 'The browser timeout is not proven to be hardware-only or software-renderer-only. Do not declare either cause without diagnosis.'] };
writeFileSync(resolve(root, folder, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ build: summary.buildId, sourceFilesMatched: summary.sourceFilesMatched, tests: summary.tests, anchors: anchors.length, servedAssets: servedAssets.length, visualAcceptance: false }));
