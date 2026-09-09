import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const local = 'qa/revamp-r1/source-monitor-20260909';
const json = path => JSON.parse(readFileSync(resolve(root, local, path), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const tests = json('cli-green-2/checks.json'), catalog = json('catalog-create-1/command.json');
const currentSources = tests.after.map(item => ({ path: item.path, sha256: sha(readFileSync(resolve(root, item.path))) }));
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const oldEvidence = execFileSync('git', ['show', 'HEAD:' + evidencePath], { cwd: root, maxBuffer: 8 * 1024 ** 2 });
const evidence = readFileSync(resolve(root, evidencePath));
const check = {
  focusedTestsPassed: tests.exitCode === 0 && /187 passed/.test(tests.stdout),
  testedSourcesUnchanged: JSON.stringify(currentSources) === JSON.stringify(tests.after),
  stoppedOnInputMismatch: catalog.exitCode !== 0 && catalog.stderr.includes('STOP_INPUT_MISMATCH tracked metadata: raw/manifest.json'),
  localInputsStableDuringAttempt: catalog.identitiesStable,
  noCatalogProduced: !existsSync(resolve(root, 'source-metadata-catalog.json')),
  evidenceAppendOnly: evidence.subarray(0, oldEvidence.length).equals(oldEvidence),
};
const summary = {
  status: 'STOPPED_INPUT_IDENTITY', root, hostname: 'Prawn-E14',
  base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  checks: check, currentSources,
  tests: { total: 187, files: 4, arithmetic: '39 CLI + 54 HTTP + 9 catalog + 85 state = 187', receipt: local + '/cli-green-2/checks.json', fullProjectSuiteRun: false },
  mismatch: { path: 'raw/manifest.json', committedSha256: '159d5f7818174da8d80eafda3be95de9cfb65aa2fc1fc94a78ab174a001b383b', localSha256: 'ad90df61621bea3d4a3cb207c012b988d2e9338e116ce521b00307198919ae5a', cause: 'unknown, not investigated', receipt: local + '/catalog-create-1/command.json' },
  evidence: { path: evidencePath, previousBytes: oldEvidence.length, previousSha256: sha(oldEvidence), bytes: evidence.length, sha256: sha(evidence) },
  review: { stateTests: 'Parfit: 85 passed, frozen; no sidecar processes', verdict: 'Anscombe: NOT_APPROVED', open: [
    { severity: 'P2', path: 'scripts/source_metadata_http.py', finding: 'Observed 429 cooldown can be lost or bypassed by deadline/cleanup handling.' },
    { severity: 'P2', path: 'scripts/check_source_metadata.py', finding: 'Report written before state persistence can claim success despite a later state-write failure.' },
  ], readOnlySession: { id: 76119, parentPoll: 'Unknown process id 76119', exitCodeKnown: false }, agentsClosed: true },
  gate: 'Owner must disposition metadata mismatch. Do not investigate, repair or resume runtime work implicitly. Review fixes and activation/delivery approval also outstanding.',
  liveSourceRequests: 0, pipelineRuns: 0, installations: 0, deployments: 0, externalNoticeWrites: 0,
  FINDINGS: [
    'Local and committed raw manifest bytes differ; the local file was stable before and after this stopped attempt.',
    '187 focused tests pass; two review defects remain and no live execution is approved.',
    'Validated latestObservation fixes the ETag integration; acknowledged staleness and deferred checks no longer report all-clear in fixtures.',
    'Metadata-check scheduling and delivered deduplicated notices remain unimplemented approval-gated work.',
  ],
  DISAGREEMENTS: [
    'Passing fixtures cannot establish operational completion.',
    'The mismatch does not establish formatting drift or corruption; cause and preferred version are unknown.',
  ],
};
writeFileSync(resolve(root, local, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(summary));
if (!Object.values(check).every(Boolean)) process.exitCode = 1;
