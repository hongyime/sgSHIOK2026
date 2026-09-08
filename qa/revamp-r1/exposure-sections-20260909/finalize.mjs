import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const checksPath = 'qa/revamp-r1/published-options-20260909/exposure-full-3/checks.json';
const buildPath = 'qa/revamp-r1/cached-release-20260908/exposure-sections-20260909-2/build.json';
const browserPath = 'qa/revamp-r1/exposure-sections-20260909/acceptance-3-1788905990095/browser.json';
const checks = json(checksPath), build = json(buildPath), browser = json(browserPath);
if (!checks.ok || !browser.ok || build.exitCode !== 0) throw Error('Required validation failed');
if (!/Tests\s+1065 passed/.test(checks.commands[0].stdout)) throw Error('Unexpected test count');
let browserAbsent = false;
try { process.kill(browser.chromePid, 0); } catch (error) { if (error.code !== 'ESRCH') throw error; browserAbsent = true; }
if (!browserAbsent) throw Error('Owned Chrome remains running');
const snapshotMatch = checks.commands[0].stdout.match(/"snapshot":\s*"([^"]+)"/);
if (!snapshotMatch) throw Error('Missing isolation snapshot');
const snapshot = JSON.parse('"' + snapshotMatch[1] + '"');
if (!snapshot.startsWith(resolve(root, 'tmp') + '\\')) throw Error('Unexpected snapshot root');
const paths = execFileSync('git', ['diff', '--cached', '--name-only', '--', 'web/'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const sources = paths.map(path => {
  const bytes = readFileSync(resolve(root, path)), hash = sha(bytes);
  return { path, bytes: bytes.length, sha256: hash,
    matchesTestedSnapshot: hash === sha(readFileSync(resolve(snapshot, path))),
    matchesBuiltSource: hash === build.sources.find(source => source.path === path)?.sha256 };
});
if (sources.some(source => !source.matchesTestedSnapshot || !source.matchesBuiltSource)) throw Error('Untested/unbuilt source');
const anchors = checks.inputs.map(input => {
  const bytes = readFileSync(resolve(root, input.path)), hash = sha(bytes);
  if (hash !== input.expected || bytes.length !== input.bytes) throw Error('STOP_INPUT_MISMATCH ' + input.path + ' ' + hash);
  return { path: input.path, bytes: bytes.length, sha256: hash, match: true };
});
const summary = {
  task: 'T07', date: new Date().toISOString(), root, hostname: process.env.COMPUTERNAME,
  base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  status: 'complete_published_exposed_section_journey', sources, anchors,
  validation: { checksPath, buildPath, browserPath, buildId: browser.build, testSnapshot: relative(root, snapshot),
    tests: { previous: 964, model: 33, explorer: 39, map: 17, page: 10, accessibility: 2, total: 1065, files: 46,
      arithmetic: '964 + 33 + 39 + 17 + 10 + 2 = 1065; 44 + 2 = 46' },
    commands: checks.commands.map(({ command, args, exitCode, elapsedSeconds }) => ({ command, args, exitCode, elapsedSeconds })),
    browserChecks: browser.checks.map(({ name, pass }) => ({ name, pass })),
    captures: browser.captures.map(({ name, path, bytes, sha256 }) => ({ name, path, bytes, sha256 })),
    visualReview: 'Parent inspected all eight final screenshots at 1440x950,390x844,390x667,320x667. Current selected route/focus features and exact fragment vertices checked before/after capture. Narrow inspector scrolls within its measured bounds; map, required attribution and About data remain visible.',
    cleanup: { ...browser.cleanup, browserAbsent, chromePid: browser.chromePid },
    review: 'Parfit: explorer/tests; Raman: model/map/tests; Anscombe: independent model tests and P2 focus-removal review; parent: integration/tests/build/browser/visual review. Final scoped focus review approved read-only.' },
  retainedFailures: [
    'exposure-full-1: 6 failed,1043 passed; five inherited assertions wrongly borrowed sheltered metrics or guaranteed coverage, and nullable distance type failed. Corrected explicitly. Full2 passed1051/46 before the focus-removal fix; full3 is final1065/46.',
    'acceptance-1: initial desktop CDP Runtime.evaluate timeout before screenshot. No rendered-map claim and no hardware-only cause established.',
    'acceptance-2: initial mobile route/metrics and section selection passed, but focus probe read obsolete MapLibre source._data.features. Installed library wraps _data; final harness uses public await source.getData(). This failed probe does not establish a map rendering failure.',
    'Independent review found an actual P2: asynchronously removing the focused explorer left focus on the document. Lifetime-only cleanup now returns it to the stable Walk details button, only when the disappearing explorer owns focus. Tests and final real-DOM replacement checks cover the fix.'
  ],
  catalogue: {
    'W01-W04/W09-W11/W13': 'model33/explorer39/page44 tests, legacy missing-vs-empty assertions; logical metrics remain36.5m/20.2m while mapped fragments remain16.3m,11m,9.1m.',
    'M03/M10/M15': 'map lifecycle/interaction49 tests and final browser: exact published line/vertices, measured focus bounds, clear/back/close, unchanged base sources, pan preservation, context replacement and shortest removal.',
    U01: 'Keyboard and emulated viewport preparation only; no recruited-user acceptance.'
  },
  findings: [
    'A collapsed Mapped exposed sections disclosure now connects the four measurements to actual selected-route fragments and back to the whole walk.',
    'Logical gap statistics are not reconstructed from fragments. Partial/missing/shortest geometry never becomes zero or an all-covered guarantee; legacy contradictory gap panels are suppressed in Home.',
    'Mapped focus is independently validated against current route geometry/context. Stale callbacks, duplicate fragments, context replacement and optional renders cannot focus another route or resubmit unchanged base sources.',
    'The inherited borrowed shortest/unrouted exposure assertions and asynchronous keyboard-focus-removal defect were corrected explicitly.',
    '1065/46 isolated tests, TypeScript, direct build, repository integrity,11 anchors and final browser acceptance pass. All8 final screenshots were inspected.'
  ],
  disagreements: [
    'A mapped section is not necessarily one complete logical gap. The real three fragments total36.4m while logical gaps total36.5m; the largest fragment16.3m is not the20.2m longest logical gap.',
    'The second browser failure was an obsolete private-field probe, not proof that the section failed to render. No app fix is attributed to that harness repair.',
    'Functional headless acceptance is not physical-phone, representative-performance, nationwide coverage or production-release acceptance.'
  ],
  limitations: [
    'SwiftShader desktop-engine viewport emulation, not physical-device timing. No speedup claim.',
    'QA preview uses immutable existing local artifacts and blocks live APIs; browser context-removal checks programmatically trigger replacement while keyboard focus remains inside. Actual live-preview races execute in component tests only.',
    'No new scoring, export, installation, deployment, protected input/output mutation or X operation.'
  ], pipelineRuns: 0, pipelineCost: 0, installations: 0, deploymentCommands: 0,
};
const output = resolve(root, 'qa/revamp-r1/exposure-sections-20260909/summary.json');
writeFileSync(output, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, sources: sources.length, anchors: anchors.length, tests: summary.validation.tests,
  browserChecks: browser.checks.length, screenshots: browser.captures.length, browserAbsent, sha256: sha(readFileSync(output)) }, null, 2));
