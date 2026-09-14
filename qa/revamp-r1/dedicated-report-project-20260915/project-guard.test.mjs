import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
for (const project of [undefined, 'ajvenxqkedajbrbnnfko', 'aaaaaaaaaaaaaaaaaaaa']) {
  test(`setup rejects unapproved/missing project ${project ?? 'missing'} before IO`, () => {
    const source = `
      import fs from 'node:fs'; import { syncBuiltinESMExports } from 'node:module';
      fs.mkdtempSync = () => { throw new Error('UNEXPECTED_WRITE'); };
      syncBuiltinESMExports(); globalThis.fetch = () => { throw new Error('UNEXPECTED_REQUEST'); };
      process.argv = ['node', 'project.mjs', '--mode', 'inspect', ...${JSON.stringify(project ? ['--project', project] : [])}];
      try { await import('file:///C:/sgSHIOK2026/qa/revamp-r1/dedicated-report-project-20260915/project.mjs'); process.exitCode = 2; }
      catch (e) { if (!e.message.includes('Explicit owner-approved project confirmation required')) throw e; console.log('TARGET_REJECTED_BEFORE_IO'); }
    `;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: root, windowsHide: true, encoding: 'utf8', timeout: 15000 });
    assert.equal(run.status, 0, run.stderr); assert.equal(run.stdout.trim(), 'TARGET_REJECTED_BEFORE_IO');
  });
}
