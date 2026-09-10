import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root)throw Error('Working root guard');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const out=resolve(root,'qa/revamp-r1/map-stall-20260910');
const build=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/cached-release-20260908/worker-alignment-20260910/build.json')));
const sources=build.sources.map(s=>({...s,actual:sha(readFileSync(resolve(root,s.path)))}));
assert.ok(sources.every(s=>s.sha256===s.actual),'Current application differs from build');
const chunks=resolve(root,'tmp/cached-release-worker-alignment-20260910/web/.next/static/chunks');
const locations=[['29ddgwgt55efo.js',799,106910],['29ddgwgt55efo.js',1,147642],['3u4fr6aw4uicq.js',0,42865]];
const frames=locations.map(([name,line,column])=>{
  const bytes=readFileSync(resolve(chunks,name));
  const lines=bytes.toString('utf8').split('\n');
  const offset=lines.slice(0,line).reduce((n,s)=>n+s.length+1,0)+column;
  return {name,zeroBasedLine:line,zeroBasedColumn:column,bytes:bytes.length,sha256:sha(bytes),
    excerpt:bytes.toString('utf8').slice(Math.max(0,offset-60),offset+1100)};
});
const report={buildId:build.buildId,sourceCount:sources.length,sourcesMatch:true,frames,
  sourceNote:'Profile frame locations identify minified compiled expressions, not precise wall-time causes. The watcher is visible in the third excerpt; its source is web/lib/map-viewport.ts.',
  manualCaptureReview:{count:5,reviewer:'parent',result:'Probe1 error despite visible route and blurry raster; probe2 loading frame then two consistent ready-route frames at390x844. No four-viewport acceptance.'}};
writeFileSync(resolve(out,'source-anchors.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({buildId:report.buildId,sourceCount:report.sourceCount,sourcesMatch:report.sourcesMatch,frames:frames.map(({excerpt,...f})=>f)}));
