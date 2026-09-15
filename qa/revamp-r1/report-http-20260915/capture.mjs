import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const here = resolve(root, 'qa/revamp-r1/report-http-20260915');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const evidence = readFileSync(resolve(root, 'qa/verification/REVAMP-R1-core-walk.md'));
const mode = process.argv[2];
assert.ok(['before', 'after'].includes(mode));
const weights = digest(readFileSync(resolve(root, 'pipeline/config/weights.yaml')));
assert.equal(weights, '5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec', `STOP weights hash=${weights}`);
const provenance = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-walks.provenance.json'), 'utf8'));
const anchors = Object.values(provenance.sources).map(source => {
  const bytes = readFileSync(resolve(root, source.path));
  const sha256 = digest(bytes);
  assert.equal(sha256, source.sha256, `STOP ${source.path} sha256=${sha256}`);
  assert.equal(bytes.length, source.bytes);
  return { path: source.path, bytes: bytes.length, sha256 };
});
const result = { mode, root, weights, anchors, evidencePrefix: { bytes: evidence.length, sha256: digest(evidence) } };
if (mode === 'after') {
  const before = JSON.parse(readFileSync(resolve(here, 'before.json'), 'utf8'));
  assert.deepEqual(anchors, before.anchors);
  assert.equal(digest(evidence.subarray(0, before.evidencePrefix.bytes)), before.evidencePrefix.sha256);
  result.evidenceOriginalPrefix = before.evidencePrefix;
  result.checks = readdirSync(here).filter(name => name.startsWith('checks-')).map(name => ({ name, ...JSON.parse(readFileSync(resolve(here, name, 'summary.json'), 'utf8')) }));
  result.pipelineRuns = 0;
  result.deployments = 0;
  result.remoteReportRequests = 0;
  result.retention = ['retention-5uSINW', 'retention-eH4VMW', 'retention-YWBTdv'].map(name => ({ name, ...JSON.parse(readFileSync(resolve(here, name, 'summary.json'), 'utf8')) }));
  result.managementRequests = result.retention.reduce((sum, record) => sum + record.requests.length, 0);
  result.managementCredential = 'Existing session credential explicitly passed to pinned-project helper; not assumed identical to previously supplied PAT; no credential saved.';
  const full = JSON.parse(readFileSync(resolve(here, 'checks-3c72vb/summary.json'), 'utf8'));
  assert.equal(full.exit, 0); assert.equal(full.sourceStable, true);
  assert.deepEqual(full.snapshotSources, full.sources);
  for (const [path, expected] of Object.entries(full.sources)) assert.equal(digest(readFileSync(resolve(root, path))), expected);
  const stdout = readFileSync(resolve(here, 'checks-3c72vb/stdout.txt'), 'utf8');
  result.validation = { focused: 308, focusedFiles: 5, full: Number(stdout.match(/Tests\s+(\d+) passed/)[1]), fullFiles: Number(stdout.match(/Test Files\s+(\d+) passed/)[1]), dependencyGuards: 42, docsTests: 41, types: 'pass', fullSourceStable: true };
  result.supersededFull = 'checks-woS150 used snapshot63D8RA before the midnight regression and client module. Its post-run source list is not execution identity; final checks-3c72vb explicitly compares snapshot and stable current source hashes.';
  result.findings = [
    'The default-disabled report POST endpoint now bounds same-origin wire input, trusted-ingress HMAC quotas and upload/storage deadlines.',
    'Inherited generic503 handling lost commit uncertainty; only the exact RPC admission rejection is now definite unavailability.',
    'Warm-instance request throttling is not a distributed request budget; global abuse, cleanup and moderator acceptance remain before activation.',
    'Core-map release does not depend on activating reports, but retained preview is not an exact deployable candidate.',
    'Independent review caught cumulative uncertainty lost on denied retry. Its predicted Origin:null Chrome failure was not reproduced; both loopback options sent correctOrigin/noReferer, and the failure claim is withdrawn.',
    'Approved30-day expiry is applied and database-tested, but physical cleanup/tombstone and moderation acceptance remain unfinished.',
  ];
  result.disagreements = ['Build-and-ship approval is not evidence of completed release checks or a waiver of protected-data and physical-device gates.'];
}
writeFileSync(resolve(here, `${mode}.json`), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(result, null, 2));
