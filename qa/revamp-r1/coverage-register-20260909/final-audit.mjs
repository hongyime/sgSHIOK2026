import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createJsonReader } from './reader.mjs';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const dir = resolve(root, 'qa/revamp-r1/coverage-register-20260909');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(resolve(root, path));
const json = path => JSON.parse(read(path));
const report = { base: 'a26deb5c615d7b1a92892eefcba417e1d0ee0a8f', ok: false, checks: [], commands: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); if (!pass) throw Error(name); };
const git = args => { const result = spawnSync('git', args, { cwd: root, windowsHide: true, maxBuffer: 32 * 1024 ** 2 }); if (result.status !== 0) throw Error(result.stderr.toString()); return result.stdout; };
try {
  const old = git(['show', report.base + ':qa/verification/REVAMP-R1-core-walk.md']);
  const evidence = read('qa/verification/REVAMP-R1-core-walk.md');
  check('previous evidence is exact byte prefix', evidence.subarray(0, old.length).equals(old), { oldBytes: old.length, oldSha256: sha(old), newBytes: evidence.length, newSha256: sha(evidence) });
  const full = json('qa/revamp-r1/published-options-20260909/coverage-full-1/checks.json');
  check('full isolated suite and verification commands passed', full.ok && full.commands.every(c => c.exitCode === 0));
  check('test count and file arithmetic', /Tests\s+1708 passed/.test(full.commands[0].stdout) && /Test Files\s+62 passed/.test(full.commands[0].stdout), { arithmetic: '1676 + 32 = 1708; 61 + 1 = 62 files' });
  const isolation = json('tmp/test-without-data-ETJXTI/isolation.json');
  check('production-data isolation', isolation.productionDataDirectoryAbsent && isolation.guardProbePassed && isolation.exitCode === 0, isolation);
  const sourcePaths = git(['ls-files', '-z', '--', 'web']).toString().split('\0').filter(path => path && !path.startsWith('web/public/') && /\.(ts|tsx|js|mjs|json|css)$/.test(path));
  report.testedSourceIdentities = [];
  for (const path of sourcePaths) {
    const snapshot = resolve(root, 'tmp/test-without-data-ETJXTI', path);
    check('tested source exists: ' + path, existsSync(snapshot));
    const currentSha256 = sha(read(path)), testedSha256 = sha(readFileSync(snapshot));
    report.testedSourceIdentities.push({ path, currentSha256, testedSha256 });
    check('tested source current: ' + path, currentSha256 === testedSha256);
  }
  const pilot = json('qa/revamp-r1/coverage-register-20260909/pilot-1/summary.json');
  const ledger = json('qa/revamp-r1/coverage-register-20260909/pilot-1/input-ledger.json');
  check('pilot stopped at full gate', pilot.complete && !pilot.coverageComplete && pilot.projection.gate === 'stop' && pilot.projection.budgetSeconds === 3203);
  const checksums = json('checksums.json');
  check('checksum manifest unchanged', sha(read('checksums.json')) === pilot.checksumsSha256);
  const rereader = createJsonReader({ bundleRoot: resolve(root, 'web/public/data', pilot.bundle), checksums: checksums.files, deadline: Date.now() + 60000, cacheBytes: 0 });
  for (const [physical, item] of Object.entries(ledger.files)) {
    const logical = physical.endsWith('.gz') ? physical.slice(0, -3) : physical;
    const actual = rereader.read(logical, { cache: false });
    check('selected input unchanged: ' + physical, actual.status === 'present' && actual.physicalPath === physical && actual.sha256 === item.sha256 && actual.decodedSha256 === item.decodedSha256);
  }
  report.inputRecheck = rereader.getStats();
  const provenance = json('web/lib/__tests__/fixtures/published-walks.provenance.json');
  report.fixtureAnchors = Object.values(provenance.sources).map(source => { const bytes = read(source.path); const actual = sha(bytes); check('fixture anchor unchanged: ' + source.path, actual === source.sha256 && bytes.length === source.bytes); return { path: source.path, bytes: bytes.length, sha256: actual, expected: source.sha256 }; });
  check('pin unchanged', sha(read('web/data-bundle.json')) === pilot.pinSha256);
  for (const item of pilot.before) check('audited scanner current: ' + item.path, sha(read(item.path)) === item.sha256);
  for (const item of pilot.classifier.sources) check('audited classifier current: ' + item.path, sha(read(item.path)) === item.sha256);
  for (const args of [['diff', '--check'], ['check-ignore', '-v', 'qa/verification/REVAMP-R1-core-walk.md']]) {
    const result = spawnSync('git', args, { cwd: root, windowsHide: true, encoding: 'utf8' });
    report.commands.push({ command: 'git', args, stdout: result.stdout, stderr: result.stderr, exitCode: result.status });
    check('git ' + args.join(' '), result.status === (args[0] === 'check-ignore' ? 1 : 0));
  }
  report.changedPaths = git(['diff', '--name-only', report.base]).toString().trim().split('\n');
  const allowed = new Set(['.agents/STATE.md', 'PRODUCT-PLAN.md', 'decisions.md', 'qa/verification/REVAMP-R1-core-walk.md', 'web/lib/coverage-gap-register.ts', 'web/lib/__tests__/coverage-gap-register.test.ts']);
  check('tracked changes narrowly scoped', report.changedPaths.every(path => allowed.has(path)
    || path.startsWith('qa/revamp-r1/coverage-register-20260909/')
    || path.startsWith('qa/revamp-r1/comparison-sharing-20260909/coverage-')
    || path.startsWith('qa/revamp-r1/published-options-20260909/coverage-full-1/')));
  report.ok = true;
} catch (error) { report.error = { message: error.message, code: error.code, stack: error.stack }; process.exitCode = 1; }
writeFileSync(resolve(dir, 'identity-final.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ok: report.ok, error: report.error, checks: report.checks.length, testedSourceCount: report.testedSourceIdentities?.length,
  selectedInputCount: report.inputRecheck ? Object.keys(report.inputRecheck.files).length : 0, fixtureAnchors: report.fixtureAnchors?.length,
  prefix: report.checks[0], commands: report.commands }));
