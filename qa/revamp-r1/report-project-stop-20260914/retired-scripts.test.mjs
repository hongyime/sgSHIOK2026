import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
for (const name of ['database-check.mjs', 'apply-schema.mjs', 'inspect-installed.mjs']) {
  test(`${name} refuses before filesystem writes or provider requests`, () => {
    const file = pathToFileURL(resolve(root, 'qa/revamp-r1/report-storage-20260914', name)).href;
    const source = `
      import fs from 'node:fs';
      import { syncBuiltinESMExports } from 'node:module';
      const forbidden = () => { throw new Error('Unexpected side effect'); };
      fs.mkdtempSync = forbidden;
      fs.writeFileSync = forbidden;
      syncBuiltinESMExports();
      globalThis.fetch = forbidden;
      process.argv[2] = '--apply-disabled-reviewed-schema';
      try {
        await import(${JSON.stringify(file)});
        process.exitCode = 2;
      } catch (error) {
        if (error.message !== 'RETIRED: sgbuslaobu is not a SHIOK project. No access permitted.') throw error;
        console.log('RETIRED_WITHOUT_IO');
      }
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
      cwd: root, windowsHide: true, encoding: 'utf8', timeout: 15000,
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: 'unused-synthetic-test' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'RETIRED_WITHOUT_IO');
  });
}
