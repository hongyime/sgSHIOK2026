import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { RECORDED_SOURCE_FRESHNESS, parseFreshnessDate, sourceFreshnessAtCheck } from '../../../web/lib/source-freshness.ts';

const root='C:\\sgSHIOK2026';
if(process.cwd()!==root) throw Error('Wrong working root');
const read=p=>readFileSync(resolve(root,p)), sha=b=>createHash('sha256').update(b).digest('hex');
const files={raw:'raw/manifest.json',pinned:'web/data-bundle.json',bundle:'web/public/data/'+RECORDED_SOURCE_FRESHNESS.bundle+'/manifest.json',check:'qa/verification/P1023-browser-source-age-snapshot.md',helper:'web/lib/source-freshness.ts'};
const report={root,hostname:process.env.COMPUTERNAME,mode:'Read frozen metadata only; no live source check, source refresh or processing.',files:[],sources:[]};
try {
  const data=Object.fromEntries(Object.entries(files).map(([key,path])=>{
    const bytes=read(path);report.files.push({path,bytes:bytes.length,sha256:sha(bytes)});return [key,bytes];
  }));
  const expected='7108e66e70628f3211883402fc753c2f5809db5a822d6a2415f6ae6459a1070e';
  if(sha(data.bundle)!==expected) throw Error('STOP_INPUT_MISMATCH '+files.bundle+' '+sha(data.bundle));
  const raw=JSON.parse(data.raw), bundle=JSON.parse(data.bundle), pinned=JSON.parse(data.pinned);
  for(const source of RECORDED_SOURCE_FRESHNESS.sources) {
    const stored=raw.sources[source.id], bundleHash=bundle.provenance.source_hashes[source.id];
    if(stored.sha256!==source.sourceHash||bundleHash!==source.sourceHash) throw Error('STOP_INPUT_MISMATCH '+source.id+' raw='+stored.sha256+' bundle='+bundleHash+' expected='+source.sourceHash);
    const freshness=sourceFreshnessAtCheck({...source,checkedAt:RECORDED_SOURCE_FRESHNESS.checkedAt});
    const actualUpdate=stored.last_modified===null?null:Date.parse(stored.last_modified);
    const updateMatches=actualUpdate===(freshness.updatedAt?.milliseconds??null);
    const fetchMatches=Date.parse(stored.fetched_at)===Date.parse(source.fetchedAt);
    report.sources.push({id:source.id,sourceHash:source.sourceHash,rawDeclaredHash:stored.sha256,bundleDeclaredHash:bundleHash,
      recordedLastModified:stored.last_modified,updatedAt:freshness.updatedAt,recordedFetchedAt:stored.fetched_at,fetchedAt:source.fetchedAt,
      updateMatches,fetchMatches,staleAfterDays:source.staleAfterDays,statusAtRecordedCheck:freshness.status});
    if(!updateMatches||!fetchMatches) throw Error('Recorded metadata mismatch '+source.id);
  }
  report.dates={dataReference:parseFreshnessDate(pinned.data_as_of),generated:parseFreshnessDate(pinned.generated_at),publication:RECORDED_SOURCE_FRESHNESS.releasedAt,checked:parseFreshnessDate(RECORDED_SOURCE_FRESHNESS.checkedAt)};
  report.checkReceiptContainsExactInstant=data.check.toString().includes('at '+RECORDED_SOURCE_FRESHNESS.checkedAt);
  report.pinnedManifestMatches=pinned.bundle===RECORDED_SOURCE_FRESHNESS.bundle&&pinned.data_as_of===bundle.data_as_of&&pinned.generated_at===bundle.generated_at;
  report.ok=report.checkReceiptContainsExactInstant&&report.pinnedManifestMatches&&report.sources.length===3;
}catch(error){report.failure=error.message;report.ok=false;}
writeFileSync(resolve(root,'qa/revamp-r1/source-freshness-20260909/metadata.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report));process.exitCode=report.ok?0:1;
