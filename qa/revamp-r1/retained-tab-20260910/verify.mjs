import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const directory = resolve(root, 'qa/revamp-r1/retained-tab-20260910');
const output = resolve(directory, 'summary.json');
if (existsSync(output)) throw Error('Preserve prior receipt');
const sha = b => createHash('sha256').update(b).digest('hex');
const read = p => readFileSync(resolve(root, p));
const json = p => JSON.parse(read(p));
const previous = json('qa/revamp-r1/cross-feature-20260910/final-check.json');
const browserPath = 'qa/revamp-r1/retained-tab-20260910/observed-waRkIU/browser.json';
const browser = json(browserPath);
const report = { root, hostname: process.env.COMPUTERNAME, base: 'c2276dd4aaa3f65e677932d0831d02103dedfdda', startedAt: new Date().toISOString(), commands: [] };
const sameSources = () => previous.sources.map(s => ({ path: s.path, expected: s.expected, actual: sha(read(s.path)) }));
const sameAnchors = () => previous.anchors.map(s => ({ path: s.path, expected: s.expected, actual: sha(read(s.path)) }));
report.sourcesBefore = sameSources(); report.anchorsBefore = sameAnchors();
if (![...report.sourcesBefore, ...report.anchorsBefore].every(s => s.actual === s.expected)) throw Error('Identity mismatch; no test run');
function command(executable, args, timeout = 300000) {
  const start = Date.now(), r = spawnSync(executable, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout, maxBuffer: 32 * 1024 * 1024 });
  const receipt = { executable, args, exitCode: r.status, signal: r.signal, stdout: r.stdout, stderr: r.stderr, error: r.error?.message, elapsedSeconds: (Date.now()-start)/1000 };
  report.commands.push(receipt); console.log(JSON.stringify({ command: args, exitCode: r.status, elapsedSeconds: receipt.elapsedSeconds }));
  return receipt;
}
command(process.execPath, [resolve(root, 'web/scripts/test-without-production-data.mjs'), 'lib/__tests__/service-worker-behaviour.test.ts', 'lib/__tests__/service-worker-registration.test.ts', 'lib/__tests__/route-map-loader.test.tsx', '--reporter=dot']);
command(resolve(root, '.venv/Scripts/python.exe'), ['-B', resolve(root, 'scripts/check_repo_integrity.py')]);
command('git', ['diff','--check']);
report.sourcesAfter = sameSources(); report.anchorsAfter = sameAnchors();
report.identityUnchanged = [...report.sourcesAfter, ...report.anchorsAfter].every(s => s.actual === s.expected);
report.lastFullSuite = { commit: report.base, path: 'qa/revamp-r1/cross-feature-20260910/full-3-gPN3NJ/checks.json', tests: 1717, files: 62, scope: 'Previously executed; not rerun here. Current web sources match its final audited build.' };
report.browser = { path: browserPath, exitCode: browser.exitCode, outcome: 'FAIL: global error loses walk details; its Reload clears selected postal. Re-entering postal separately recovers B.',
  checks: browser.checks.length, passed: browser.checks.filter(c=>c.pass).length, failed: browser.checks.filter(c=>!c.pass), elapsedSeconds: browser.elapsedSeconds,
  setup: browser.setup, recoveryAction: browser.recoveryAction, manualSearch: browser.manualSearch, cleanup: browser.cleanup.verified, proxyStopped: browser.proxyStopStatus === 204 };
report.visualInspection = { reviewer: 'parent', independent: false, reason: 'Previously recorded subagent quota; no repeated spawn attempt', images: browser.captures.map(c => c.name), result: 'All seven final captures inspected: pending walk metrics; generic error; B empty-map selection loss; four viewport routes after separate search. No route claimed in first three captures.' };
report.captures = browser.captures.map(c => ({ name: c.name, expected: c.sha256, actual: sha(readFileSync(resolve(browser.out,c.name+'.png'))), before: c.before.featureCount, after: c.after.featureCount }));
report.priorAttempts = ['observed-5wGdTS','observed-bdLtRS','observed-of5VTg','observed-CiZFDn'].map(name => {
  const r = json('qa/revamp-r1/retained-tab-20260910/'+name+'/browser.json');
  return { name, exitCode: r.exitCode, error: r.error, checks: r.checks.length, captures: r.captures.length, cleanup: r.cleanup.verified, proxyStopStatus: r.proxyStopStatus };
});
report.attemptCorrections = [
  'Attempt1 selected URL used unsupported #postal= instead of the observed legacy ?postal= form; no upgrade attempted. Its runner exited1 after lingering idle handles. A proposed stop was rejected because the process had already exited; no process killed.',
  'Attempt2 tried to retrieve fixture seed HTML after Chrome evicted its response body. No upgrade attempted. Application Document captures now exclude the explicitly non-application seed.',
  'Attempt3 reached actual missing-chunk global error; polling did not recognize its exact text. Real failure preserved, not a pass.',
  'Attempt4 captured global error and clicked its visible Reload. It reached plain B, not selected B; the selected-route wait timed out. Final attempt names selection loss as a second failing check and separately exercises native re-search.',
  'The final runner outcome wording "Reload recovers" means only the B application shell. It does not establish preserved selection; the two explicit FAILs and manualSearch distinguish them.'
];
const legacyFallbackPath = 'web/.next/static/chunks/310vm2bl3xxpt.js';
const fallback = read(legacyFallbackPath), text = fallback.toString(), index = text.indexOf('This page');
if (index < 0) throw Error('Observed fallback no longer available');
report.fallbackMechanism = { path: legacyFallbackPath, bytes: fallback.length, sha256: sha(fallback), rawExcerpt: text.slice(Math.max(0,index-350),index+1200),
  conclusion: 'The observed old-build fallback renders a form with a submit button and no method or hidden query controls. Its native default GET submission produced /? in the recorded Document request; the selected postal and debug query were lost.' };
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const priorEvidence = execFileSync('git', ['show', report.base+':'+evidencePath], { cwd: root, windowsHide: true, maxBuffer: 2*1024*1024 });
report.evidencePrefix = { path: evidencePath, base: report.base, bytes: priorEvidence.length, sha256: sha(priorEvidence), unchanged: read(evidencePath).subarray(0,priorEvidence.length).equals(priorEvidence) };
report.protectedTrackedDiff = command('git', ['diff',report.base,'--','pipeline','raw','processed','web/public/data','checksums.json','qa/releases','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*']).stdout;
report.findings = [
  'M17 retained-legacy acceptance fails in the controlled same-origin/profile rehearsal: real old map module404 through the B service worker causes global error and loses the selected walk view.',
  'The global fallback Reload submits an empty GET form and removes the selected postal. A separate native search restores four selected route features at four viewports; it is not automatic or preserved-selection recovery.',
  'Both cache sentinels and four sampled versioned-data bodies survive. Keeping already-cached assets does not supply a never-cached old chunk.',
  'Current B already has the scoped map-import error boundary from prior work, but that cannot retrofit the observed already-loaded A runtime.',
  'No application change, dependency install, pipeline execution, production staging or deployment occurred. Prior setup failures and incomplete attempts remain in this receipt.',
  'Next safe work: design/test bounded retention of previous immutable frontend assets in release preparation; reject filename/byte conflicts and avoid forced reloads that could lose report drafts. Verify old build identity before real staging.'
];
report.disagreements = [
  'Ordinary A-to-B navigation and current-build rejected-import tests do not establish safety for retained legacy Documents. T01 remains PARTIAL.',
  'The global error has controls, so this is not a literal empty browser page. It is still a failed seamless upgrade, with proven lost selection; do not describe manual re-search as success.',
  'The existing local A build and pinned legacy worker are controlled fixtures, not newly verified production deployment identity. Explicit worker update establishes this race, not automatic update timing or all-browser behavior.'
];
report.limits = ['One fresh final Chromium profile; viewport emulation, not physical devices', 'No latency/phone benchmark', 'No full Python-suite run', 'Only four cached data-body hashes checked, not every cached body', 'Final images parent-reviewed; no independent acceptance', 'T01/T25/T29/T27/T28 and the overall goal remain open'];
report.ok = report.commands.every(c=>c.exitCode===0) && report.identityUnchanged && report.evidencePrefix.unchanged && !report.protectedTrackedDiff && report.captures.every(c=>c.expected===c.actual) && report.browser.cleanup && report.browser.proxyStopped;
report.okMeaning = 'Receipt, source identity, focused tests and cleanup valid; NOT product M17 acceptance';
report.finishedAt = new Date().toISOString();
writeFileSync(output, JSON.stringify(report,null,2)+'\n', { flag:'wx' });
console.log(JSON.stringify({ output, ok:report.ok, productAcceptance:false, browser:report.browser, sourceCount:report.sourcesAfter.length, anchorCount:report.anchorsAfter.length }));
process.exitCode = report.ok ? 0 : 1;
