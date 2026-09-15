import assert from 'node:assert/strict';
import { mkdtempSync,writeFileSync,readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const target=JSON.parse(readFileSync(resolve(root,'web/lib/report-project.json'),'utf8'));
assert.equal(target.projectUrl,'https://ztjilsfgoephcdcsgcks.supabase.co');
const key=process.env.SHIOK_SUPABASE_PUBLISHABLE_KEY;
assert.ok(key?.startsWith('sb_publishable_'));
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-cleanup-20260915/advisor-http-'));
const result={url:`${target.projectUrl}/rest/v1/rpc/rls_auto_enable`,method:'POST',body:'{}',authenticated:false,passed:false};
try{
  const response=await fetch(result.url,{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000),headers:{apikey:key,'Content-Type':'application/json'},body:'{}'});
  result.status=response.status;
  const body=await response.text();assert.ok(body.length<=4096);
  result.response=JSON.parse(body);
  result.rpcAbsent=response.status===404&&result.response.code==='PGRST202';
  assert.equal(result.rpcAbsent,true,'Do not classify other responses as inaccessible RPC');
  result.passed=true;
}catch(error){result.error=String(error.message).split(key).join('[withheld]').slice(0,500);process.exitCode=1;}
result.finishedAt=new Date().toISOString();
writeFileSync(resolve(out,'summary.json'),`${JSON.stringify(result,null,2)}\n`,{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));
