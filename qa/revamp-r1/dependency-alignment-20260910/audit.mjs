import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const base = '15a32e2a53ad0f42aa2d58af83b22b92ec749001';
const directory = 'qa/revamp-r1/dependency-alignment-20260910';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(resolve(root, path));
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const labels = ['red-1', 'green-1', 'green-2', 'green-3', 'null-red-1',
  'final-contracts-1', 'final-contracts-2', 'actual-1', 'actual-2',
  'qa-build-refusal-1', 'release-refusal-1', 'types-1', 'integrity-1'];
const reports = new Map(labels.map(label => [label, JSON.parse(read(`${directory}/${label}/command.json`))]));
const finalLabels = ['final-contracts-2', 'actual-2', 'qa-build-refusal-1', 'release-refusal-1', 'types-1', 'integrity-1'];
for (const label of finalLabels) {
  const report = reports.get(label);
  assert.equal(report.base, base);
  assert.equal(report.error, undefined);
  assert.equal(report.unchanged, true);
  assert.equal(report.sources.length, 8);
  for (const source of report.sources) assert.equal(sha(read(source.path)), source.sha256, `${label}: ${source.path}`);
  assert.equal(report.anchorsAfter.length, 11);
  for (const anchor of report.anchorsAfter) {
    assert.equal(anchor.actual, anchor.expected);
    assert.equal(sha(read(anchor.path)), anchor.expected);
  }
  assert.equal(report.exitCode, ['actual-2', 'qa-build-refusal-1', 'release-refusal-1'].includes(label) ? 1 : 0);
}
assert.match(reports.get('final-contracts-2').stdout, /tests 42/);
assert.match(reports.get('final-contracts-2').stdout, /pass 42/);
assert.match(reports.get('final-contracts-2').stdout, /fail 0/);
for (const label of ['actual-2', 'qa-build-refusal-1', 'release-refusal-1']) {
  const report = reports.get(label);
  assert.equal(report.stdout, '');
  const lines = report.stderr.trim().split('\n');
  assert.equal(lines.shift(), 'installed_dependencies=failed');
  assert.deepEqual(lines.map(line => JSON.parse(line)), [
    { signal: 'installed_version_mismatch', name: 'maplibre-gl', locked: '6.4.1', installed: '6.1.0' },
    { signal: 'installed_version_mismatch', name: 'next', locked: '16.3.3', installed: '16.3.0' },
    { signal: 'installed_version_mismatch', name: 'vitest', locked: '4.1.11', installed: '4.1.10' },
  ]);
}
assert.equal(reports.get('qa-build-refusal-1').forbiddenBuildOutputs.length, 2);
assert.ok(reports.get('qa-build-refusal-1').forbiddenBuildOutputs.every(item => !item.exists));
assert.equal(reports.get('integrity-1').stdout.trim(), 'repo_integrity=ok');
const originalPackage = JSON.parse(git(['show', `${base}:web/package.json`]));
const currentPackage = JSON.parse(read('web/package.json'));
const currentBuild = currentPackage.scripts.build;
currentPackage.scripts.build = originalPackage.scripts.build;
assert.deepEqual(currentPackage, originalPackage);
assert.ok(read('web/package-lock.json').equals(git(['show', `${base}:web/package-lock.json`])));
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const originalEvidence = git(['show', `${base}:${evidencePath}`]);
const evidence = read(evidencePath);
assert.ok(evidence.subarray(0, originalEvidence.length).equals(originalEvidence), 'Evidence must be append-only');
const changed = git(['diff', '--name-only', base, '--']).toString().trim().split('\n').filter(Boolean);
const protectedPattern = /^(pipeline\/config\/weights\.yaml$|raw\/|processed\/|web\/public\/data\/|checksums\.json$|qa\/(?:p[6-9]_|p10_|p11\/d_|releases\/))/;
assert.deepEqual(changed.filter(path => protectedPattern.test(path)), []);
const summary = {
  root, hostname: process.env.COMPUTERNAME, base,
  receiptAudit: finalLabels.map(label => ({ label, exitCode: reports.get(label).exitCode,
    matchingSources: 8, matchingProtectedAnchors: 11 })),
  contracts: { passed: 42, failed: 0, skipped: 0, framework: 'node:test' },
  attempts: labels.map(label => ({ label, mode: reports.get(label).mode, exitCode: reports.get(label).exitCode,
    counts: reports.get(label).stdout.split('\n').filter(line => /(?:tests|pass|fail|skipped) \d+$/.test(line)) })),
  lockUnchangedSha256: sha(read('web/package-lock.json')), buildCommand: currentBuild,
  evidence: { path: evidencePath, originalBytes: originalEvidence.length, originalSha256: sha(originalEvidence),
    originalPrefixUnchanged: true, appendedBytes: evidence.length - originalEvidence.length },
  findings: [
    'Three direct installed versions differ from the merged lock; previous 1765/64 web validation belongs to the pre-merge dependency state.',
    'Test, package build, direct release CLI and QA snapshot entry points now check direct installed versions before their work. This is not a transitive or file-integrity audit.',
    '42 dependency-free contracts pass. Real test/release/QA entry points refuse with the exact three mismatch signals. QA refusal creates neither snapshot nor build output. Installed TypeScript and repository integrity pass.',
    'Preserved red receipts expose the original false-green path, inherited NODE_TEST_CONTEXT hiding a child native suite, and explicit null metadata being mistaken for omitted sections. These defects were corrected and tested.',
    'Source review is parent-only because peer quota is exhausted. No new browser acceptance, dependency install, real build, deployment, pipeline run or protected-data write is claimed. Existing preview is unchanged.',
  ],
  disagreements: [
    'Passing TypeScript or old-library tests cannot certify the new lock or its worker. Do not bypass the refusal to obtain a green full-suite count. Dependency/worker alignment still needs the pending installation decision.',
  ],
};
const destination = resolve(root, directory, 'summary.json');
writeFileSync(destination, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(summary, null, 2));
