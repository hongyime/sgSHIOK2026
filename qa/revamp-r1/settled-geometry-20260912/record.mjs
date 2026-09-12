import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { stages } from '../loading-profile-20260912/analyze.mjs';
const root = 'C:/sgSHIOK2026/qa/revamp-r1/settled-geometry-20260912/';
const raw = JSON.parse(readFileSync(root + 'observed-SKgwD8/browser.json'));
const baseline = JSON.parse(readFileSync(new URL('../loading-profile-20260912/observed-OUYeAZ/browser.json', import.meta.url)));
const tests = JSON.parse(readFileSync(root + 'tests.json'));
const build = JSON.parse(readFileSync(root + 'build-1/build.json'));
assert.equal(raw.ok, true); assert.equal(tests.exitCode, 0); assert.equal(build.exitCode, 0);
assert.equal(raw.anchorsUnchanged, true); assert.equal(raw.cleanup.verified, true);
const captures = raw.samples.map(s => {
  const sha256 = createHash('sha256').update(readFileSync(root + 'observed-SKgwD8/' + s.cache + '.png')).digest('hex');
  assert.equal(sha256, s.capture.sha256); assert.equal(s.capture.before.count, 4); assert.equal(s.capture.after.count, 4);
  return {cache:s.cache,sha256,before:s.capture.before,after:s.capture.after,parentInspected:true};
});
const summary = { root:'C:\\sgSHIOK2026', hostname:raw.hostname, base:'2c469a4',
  regression: { before:'New ready-geometry test failed: expected one selection update, observed two.', after:'1788 tests /65files pass, including3new cases (ready/missing/rejected already-settled geometry). Existing deferred/stale/category/retry cases remain in full suite.', independentReview:'Unavailable: peer quota; parent review only.' },
  checks:{isolatedSuiteExit:tests.exitCode,typescriptExit:0,repoIntegrity:'repo_integrity=ok',build:build.buildId,sourceStable:build.sourceStable,browserExit:0,cleanup:true},
  preview:JSON.parse(readFileSync(root+'preview.json')),
  baselineStages:baseline.samples.map(stages), treatmentStages:raw.samples.map(stages), captures,
  hostCounters:raw.hostCounters,
  FINDINGS:['Already-settled geometry is included in the first selection; identical final geometry no longer republishes primary. Pending geometry never delays score text, and stale request/geometry-attempt checks remain.',
    'Warm selected-route setData trace: baseline empty/key2/key3, treatment one populated key3. Source writes baseline11+23=34, treatment11+12=23. Browser scheduling differed; unit regression, not those totals alone, proves removal of duplicate selection publication.',
    'Observed route times baseline7559/2125.7ms, treatment7197/2111.9ms. No claimed speedup: cold HTML TTFB differs, paging/near100% CPU observed, server data responses no-store, CDP/injection overhead, SWbypassed and desktop SwiftShader.',
    'Full isolated suite1785+3=1788/65files,42native guards, types, integrity and new build pass. Two new mobile screenshots inspected with4current features. Existing preview4362 is old;4374 serves the change.'],
  DISAGREEMENTS:['Do not repeat timing pairs under this pressure or equate this bounded loading fix with representative performance acceptance. T02 remains partial.'],
  protectedInputsUnchanged:true,noPipeline:true,noInstall:true,noDeployment:true };
writeFileSync(root+'summary.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(summary.checks));
