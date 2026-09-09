import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { hostname } from 'node:os';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const qa = 'qa/revamp-r1/source-monitor-20260909';
const live = 'qa/source-monitor/live-review-1';
const bytes = path => readFileSync(resolve(root, path));
const json = path => JSON.parse(bytes(path).toString('utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const tests = json(`${qa}/review-fixes-green-2/checks.json`);
const command = json(`${qa}/live-review-1/command.json`);
const report = json(`${live}/report.json`), stateBytes = bytes(`${live}/state.json`);
const state = JSON.parse(stateBytes.toString('utf8'));
const observations = bytes(`${live}/observations.jsonl`).toString('utf8').trim().split('\n').map(JSON.parse);
const catalog = json('source-metadata-catalog.json');
const identities = tests.after.map(({ path }) => ({ path, sha256: sha(bytes(path)) }));
const liveIdentities = command.after.map(({ path }) => ({ path, sha256: sha(bytes(path)) }));
const outcomes = {};
for (const source of report.sources) outcomes[source.result.outcome] = (outcomes[source.result.outcome] ?? 0) + 1;
const sortedEntries = value => Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
const previous = execFileSync('git', ['show', 'HEAD:qa/verification/REVAMP-R1-core-walk.md'], { cwd: root, maxBuffer: 8 * 1024 ** 2 });
const evidence = bytes('qa/verification/REVAMP-R1-core-walk.md');
const integrity = spawnSync('python', ['-B', 'scripts/check_repo_integrity.py'], {
  cwd: root, encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
});
const checks = {
  testsPassed: tests.exitCode === 0 && tests.stable && /253 passed in 32.59s/.test(tests.stdout),
  testedSourcesUnchanged: same(identities, tests.after),
  liveSourcesAndInputsUnchanged: command.identitiesStable && same(command.before, command.after) && same(liveIdentities, command.after),
  exactLocalInputAnchors: Object.entries(catalog.anchors).every(([path, expected]) => sha(bytes(path)) === expected),
  catalogIdentity: report.catalogSha256 === sha(bytes('source-metadata-catalog.json')) && state.catalogSha256 === report.catalogSha256,
  reportPublication: bytes(`${live}/report.json`).equals(bytes(`${live}/report.pending.json`)),
  stateCompletion: report.persistence.status === 'verified' && report.persistence.stateSha256 === sha(stateBytes) && report.finishedAt === state.finishedAt,
  recordedAttention: command.exitCode === 1 && report.exitCode === 1 && report.runStatus === 'attention_required' && report.checkCompleted,
  exactOutcomeCounts: same(sortedEntries(outcomes), sortedEntries(report.counts.outcomes)) && report.sources.length === 24,
  exactAttemptCount: report.sources.filter(s => s.result.attempted).length === report.counts.attempted && report.counts.attempted === 14,
  reportMatchesJournal: same(observations, report.sources),
  reportMatchesState: report.sources.every(s => same(s.state, state.sources[s.key])) && Object.keys(state.sources).length === 24,
  noDeliveredNoticeClaim: report.noticeDelivery === 'not_configured' && report.pendingNotices.length === 16,
  integrityPassed: integrity.status === 0 && integrity.stdout.includes('repo_integrity=ok') && report.integrity.status === 'ok',
  evidenceAppendOnly: previous.length === 197711 && sha(previous) === '5eb291a0c1b2bbabdd5220d302251e86b27e263f771c2364eddeda531318cf8c' && evidence.subarray(0, previous.length).equals(previous),
};
const receipts = ['http-review-red-1', 'http-review-green-1', 'persistence-red-1', 'persistence-green-1',
  'persistence-green-2', 'review-fixes-green-1', 'report-publication-red-1', 'review-fixes-green-2'].map(name => {
  const path = `${qa}/${name}/checks.json`, content = bytes(path), receipt = JSON.parse(content.toString('utf8'));
  return { path, bytes: content.length, sha256: sha(content), exitCode: receipt.exitCode, stable: receipt.stable,
    result: receipt.stdout.split(/\r?\n/).filter(line => /(?:passed|failed|errors).*in /.test(line)).at(-1) };
});
const summary = {
  root, hostname: hostname(), base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  checks, identities, liveIdentities, receipts,
  tests: { count: 253, files: 4, arithmetic: '31 catalog + 61 CLI + 76 HTTP + 85 state = 253', fullProjectSuite: false },
  live: { output: live, commandReceipt: `${qa}/live-review-1/command.json`, exitCode: report.exitCode,
    wrapperSeconds: command.elapsedMs / 1000, checkerSeconds: report.elapsedSeconds,
    outcomeArithmetic: '12 observed + 2 timeout + 3 credentials_required + 3 manual + 4 unsupported = 24',
    attemptArithmetic: '12 observed + 2 timeout = 14', bounds: report.bounds, transport: report.transport,
    stateSha256: sha(stateBytes), reportSha256: sha(bytes(`${live}/report.json`)),
    sources: report.sources.map(s => ({ key: s.key, outcome: s.result.outcome, reason: s.result.reason ?? null,
      baselineFreshness: s.state.freshness.status, observedFreshness: s.state.observedFreshness.status })),
    scheduled: false, noticeDelivery: report.noticeDelivery, pendingNotices: report.pendingNotices.length },
  integrity: { command: 'python -B scripts/check_repo_integrity.py', exitCode: integrity.status, stdout: integrity.stdout, stderr: integrity.stderr },
  evidence: { path: 'qa/verification/REVAMP-R1-core-walk.md', previousBytes: previous.length, previousSha256: sha(previous), bytes: evidence.length, sha256: sha(evidence) },
  FINDINGS: ['The exact metadata representation mismatch was resolved without protected writes.',
    'Received 429 cooldown loss and premature completion were real defects, now regression-tested.',
    'Direct final-report persistence was insufficient; seven additional failures drove staged publication.',
    '253 focused tests pass with stable source identities; one live metadata pass correctly returns attention.',
    'T23 remains partial: no scheduled execution, external state or actual notice delivery is claimed.'],
  DISAGREEMENTS: ['Parseable success JSON does not prove completed persistence.',
    'Current metadata observations do not make frozen inputs current or prove changed payload bytes.'],
  pipelineRuns: 0, datasetDownloads: 0, protectedInputWrites: 0, installations: 0, deployments: 0,
};
writeFileSync(resolve(root, qa, 'review-fixes-summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(summary));
if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
