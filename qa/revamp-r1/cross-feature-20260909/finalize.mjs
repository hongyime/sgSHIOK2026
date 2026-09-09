import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [browserName] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(browserName || '')) throw Error('Existing final browser receipt required');
const base = 'qa/revamp-r1/cross-feature-20260909';
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const browserPath = `${base}/${browserName}/browser.json`, browser = read(browserPath);
const lastBrowserPath = `${base}/treatment-4-1788924034815/browser.json`, lastBrowser = read(lastBrowserPath);
const buildPath = 'qa/revamp-r1/cached-release-20260908/cross-feature-20260909-2/build.json', build = read(buildPath);
const checksPath = 'qa/revamp-r1/published-options-20260909/cross-feature-full-1/checks.json', checks = read(checksPath);
const plain = checks.commands[0].stdout.replace(/\x1b\[[0-9;]*m/g, '');
const rawSnapshot = /"snapshot"\s*:\s*"([^"]+)"/.exec(plain)?.[1];
if (!rawSnapshot) throw Error('Cannot identify isolated test snapshot');
const snapshot = JSON.parse('"' + rawSnapshot + '"');
const files = ['components/home-comparison.module.css', 'components/route-evidence-map.module.css', 'components/route-evidence-map.tsx',
  'lib/__tests__/home-comparison.test.tsx', 'lib/__tests__/map-startup-import.test.ts', 'lib/__tests__/route-map-keyboard.test.ts', 'lib/__tests__/route-source-lifecycle.test.ts'];
const sources = files.map(file => {
  const bytes = readFileSync(resolve(root, 'web', file));
  return {path:'web/'+file,bytes:bytes.length,sha256:hash(bytes),
    matchesTestedSnapshot:hash(bytes)===hash(readFileSync(resolve(snapshot,'web',file))),
    matchesBuiltSource:hash(bytes)===hash(readFileSync(resolve(root,'tmp/cached-release-cross-feature-20260909-2/web',file)))};
});
const anchors = checks.inputs.map(input => {
  const bytes = readFileSync(resolve(root,input.path)), actual = hash(bytes);
  return {path:input.path,bytes:bytes.length,sha256:actual,match:actual===input.expected&&bytes.length===input.bytes};
});
const evidence = 'qa/verification/REVAMP-R1-core-walk.md';
const prior = execFileSync('git',['show','HEAD:'+evidence],{cwd:root,maxBuffer:8*1024*1024});
const current = readFileSync(resolve(root,evidence));
const result = {
  task:'T25', status:'PARTIAL', date:new Date().toISOString(),root,hostname:process.env.COMPUTERNAME,
  base:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sources,anchors,
  validation:{tests:1389,files:54,arithmetic:'1382 + 6 map keyboard + 1 structural comparison regression = 1389; 53 + 1 file = 54',
    focused:'104 tests / 4 files; 55 comparison + 38 lifecycle + 5 startup + 6 keyboard = 104',
    checksPath,buildPath,browserPath,buildId:browser.build,browserChecks:browser.checks.length,captures:browser.captures.length,
    checksOk:checks.ok,browserOk:browser.ok,lastBrowserPath,lastBrowserOk:lastBrowser.ok,isolatedSnapshot:snapshot,
    browserReceiptSha256:hash(readFileSync(resolve(root,browserPath))),buildReceiptSha256:hash(readFileSync(resolve(root,buildPath))),
    checksReceiptSha256:hash(readFileSync(resolve(root,checksPath))),primaryRunnerWasLaterRevised:true,lastRunnerMatches:lastBrowser.runnerSha256===hash(readFileSync(resolve(root,base,'browser.mjs'))),
    testRunnerWarning:'Vitest exit0 emitted Timeout terminating forks worker for transit-stop-picker.test.tsx. The post-run process query for this exact isolated snapshot returned no processes; all1389 assertions passed.'},
  evidencePrefix:{bytes:prior.length,sha256:hash(prior),workingUnchanged:current.subarray(0,prior.length).equals(prior)},
  executedScope:['Native Tab to labelled map canvas; ArrowRight panning and visible focus.','Application fitBounds duration0 with reduced-motion emulation.',
    'Plain home, typed postal and shared comparison; actual Document bytes identify tested build.',
    'Four standard viewport layouts plus720x475 CSS/DPR2 reflow and panel-descendant font doubling at320x667.',
    'Treatment1: settled raster/route captures, comparison End scrolling, three-column horizontal keyboard scrolling, eight pinned commands, inactive rightmost removal and clear/Escape focus. Rightmost metric border-bound assertion failed and its corrected replay remains unpassed.'],
  visualInspection:{primaryCaptures:18,allPrimaryInspected:true,latestFailureInspected:true,
    finding:'Treatment1 shows nonblank maps/current routes, preserved normal stack, and usable table scrolling at reflow/enlarged text. Postal headings remain visible while controls scroll vertically away. Latest treatment4 failure.png shows the application Map failed / map did not start / Reload page state with no basemap. It is not accepted as merely a harness failure.'},
  pending:['M17 automatic legacy service-worker upgrade and outer lazy-component download recovery (T01).','M18 sanitized Copy diagnostics (T03).',
    'Body Retry and Save/Use saved focus after scrolling, browser storage-denied message, complete cross-feature network-failure/revisit acceptance.',
    'Corrected rightmost-cell assertion and the final complete browser replay. Latest startup failure takes priority over release.',
    'Native browser zoom, physical touch devices, assistive-technology announcements, intended-user sessions and representative performance/M12.',
    'Reporting acceptance only after approved T13 service and T18 implementation. No report placeholders counted as passes.'],
  retainedAttempts:[
    {path:`${base}/baseline-1-1788921686887/browser.json`,finding:'Dead outer map focus and missing canvas description confirmed; subsequent typed-search timeout was harness Enter without text, not a demonstrated app search defect.'},
    {path:`${base}/baseline-2-1788922004975/browser.json`,finding:'27 passes + 5 failures =32 checks. Double-font table clientHeight0. Reflow table72px against61px sticky heading. Old reflow final-row PASS used displaced thead rectangle and is rejected.'},
    {path:`${base}/treatment-1-1788922922479/browser.json`,finding:'42 passes + 1 failure =43 checks. Border-client coordinate error caused rightmost metric failure; driver now includes clientTop/clientLeft. Immediate post-stop CIM snapshot did not establish cleanup; receipt remains unsuccessful.'},
    {path:`${base}/treatment-2-1788923363928/browser.json`,finding:'10 passes before60s resize settle timeout during concurrent full suite. Last sample had ready route/tiles; prior driver did not retain intermediate settle signatures, so cause is unresolved, not labelled hardware-only. Cleanup verified. Final replay serialized after full suite adds traces without extending60s gate.'},
    {path:`${base}/treatment-3-1788923797553/browser.json`,finding:'Owned browser did not reach its debugging endpoint within40s; empty stderr, zero checks/captures, cleanup verified. Subsequent host snapshot was1309912KiB free of16545324KiB total; not a causal attribution. One final bounded launch was attempted after inspecting this receipt, not an unbounded retry loop.'},
    {path:lastBrowserPath,finding:'45s Runtime.evaluate timeout; last sampled map status mounting. Failure screenshot subsequently shows explicit map startup deadline/reload error with blank basemap. Browser stderr also reports about:blank timeout and failed default web-app setup; causation unresolved. Cleanup verified. No more browser launches this turn.'}
  ],
  findings:['The duplicate outer map focus stop was inert; canvas metadata and focus styling now belong to the actual keyboard target.',
    'The shared comparison collapsed to a zero-height table at enlarged text. One panel scroll owner retains the46dvh cap, sticky postal identity, horizontally pinned commands and44px controls.',
    'Full suite has1389 passing tests in54 files; treatment1 screenshots and executed checks cover the repaired paths, but no complete final browser pass is claimed.',
    'The latest actual screenshot shows a map startup failure. Release remains blocked; neither source review nor passing unit tests can overrule it.',
    'T25 remains partial. Passing this bounded slice does not resolve cache upgrades, diagnostics, all failure combinations, user acceptance or release.'],
  disagreements:['Required OneMap/SLA credit is attribution, not an optional legend, and remains visible.',
    'Headless CSS reflow/text stress and functional route counts are not native-phone or representative performance evidence.'],
  pipelineRuns:0,pipelineCost:0,installations:0,deploymentCommands:0,protectedPayloadMutations:0,XOperations:0
};
if (!checks.ok||browser.build!==build.buildId||browser.checks.length!==43||browser.captures.length!==18||!result.validation.lastRunnerMatches||!lastBrowser.cleanup.verified||sources.some(s=>!s.matchesBuiltSource||!s.matchesTestedSnapshot)||anchors.some(a=>!a.match)||!result.evidencePrefix.workingUnchanged) throw Error('Source validation, receipt identity or preservation failed');
writeFileSync(resolve(root,base,'driver-at-treatment-4.mjs'),readFileSync(resolve(root,base,'browser.mjs')),{flag:'wx'});
writeFileSync(resolve(root,base,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result,null,2));
