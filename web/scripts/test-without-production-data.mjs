import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Copy tracked working-tree source only. No clone, download, payload move or install.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const temporaryRoot = join(root, 'tmp');
mkdirSync(temporaryRoot, { recursive: true });
const snapshot = mkdtempSync(join(temporaryRoot, 'test-without-data-'));
const files = execFileSync('git', ['ls-files', '-z', '--', 'web', 'scripts', '.gitignore', '.vercelignore', 'pipeline/config/weights.yaml'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(file => file && !file.startsWith('web/public/data/'));
for (const file of files) {
  const destination = resolve(snapshot, file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(resolve(root, file), destination);
}
const isolatedWeb = join(snapshot, 'web');
const isolatedData = join(isolatedWeb, 'public/data');
if (existsSync(isolatedData)) throw new Error('Production data unexpectedly copied');
symlinkSync(join(root, 'web/node_modules'), join(isolatedWeb, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
const forbidden = [join(root, 'web/public/data'), isolatedData];
const guard = join(root, 'web/scripts/deny-production-data.cjs');
const env = {
  ...process.env,
  SHIOK_FORBIDDEN_DATA_PATHS: JSON.stringify(forbidden),
  NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require ${JSON.stringify(guard)}`,
};
// Prove the guard blocks both the real payload path and the absent snapshot path.
const probe = spawnSync(process.execPath, ['-e', `const fs=require('node:fs');for(const p of JSON.parse(process.env.SHIOK_FORBIDDEN_DATA_PATHS)){try{fs.readFileSync(p+'/manifest.json');process.exit(2)}catch(e){if(e.code!=='SHIOK_TEST_PRODUCTION_DATA_DENIED')throw e}}`], { env, encoding: 'utf8' });
if (probe.status !== 0) throw new Error(`Isolation guard probe failed: ${probe.stderr}`);
const args = process.argv.slice(2);
const result = spawnSync(process.execPath, [join(isolatedWeb, 'scripts/test-web.mjs'), ...args], { cwd: isolatedWeb, env, stdio: 'inherit' });
const report = { snapshot, copiedFiles: files.length, productionDataDirectoryAbsent: true, guardProbePassed: true, forbiddenPaths: forbidden, dependencies: 'Existing node_modules linked; no installation', testArgs: args, exitCode: result.status, error: result.error?.message };
writeFileSync(join(snapshot, 'isolation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(result.status ?? 1);
