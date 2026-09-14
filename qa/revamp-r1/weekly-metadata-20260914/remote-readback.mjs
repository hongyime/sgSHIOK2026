import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026', repo='hongyime/sgSHIOK2026', run=process.argv[2] ?? '34798579347';
assert.equal(process.cwd(),root);
assert.ok(['34798579347','34799037563'].includes(run));
const commands=[
 ['api',`repos/${repo}/actions/workflows/source-metadata-weekly.yml`,'--jq','{id,name,path,state}'],
 ['run','view',run,'--repo',repo,'--json','databaseId,attempt,event,headSha,status,conclusion,createdAt,updatedAt,url,jobs'],
 ['api',`repos/${repo}/actions/runs/${run}/artifacts?per_page=100`],
 ['api',`repos/${repo}/issues/34/comments?per_page=100`,'--jq','{sourceComments:map(select(.body|startswith("<!-- sgshiok-source-notice:"))|{id,html_url,created_at,updated_at,body,user:{id:.user.id,login:.user.login}}),otherCommentCount:map(select(.body|startswith("<!-- sgshiok-source-notice:")|not))|length}'],
 ['run','list','--repo',repo,'--workflow','source-metadata-weekly.yml','--event','schedule','--limit','5','--json','databaseId,event,status,conclusion,createdAt,headSha'],
];
const results=commands.map(args=>{
 const started=Date.now();
 const r=spawnSync('gh',args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:30000,maxBuffer:4000000,env:{...process.env,TEMP:resolve(root,'tmp'),TMP:resolve(root,'tmp')}});
 return {command:['gh',...args],exitCode:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr,elapsedMs:Date.now()-started};
});
const output=resolve(root,`qa/revamp-r1/weekly-metadata-20260914/remote-${Date.now()}.json`);
writeFileSync(output,JSON.stringify({at:new Date().toISOString(),runId:run,results},null,2)+'\n',{flag:'wx'});
assert.ok(results.every(r=>r.exitCode===0),output);
const state=JSON.parse(results[1].stdout), comments=JSON.parse(results[3].stdout);
console.log(JSON.stringify({output,run:{status:state.status,conclusion:state.conclusion,url:state.url,headSha:state.headSha,jobs:state.jobs},sourceNotices:comments.sourceComments.length,otherComments:comments.otherCommentCount,naturalScheduledRuns:JSON.parse(results[4].stdout).length}));
