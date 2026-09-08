import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const browserName = process.argv[2];
if (!/^acceptance-5-\d+$/.test(browserName || '')) throw Error('Final browser receipt required');
const directory = resolve(root, 'qa/revamp-r1/published-interaction-20260909');
const output = resolve(directory, 'summary.json');
if (existsSync(output)) throw Error('Preserve previous evidence');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const checksPath = 'qa/revamp-r1/published-options-20260909/interaction-full-5/checks.json';
const buildPath = 'qa/revamp-r1/cached-release-20260908/published-interaction-20260909-4/build.json';
const browserPath = `qa/revamp-r1/published-interaction-20260909/${browserName}/browser.json`;
const checks = json(checksPath), build = json(buildPath), browser = json(browserPath);
if (!checks.ok || !browser.ok || build.exitCode !== 0) throw Error('Required check failed');
let ownedBrowserAbsent = false;
try { process.kill(browser.chromePid, 0); } catch (error) {
  if (error.code !== 'ESRCH') throw error;
  ownedBrowserAbsent = true;
}
if (!ownedBrowserAbsent) throw Error('Owned browser still running');
const sources = execFileSync('git', ['diff', '--cached', '--name-only', '--', 'web/'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const snapshotMatch = checks.commands[0].stdout.match(/"snapshot":\s*"([^"]+)"/);
if (!snapshotMatch) throw Error('Missing isolation receipt');
const testSnapshot = JSON.parse('"' + snapshotMatch[1] + '"');
if (!testSnapshot.startsWith(resolve(root, 'tmp') + '\\')) throw Error('Snapshot outside repository');
const identities = sources.map(path => {
  const bytes = readFileSync(resolve(root, path));
  const hash = sha(bytes);
  return { path, bytes: bytes.length, sha256: hash,
    matchesTestedSnapshot: hash === sha(readFileSync(resolve(testSnapshot, path))),
    matchesBuiltSource: hash === build.sources.find(item => item.path === path)?.sha256 };
});
if (identities.some(item => !item.matchesTestedSnapshot || !item.matchesBuiltSource)) throw Error('Untested or unbuilt source');
const anchors = checks.inputs.map(item => {
  const bytes = readFileSync(resolve(root, item.path));
  const hash = sha(bytes);
  if (hash !== item.expected || bytes.length !== item.bytes) throw Error('STOP_INPUT_MISMATCH ' + item.path + ' ' + hash);
  return { path: item.path, bytes: bytes.length, sha256: hash, match: true };
});
const summary = {
  date: new Date().toISOString(), task: 'T06', root, hostname: process.env.COMPUTERNAME,
  base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  status: 'complete_published_choice_interaction', sources: identities, anchors,
  validation: { checksPath, buildPath, browserPath, buildId: browser.build,
    tests: { previous: 769, added: 195, total: 964, files: 44, arithmetic: '769 + 195 = 964; 40 + 4 = 44' },
    testSnapshot: relative(root, testSnapshot), commands: checks.commands.map(({ command, args, exitCode, elapsedSeconds }) => ({ command, args, exitCode, elapsedSeconds })),
    screenshotNames: browser.captures.map(c => c.name), screenshotReview: 'Parent visually inspected each final capture; source-feature assertions captured before/after each screenshot.',
    browserChecks: browser.checks.map(({ name, pass }) => ({ name, pass })), cleanup: browser.cleanup,
    postRunCleanup: { chromePid: browser.chromePid, ownedBrowserAbsent, checkedAt: new Date().toISOString(), note: browser.cleanup.chromeExited ? 'Harness and subsequent OS PID probe both confirm owned browser exit.' : 'Harness timed out its local exit notification; subsequent OS PID probe confirms process absent. Original report remains unchanged.' } },
  review: { pickerAndPageTests: 'Parfit', geometryValidation: 'Raman', summaryPreviewAndIndependentSelectionReview: 'Anscombe', finalExecutionAndVisualReview: 'Parent' },
  geometryProbe: 'qa/revamp-r1/published-interaction-20260909/geometry-probe.json',
  retainedFailures: [
    'interaction-full-1: three stale expectations failed; source-dump diagnostics retained in checks.json.',
    'acceptance-1: CDP Enter omitted text CR; native disclosure remained closed. Corrected test verifies open state and owned browser exit.',
    'acceptance-2 passed functional checks, but visual inspection found midword Unavailable wrapping. Added compact typography, stable metric tracks and font-ready per-cell bounds checks before acceptance-3.',
    'acceptance-3 passed the expanded checks; visual inspection then caught category subtitle spill. Explicit inner grid tracks and44px touch targets were added, with per-button text-bound checks.',
    'acceptance-4 raced the initial document transition before documentElement existed. It made no screenshot/interaction claim. Readiness sampling now treats that state as pending; acceptance-5 retains the same app build.'
  ],
  findings: [
    'The bounded picker now uses the original normalized published pool. Category, destination, measurements, geometry and URL stay together; valid published choices issue no preview request.',
    'Candidates no longer inherit default total/state/provenance or fabricated distances. Real candidate C retains109m/0%; unsupported logical-gap values remain unavailable. Bus default retains81m/55%/37m/20m.',
    'Preview field meanings are corrected: sheltered_m is full preview walk distance, covered_m is covered distance, straight_line_m is endpoint distance. Preview total/subscores are null and provenance is explicitly non-authoritative.',
    'Validated complete segment partitions preserve real shelter colors. Foreign fragments cannot expand route bounds; mapped fragments remain distinct from complete logical gap statistics.',
    'Initial URL, same-postal reload, delayed geometry/POIs, explicit category/route choice and stale preview callbacks have executed regressions. Missing category is not misreported as an absent postal.',
    '964 isolated tests/44 files, TypeScript, direct build, integrity,11 source anchors and browser functional acceptance pass. Approved equal-width top-left stack and bottom-right About data remain visible.'
  ],
  disagreements: [
    'A positive distance on an explicitly unrouted fallback is not a verified walk. Corrected the inherited real018990 test expectation instead of preserving that presentation error.',
    'Passing DOM/page overflow checks is not visual acceptance; the first successful browser run still split Unavailable midword. This was corrected and rechecked.',
    'This closes published-choice interaction, not all-postal coverage, gap exploration, representative performance or release acceptance.'
  ],
  limitations: [
    'Headless desktop-engine emulation uses SwiftShader; no representative phone timing, speedup, whole-bundle validation or deployment claim.',
    'Local QA proxy serves unmodified protected data read-only and deliberately rejects live preview APIs; failure/race paths execute in component tests.',
    'T07 still must connect summary metrics to honest logical-gap/fragment exploration and remove contradictory legacy gap details.',
    'No pipeline run, installation, protected-payload mutation, X operation or deployment command. Only owned test processes were replaced/closed.'
  ],
  pipelineRuns: 0, pipelineCost: 0, installations: 0, deploymentCommands: 0,
};
writeFileSync(output, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, sourceCount: identities.length, allTestedAndBuilt: true, anchorCount: anchors.length, allAnchorsMatch: true,
  tests: summary.validation.tests, screenshots: browser.captures.length, browserChecks: browser.checks.length, build: browser.build, sha256: sha(readFileSync(output)) }, null, 2));
