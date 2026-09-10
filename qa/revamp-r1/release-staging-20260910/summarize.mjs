import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { hostname } from 'node:os';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const directory = 'qa/revamp-r1/release-staging-20260910';
const output = resolve(root, directory, 'summary.json');
if (existsSync(output)) throw Error('Preserve existing receipt');
const bytes = path => readFileSync(resolve(root, path));
const sha = value => createHash('sha256').update(value).digest('hex');
const read = path => JSON.parse(bytes(path));
const parentPath = `${directory}/parent-final-3.json`, parent = read(parentPath);
const aPath = `${directory}/a-current-summary-1/checks.json`, agent = read(aPath);
const current = parent.after.map(entry => ({ ...entry, actual: sha(bytes(entry.path)) }));
if (parent.exitCode !== 0 || !parent.stable || !/144 passed/.test(parent.stdout)
  || current.some(entry => entry.sha256 !== entry.actual)) throw Error('Parent acceptance mismatch');
const ids = agent.groups.flatMap(group => group.nodeids);
if (ids.length !== 58 || new Set(ids).size !== 58 || agent.groups.some(group => group.exitCode !== 0 || !group.stable)) throw Error('Staging acceptance mismatch');
for (const [path, expected] of Object.entries(agent.currentHashes)) {
  if (sha(bytes(path)) !== expected) throw Error(`Changed staging source: ${path}`);
}
const syntheticExports = ['parent-red-1', 'parent-green-1'].map(label => {
  const path = `tmp/release-parent-${label}/test_publish_preflight_accepts0/data/manifest.json`;
  const content = bytes(path), manifest = JSON.parse(content);
  if (manifest.provenance.record_count !== 1) throw Error('Unexpected synthetic export record count');
  return { attempt: label, path, bytes: content.length, sha256: sha(content), manifest };
});
const receipt = {
  root, hostname: hostname(), base: '8fa20c0e30ea51f40899666ab5c006c60023abd4',
  parent: { path: parentPath, sha256: sha(bytes(parentPath)), passed: 144, exitCode: parent.exitCode,
    stdout: parent.stdout, watchedSourceCount: current.length, currentSourceIdentities: current },
  staging: { path: aPath, sha256: sha(bytes(aPath)), passed: 58, uniqueNodeIds: new Set(ids).size,
    groups: agent.groups.map(group => ({ group: group.group, passed: group.passed, receipt: group.receipt, receiptSha256: group.receiptSha256 })) },
  total: { arithmetic: '73 publish + 24 wrappers + 5 process + 8 README + 3 agent docs + 29 integrity + 2 runner + 58 staging = 202', passed: 202, files: 8 },
  priorFailures: ['parent-red-1', 'parent-green-1', 'parent-final-1', 'parent-final-2',
    'a-red-1', 'a-green-1', 'a-green-2', 'a-green-3', 'a-pin-red-1', 'a-current-races-1'],
  incident: { syntheticExportCalls: 2, exportedFixtureRecords: '1 + 1 = 2', separateExportTiming: 'not instrumented',
    cause: 'Parent used partial Get-Content session output as a complete file, replacing imports but leaving the legacy exporter-backed test suffix.',
    correction: 'Drain reads fully; remove legacy suffix; pre-run source guard and runtime forbidden exporter module; preserve both receipts and synthetic manifests.', syntheticExports },
  findings: [
    'Committed source and both required artifacts are staged with byte identities; existing gzip bytes are preserved and missing/changed inputs block without repair.',
    'Reviewed target IDs, explicit root/config and production data metadata checks precede submission; incomplete metadata fails closed.',
    'Preparation is not readiness; provider READY is not production smoke. Unknown submission outcomes are not retried by the caller.',
    'Windows owned-job timeout, assignment failure, termination failure and normal-exit child cleanup have executed harmless fixtures.',
    'Two unintended synthetic export setup calls violated the zero-export constraint. No zero-pipeline claim is made for this turn.',
  ],
  disagreements: [
    'A passing fixture suite cannot prove installed CLI compatibility, real staging/build, deployment, cache upgrade or production rollback.',
    'The selected 202 passing tests are not the full Python or web suites; the full Python suite still contains exporter-backed tests and was not run.',
  ],
  limits: { realArtifactStaging: false, actualBuild: false, installedDependencies: false, deployment: false,
    browserRerun: false, fullProtectedPayloadAudit: false, allBacklogComplete: false },
};
writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, tests: receipt.total, syntheticExportCalls: syntheticExports.length, watchedSources: current.length }));
