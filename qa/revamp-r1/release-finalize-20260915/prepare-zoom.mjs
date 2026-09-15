import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, basename } from 'node:path';
const ROOT='C:\\sgSHIOK2026',BASE=resolve(ROOT,'qa/revamp-r1/release-finalize-20260915');
assert.equal(process.cwd(),ROOT);
const read=p=>JSON.parse(readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const previewPath=process.argv[2];
const captureDisplayImages=process.argv[3]==='--capture-display-images';
assert.ok(process.argv[3]===undefined||captureDisplayImages);
assert.equal(dirname(dirname(previewPath)),BASE);assert.equal(basename(previewPath),'preview.json');
const preview=read(previewPath);
const auditPath=resolve(dirname(previewPath),'served-audit.json'),audit=read(auditPath);
const build=read(preview.receiptPath);assert.equal(build.passed,true);assert.equal(audit.passed,true);
assert.equal(audit.buildId,build.buildId);assert.equal(sha(readFileSync(preview.receiptPath)),preview.receiptSha256);
const tilesPath=resolve(BASE,'basemap-bwIezw/receipt.json'),tiles=read(tilesPath);assert.equal(tiles.passed,true);
const paths=['web/app/page.tsx','web/app/home.tsx','web/app/page.module.css',
  'web/components/route-evidence-map.tsx','web/components/route-evidence-map.module.css',
  'web/public/maplibre/6.4.1/maplibre-gl-worker.mjs'];
const sources=paths.map(path=>{const entry=build.files.find(e=>e.path===path);assert.ok(entry,path);
  const sha256=sha(readFileSync(resolve(ROOT,path)));assert.equal(sha256,entry.sha256,path);return {path,sha256};});
const config={approved:'exact-preview-go',target:preview.url+'?debugMap=1&postal=018956&transit=mrt_lrt&stop=mrt%3A21677',
  buildId:build.buildId,sources,localReplies:tiles.localReplies,captureDisplayImages,sourceRevision:build.sourceRevision,
  previewReceipt:{path:previewPath,sha256:sha(readFileSync(previewPath))},
  servedAudit:{path:auditPath,sha256:sha(readFileSync(auditPath))},
  basemapReceipt:{path:tilesPath,sha256:sha(readFileSync(tilesPath)),fileCreationUtc:statSync(tilesPath).birthtime.toISOString(),
    timingQualification:'Receipt file time after a 1355ms download, not a historical September13 capture'},
  qualification:'Frozen display images captured September15; optional bounded fresh OneMap display-image reads, no route API or pipeline calls. No physical-phone or performance claim'};
const out=resolve(ROOT,'qa/revamp-r1/same-document-zoom-20260915/exact-69eac6a-'+basename(dirname(previewPath))+(captureDisplayImages?'-display':'')+'.json');
writeFileSync(out,JSON.stringify(config,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,buildId:config.buildId,sources:sources.length,localReplies:config.localReplies.length,target:config.target}));
