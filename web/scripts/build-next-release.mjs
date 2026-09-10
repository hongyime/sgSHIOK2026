import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyFrontendRetention } from './frontend-retention.mjs';

/** @param {string} webRoot @param {() => {status: number | null, error?: Error}} [runBuild] */
export function buildFrontendRelease(webRoot, runBuild = () => spawnSync(process.execPath,
  [resolve(webRoot, 'node_modules/next/dist/bin/next'), 'build'],
  { cwd: webRoot, stdio: 'inherit', windowsHide: true })) {
  const before = verifyFrontendRetention(webRoot);
  const result = runBuild();
  if (result.error || result.status !== 0) throw Error('DIRECT_NEXT_BUILD_FAILED');
  const after = verifyFrontendRetention(webRoot, { requireBuild: true });
  if (before.manifestSha256 !== after.manifestSha256) throw Error('RETENTION_MANIFEST_CHANGED_DURING_BUILD');
  return { built: true, retention: after };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3 || process.argv[2] !== 'build') throw Error('Explicit build command required');
  console.log(JSON.stringify(buildFrontendRelease(dirname(dirname(fileURLToPath(import.meta.url))))));
}
