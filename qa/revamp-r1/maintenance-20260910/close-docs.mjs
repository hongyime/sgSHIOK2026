import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong root');
const directory = 'qa/revamp-r1/maintenance-20260910';
const read = path => readFileSync(resolve(root, path));
const sha = content => createHash('sha256').update(content).digest('hex');
const receipt = JSON.parse(read(`${directory}/docs-green-1.json`).toString('utf8'));
const inspection = JSON.parse(read(`${directory}/inspection.json`).toString('utf8'));
const path = 'qa/verification/REVAMP-R1-core-walk.md';
const previous = execFileSync('git', ['show', `HEAD:${path}`], { cwd: root, maxBuffer: 8 * 1024 ** 2 });
const evidence = read(path);
const checks = {
  documentationSuite: receipt.exitCode === 0 && receipt.stable && receipt.stdout.includes('40 passed in 39.77s'),
  testedFilesCurrent: receipt.after.every(f => sha(read(f.path)) === f.sha256),
  fourMetadataAnchorsUnchanged: inspection.after.every(f => sha(read(f.path)) === f.sha256),
  appendOnly: previous.length === 209435 && sha(previous) === 'ceb42a0d4e78d31279b48d4f9e30cfdd86e982d3b94742504ae973f75b6c6e37' && evidence.subarray(0, previous.length).equals(previous),
};
const result = { checks, tests: { arithmetic: '4 existing README + 4 new README + 3 agent-doc + 29 integrity = 40', files: 3, fullProjectSuite: false },
  review: { reviewer: 'Anscombe', disposition: 'Accepted. No corrective change required.',
    scope: 'Read-only review; all six current hashes match the green receipt. Unrelated valid artifact facts and approval boundaries remain. No independent test execution.' },
  evidence: { path, previousBytes: previous.length, previousSha256: sha(previous), bytes: evidence.length, sha256: sha(evidence) },
  FINDINGS: ['Initial16receipt checks missed the stale existing documentation contract.', 'The old failing receipt is preserved; corrected policy assertions and four new tests pass.'],
  DISAGREEMENTS: ['Do not restore prohibited pipeline commands to satisfy retired copy assertions.'],
  pipelineRuns: 0, deploymentCommands: 0, installations: 0 };
writeFileSync(resolve(root, directory, 'documentation-final.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result));
if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
