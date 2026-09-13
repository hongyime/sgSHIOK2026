import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const prefix = 'qa/revamp-r1/report-lifecycle-20260913';
const read = p => readFileSync(resolve(root, p));
const json = p => JSON.parse(read(`${prefix}/${p}`));
const sha = b => createHash('sha256').update(b).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: root, windowsHide: true, maxBuffer: 32000000 });
const summary = json('summary.json');
const differences = [];
for (const source of summary.sources) {
  const disk = read(source.path), index = git('show', ':' + source.path);
  assert.equal(sha(disk), source.sha256, 'Raw tested bytes: ' + source.path);
  assert.equal(sha(readFileSync(resolve(summary.tests.full.isolation.snapshot, source.path))), source.sha256);
  if (disk.equals(index)) continue;
  const normalized = Buffer.from(disk.toString('utf8').replace(/\r\n/g, '\n'));
  assert.ok(normalized.equals(index), 'STOP: not solely CRLF normalization: ' + source.path);
  assert.ok(git('show', 'HEAD:' + source.path).equals(index), 'Existing source changed: ' + source.path);
  differences.push({ path: source.path, rawTestedBytes: disk.length, rawTestedSha256: sha(disk),
    indexBytes: index.length, indexSha256: sha(index),
    crlfSequences: disk.toString('utf8').split('\r\n').length - 1,
    normalizedEqualsIndex: true, headEqualsIndex: true });
}
const result = { sourceCount: summary.sources.length, rawEqualsIndexCount: summary.sources.length - differences.length,
  differences, classification: 'Raw tested bytes retained; in-memory CRLF normalization explains every Git-byte difference. No source normalization or input repair performed.',
  priorFailure: 'Raw-only index verifier failed on revamp-layout.test.ts. The later git diff --cached --check exited 0; that was not verifier success.' };
writeFileSync(resolve(root, prefix, 'git-source-bytes.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
summary.gitSourceBytes = result;
const before = git('show', summary.base + ':' + summary.evidence.path), after = read(summary.evidence.path);
assert.ok(before.equals(after.subarray(0, before.length)));
summary.evidence.bytes = after.length;
summary.evidence.addedBytes = after.length - before.length;
writeFileSync(resolve(root, prefix, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
const index = json('artifact-index.json'), paths = json('stage-paths.json');
for (const file of ['check-git-source-bytes.mjs', 'git-source-bytes.json']) {
  index.files.push({ path: prefix + '/' + file });
  paths.push(prefix + '/' + file);
}
for (const entry of index.files) { const b = read(entry.path); entry.bytes = b.length; entry.sha256 = sha(b); }
writeFileSync(resolve(root, prefix, 'artifact-index.json'), JSON.stringify(index, null, 2) + '\n');
writeFileSync(resolve(root, prefix, 'stage-paths.json'), JSON.stringify(paths, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
