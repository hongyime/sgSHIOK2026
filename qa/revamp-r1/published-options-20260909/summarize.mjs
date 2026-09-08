import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const out = resolve(root, 'qa/revamp-r1/published-options-20260909');
const target = resolve(out, 'summary.json');
const diffPath = resolve(out, 'conflict-fix.diff');
if (existsSync(target) || existsSync(diffPath)) throw Error('Preserve existing evidence');
const report = JSON.parse(readFileSync(resolve(out, 'full-2/checks.json')));
if (!report.ok || report.inputs.length !== 11 || report.inputs.some(x => !x.match)) throw Error('Final checks incomplete');
const stdout = report.commands[0].stdout;
if (!/Tests\s+702 passed \(702\)/.test(stdout) || !/Test Files\s+39 passed \(39\)/.test(stdout)) throw Error('Unexpected test counts');
const snapshot = 'tmp/test-without-data-pEwezv';
const module = 'web/lib/published-transit-options.ts';
const diff = spawnSync('git', ['diff', '--no-index', '--no-color', '--', resolve(root, snapshot, module), resolve(root, module)], { cwd: root, windowsHide: true, encoding: 'utf8' });
if (diff.status !== 1 || !diff.stdout) throw Error('Expected the recorded red-to-green classifier diff');
writeFileSync(diffPath, diff.stdout);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const identity = path => {
  const bytes = readFileSync(resolve(root, path));
  return { path, bytes: bytes.length, sha256: hash(bytes) };
};
const sourcePaths = [module, 'web/lib/__tests__/published-transit-options.test.ts', 'web/lib/__tests__/published-options-fixture.test.ts',
  'web/lib/__tests__/fixtures/published-options.json', 'web/lib/__tests__/fixtures/published-options.provenance.json'];
const summary = {
  task: 'T04', date: new Date().toISOString(), workingRoot: root, hostname: process.env.COMPUTERNAME,
  base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  status: 'complete_normalizer_contract_only', sources: sourcePaths.map(identity),
  contract: 'qa/revamp-r1/published-option-contract-20260909.json',
  checks: 'qa/revamp-r1/published-options-20260909/full-2/checks.json',
  redRegression: 'qa/revamp-r1/published-options-20260909/conflict-red-1/checks.json',
  redToGreenDiff: { ...identity('qa/revamp-r1/published-options-20260909/conflict-fix.diff'), lines: diff.stdout.split('\n').length - Number(diff.stdout.endsWith('\n')) },
  priorRuns: ['fixture-check.json', 'focused-1/checks.json', 'full-1/checks.json'],
  tests: { previous: 358, fixture: 16, normalizer: 328, total: 702, files: 39, arithmetic: '358 + 16 + 328 = 702; 37 + 1 + 1 = 39' },
  authorReportedAttempts: {
    limitation: 'Author handback, not parent reruns or retained raw transcripts. Parent retained its own isolated command output separately.',
    runs: [{ passed: 292, failed: 5, total: 297 }, { passed: 312, failed: 0, total: 312 }, { passed: 317, failed: 0, total: 317 }],
    initialFailure: 'Five N16 permutation assertions compared raw candidate-array order after deliberately reversing it. Corrected comparisons cover normalized capabilities, diagnostics and source locators; raw input order is preserved, not normalized.',
  },
  review: { reviewer: 'Parfit', result: 'approved source/test design after corrections', independentExecution: false },
  inputChecks: { timing: 'before final isolated validation', count: report.inputs.length, allMatch: true },
  integration: { pickerWired: false, rankingImplemented: false, newBrowserClaim: false, newBuild: false, preview: 'http://127.0.0.1:4324/', previewBuild: '1yBIxF2hxkFbQ0wR27y96' },
  findings: [
    'Category defaults can exist outside the retained candidate list; exact source identities and whole-representation precedence preserve this evidence.',
    'The real default has logical gaps 16.3 + 20.2 = 36.5 m, while rendering fragments sum to 36.4 m with a 16.3 m maximum. They are not interchangeable.',
    'Review removed the unjustified default-only positive-distance prerequisite; missing distance cannot erase valid coverage.',
    'Review fixed state coercion, invalid-default alias absorption, unsupported-duplicate poisoning, empty-flat geometry and degenerate-line diagnostics before landing.',
    'Parent red tests reproduced three remaining conflict-branch holes; exact state and finite own-category trust checks now prevent unsupported duplicates from quarantining a valid walk.',
    'All final tests pass without production-data access; original score/geometry and locked values are not recomputed or mutated.',
  ],
  disagreements: [
    'Positive routed_m and shortest_m are not independent corroboration: the producer derives both from the same variable.',
    'Fixture shape checks alone do not prove normalization; T04 now executes capabilities and boundaries, but not T05 ordering or T06 UI behavior.',
    'Raw evidence intentionally preserves input order. Determinism applies to normalized capabilities, diagnostics and source locators, not a rewritten source snapshot.',
  ],
  limits: ['Only three real score fixtures, not a full-bundle audit.', 'No claim of all stops evaluated or complete address/route coverage.', 'Optional route segments are not exposed for rendering by this normalizer; T06 must use validated geometry only.', 'No pipeline, installation, deployment or protected-payload mutation.'],
};
writeFileSync(target, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
