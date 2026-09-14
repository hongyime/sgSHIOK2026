import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { hostname } from 'node:os';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026', prefix='qa/revamp-r1/weekly-metadata-20260914';
assert.equal(process.cwd(),root);
const bytes=p=>readFileSync(resolve(root,p)), json=p=>JSON.parse(bytes(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const command=(name,args)=>{
 const r=spawnSync(name,args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:30000,maxBuffer:4000000,env:{...process.env,TEMP:resolve(root,'tmp'),TMP:resolve(root,'tmp'),PYTHONDONTWRITEBYTECODE:'1'}});
 assert.equal(r.status,0,`${name}: ${r.stderr}`);
 return {command:[name,...args],exitCode:r.status,stdout:r.stdout,stderr:r.stderr};
};
const full=json(`${prefix}/all-1789351166545.json`), docs=json(`${prefix}/docs-1789353339850.json`);
for(const source of full.sources.filter(s=>s.path!=='tests/test_readme.py')) assert.equal(sha(bytes(source.path)),source.sha256,source.path);
for(const source of docs.sources) assert.equal(sha(bytes(source.path)),source.sha256,source.path);
const evidence=bytes('qa/verification/REVAMP-R1-core-walk.md');
assert.equal(sha(evidence.subarray(0,436718)),'c49e808defa2ba4f020c9580eb9a3b725cd67621949b8dc0f83a9aa4343389e4');
const anchors=json(`${prefix}/inspection-1789351254378.json`).anchors;
for(const a of anchors){assert.equal(sha(bytes(a.path)),a.sha256,a.path);assert.equal(bytes(a.path).length,a.bytes);}
const weights=sha(bytes('pipeline/config/weights.yaml'));
assert.equal(weights,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
const pins=json('source-metadata-catalog.json').anchors;
for(const [p,h] of Object.entries(pins))assert.equal(sha(bytes(p)),h,p);
const first=json(`${prefix}/activation-34798579347/inspection.json`), second=json(`${prefix}/activation-34799037563/inspection.json`);
const zipComparison=command('python',['-B','-c',`import json,zipfile;from pathlib import Path;p=Path('${root.replaceAll('\\','/')}')/'${prefix}';a=zipfile.ZipFile(p/'activation-34798579347/checkpoint.zip');b=zipfile.ZipFile(p/'activation-34799037563/checkpoint.zip');names=set(a.namelist())-{'manifest.json'};assert all(a.read(n)==b.read(n) for n in names);print(json.dumps({'preserved':len(names),'newFiles':sorted(set(b.namelist())-set(a.namelist()))}))`]);
const remote=command('gh',['api','repos/hongyime/sgSHIOK2026/issues/34/comments?per_page=100','--jq','map(select(.body|startswith("<!-- sgshiok-source-notice:"))|{id,body,user:{id:.user.id,login:.user.login}})']);
const comments=JSON.parse(remote.stdout), sourceComments=comments.filter(c=>c.body.startsWith('<!-- sgshiok-source-notice:'));
assert.equal(sourceComments.length,16);
for(const notice of second.retainedVerifiedComments){
 const matches=sourceComments.filter(c=>c.id===notice.commentId);
 assert.equal(matches.length,1);assert.equal(matches[0].user.id,notice.authorId);
 assert.equal(sha(Buffer.from(matches[0].body)),notice.bodySha256);
}
assert.deepEqual(first.retainedVerifiedComments,second.retainedVerifiedComments);
const issue=command('gh',['issue','view','34','--repo','hongyime/sgSHIOK2026','--json','number,url,state,body']);
assert.equal(JSON.parse(issue.stdout).body.replaceAll('\r\n','\n'),bytes(`${prefix}/issue-body-active.txt`).toString().replaceAll('\r\n','\n'));
const cron=command('gh',['run','list','--repo','hongyime/sgSHIOK2026','--workflow','source-metadata-weekly.yml','--event','schedule','--limit','5','--json','databaseId,event,status,conclusion,headSha']);
const integrity=command('python',['-B','scripts/check_repo_integrity.py']);
assert.equal(integrity.stdout.trim(),'repo_integrity=ok');
const diff=command('git',['diff','--check']);
let preview;
try{
 const r=await fetch('http://127.0.0.1:4420/postplan.html',{signal:AbortSignal.timeout(10000)});
 const b=Buffer.from(await r.arrayBuffer());assert.equal(r.status,200);assert.equal(sha(b),sha(bytes('postplan.html')));
 preview={taskBoard:'http://127.0.0.1:4420/postplan.html',httpStatus:r.status,servedHashMatches:true,sha256:sha(b),browserRerun:false};
}catch(error){preview={taskBoard:'http://127.0.0.1:4420/postplan.html',probeError:error.message,browserRerun:false};}
const output={root,hostname:hostname(),at:new Date().toISOString(),implementationCommit:'0eec7fe1212f50e5b7110c949aed1e235afe8f40',
 workflow:{state:'active',issue:34,naturalScheduledRuns:JSON.parse(cron.stdout),first:first.summary,followUp:second.summary},
 arithmetic:{sources:'14+3+4+3=24',metadataRequests:'14+14=28',noticeRequests:'48+0=48',operationSeconds:'243.331235985+169.734610146=413.065846131',files:'157+5=162',tests:'1195-38+40=1197;1039+80+46+32=1197'},
 tests:{uniqueCases:1197,files:17,fullRun:{passed:1195,failed:2,receipt:'all-1789351166545.json'},finalDocs:{passed:40,failed:0,receipt:'docs-1789353339850.json'},singleFinalAllGreenRun:false,earlierTimeout:'all-1789350523581.json',functionalSourceHashesStillMatch:true,retainedWeb:{cases:1990,files:73,guards:42,rerun:false}},
 commands:[zipComparison,remote,issue,cron,integrity,diff],anchors,weights,metadataPins:pins,
 evidence:{oldBytes:436718,oldSha256:sha(evidence.subarray(0,436718)),prefixPreserved:true,appendedBytes:evidence.length-436718,sha256:sha(evidence)},preview,
 findings:['Weekly metadata operation active; real delivery and cross-run continuity verified.','Sixteen source notices, no duplicate POST in follow-up.','Source health needs attention; scheduler checkpoints remain ready.','Cloudflare rejected; private report storage and real-phone acceptance still open.'],
 disagreements:['No new owner factual disagreement.','Activation is not natural cron evidence or full product completion.'],
 pipelineRuns:0,pipelineSeconds:0,localInstalls:0,deployments:0,cloudflareUsed:false};
writeFileSync(resolve(root,prefix,'summary.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:resolve(root,prefix,'summary.json'),metadataActive:true,sourceNotices:sourceComments.length,followUpNewNoticeRequests:second.summary.githubNoticeRequests,protectedAnchors:anchors.length,evidence:output.evidence,preview}));
