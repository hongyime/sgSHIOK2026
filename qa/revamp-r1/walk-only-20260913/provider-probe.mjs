import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root='C:\\sgSHIOK2026';
assert.equal(process.cwd(),root);
const out=resolve(root,'qa/revamp-r1/walk-only-20260913');
const observed=JSON.parse(readFileSync(resolve(out,'observed-q5dYh5/browser.json')));
const url=observed.entries.find(e=>e.method==='Fetch.requestPaused'&&e.params.request.url.includes('/api/onemap-route')).params.request.url;
assert.equal(new URL(url).origin,'http://127.0.0.1:4406');
const report={url,fixturePostal:'018956',stop:observed.unsavedTarget.id,
  policy:'One public-location local web API request; no provider fixture or retry; no pipeline/input writes.',
  startedAt:new Date().toISOString()};
const start=performance.now();
try {
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  report.httpStatus=response.status;
  const body=await response.json();
  report.body=body;
  report.usable=body.ok===true&&typeof body.route_geometry==='string'&&body.route_geometry.length>0;
} catch(error) { report.failure={name:error.name,message:error.message}; }
report.elapsedMs=performance.now()-start;
report.withinClientDeadline=report.usable===true&&report.elapsedMs<12000;
writeFileSync(resolve(out,'provider-probe.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...report,body:report.body?{...report.body,route_geometry:report.body.route_geometry?'[recorded in provider-probe.json]':undefined}:undefined},null,2));
