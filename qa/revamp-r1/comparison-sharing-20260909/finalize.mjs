import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong root');
const [browserName, buildName, testsName] = process.argv.slice(2);
if ([browserName, buildName, testsName].some(value => !/^[a-z0-9-]+$/.test(value || ''))) throw Error('Three existing receipt labels required');
const base = 'qa/revamp-r1/comparison-sharing-20260909';
const read = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const browserPath = `${base}/${browserName}/browser.json`, browser = read(browserPath);
const buildPath = `qa/revamp-r1/cached-release-20260908/${buildName}/build.json`, build = read(buildPath);
const checksPath = `qa/revamp-r1/published-options-20260909/${testsName}/checks.json`, checks = read(checksPath);
const fileNames = ['app/page.tsx','lib/comparison-controller.ts','lib/comparison-link.ts',
  'components/home-comparison.tsx','components/home-comparison.module.css','components/comparison-share-dialog.tsx','components/comparison-share-dialog.module.css',
  'lib/__tests__/home-comparison.test.tsx','lib/__tests__/comparison-share-dialog.test.tsx','lib/__tests__/comparison-link.test.ts',
  'lib/__tests__/comparison-shared-controller.test.ts','lib/__tests__/comparison-controller.test.ts','lib/__tests__/published-walk-page.test.tsx'];
const plain = checks.commands[0].stdout.replace(/\x1b\[[0-9;]*m/g, '');
const isolated = /"snapshot"\s*:\s*"([^"]+)"/.exec(plain)?.[1];
if (!isolated) throw Error('Cannot identify isolated test snapshot');
const snapshot = JSON.parse('"' + isolated + '"');
const sources = fileNames.map(file => {
  const bytes = readFileSync(resolve(root, 'web', file));
  return {path:'web/'+file,bytes:bytes.length,sha256:hash(bytes),
    matchesTestedSnapshot:hash(bytes)===hash(readFileSync(resolve(snapshot,'web',file))),
    matchesBuiltSource:hash(bytes)===hash(readFileSync(resolve(root,'tmp','cached-release-'+buildName,'web',file)))};
});
const anchors = checks.inputs.map(input => {
  const bytes = readFileSync(resolve(root,input.path)), actual = hash(bytes);
  return {path:input.path,bytes:bytes.length,sha256:actual,match:actual===input.expected&&bytes.length===input.bytes};
});
const evidence = 'qa/verification/REVAMP-R1-core-walk.md';
const prior = execFileSync('git',['show','HEAD:'+evidence],{cwd:root,maxBuffer:8*1024*1024});
const current = readFileSync(resolve(root,evidence));
const result = {task:'T11',date:new Date().toISOString(),root,hostname:process.env.COMPUTERNAME,
  base:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sources,anchors,
  validation:{tests:1382,files:53,arithmetic:'1269 + 26 link + 26 shared controller + 37 dialog + 9 drawer + 15 page = 1382; 50 + 3 files = 53',checksPath,buildPath,browserPath,buildId:browser.build,browserChecks:browser.checks.length,captures:browser.captures.length,
    checksOk:checks.ok,browserOk:browser.ok,build,isolatedSnapshot:snapshot},
  evidencePrefix:{bytes:prior.length,workingUnchanged:current.subarray(0,prior.length).equals(prior)},
  visualInspection:'All12 final captures inspected. Normal layout matches requested stack and About placement; routes and modal controls are visible. Two390x844 resize captures include transient raster-tile blending; later captures at that width are clear. On667px shared views, the comparison table requires inner scrolling; all rows are not visible simultaneously.',
  limitations:['Headless functional validation is not representative device/performance acceptance.','Report provisioning, compute and deployment gates remain owner decisions.'],
  findings:['Shared fragments preserve the previous local shortlist until explicit Save.','Shared and ordinary URL navigation invalidate prior async request ownership.',
    'Failed test expectations about identical published geometry, idempotent Save and the new snapshot flag were corrected; raw red receipts remain.',
    'Chromium exposed a modal Tab-boundary gap; explicit wrapping retains native modal semantics.'],
  disagreements:['Required OneMap/SLA attribution remains visible; it is not an optional legend.'],
  pipelineRuns:0,installations:0,deploymentCommands:0};
if (!checks.ok||!browser.ok||sources.some(s=>!s.matchesBuiltSource||!s.matchesTestedSnapshot)||anchors.some(a=>!a.match)||!result.evidencePrefix.workingUnchanged) throw Error('Final validation or preservation failed');
writeFileSync(resolve(root,base,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result,null,2));
