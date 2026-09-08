import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const dir = resolve(root, 'qa/revamp-r1/cached-release-20260908');
const output = resolve(dir, 'summary.json');
if (existsSync(output)) throw Error('Preserve prior summary');
const read = path => JSON.parse(readFileSync(resolve(dir, path), 'utf8'));
const validation = read('validation-final-1/validation.json');
const automatic = read('acceptance-6/browser.json');
const explicit = read('explicit-update-1/browser.json');
const selected = explicit.captures.filter(capture => capture.label.startsWith('B-'));
const summary = {
  workingRoot: root, hostname: 'PRAWN-E14', task: 'T01', status: 'PARTIAL',
  codeReview: 'Independent subagent approved source after five identified races/policy defects were fixed.',
  sourceWorkerSha256: createHash('sha256').update(readFileSync(resolve(root, 'web/public/sw.js'))).digest('hex'),
  validation: { ok: validation.ok, inputHashesMatched: validation.inputs.filter(input => input.match).length,
    commands: validation.commands.map(command => ({ command: command.command, args: command.args, exitCode: command.exitCode })),
    testSummary: validation.commands[0].stdout.match(/Test Files[^\n]+\n\s+Tests[^\n]+/)?.[0],
    arithmetic: '242 + 39 worker behavior + 8 registration = 289 tests; 32 + 2 = 34 files',
    source: 'validation-final-1/validation.json' },
  automaticLegacyUpgrade: { passed: !automatic.failure, failure: automatic.failure, source: 'acceptance-6/browser.json',
    interpretation: 'A served a distinct controlled navigation, but no B activation was observed in 90 seconds. Cause is not established; no claim of permanent lockout or seamless migration.' },
  postExplicitUpdate: { intervention: explicit.updateResult, allChecksPassed: !explicit.failure,
    selectedCaptures: selected.map(capture => ({ label: capture.label, stable: capture.stable, width: capture.before.width, height: capture.before.height,
      routeCount: capture.before.routeCount, document: capture.before.document })),
    oldSuccessfulChunksNow404: explicit.oldChunkChecks, preservedSentinels: explicit.sentinels,
    failure: explicit.failure, failureState: explicit.failureState, source: 'explicit-update-1/browser.json' },
  visualInspection: 'Parent inspected all four B selected-route PNGs. Route and requested top-left stack are visible; one narrow capture retains a peripheral raster fade/blur. Not a latency or physical-phone acceptance claim.',
  setupFailures: {
    build1: 'Turbopack rejected external dependency junction. Snapshot2 used documented QA-only common root. Compiler1 emitted a panic log to its default external TEMP; subsequent build redirected TEMP/TMP inside the repository. No panic log was opened or deleted.',
    acceptance1: 'Proxy addressed A at 127.0.0.1, but old preview listens on localhost; browser received 502. Fixed target address.',
    acceptance2: 'Next consumed __next_f; build assertion was invalid despite four route features. Fixed using actual Document response bytes.',
    acceptance3: 'Old compiled server served current public/sw.js from disk. Not a valid A-worker upgrade; now pin A worker to git c83fc96 and assert its SHA.',
    acceptance4: 'Fixed debugger port collided; Chrome bound IPv6. Now use port0 and the spawned browser endpoint.',
    acceptance5: 'Polling read body before document creation; now null-safe.',
  },
  FINDINGS: [
    'Worker no longer holds mutable HTML for seven days; versioned data/chunks remain cache-first. Actual root/SW HTTP headers require revalidation.',
    'Scoped caches, failure-safe storage, registration retry, RSC/prefetch exclusions, request deduplication and navigation/timeout races have executed regressions.',
    'After an explicit update, B renders four current route features at all four required viewport sizes with 12 old successful JS URLs unavailable on the server. Foreign/future sentinel contents survive.',
    'Automatic legacy transition did not pass its 90-second browser gate. Browser-managed update cause remains unresolved; T01 is not complete.',
    'Origin outage retained the B HTML shell but lost the walk: the reader abandoned cached plain JSON when compressed probes returned503. Next action is a cache-only alternate-format recovery with behavioral tests, not pipeline rebuilding.',
    'All 11 source anchors match. Zero pipeline, installs, protected-payload changes or deployments. Full isolated tests289/34, TypeScript and repo_integrity pass.',
  ],
  DISAGREEMENTS: [
    'Passing unit tests and explicit-update captures do not establish automatic legacy upgrades or offline walk acceptance. No all-tasks-complete claim.',
    'Do not attribute the update timeout solely to hardware, caching headers or CDP; available telemetry cannot choose among those mechanisms.',
  ],
};
writeFileSync(output, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
