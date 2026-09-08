import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const browserName = process.argv[2];
if (!/^comparison-regression-1-\d+$/.test(browserName || '')) throw Error('Final browser receipt required');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const checksPath = 'qa/revamp-r1/published-options-20260909/comparison-full-1/checks.json';
const buildPath = 'qa/revamp-r1/cached-release-20260908/comparison-contract-20260909-1/build.json';
const browserPath = `qa/revamp-r1/exposure-sections-20260909/${browserName}/browser.json`;
const checks = read(checksPath), build = read(buildPath), browser = read(browserPath);
if (!checks.ok || build.exitCode !== 0 || !browser.ok) throw Error('Required check failed');
if (!/Tests\s+1109 passed/.test(checks.commands[0].stdout)) throw Error('Unexpected final test count');
const match = checks.commands[0].stdout.match(/"snapshot":\s*"([^"]+)"/);
if (!match) throw Error('Missing isolated snapshot receipt');
const snapshot = JSON.parse('"' + match[1] + '"');
if (!snapshot.startsWith(resolve(root, 'tmp') + '\\')) throw Error('Unexpected snapshot root');
const sources = execFileSync('git', ['diff', '--cached', '--name-only', '--', 'web/'], { cwd: root, encoding: 'utf8' }).trim().split('\n').map(path => {
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
let browserAbsent = false;
try { process.kill(browser.chromePid, 0); } catch (error) { if (error.code !== 'ESRCH') throw error; browserAbsent = true; }
if (!browserAbsent) throw Error('Owned browser remains running');
const summary = {
  task: 'T08', date: new Date().toISOString(), root, hostname: process.env.COMPUTERNAME,
  base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  status: 'complete_comparison_row_contract_not_ui', sources, anchors,
  policy: 'ADR-16: category_default_sheltered_v1. Compare postals using the common category declaration, never the inspector candidate or picker winner. Missing/conflicting declarations cannot silently use another option/category.',
  validation: { checksPath, buildPath, browserPath, buildId: browser.build, snapshot,
    tests: { previous: 1065, added: 44, total: 1109, files: 47, arithmetic: '1065 + 44 = 1109; 46 + 1 = 47' },
    commands: checks.commands.map(({ command, args, exitCode, elapsedSeconds }) => ({ command, args, exitCode, elapsedSeconds })),
    browserChecks: browser.checks.map(({ name, pass }) => ({ name, pass })),
    captures: browser.captures.map(({ name, path, bytes, sha256 }) => ({ name, path, bytes, sha256 })),
    visualReview: 'Parent inspected all eight final existing-walk regression captures at four viewports. This checks extraction compatibility, not a comparison UI that is not implemented yet.',
    cleanup: { ...browser.cleanup, browserAbsent, chromePid: browser.chromePid },
    review: 'Parfit implementation; Raman independent real-fixture/boundary tests; Anscombe adversarial read-only source review; parent integrated validation and screenshot review.' },
  retainedFailures: [
    'b-focused-1788907465473:36 initial tests pass. Expanded b-focused-1788907574542:39pass/1fail, reproducing the review-found partial-default metric-conflict bypass. This was an explicitly mutated fixture, not a changed protected input.',
    'After the implementation fix,41/44 passed; three new cases expected the normalizer diagnostic prefix instead of comparison_evidence_conflict. Their unavailable/all-null assertions already passed. Test prefixes were corrected, keeping underlying normalizer status truthful. Raw red/green receipts are preserved under this directory.'
  ],
  catalogue: { 'C03/C04': '44 contract tests for shared category/default/availability; visible column/category UI acceptance remains T10.',
    'W01/W02/W10/W13': 'Shared pure walkMetrics and compatibility re-export retain existing summary/selection tests; fresh browser verifies unchanged walk rendering and focus.' },
  findings: [
    'Comparison rows now carry fixed policy, bundle/postal/category, real destination/source locator, four nullable metrics and separate capability/status evidence. No fabricated composite, candidate provenance or implicit category fallback.',
    'Default-group ownership and selected-source authority differ. The row pins the declared representation even when the existing picker chooses a healthier alias; useful measurements survive missing geometry.',
    'Review found partial geometry could hide a trusted same-stop metric contradiction. A comparison-only check now independently normalizes existing group sources and blocks valid differing shortest/sheltered distances or coverage without changing picker/normalizer behavior.',
    'Logical gaps retain their published meaning; 36.5m/20.2m are not replaced by mapped-fragment totals. Provenance references are original-field locators, not newly audited digests.',
    'The top-level task board now reflects completed local core walk work. Home comparison remains unfinished until T09-T11 provide state, visible controls and sharing.'
  ],
  disagreements: [
    'A group that contains a default is not necessarily displaying that default representation. Comparison cannot safely use the picker group selectedSource without pinning the declaration.',
    'Partial geometry does not make independently valid, same-identity metric contradictions disappear. The first44-test implementation required a stricter comparison-specific check.',
    'This is a tested data contract, not a shipped comparison interface or user acceptance. Existing-walk browser regression does not claim otherwise.'
  ],
  limitations: ['No new comparison controls, shortlist storage, sharing, live requests or service provisioning.',
    'Headless SwiftShader viewport emulation is not a representative phone benchmark. No speedup or deployment claim.',
    'No protected input/output change, pipeline run, installation or X operation. Existing QA preview APIs remain disabled.'],
  pipelineRuns: 0, pipelineCost: 0, installations: 0, deploymentCommands: 0,
};
const output = resolve(root, 'qa/revamp-r1/comparison-20260909/summary.json');
writeFileSync(output, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, sources: sources.length, anchors: anchors.length, tests: summary.validation.tests,
  browserChecks: browser.checks.length, screenshots: browser.captures.length, browserAbsent, sha256: sha(readFileSync(output)) }, null, 2));
