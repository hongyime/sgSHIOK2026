import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
process.env.PYTHONDONTWRITEBYTECODE = '1';
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/report-provider-20260914/checks-'));
const hash = data => createHash('sha256').update(data).digest('hex');
const evidence = readFileSync(resolve(root, 'qa/verification/REVAMP-R1-core-walk.md'));
assert.equal(hash(evidence.subarray(0, 442163)), '1ac691827104c7b30a609f24a48286a737eb36ec32c9c0358c31064794c49243');
const anchors = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/weekly-metadata-20260914/summary.public.json'), 'utf8')).anchors;
const weights = hash(readFileSync(resolve(root, 'pipeline/config/weights.yaml')));
assert.equal(weights, '5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
const commands = [
  ['.venv/Scripts/python.exe', '-B', '-m', 'pytest', 'tests/test_readme.py', 'tests/test_agent_docs.py', 'tests/test_repo_integrity.py', '-q', '-p', 'no:cacheprovider'],
  ['.venv/Scripts/python.exe', '-B', 'scripts/check_repo_integrity.py'],
];
const checks = [];
for (const [index, [executable, ...args]] of commands.entries()) {
  const start = Date.now();
  const result = spawnSync(resolve(root, executable), args, { cwd: root, windowsHide: true, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  for (const stream of ['stdout', 'stderr']) writeFileSync(resolve(out, `${index}.${stream}.txt`), result[stream] ?? '', { flag: 'wx' });
  checks.push({ command: [executable, ...args], exit: result.status, elapsedMs: Date.now() - start, error: result.error?.code ?? null, stdout: `${index}.stdout.txt`, stderr: `${index}.stderr.txt` });
  console.log(result.stdout);
  if (result.status !== 0) { console.log(result.stderr); break; }
}
const summary = {
  root, baseline: 'c152a55b419a8653d069dceee61ddef9ab7ebcd9',
  checks, evidencePrefix: { bytes: 442163, sha256: hash(evidence.subarray(0, 442163)) },
  weights, priorAnchorCount: anchors?.length ?? null,
  scope: 'Approval/setup documentation and documentation regression tests only. No application or backend implementation in this checkpoint.',
  observations: {
    supabaseCliVersion: '2.111.0', configuredSupabaseEnvNames: 0, supabaseProjectConfig: false,
    projectList: { command: 'supabase projects list -o json', exit: 0, shiokNamedMatches: 0, stderr: 'Cannot find project ref. Have you run supabase link?', limitation: 'Other names/accounts not ruled out. Private account resources not published.' },
    firstListAttempt: 'CLI --output-format json invocation was not JSON-parseable after merging stderr. Not used as proof of project absence.',
    dockerServer: 'Unavailable: dockerDesktopLinuxEngine pipe missing. Not started or installed.',
    ownerBrowser: 'Desktop Chrome with resized viewport; not physical-phone acceptance.',
    providerApproval: 'Supabase Free for private resident reports; no Cloudflare or paid upgrades.',
  },
  pipelineRuns: 0, deployments: 0, remoteSchemasCreated: 0, residentReportsStored: 0,
  findings: ['Supabase Free provider choice is settled.', 'No SHIOK-named project was identified or configured; intended project still needs owner identification.', 'The existing 79 reporting contract tests do not establish a durable private service.'],
  disagreements: ['Earlier physical-phone participation inference is corrected to desktop Chrome viewport testing.'],
};
writeFileSync(resolve(out, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ out, ...summary }, null, 2));
process.exitCode = checks.length === commands.length && checks.every(check => check.exit === 0) ? 0 : 1;
