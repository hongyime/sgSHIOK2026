import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026', label = process.argv[2];
if (process.cwd() !== root || !/^[a-z0-9-]+$/.test(label ?? '')) throw Error('Root/label required');
const output = resolve(root, `qa/revamp-r1/release-staging-20260910/${label}.json`);
if (existsSync(output)) throw Error('Fresh receipt required');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const anchors = [
  ['web/data-bundle.json', 360, 'd5ce7703d5ee6b39651947749f9bd2f4c6d642fe2af06e1d9324671ce8f009e8'],
  ['web/public/data/generated_20260805_prefer_scored_routed/manifest.json', 13626, '7108e66e70628f3211883402fc753c2f5809db5a822d6a2415f6ae6459a1070e'],
  ['web/public/data/lamp_posts_v1/manifest.json', 120620, '3e28d94c90cfdd03a72d26cc0cf9a3a4f37657e650b6ae94d8de2505124a9512'],
  ['raw/manifest.json', 11616, 'ad90df61621bea3d4a3cb207c012b988d2e9338e116ce521b00307198919ae5a'],
].map(([path, size, expected]) => {
  const bytes = readFileSync(resolve(root, path)), actual = sha(bytes);
  return { path, expectedBytes: size, bytes: bytes.length, expected, sha256: actual, ok: bytes.length === size && actual === expected };
});
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const evidence = readFileSync(resolve(root, evidencePath));
const prefix = { bytes: 211578, expected: '2292e00f2171b7cbde128dcce65318b8e96579f03f4fe1861fe814f23af4eee7' };
prefix.sha256 = sha(evidence.subarray(0, prefix.bytes));
prefix.ok = prefix.sha256 === prefix.expected;
const command = resolve(root, '.venv/Scripts/python.exe');
const args = ['-B', resolve(root, 'scripts/check_repo_integrity.py')];
const run = spawnSync(command, args, { cwd: root, windowsHide: true, encoding: 'utf8', timeout: 60000,
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', TEMP: resolve(root, 'tmp'), TMP: resolve(root, 'tmp') } });
const receipt = { command, args, exitCode: run.status, stdout: run.stdout, stderr: run.stderr,
  anchors, evidencePrefix: prefix, evidenceBytes: evidence.length,
  limits: 'Four metadata anchors and append-only prefix, not a new recursive protected-payload audit.',
  ok: run.status === 0 && anchors.every(entry => entry.ok) && prefix.ok };
writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(receipt));
if (!receipt.ok) process.exitCode = 1;
