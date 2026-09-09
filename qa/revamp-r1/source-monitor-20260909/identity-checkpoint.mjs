import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const directory = 'qa/revamp-r1/source-monitor-20260909';
const json = path => JSON.parse(readFileSync(resolve(root, directory, path), 'utf8'));
const sha = content => createHash('sha256').update(content).digest('hex');
const tests = json('identity-green-1/checks.json'), creation = json('catalog-create-2/command.json');
const created = JSON.parse(creation.stdout), diagnosis = json('manifest-identity.json');
const sourceIdentities = tests.after.map(item => ({ path: item.path, sha256: sha(readFileSync(resolve(root, item.path))) }));
const catalogBytes = readFileSync(resolve(root, 'source-metadata-catalog.json'));
const catalog = JSON.parse(catalogBytes.toString('utf8'));
const inputs = Object.entries(catalog.anchors).map(([path, expected]) => ({ path, expected, actual: sha(readFileSync(resolve(root, path))) }));
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const previous = execFileSync('git', ['show', 'HEAD:' + evidencePath], { cwd: root, maxBuffer: 8 * 1024 ** 2 });
const evidence = readFileSync(resolve(root, evidencePath));
const checks = {
  focusedTests: tests.exitCode === 0 && /212 passed/.test(tests.stdout),
  testedSourcesCurrent: JSON.stringify(sourceIdentities) === JSON.stringify(tests.after),
  catalogCreatedWithoutInputMutation: creation.exitCode === 0 && creation.identitiesStable,
  rawInputsStillMatchLocalAnchors: inputs.every(item => item.expected === item.actual),
  exactTextOnlyDiagnosis: diagnosis.exactAfterCRLFToLF && diagnosis.equalParsedJSON && diagnosis.local.sha256 === diagnosis.localAfterSha256,
  all23ManifestEntriesIdentical: diagnosis.sources.length === 23 && diagnosis.sources.every(item => item.entireEntryEqual),
  distinctManifestRepresentations: catalog.anchors['raw/manifest.json'] !== catalog.gitAnchors['raw/manifest.json'],
  catalogCounts: created.sources === 24 && Object.values(created.adapters).reduce((sum, n) => sum + n, 0) === 24,
  evidenceAppendOnly: evidence.subarray(0, previous.length).equals(previous),
};
const summary = { base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  checks, sourceIdentities, inputs, catalog: { path: 'source-metadata-catalog.json', sha256: sha(catalogBytes), sources: created.sources, adapters: created.adapters },
  tests: { count: 212, files: 4, arithmetic: '31 catalog + 42 CLI + 54 HTTP + 85 state = 212', fullProjectSuite: false },
  evidence: { path: evidencePath, previousBytes: previous.length, previousSha256: sha(previous), bytes: evidence.length, sha256: sha(evidence) },
  independentReview: { reviewer: 'Anscombe', disposition: 'Accepted for identity-correction-only checkpoint commit.',
    limits: 'Read-only review. Parent test receipts not independently executed. Does not approve live HTTP, schedule or external notices.',
    open: ['429 cooldown can be lost/bypassed through deadline or cleanup.', 'Report completion precedes state persistence.'] },
  FINDINGS: ['235 CR bytes account for the exact manifest difference; all23 source entries are equal.',
    'Initial catalog metadata equivalence is narrowly allowlisted; runtime and payload hash rules stay byte-exact.',
    'Owner approved routine read-only diagnosis without another approval pause; protected writes and activation remain gated.',
    'Catalog created and212focused tests pass; two independent monitor defects remain open.'],
  DISAGREEMENTS: ['eol=lf attributes did not establish actual worktree line endings.', 'JSON semantic equality alone does not authorize arbitrary byte differences.'],
  liveSourceRequests: 0, pipelineRuns: 0, protectedInputWrites: 0, deployments: 0,
};
writeFileSync(resolve(root, directory, 'identity-correction-summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(summary));
if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
