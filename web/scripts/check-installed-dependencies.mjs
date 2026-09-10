import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const packageName = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

/** Compare direct test/build dependencies to resolved lock versions; no install or integrity audit. */
export function inspectInstalledDependencies(webRoot) {
  const failures = [], checked = [];
  function json(path) {
    try {
      const value = JSON.parse(readFileSync(resolve(webRoot, path), 'utf8'));
      if (!record(value)) throw new Error('Expected an object');
      return value;
    } catch (error) {
      failures.push({ signal: 'metadata_unreadable', path, reason: error.code ?? 'invalid_json_object' });
      return null;
    }
  }
  const manifest = json('package.json'), lock = json('package-lock.json');
  if (!manifest || !lock) return { ok: false, checked, failures };
  if (![2, 3].includes(lock.lockfileVersion) || !record(lock.packages) || !record(lock.packages[''])) {
    failures.push({ signal: 'unsupported_lockfile', path: 'package-lock.json' });
    return { ok: false, checked, failures };
  }
  const names = new Set();
  for (const section of ['dependencies', 'devDependencies']) {
    const declared = manifest[section] === undefined ? {} : manifest[section];
    const pinned = lock.packages[''][section] === undefined ? {} : lock.packages[''][section];
    if (!record(declared) || !record(pinned)) {
      failures.push({ signal: 'invalid_dependency_section', section });
      continue;
    }
    if (!isDeepStrictEqual(declared, pinned)) failures.push({ signal: 'manifest_lock_mismatch', section });
    for (const [name, spec] of Object.entries(declared)) {
      if (!packageName.test(name) || typeof spec !== 'string' || !spec.trim()) {
        failures.push({ signal: 'invalid_dependency', section, name });
      } else names.add(name);
    }
  }
  if (!names.size) failures.push({ signal: 'empty_dependency_set' });
  for (const name of [...names].sort()) {
    const path = `node_modules/${name}/package.json`, pinned = lock.packages[`node_modules/${name}`];
    if (!record(pinned) || pinned.link || typeof pinned.version !== 'string' || !pinned.version.trim()) {
      failures.push({ signal: 'unresolved_lock_dependency', name });
      continue;
    }
    const installed = json(path);
    if (!installed) continue;
    const item = { name, locked: pinned.version, installed: installed.version ?? null };
    checked.push(item);
    if (installed.version !== pinned.version) failures.push({ signal: 'installed_version_mismatch', ...item });
  }
  return { ok: failures.length === 0, checked, failures };
}

export function reportInstalledDependencies(webRoot) {
  const result = inspectInstalledDependencies(webRoot);
  const output = result.ok ? console.log : console.error;
  output(`installed_dependencies=${result.ok ? 'ok' : 'failed'}`);
  for (const failure of result.failures) output(JSON.stringify(failure));
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = reportInstalledDependencies(resolve(dirname(fileURLToPath(import.meta.url)), '..')).ok ? 0 : 1;
}
