import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const reports = [];
for (const [name, command, args] of [
  ['capture-contracts', process.execPath, ['--test', resolve(root, 'qa/revamp-r1/retained-current-20260912/capture-state.test.mjs')]],
  ['integrity', resolve(root, '.venv/Scripts/python.exe'), ['-B', resolve(root, 'scripts/check_repo_integrity.py')]],
]) {
  const start = Date.now(); let stdout = '', stderr = '', code = 0;
  try { stdout = execFileSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 }); }
  catch (error) { stdout = error.stdout?.toString() ?? ''; stderr = error.stderr?.toString() ?? error.message; code = error.status ?? 1; }
  const report = { name, command, args, stdout, stderr, exitCode: code, elapsedMs: Date.now() - start };
  reports.push(report); console.log(JSON.stringify(report));
}
writeFileSync(resolve(root, 'qa/revamp-r1/retained-current-20260912/checks.json'), JSON.stringify(reports, null, 2) + '\n', { flag: 'wx' });
assert.ok(reports.every(r => r.exitCode === 0));
