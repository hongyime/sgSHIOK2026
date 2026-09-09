import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, browserName, extra] = process.argv.slice(2);
if (extra || !/^[a-z0-9-]+$/.test(label || '') || !/^accepted-[0-9]+-[A-Za-z0-9]+$/.test(browserName || '')) throw Error('Fresh label and browser directory required');
const bytes = path => readFileSync(resolve(root, path));
const json = path => JSON.parse(bytes(path));
const sha = value => createHash('sha256').update(value).digest('hex');
const build = json('qa/revamp-r1/cached-release-20260908/native-postal-20260909-1/build.json');
const tests = json('qa/revamp-r1/published-options-20260909/native-postal-full-1/checks.json');
const browser = json('qa/revamp-r1/native-postal-20260909/' + browserName + '/browser.json');
const isolation = json('tmp/test-without-data-WYxtYh/isolation.json');
const sources = build.sources.map(source => {
  const current = sha(bytes(source.path)), tested = sha(bytes('tmp/test-without-data-WYxtYh/' + source.path));
  return { path: source.path, built: source.sha256, current, tested, match: source.sha256 === current && current === tested };
});
const anchors = tests.inputs.map(input => {
  const value = bytes(input.path), actual = sha(value), match = actual === input.expected && value.length === input.bytes;
  if (!match) throw Error('STOP_INPUT_MISMATCH ' + input.path + ' ' + actual);
  return { path: input.path, bytes: value.length, expected: input.expected, actual, match };
});
const prior = execFileSync('git', ['show', '3fc92ff:qa/verification/REVAMP-R1-core-walk.md'], { cwd: root, maxBuffer: 2_000_000 });
const current = bytes('qa/verification/REVAMP-R1-core-walk.md');
const evidence = { base: '3fc92ff', priorBytes: prior.length, currentBytes: current.length, priorSha256: sha(prior), preserved: current.subarray(0, prior.length).equals(prior) };
const report = { root, buildId: build.buildId, browser: browserName, sources, anchors, evidence,
  buildPassed: build.exitCode === 0, testsPassed: tests.ok,
  isolationPassed: isolation.productionDataDirectoryAbsent && isolation.guardProbePassed && isolation.exitCode === 0,
  browserPassed: browser.ok && browser.build === build.buildId,
  note: 'Identity and test-isolation audit; separate review of actual browser assertions and screenshot contents still required.' };
report.ok = report.buildPassed && report.testsPassed && report.isolationPassed && report.browserPassed && evidence.preserved && sources.every(s => s.match);
writeFileSync(resolve(root, 'qa/revamp-r1/native-postal-20260909', label + '.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ok: report.ok, sources: sources.length, anchors: anchors.length, evidence }));
process.exitCode = report.ok ? 0 : 1;
