import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { inspectInstalledDependencies } from '../check-installed-dependencies.mjs';

const scripts = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = resolve(scripts, '../..');
const temporary = resolve(repository, 'tmp');
mkdirSync(temporary, { recursive: true });
const fixtureRoot = mkdtempSync(join(temporary, 'dependency-identity-tests-'));
const packageSource = JSON.parse(readFileSync(resolve(scripts, '../package.json')));

function put(root, path, value) {
  const target = resolve(root, path);
  assert.ok(target.startsWith(root + sep));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
}

function fixture(installed = '6.4.1') {
  const root = mkdtempSync(join(fixtureRoot, 'web-'));
  const dependencies = { 'maplibre-gl': '6.4.1' };
  const devDependencies = { vitest: '^4.1.11' };
  put(root, 'package.json', { dependencies, devDependencies, scripts: packageSource.scripts });
  put(root, 'package-lock.json', { lockfileVersion: 3, packages: {
    '': { dependencies, devDependencies },
    'node_modules/maplibre-gl': { version: '6.4.1' },
    'node_modules/vitest': { version: '4.1.11' },
  } });
  put(root, 'node_modules/maplibre-gl/package.json', { name: 'maplibre-gl', version: installed });
  put(root, 'node_modules/vitest/package.json', { name: 'vitest', version: '4.1.11' });
  put(root, 'scripts/__tests__/installed-dependencies.test.mjs', "import { test } from 'node:test';test('fixture contract suite',()=>{});\n");
  put(root, 'scripts/fixture-vitest.mjs', "console.log('fixture_vitest_launched');\n");
  put(root, 'scripts/ensure-data-bundle.mjs', "console.log('fixture_preparation_launched');process.exit(99);\n");
  put(root, 'scripts/frontend-retention.mjs', "export function verifyFrontendRetention(){console.log('fixture_retention_reached');throw Error('fixture_retention_stop');}\n");
  for (const name of ['test-web.mjs', 'check-installed-dependencies.mjs', 'build-next-release.mjs']) {
    if (existsSync(join(scripts, name))) copyFileSync(join(scripts, name), join(root, 'scripts', name));
  }
  const windows = process.platform === 'win32';
  const binary = windows ? `@"${process.execPath}" "${join(root, 'scripts/fixture-vitest.mjs')}" %*\r\n`
    : '#!/usr/bin/env node\nconsole.log("fixture_vitest_launched");\n';
  put(root, 'node_modules/.bin/' + (windows ? 'vitest.cmd' : 'vitest'), binary);
  if (!windows) {
    // Executable fixture only; never changes installed dependency permissions.
    chmodSync(join(root, 'node_modules/.bin/vitest'), 0o755);
  }
  return root;
}

function runTest(root) {
  // Model an ordinary CLI launch, not a recursive invocation of the parent node:test runner.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, [join(root, 'scripts/test-web.mjs')], {
    cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000, env,
  });
}

function runBuild(root) {
  // Execute the real package command against a refusing preparation double, never the real data script.
  const executable = process.platform === 'win32' ? process.env.ComSpec : '/bin/sh';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', packageSource.scripts.build] : ['-c', packageSource.scripts.build];
  return spawnSync(executable, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 });
}

test('test entry refuses the real MapLibre 6.4.1 lock versus 6.1.0 install shape before Vitest', () => {
  const result = runTest(fixture('6.1.0'));
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /installed_dependencies=failed/);
  assert.match(result.stderr, /maplibre-gl.*6\.4\.1.*6\.1\.0/);
  assert.doesNotMatch(result.stdout + result.stderr, /fixture_vitest_launched/);
});

test('matching versions may launch the test entry', () => {
  const result = runTest(fixture());
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /fixture_vitest_launched/);
  assert.match(result.stdout, /fixture contract suite/);
});

test('a failing native guard contract suite prevents Vitest from starting', () => {
  const root = fixture();
  put(root, 'scripts/__tests__/installed-dependencies.test.mjs', 'throw Error("fixture contract failure");');
  const result = runTest(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, /fixture contract failure/);
  assert.doesNotMatch(result.stdout + result.stderr, /fixture_vitest_launched/);
});

test('build entry refuses stale dependencies before even the preparation double', () => {
  const result = runBuild(fixture('6.1.0'));
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /installed_dependencies=failed/);
  assert.doesNotMatch(result.stdout + result.stderr, /fixture_preparation_launched/);
});

test('matching build reaches only the refusing preparation double, never Next', () => {
  const result = runBuild(fixture());
  assert.equal(result.status, 99, result.stdout + result.stderr);
  assert.match(result.stdout, /fixture_preparation_launched/);
});

for (const installed of ['6.1.0', '6.4.1']) test(`release CLI checks dependencies before retention/build with installed ${installed}`, () => {
  const root = fixture(installed);
  const result = spawnSync(process.execPath, [join(root, 'scripts/build-next-release.mjs'), 'build'], {
    cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000,
  });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  if (installed === '6.1.0') {
    assert.match(result.stderr, /installed_dependencies=failed/);
    assert.doesNotMatch(result.stdout + result.stderr, /fixture_retention_reached/);
  } else {
    assert.match(result.stdout, /installed_dependencies=ok/);
    assert.match(result.stdout + result.stderr, /fixture_retention_reached/);
    assert.match(result.stderr, /fixture_retention_stop/);
  }
});

function change(root, path, mutate) {
  const value = JSON.parse(readFileSync(join(root, path)));
  mutate(value);
  put(root, path, value);
}

test('reports exact resolved versions for runtime and development dependencies', () => {
  assert.deepEqual(inspectInstalledDependencies(fixture()), { ok: true, failures: [], checked: [
    { name: 'maplibre-gl', locked: '6.4.1', installed: '6.4.1' },
    { name: 'vitest', locked: '4.1.11', installed: '4.1.11' },
  ] });
});

test('development dependency drift also fails', () => {
  const root = fixture();
  change(root, 'node_modules/vitest/package.json', p => { p.version = '4.1.10'; });
  assert.deepEqual(inspectInstalledDependencies(root).failures, [
    { signal: 'installed_version_mismatch', name: 'vitest', locked: '4.1.11', installed: '4.1.10' },
  ]);
});

test('a manifest edit without matching lock-root metadata is not accepted', () => {
  const root = fixture();
  change(root, 'package.json', p => { p.dependencies['maplibre-gl'] = '^6.4.1'; });
  assert.deepEqual(inspectInstalledDependencies(root).failures, [
    { signal: 'manifest_lock_mismatch', section: 'dependencies' },
  ]);
});

for (const file of ['package.json', 'package-lock.json', 'node_modules/maplibre-gl/package.json']) {
  for (const value of ['invalid JSON', 'null', '[]']) test(`refuses ${value} in ${file}`, () => {
    const root = fixture(); put(root, file, value);
    const result = inspectInstalledDependencies(root);
    assert.equal(result.ok, false);
    assert.ok(result.failures.some(f => f.signal === 'metadata_unreadable' && f.path === file));
  });
}

for (const section of ['dependencies', 'devDependencies']) test(`refuses malformed ${section}`, () => {
  const root = fixture(); change(root, 'package.json', p => { p[section] = []; });
  const result = inspectInstalledDependencies(root);
  assert.equal(result.ok, false);
  assert.ok(result.failures.some(f => f.signal === 'invalid_dependency_section' && f.section === section));
});

for (const version of [1, 4, '3', null]) test(`unsupported lock format ${JSON.stringify(version)} fails closed`, () => {
  const root = fixture(); change(root, 'package-lock.json', p => { p.lockfileVersion = version; });
  assert.deepEqual(inspectInstalledDependencies(root).failures, [{ signal: 'unsupported_lockfile', path: 'package-lock.json' }]);
});

test('lock v2 resolved-package metadata is supported', () => {
  const root = fixture(); change(root, 'package-lock.json', p => { p.lockfileVersion = 2; });
  assert.equal(inspectInstalledDependencies(root).ok, true);
});

for (const entry of [null, {}, { link: true, version: '6.4.1' }, { version: '' }]) test(`refuses unresolved lock entry ${JSON.stringify(entry)}`, () => {
  const root = fixture(); change(root, 'package-lock.json', p => { p.packages['node_modules/maplibre-gl'] = entry; });
  assert.deepEqual(inspectInstalledDependencies(root).failures, [{ signal: 'unresolved_lock_dependency', name: 'maplibre-gl' }]);
});

test('missing installed package is reported without loading or executing it', () => {
  const root = fixture();
  change(root, 'package.json', p => { p.dependencies.missing = '1.0.0'; });
  change(root, 'package-lock.json', p => { p.packages[''].dependencies.missing = '1.0.0'; p.packages['node_modules/missing'] = { version: '1.0.0' }; });
  assert.deepEqual(inspectInstalledDependencies(root).failures, [{ signal: 'metadata_unreadable', path: 'node_modules/missing/package.json', reason: 'ENOENT' }]);
});

for (const name of ['../escape', '@scope/../../escape', 'C:\\escape', '/escape', '@scope\\escape', '.hidden']) test(`refuses unsafe dependency name ${name}`, () => {
  const root = fixture(); change(root, 'package.json', p => { p.dependencies[name] = '1.0.0'; });
  const result = inspectInstalledDependencies(root);
  assert.equal(result.ok, false);
  assert.ok(result.failures.some(f => f.signal === 'invalid_dependency' && f.name === name));
  assert.ok(!result.checked.some(c => c.name === name));
  assert.ok(!result.failures.some(f => f.signal === 'metadata_unreadable'));
});

test('scoped packages and a dependency listed in both sections are checked once', () => {
  const root = fixture();
  change(root, 'package.json', p => { p.dependencies['@scope/tool'] = '1.2.3'; p.devDependencies['@scope/tool'] = '1.2.3'; });
  change(root, 'package-lock.json', p => {
    p.packages[''].dependencies['@scope/tool'] = '1.2.3'; p.packages[''].devDependencies['@scope/tool'] = '1.2.3';
    p.packages['node_modules/@scope/tool'] = { version: '1.2.3' };
  });
  put(root, 'node_modules/@scope/tool/package.json', { version: '1.2.3' });
  const result = inspectInstalledDependencies(root);
  assert.equal(result.ok, true);
  assert.equal(result.checked.filter(c => c.name === '@scope/tool').length, 1);
});

test('empty dependency metadata cannot authorize a vacuous success', () => {
  const root = fixture();
  put(root, 'package.json', {});
  put(root, 'package-lock.json', { lockfileVersion: 3, packages: { '': {} } });
  assert.deepEqual(inspectInstalledDependencies(root).failures, [{ signal: 'empty_dependency_set' }]);
});

for (const section of ['dependencies', 'devDependencies']) test(`matching null ${section} sections are invalid, not absent`, () => {
  const root = fixture();
  change(root, 'package.json', p => { p[section] = null; });
  change(root, 'package-lock.json', p => { p.packages[''][section] = null; });
  const result = inspectInstalledDependencies(root);
  assert.equal(result.ok, false);
  assert.ok(result.failures.some(f => f.signal === 'invalid_dependency_section' && f.section === section));
});

test('package executable exports are never imported by the version check', () => {
  const root = fixture();
  change(root, 'node_modules/maplibre-gl/package.json', p => { p.main = './danger.cjs'; });
  put(root, 'node_modules/maplibre-gl/danger.cjs', 'throw Error("must not execute a dependency");');
  assert.equal(inspectInstalledDependencies(root).ok, true);
});
