import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, buildName, testName, testSnapshot, browserPath, extra] = process.argv.slice(2);
if (extra || [label, buildName, testName].some(value => !/^[a-z0-9-]+$/.test(value || ''))
    || !/^tmp\/test-without-data-[a-zA-Z0-9]+$/.test(testSnapshot || '')) throw Error('Explicit receipt paths required');
const own = path => {
  const result = resolve(root, path), part = relative(root, result);
  if (part === '..' || part.startsWith('..' + sep) || isAbsolute(part)) throw Error('Path outside working root');
  return result;
};
if (!/^qa\/revamp-r1\/failure-diagnostics-20260909\/[a-zA-Z0-9_-]+\/browser\.json$/.test(browserPath || '')) throw Error('Unexpected browser receipt');
const json = path => JSON.parse(readFileSync(own(path), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const buildPath = `qa/revamp-r1/cached-release-20260908/${buildName}/build.json`;
const testPath = `qa/revamp-r1/published-options-20260909/${testName}/checks.json`;
const build = json(buildPath), tests = json(testPath), browser = json(browserPath);
const isolation = json(testSnapshot + '/isolation.json');
const report = { root, hostname: process.env.COMPUTERNAME, base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  buildPath, testPath, browserPath, testSnapshot, sources: [], anchors: [], evidencePrefix: null,
  buildPassed: build.exitCode === 0, testsPassed: tests.ok === true,
  isolationPassed: isolation.productionDataDirectoryAbsent && isolation.guardProbePassed && isolation.exitCode === 0,
  browserBuildMatches: browser.build === build.buildId,
};
for (const source of build.sources) {
  const current = sha(readFileSync(own(source.path)));
  const tested = sha(readFileSync(own(testSnapshot + '/' + source.path)));
  report.sources.push({ path: source.path, current, tested, built: source.sha256,
    matches: current === tested && current === source.sha256 });
}
for (const source of Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources)) {
  const bytes = readFileSync(own(source.path)), actual = sha(bytes);
  const entry = { path: source.path, bytes: bytes.length, expected: source.sha256, actual,
    matches: actual === source.sha256 && bytes.length === source.bytes };
  report.anchors.push(entry);
  if (!entry.matches) {
    writeFileSync(own(`qa/revamp-r1/failure-diagnostics-20260909/${label}.json`), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    throw Error('STOP_INPUT_MISMATCH ' + JSON.stringify(entry));
  }
}
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const prior = execFileSync('git', ['show', '74a7901:' + evidencePath], { cwd: root, maxBuffer: 2 * 1024 * 1024 });
const current = readFileSync(own(evidencePath));
report.evidencePrefix = { base: '74a7901', bytes: prior.length, sha256: sha(prior),
  currentBytes: current.length, preserved: current.subarray(0, prior.length).equals(prior) };
report.ok = report.buildPassed && report.testsPassed && report.isolationPassed && report.browserBuildMatches
  && report.sources.every(item => item.matches) && report.anchors.every(item => item.matches) && report.evidencePrefix.preserved;
report.note = 'Identity/isolation audit only; browser assertions, screenshots and cleanup require independent review of the cited receipt.';
const output = own(`qa/revamp-r1/failure-diagnostics-20260909/${label}.json`);
writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, ok: report.ok, sources: report.sources.length, anchors: report.anchors.length, evidencePrefix: report.evidencePrefix }));
process.exitCode = report.ok ? 0 : 1;
