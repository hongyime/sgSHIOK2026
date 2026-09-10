import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const MAX_FILES = 5000;
const MAX_BYTES = 64 * 1024 * 1024;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw Error(code); };

function plain(path, missing = false) {
  if (!isAbsolute(path)) fail('RETENTION_UNSAFE_PATH');
  const parent = dirname(path);
  if (parent !== path && !plain(parent, missing)) return null;
  let info;
  try { info = lstatSync(path); } catch (e) { if (missing && e.code === 'ENOENT') return null; throw e; }
  if (info.isSymbolicLink() || (!info.isFile() && !info.isDirectory())) fail('RETENTION_LINKED_PATH');
  return info;
}

function assetPath(name) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9_./-]+$/.test(name) || name.split('/').some(p => !p || p === '.' || p === '..' || p.endsWith('.') || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p))) fail('RETENTION_UNSAFE_PATH');
  const staticAsset = /^_next\/static\/.+\.(mjs|js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|avif|ico)$/.test(name);
  const worker = /^maplibre\/\d+\.\d+\.\d+\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(mjs|js)$/.test(name);
  const license = /^maplibre\/\d+\.\d+\.\d+\/LICENSE\.txt$/.test(name);
  if (!staticAsset && !worker && !license) fail('RETENTION_UNSAFE_ASSET');
  return name;
}

function inventory(root, optional = false) {
  if (!plain(root, optional)) return [];
  const found = [], pending = [root], names = new Set();
  while (pending.length) {
    const directory = pending.pop();
    for (const child of readdirSync(directory)) {
      const file = join(directory, child), name = relative(root, file).split(sep).join('/');
      if (names.has(name.toLowerCase())) fail('RETENTION_CASE_COLLISION');
      names.add(name.toLowerCase());
      if (names.size > MAX_FILES) fail('RETENTION_INVENTORY_LIMIT');
      const info = plain(file);
      if (info.isDirectory()) pending.push(file); else found.push(name);
    }
  }
  return found;
}

function identity(path, expectedBytes) {
  const info = plain(path);
  if (!info.isFile() || info.size !== expectedBytes || info.size > MAX_BYTES) fail('RETENTION_ASSET_CHANGED');
  const bytes = readFileSync(path);
  if (bytes.length !== expectedBytes) fail('RETENTION_ASSET_CHANGED');
  return sha(bytes);
}

/** @param {string} webRoot @param {{requireBuild?: boolean}} [options] */
export function verifyFrontendRetention(webRoot, { requireBuild = false } = {}) {
  if (!isAbsolute(webRoot) || resolve(webRoot) !== webRoot) fail('RETENTION_UNSAFE_ROOT');
  const manifestPath = join(webRoot, 'frontend-retention.json'), info = plain(manifestPath);
  if (!info.isFile() || info.size > 2 * 1024 * 1024) fail('RETENTION_MANIFEST_LIMIT');
  const bytes = readFileSync(manifestPath), manifestSha256 = sha(bytes), policy = JSON.parse(bytes.toString('utf8'));
  if (!policy || policy.schemaVersion !== 1 || !Array.isArray(policy.buildIds) || policy.buildIds.length > 2 ||
      policy.buildIds.some(v => typeof v !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(v)) || new Set(policy.buildIds).size !== policy.buildIds.length ||
      !Array.isArray(policy.files) || policy.files.length > MAX_FILES || !Number.isSafeInteger(policy.totalBytes) || policy.totalBytes < 0 || policy.totalBytes > MAX_BYTES) fail('RETENTION_MANIFEST_INVALID');
  const expected = new Map(), folded = new Set(); let total = 0;
  for (const entry of policy.files) {
    if (!entry || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || !/^[a-f0-9]{64}$/.test(entry.sha256)) fail('RETENTION_MANIFEST_INVALID');
    const name = assetPath(entry.path);
    if (folded.has(name.toLowerCase())) fail('RETENTION_ASSET_CONFLICT');
    expected.set(name, entry); folded.add(name.toLowerCase()); total += entry.bytes;
    if (total > MAX_BYTES) fail('RETENTION_TOTAL_SIZE_LIMIT');
  }
  if (total !== policy.totalBytes || (!!policy.files.length !== !!policy.buildIds.length)) fail('RETENTION_MANIFEST_INVALID');
  const retained = join(webRoot, 'public/_retained'), actual = inventory(retained, expected.size === 0);
  if (actual.length !== expected.size || actual.some(name => !expected.has(name))) fail('RETENTION_INVENTORY_MISMATCH');
  for (const [name, entry] of expected) if (identity(join(retained, name), entry.bytes) !== entry.sha256) fail('RETENTION_ASSET_CHANGED');
  let buildId = null;
  if (requireBuild) {
    const buildPath = join(webRoot, '.next/BUILD_ID');
    if (plain(buildPath).size > 256) fail('RETENTION_BUILD_INVALID');
    buildId = readFileSync(buildPath, 'utf8').trim();
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(buildId)) fail('RETENTION_BUILD_INVALID');
    // Match case-insensitively even on Linux; Windows must reject the same release.
    const current = new Map();
    for (const name of inventory(join(webRoot, '.next/static'))) current.set(('_next/static/' + name).toLowerCase(), { name: '_next/static/' + name, path: join(webRoot, '.next/static', name) });
    for (const name of inventory(join(webRoot, 'public/maplibre'), true)) current.set(('maplibre/' + name).toLowerCase(), { name: 'maplibre/' + name, path: join(webRoot, 'public/maplibre', name) });
    for (const [name, entry] of expected) {
      const existing = current.get(name.toLowerCase());
      if (existing && existing.name !== name) fail('RETENTION_ASSET_CONFLICT');
      const candidate = existing?.path;
      const info = candidate ? plain(candidate, true) : null;
      if (info && (info.size !== entry.bytes || identity(candidate, entry.bytes) !== entry.sha256)) fail('RETENTION_ASSET_CONFLICT');
    }
  }
  return { manifestSha256, buildId, retainedBuildIds: policy.buildIds, files: expected.size, bytes: total };
}
