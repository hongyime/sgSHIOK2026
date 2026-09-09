import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const qa = 'qa/revamp-r1/maintenance-20260910';
const bytes = path => readFileSync(resolve(root, path));
const text = path => bytes(path).toString('utf8');
const sha = content => createHash('sha256').update(content).digest('hex');
const inspection = JSON.parse(text(`${qa}/inspection.json`));
const readme = text('README.md'), plan = text('PRODUCT-PLAN.md');
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const evidence = bytes(evidencePath);
const previous = execFileSync('git', ['show', `HEAD:${evidencePath}`], { cwd: root, maxBuffer: 8 * 1024 ** 2 });
const integrity = spawnSync('python', ['-B', 'scripts/check_repo_integrity.py'], { cwd: root, encoding: 'utf8',
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }, windowsHide: true });
const whitespace = spawnSync('git', ['diff', '--check'], { cwd: root, encoding: 'utf8', windowsHide: true });
const outcomes = inspection.remote;
const checks = {
  correctRoot: inspection.root === root && inspection.hostname === 'Prawn-E14',
  exactMetadataAnchorsUnchanged: inspection.protectedMetadataStable && inspection.after.every(f => sha(bytes(f.path)) === f.sha256),
  snapshotScopeStillMatches: inspection.localFrontend.sourceChecks.length === 142 && inspection.localFrontend.sourceChecks.every(f => f.expected === f.actual && sha(bytes(f.path)) === f.actual),
  remoteReceiptsComplete: outcomes.length === 2 && outcomes.every(r => r.status === 200 && r.outcome === 'read' && bytes(r.path).length === r.bytes && sha(bytes(r.path)) === r.sha256),
  manifestMatchesPinned: outcomes.find(r => r.name === 'live-manifest').sha256 === inspection.after.find(f => f.path.endsWith('generated_20260805_prefer_scored_routed/manifest.json')).sha256,
  noUnverifiedProductionIdentityClaim: inspection.localFrontend.productionDeploymentIdentity === null && readme.includes('remain unverified in this inspection'),
  planOnlyActuallyExecuted: inspection.deploymentPlan.exitCode === 0 && inspection.deploymentPlan.stdout.includes('plan_only=true') && inspection.deploymentPlan.stdout.includes('deploy=not_started'),
  automaticGitDeployDisabledInRepo: JSON.parse(text('web/vercel.json')).git.deploymentEnabled === false,
  noPipelineCheckRecommendation: !/`uv run python run\.py check[^`]*`/.test(readme),
  explicitUnsafeReleaseHold: readme.includes('Release safety hold (T31)') && plan.includes('T31 immutable staging'),
  ownershipAndGateDiscoverable: ['### Ownership And Cadence', '### Failure And Rollback Rules', '### Free-Cap And Report Operations', '### Preserve And Recover Local Payloads'].every(h => readme.includes(h)),
  noBackupClaim: inspection.backupOrRestoreExercised === false && readme.includes('No data copy, migration, backup or restore was performed in T24.'),
  privateEnvNotRead: inspection.inventory.find(x => x.path === '.env').secretContentRead === false,
  oldEvidenceUnchanged: previous.length === 203983 && sha(previous) === 'f621549beb861749d86b0db6426571cbe6ed73a2f5e1755dc77ff2dd0d1a8a6f' && evidence.subarray(0, previous.length).equals(previous),
  repoIntegrity: integrity.status === 0 && integrity.stdout.includes('repo_integrity=ok'),
  diffWhitespace: whitespace.status === 0,
};
const sourcePaths = ['README.md', 'PRODUCT-PLAN.md', 'decisions.md', '.agents/STATE.md',
  'scripts/deploy-production.ps1', 'scripts/release-data-bundle.ps1', 'scripts/activate-data-bundle.ps1',
  'pipeline/publish.py', 'web/scripts/ensure-data-bundle.mjs', 'web/package.json',
  'web/lib/data.ts', 'web/lib/lamp-overlay.ts', 'web/public/sw.js', 'qa/SHIOK-acceptance-tests.md'];
const report = { base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), checks,
  checksPassed: Object.values(checks).filter(Boolean).length, checksTotal: Object.keys(checks).length,
  scope: 'Documentation/receipt checks, not new browser, pipeline, full project-suite, backup or production acceptance.',
  configurationInterpretation: { field: 'inspection.json:automaticGitDeploy', value: false,
    source: 'web/vercel.json checked-in setting only', remoteConfiguration: 'unverified' },
  commands: [{ command: 'python -B scripts/check_repo_integrity.py', exitCode: integrity.status, stdout: integrity.stdout, stderr: integrity.stderr },
    { command: 'git diff --check', exitCode: whitespace.status, stdout: whitespace.stdout, stderr: whitespace.stderr }],
  evidence: { path: evidencePath, previousBytes: previous.length, previousSha256: sha(previous), bytes: evidence.length, sha256: sha(evidence) },
  files: sourcePaths.map(path => ({ path, bytes: bytes(path).length, sha256: sha(bytes(path)) })),
  FINDINGS: ['Runbook assigns proposed ownership/cadences and explicit operational approval boundaries.',
    'Deploy preparation can write protected data and omit the lamp overlay; T31 repair precedes release.',
    'Live manifest matches pinned local metadata; production commit and complete shard/browser verification are not established.',
    'Git metadata coverage is not payload backup. Named P6/P7/P9 evidence directories remain absent; no copy or restore ran.'],
  DISAGREEMENTS: ['Confirmed deploy helpers are not presently a safe unchanged-artifact path.',
    'A local build or one manifest match cannot establish production deployment identity or rollback success.'] };
writeFileSync(resolve(root, qa, 'verification.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report));
if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
