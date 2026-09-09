import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [fullLabel, buildLabel, browserLabel, ...priorBrowserLabels] = process.argv.slice(2);
if ([fullLabel, buildLabel].some(value => !/^[a-z0-9-]+$/.test(value || '')) || [browserLabel, ...priorBrowserLabels].some(value => !/^[A-Za-z0-9-]+$/.test(value || ''))) throw Error('Safe receipt labels required');
const directory = resolve(root, 'qa/revamp-r1/map-download-recovery-20260909');
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = args => execFileSync('git', args, { cwd: root });
const fullPath = `qa/revamp-r1/published-options-20260909/${fullLabel}/checks.json`;
const buildPath = `qa/revamp-r1/cached-release-20260908/${buildLabel}/build.json`;
const browserPath = `qa/revamp-r1/map-download-recovery-20260909/${browserLabel}/browser.json`;
const full = read(fullPath), build = read(buildPath), browser = read(browserPath);
const priorBrowsers = priorBrowserLabels.map(label => {
  const receipt = `qa/revamp-r1/map-download-recovery-20260909/${label}/browser.json`;
  return { receipt, value: read(receipt) };
});
const suite = full.commands[0];
const snapshot = JSON.parse(suite.stdout.slice(suite.stdout.lastIndexOf('\n{')));
const changed = git(['diff', 'HEAD', '--name-only', '--', 'web']).toString().trim().split('\n').filter(Boolean);
const sources = changed.map(path => {
  const bytes = readFileSync(resolve(root, path)), hash = sha(bytes);
  return { path, bytes: bytes.length, sha256: hash,
    matchesTestedSnapshot: hash === sha(readFileSync(resolve(snapshot.snapshot, path))),
    matchesBuiltSource: hash === build.sources.find(source => source.path === path)?.sha256 };
});
const anchors = full.inputs.map(input => {
  const bytes = readFileSync(resolve(root, input.path));
  return { path: input.path, bytes: bytes.length, sha256: sha(bytes), match: bytes.length === input.bytes && sha(bytes) === input.expected };
});
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const before = git(['show', `HEAD:${evidencePath}`]), current = readFileSync(resolve(root, evidencePath));
const prefix = { path: evidencePath, bytes: before.length, sha256: sha(before), unchanged: current.subarray(0, before.length).equals(before) };
const count = Number(/Tests\s+(\d+) passed/.exec(suite.stdout)?.[1]);
const files = Number(/Test Files\s+(\d+) passed/.exec(suite.stdout)?.[1]);
const summary = {
  task: 'T01 map download recovery', date: new Date().toISOString(), root, hostname: process.env.COMPUTERNAME,
  base: git(['rev-parse', 'HEAD']).toString().trim(),
  status: 'PARTIAL: automatic existing-client cache transition remains unproven; no full T01/T25 acceptance or release claim',
  sources, anchors, evidencePrefix: prefix,
  tests: { receipt: fullPath, ok: full.ok, passed: count, files, arithmetic: `1389 + ${count - 1389} = ${count}; 54 + ${files - 54} = ${files}`,
    snapshot, commands: full.commands.map(command => ({ command: command.command, args: command.args, exitCode: command.exitCode, elapsedSeconds: command.elapsedSeconds })) },
  build: { receipt: buildPath, buildId: build.buildId, exitCode: build.exitCode, snapshot: build.snapshot },
  browser: { receipt: browserPath, ok: browser.ok, failure: browser.failure, checks: browser.checks, captures: browser.captures, cleanup: browser.cleanup },
  priorBrowsers: priorBrowsers.map(({ receipt, value }) => ({ receipt, ok: value.ok, failure: value.failure, checks: value.checks, captures: value.captures, cleanup: value.cleanup })),
  browserScope: 'Attempt1 preserved a failed screenshot-stability assertion after the held-download/late-release/explicit-reload scenario passed. Attempt2 added bounded data-read/state settling but incorrectly waited for unconsumed HTTP404 probe bodies. Attempt3 runs only the two rejection cases with corrected rejected-read tracking, preserving successful-body completion, stable full signatures and fresh post-capture rejection checks. All bypass HTTP cache and service workers; no old-client upgrade or latency claim.',
  agentReceipts: readdirSync(directory).filter(name => /^[ab]-.*\.json$/.test(name)).sort(),
  findings: [
    'The former outer dynamic import had no page-level timeout/error boundary; preload rejection was not contained. The loader adds a terminal 30-second download boundary and explicit reload recovery.',
    'Inner startup now reports library-download, glyph-setup, map-construction or map-startup; tile and selected-route failures remain distinct. Fixed messages do not expose raw exception URLs.',
    'Plain home and shared-comparison entry previously skipped cache registration/update. Common mount bootstrap now covers them; the existing helper deduplicates and retains explicit-intent retry.',
    'Independent review found wall-clock adjustment could distort outer elapsedMs. Monotonic timing and clock-jump regressions correct that inherited diagnostic defect.',
    'Fixture tests and browser fault checks have different scopes. This work does not establish representative latency or automatic old-client upgrades.'
  ],
  disagreements: [
    'A passing full fixture suite is not sufficient to declare map reliability complete; actual browser outcomes and remaining cache-transition acceptance stay explicit.',
    'The OneMap logo/copyright line is mandatory attribution, not an optional legend; approved left-stack layout remains unchanged.'
  ],
  protections: { pipelineRuns: 0, pipelineCost: 0, dependencyInstallations: 0, deploymentCommands: 0, xOperations: 0, protectedPayloadMutations: 0 },
};
summary.sourceValidationOk = full.ok && build.exitCode === 0 && sources.every(source => source.matchesBuiltSource && source.matchesTestedSnapshot)
  && anchors.every(anchor => anchor.match) && prefix.unchanged;
writeFileSync(resolve(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ sourceValidationOk: summary.sourceValidationOk, tests: count, files, browserOk: browser.ok, evidencePrefix: prefix }));
process.exitCode = summary.sourceValidationOk ? 0 : 1;
