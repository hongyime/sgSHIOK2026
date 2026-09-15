import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer, request } from 'node:http';
import { createServer as portServer } from 'node:net';
import { readFileSync, writeFileSync, createWriteStream, createReadStream, statSync, mkdtempSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT='C:\\sgSHIOK2026',BASE=resolve(ROOT,'qa/revamp-r1/release-finalize-20260915');
assert.equal(process.cwd(),ROOT);
assert.equal(process.argv[2],'--go');
const receiptPath=process.argv[3];assert.equal(dirname(dirname(receiptPath)),BASE);
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const build=read(receiptPath),web=resolve(build.stage,'web');
assert.equal(build.passed,true);
assert.equal(build.scope,'frontend-only-not-deployable');
assert.equal(dirname(build.stage),resolve(ROOT,'tmp'));
assert.ok(build.stage.startsWith(resolve(ROOT,'tmp/frontend-release-20260915-')));
assert.equal(build.dataStage,resolve(ROOT,'tmp/core-release-20260915-candidate-2'));
const dataLedgerBytes=readFileSync(resolve(build.dataStage,'release-manifest.json'));
assert.equal(digest(dataLedgerBytes),build.dataStageManifestSha256);
const dataFiles=new Map(JSON.parse(dataLedgerBytes).files.filter(entry=>entry.path.startsWith('web/public/data/'))
  .map(entry=>['/'+entry.path.slice('web/public/'.length),entry]));
const outputManifest=resolve(dirname(receiptPath),'build-files.json');
assert.equal(digest(readFileSync(outputManifest)),build.buildOutput.manifestSha256);
assert.equal(readFileSync(resolve(web,'.next/BUILD_ID'),'utf8').trim(),build.buildId);
const out=mkdtempSync(resolve(BASE,'preview-'));
const write=(name,value)=>writeFileSync(resolve(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>['PATH','SYSTEMROOT','WINDIR','SYSTEMDRIVE','COMSPEC','PATHEXT'].includes(k.toUpperCase())));
Object.assign(env,{TEMP:resolve(ROOT,'tmp'),TMP:resolve(ROOT,'tmp'),NEXT_TELEMETRY_DISABLED:'1',
  SHIOK_REPORTS_ENABLED:'false',SHIOK_MODERATION_ENABLED:'false',
  SHIOK_DATA_BUNDLE:'generated_20260805_prefer_scored_routed',
  NEXT_PUBLIC_DATA_BASE:'/data/generated_20260805_prefer_scored_routed/',NEXT_PUBLIC_LAMP_OVERLAY_BASE:'/data/lamp_posts_v1/'});
const reserve=portServer();
await new Promise((ok,no)=>{reserve.once('error',no);reserve.listen(0,'127.0.0.1',ok);});
const nextPort=reserve.address().port;await new Promise(ok=>reserve.close(ok));
const command=[resolve(web,'node_modules/next/dist/bin/next'),'start',web,'-H','127.0.0.1','-p',String(nextPort)];
const child=spawn(process.execPath,command,{cwd:ROOT,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
child.stdout.pipe(createWriteStream(resolve(out,'next.stdout.txt'),{flags:'wx'}));
child.stderr.pipe(createWriteStream(resolve(out,'next.stderr.txt'),{flags:'wx'}));
const identity={out,pid:process.pid,nextPid:child.pid,nextPort,buildId:build.buildId,webRoot:web,
  receiptPath,receiptSha256:digest(readFileSync(receiptPath)),buildOutputManifest:outputManifest,
  buildOutputManifestSha256:build.buildOutput.manifestSha256,dataStage:build.dataStage,
  dataStageManifestSha256:build.dataStageManifestSha256,scope:build.scope,
  command,reporting:false,moderation:false,credentialsConfigured:false,dataMismatches:[]};
let closing=false;
const proxy=createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  if(!['GET','HEAD'].includes(req.method)||url.pathname.startsWith('/api/')){res.writeHead(403).end();return;}
  if(url.pathname==='/__qa/status'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(identity));return;}
  if(url.pathname.startsWith('/data/')){
    const entry=dataFiles.get(url.pathname);if(!entry){res.writeHead(404).end();return;}
    const file=resolve(build.dataStage,entry.path);
    try{
      const stats=statSync(file);assert.equal(stats.size,entry.bytes);
      res.writeHead(200,{'Content-Type':file.endsWith('.gz')?'application/gzip':'application/json',
        'Content-Length':stats.size,'Cache-Control':'public, max-age=31536000, immutable','Access-Control-Allow-Origin':'*'});
      if(req.method==='HEAD'){res.end();return;}
      const stream=createReadStream(file),hash=createHash('sha256');
      stream.on('data',bytes=>hash.update(bytes));stream.on('error',()=>res.destroy());
      stream.on('end',()=>{const actual=hash.digest('hex');if(actual!==entry.sha256){
        identity.dataMismatches.push({path:entry.path,expected:entry.sha256,actual});
        write('data-mismatch.json',identity.dataMismatches);close();
      }});
      res.on('close',()=>stream.destroy());stream.pipe(res);
    }catch(error){identity.dataMismatches.push({path:entry.path,error:error.message});res.destroy();close();}
    return;
  }
  const upstream=request({hostname:'127.0.0.1',port:nextPort,path:req.url,method:req.method,
    headers:{...req.headers,host:`127.0.0.1:${nextPort}`},timeout:30000},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
  upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end();});
  upstream.on('timeout',()=>upstream.destroy());res.on('close',()=>upstream.destroy());req.pipe(upstream);
});
function close(){if(closing)return;closing=true;proxy.closeAllConnections();proxy.close();if(child.exitCode===null)child.kill();}
process.on('SIGINT',close);process.on('SIGTERM',close);
child.on('error',error=>{write('failure.json',{error:error.message});close();process.exitCode=1;});
child.on('exit',(code,signal)=>{write('child-exit.json',{code,signal});close();process.exitCode=code??1;});
try{
  await new Promise((ok,no)=>{proxy.once('error',no);proxy.listen(0,'127.0.0.1',ok);});
  identity.url=`http://127.0.0.1:${proxy.address().port}/`;
  write('preview.json',identity);console.log(JSON.stringify(identity));
  setTimeout(close,60*60*1000).unref();
}catch(error){close();throw error;}
