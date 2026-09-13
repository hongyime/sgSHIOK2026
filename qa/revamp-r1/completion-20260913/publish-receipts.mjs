import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const out = resolve(root, 'qa/revamp-r1/completion-20260913');
const privateOut = resolve(root, 'tmp/completion-20260913-private');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const index = JSON.parse(readFileSync(resolve(out, 'artifact-index.json')));
const names = ['release-audit.json', 'summary.json', 'artifact-index.json'];
const originals = Object.fromEntries(names.map(name => [name, readFileSync(resolve(out, name))]));
for (const name of names.slice(0, 2)) {
  const entry = index.artifacts.find(a => a.path.endsWith('/' + name));
  assert.equal(hash(originals[name]), entry.sha256, name);
}
mkdirSync(privateOut, { recursive: true });
for (const name of names) writeFileSync(resolve(privateOut, name), originals[name], { flag: 'wx' });

const audit = JSON.parse(originals['release-audit.json']);
const project = JSON.parse(audit.command_evidence[5].raw_text_blocks[0]);
const deploymentResponse = JSON.parse(audit.command_evidence[6].raw_text_blocks[0]);
const deployment = deploymentResponse.deployment;
assert.equal(deployment.id, 'dpl_wVnDeskyK666GwYUKWzY2aserkJR');
assert.equal(deployment.meta.gitDirty, '1');
const redacted = '[REDACTED: private account metadata]';
project.accountId = redacted;
project.latestDeployment.url = redacted;
project.domains = project.domains.map(domain => domain === 'sgshiok.vercel.app' ? domain : redacted);
deployment.url = redacted;
deployment.creator = { uid: redacted, username: redacted };
for (const key of ['githubCommitAuthorName', 'githubCommitAuthorEmail', 'actor']) {
  if (key in deployment.meta) deployment.meta[key] = redacted;
}
deployment.alias = deployment.alias.map(domain => domain === 'sgshiok.vercel.app' ? domain : redacted);
const transformed = [[5, project], [6, deploymentResponse]];
for (const [i, value] of transformed) {
  audit.command_evidence[i].raw_text_blocks[0] = JSON.stringify(value, null, 2);
  audit.command_evidence[i].publication_redaction =
    'Account IDs, creator/author identity and account-specific URLs redacted; this block is not byte-for-byte raw output.';
}
audit.publication_redactions = {
  reason: 'Pre-commit identity scan rejected the original account metadata. The privacy guard was not bypassed.',
  commandEvidenceIndices: [5, 6],
  deploymentIdAndCommitAndDirtyStatusUnchanged: true,
  originalSha256: hash(originals['release-audit.json']),
  originalRetainedLocallyNotPublished: 'tmp/completion-20260913-private/release-audit.json',
};
const summary = JSON.parse(originals['summary.json']);
summary.receiptPublication = {
  privacyGate: 'First final-commit attempt rejected private account metadata; audit outputs 5 and 6 are explicitly redacted.',
  originalAuditSha256: hash(originals['release-audit.json']),
  rawUnredactedAuditPublished: false,
  appSourceOrTestResultsChanged: false,
};
writeFileSync(resolve(out, 'release-audit.json'), JSON.stringify(audit, null, 2) + '\n');
writeFileSync(resolve(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
for (const name of ['.gitattributes', 'publish-receipts.mjs']) {
  const path = relative(root, resolve(out, name)).replaceAll('\\', '/');
  assert.ok(!index.artifacts.some(a => a.path === path));
  index.artifacts.push({ path, committedPath: path, losslessGzip: false });
}
for (const entry of index.artifacts) {
  const raw = readFileSync(resolve(root, entry.path));
  const committed = readFileSync(resolve(root, entry.committedPath));
  Object.assign(entry, { bytes: raw.length, sha256: hash(raw),
    committedBytes: committed.length, committedSha256: hash(committed) });
}
index.publicationNote = 'Regenerated after explicit privacy redactions; original index retained privately, not published as the current index.';
writeFileSync(resolve(out, 'artifact-index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(JSON.stringify({ redactedCommandBlocks: transformed.length, artifacts: index.artifacts.length,
  privateOriginalsPublished: false, privacyGuardBypassed: false }));
