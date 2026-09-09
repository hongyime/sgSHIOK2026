import { readFileSync, writeFileSync, lstatSync, readdirSync, realpathSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { hostname } from 'node:os';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const qa = 'qa/revamp-r1/maintenance-20260910';
const read = path => readFileSync(resolve(root, path));
const sha = value => createHash('sha256').update(value).digest('hex');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2 });
const tracked = new Set(git(['ls-files', '-z']).split('\0').filter(Boolean));
const config = JSON.parse(read('web/data-bundle.json'));
const manifestPath = `web/public/data/${config.bundle}/manifest.json`;
const expected = '7108e66e70628f3211883402fc753c2f5809db5a822d6a2415f6ae6459a1070e';
const anchors = ['web/data-bundle.json', manifestPath, 'web/public/data/lamp_posts_v1/manifest.json', 'raw/manifest.json'];
const hashes = () => anchors.map(path => ({ path, bytes: read(path).length, sha256: sha(read(path)) }));
const before = hashes();
if (before.find(f => f.path === manifestPath).sha256 !== expected) throw Error('STOP_INPUT_MISMATCH: published manifest');
const names = ['.env', 'raw', 'processed', 'data', 'web/public/data', 'qa/releases',
  'qa/p6_rerun_cost_20260812_102712', 'qa/p7_determinism_20260813',
  'qa/p8_provenance_repair_20260813', 'qa/p9_input_provenance_20260813',
  'qa/p10_network_provenance_20260813', 'checksums.json',
  ...readdirSync(resolve(root, 'qa/p11'), { withFileTypes: true }).filter(e => e.name.startsWith('d_')).map(e => `qa/p11/${e.name}`)];
const inventory = names.map(path => {
  try {
    const absolute = resolve(root, path), info = lstatSync(absolute);
    if (info.isSymbolicLink() || realpathSync(absolute) !== absolute) throw Error('Linked inventory path');
    return { path, present: true, kind: info.isDirectory() ? 'directory' : 'file',
      trackedPaths: [...tracked].filter(f => f === path || (info.isDirectory() && f.startsWith(`${path}/`))).length,
      recursivePayloadScan: false, secretContentRead: false };
  } catch (error) {
    if (error.code === 'ENOENT') return { path, present: false, trackedPaths: [...tracked].filter(f => f === path || f.startsWith(`${path}/`)).length };
    throw error;
  }
});
const buildPath = 'qa/revamp-r1/cached-release-20260908/source-freshness-20260909-1/build.json';
const build = JSON.parse(read(buildPath));
const sourceChecks = build.sources.map(f => ({ path: f.path, expected: f.sha256, actual: sha(read(f.path)) }));
const plan = spawnSync('powershell.exe', ['-NoProfile', '-File', resolve(root, 'scripts/deploy-production.ps1')], {
  cwd: root, encoding: 'utf8', timeout: 30000, windowsHide: true,
});
const remote = [];
for (const [name, url, limit, type] of [
  ['live-document', 'https://sgshiok.vercel.app/', 1024 * 1024, 'text/html'],
  ['live-manifest', `https://sgshiok.vercel.app/data/${config.bundle}/manifest.json`, 256 * 1024, 'application/json'],
]) {
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error',
      headers: { Accept: type, 'User-Agent': 'sgSHIOK-Maintenance-Read-Check/1.0' } });
    if (response.status !== 200 || !response.headers.get('content-type')?.startsWith(type)) {
      await response.body?.cancel();
      remote.push({ name, url, status: response.status, outcome: 'unexpected_status_or_type', elapsedMs: Date.now() - started });
      break;
    }
    const reader = response.body.getReader(), chunks = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) { await reader.cancel(); throw Error('Response exceeds read budget'); }
      chunks.push(value);
    }
    const content = Buffer.concat(chunks), path = `${qa}/${name}.${name === 'live-document' ? 'html' : 'json'}`;
    writeFileSync(resolve(root, path), content, { flag: 'wx' });
    const receipt = { name, url, status: response.status, outcome: 'read', bytes: content.length,
      sha256: sha(content), elapsedMs: Date.now() - started, path };
    remote.push(receipt);
    if (name === 'live-manifest' && receipt.sha256 !== expected) { receipt.outcome = 'STOP_INPUT_MISMATCH'; break; }
  } catch (error) {
    remote.push({ name, url, outcome: 'read_failed_no_retry', error: error.name, elapsedMs: Date.now() - started });
    break;
  }
}
const after = hashes();
const result = { root, hostname: hostname(), at: new Date().toISOString(), base: git(['rev-parse', 'HEAD']).trim(),
  inventory, inventoryScope: 'Named-path presence and Git-index membership only; no recursive payload enumeration, no .env content read, no X access.',
  before, after, protectedMetadataStable: JSON.stringify(before) === JSON.stringify(after),
  localFrontend: { buildPath, buildId: build.buildId ?? build.id ?? null, sourceChecks,
    sourcesMatch: sourceChecks.every(f => f.expected === f.actual),
    productionDeploymentIdentity: null, meaning: 'Local snapshot source identity, not production commit or deployment.' },
  pinnedArtifact: config, automaticGitDeploy: JSON.parse(read('web/vercel.json')).git.deploymentEnabled,
  deploymentPlan: { command: 'powershell.exe -NoProfile -File C:\\sgSHIOK2026\\scripts\\deploy-production.ps1',
    exitCode: plan.status, stdout: plan.stdout, stderr: plan.stderr, error: plan.error?.name ?? null },
  remote, remoteReadBounds: { maximumRequests: 2, timeoutPerRequestMs: 20000, redirects: false, retries: 0, noScriptsOrAssetsLoaded: true },
  sourceReferences: [{ url: 'https://vercel.com/docs/instant-rollback', checked: '2026-09-10',
    fact: 'Hobby Instant Rollback is limited to the immediately previous deployment; old build-time configuration is reused, production auto-assignment changes after rollback.' },
  { url: 'https://vercel.com/docs/limits/fair-use-guidelines', checked: '2026-09-10',
    fact: 'Hobby usage has plan limits and is restricted to non-commercial personal use; inspect current account dashboard before release.' }],
  pipelineRuns: 0, dataCopies: 0, installs: 0, deployments: 0, backupOrRestoreExercised: false };
writeFileSync(resolve(root, qa, 'inspection.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...result, localFrontend: { ...result.localFrontend, sourceChecks: sourceChecks.filter(f => f.actual !== f.expected), inspectedSourceCount: sourceChecks.length } }));
if (!result.protectedMetadataStable || remote.some(r => r.outcome === 'STOP_INPUT_MISMATCH')) process.exitCode = 2;
