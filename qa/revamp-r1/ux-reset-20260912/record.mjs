import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const out = resolve(root, 'qa/revamp-r1/ux-reset-20260912');
const json = name => JSON.parse(readFileSync(resolve(out, name)));
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const build = json('build-2/build.json');
assert.equal(build.exitCode, 0);
assert.ok(build.sources.every(s => hash(resolve(root, s.path)) === s.sha256), 'Built source differs');
const viewport = json('observed-UeZnEw/browser.json');
const disclosure = json('observed-6w3yXi/browser.json');
assert.ok(disclosure.ok);
const error = viewport.errors[0];
const command = viewport.entries.find(e => e.kind === 'send' && e.id === error.cdp.id && e.sessionId === error.cdp.sessionId);
const request = viewport.entries.find(e => e.method === 'Fetch.requestPaused' && e.params.requestId === command.params.requestId && e.sessionId === command.sessionId);
const cancellation = viewport.entries.find(e => e.method === 'Network.loadingFailed' && e.params.requestId === request.params.networkId && e.sessionId === request.sessionId);
assert.ok(cancellation.params.canceled && cancellation.params.errorText === 'net::ERR_ABORTED');
const inspected = [
  'observed-KwxHgy/mobile-suggested.png', 'observed-KwxHgy/mobile-mrt_lrt.png',
  'observed-pKQ6bM/mobile-details.png', 'observed-pKQ6bM/collapsed-320.png',
  ...['collapsed-1440', 'details-1440', 'details-320', 'details-390', 'technical-opt-in', 'returned-to-walk'].map(n => 'observed-UeZnEw/' + n + '.png'),
  'observed-6w3yXi/postplan-mobile.png',
];
const changes = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
assert.ok(changes.every(p => !/^(pipeline\/config\/weights\.yaml|raw\/|processed\/|web\/public\/data\/|checksums\.json|qa\/(p[6-9]_|p10_|p11\/d_|releases\/))/.test(p)));
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const oldEvidence = execFileSync('git', ['show', 'HEAD:' + evidencePath], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
const evidence = readFileSync(resolve(root, evidencePath));
assert.ok(evidence.subarray(0, oldEvidence.length).equals(oldEvidence), 'Evidence is not append-only');
const findings = [
  'Owner usability rejection is valid: passing regressions did not make the legacy technical score panel suitable for the normal walk journey. It is now opt-in under About data > Technical record.',
  'MRT/LRT and bus pointer clicks update destination, metrics, URL and source geometry for the public 018956 fixture. Suggested and Bus stops legitimately share the same saved bus route. Explicit destination type makes that less misleading.',
  'Missing raw category paths now disable tabs. Geometry absence/provider preview failures are separate conditions; no all-postal coverage or live provider reliability claim is made.',
  'Current card and walk-details captures fit four viewport sizes. The final raw viewport run has 59 passing assertions and one wrong hidden-disclosure assertion; it is not relabelled as a clean run. A separate actual-visibility correction passes 13 checks.',
  'One viewport-run CDP continue failure maps exactly to an already canceled OneMap tile request. This is recorded independently of the app readiness checks, not silently ignored.',
  '1791 = 1788 + 3 isolated web tests in 65 unchanged test files. Added two page disclosure/disabled-control tests and one selected-transit-type test. Copy assertions intentionally changed with inherited verbose labels removed.',
  'postplan.html now distinguishes checked local UX, pending owner acceptance, unsaved-stop preview work, reporting/service decisions, data gates, maintenance and release. No production deployment or pipeline execution occurred.',
];
const disagreements = [
  'A different tab need not mean a different route: Suggested can already be the saved bus or MRT walk. Do not invent another route or recalculate values to make the button appear active.',
  'This cleanup is not full product completion or proof of faster map loads. Physical-phone usability, live preview availability, representative performance and private reporting remain open.',
];
const summary = {
  root, hostname: process.env.COMPUTERNAME, base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  createdAt: new Date().toISOString(), buildId: build.buildId, preview: 'http://127.0.0.1:4386/', buildSourcesMatched: build.sources.length,
  tests: { checks: 'checks-1789227872591/checks.json', focused:250, focusedFiles:5, isolated:1791, isolatedFiles:65, arithmetic:'1788 + 2 page tests + 1 summary test = 1791', types:true, integrity:true, nativeGuardsRerun:false },
  browser: { viewportRun:'observed-UeZnEw/browser.json', rawExit:1, pass:viewport.checks.filter(c=>c.pass).length, fail:viewport.checks.filter(c=>!c.pass).map(c=>c.name),
    correction:'observed-6w3yXi/browser.json', correctedChecks:disclosure.checks.length, correctedOk:disclosure.ok,
    canceledInterception:{error,command,request,cancellation}, inspected:inspected.map(path=>({path,sha256:hash(resolve(out,path))})),
    anchorsUnchanged:viewport.anchorsUnchanged&&disclosure.anchorsUnchanged, cleanup:viewport.cleanup.verified&&disclosure.cleanup.verified,
    notes:['First run compared render revisions instead of geometry; second captured a resize transition; third tested nested open instead of actual visibility. All original runner copies/outputs preserved.', 'Headless Chrome/CDP fallback after in-app browser bootstrap os error3. Not a physical-phone or performance benchmark.', 'Plan screenshot preceded final status-text update; layout unchanged.'] },
  changes, appendOnlyEvidence:true, scope:{pipelineRuns:0,installations:0,deployments:0,protectedWrites:0,livePreviewProviderTested:false},
  findings, disagreements,
  next:'Browser failed/slow unsaved-stop preview and missing-category acceptance, then owner/device UX acceptance. No provider or deployment activation without specific approval.',
};
writeFileSync(resolve(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag:'wx' });
const files=[];
function visit(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())visit(p);else if(!/^(next|preview).*\.(stdout|stderr)\.txt$/.test(e.name))files.push({path:p.slice(root.length+1).replaceAll('\\','/'),sha256:hash(p)});}}
visit(out);
writeFileSync(resolve(out,'artifact-hashes.json'),JSON.stringify(files,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({buildId:summary.buildId,sourceCount:summary.buildSourcesMatched,tests:summary.tests,viewportPass:summary.browser.pass,viewportFail:summary.browser.fail,correctionChecks:summary.browser.correctedChecks,protectedWrites:0,appendOnly:true,artifacts:files.length},null,2));
