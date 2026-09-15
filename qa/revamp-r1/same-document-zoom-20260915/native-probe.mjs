import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { freemem } from 'node:os';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, BASE, POWERSHELL, ownedProfile } from './contract.mjs';

assert.equal(process.cwd(),ROOT);assert.equal(process.argv[2],'--go');
const out=mkdtempSync(resolve(BASE,'observed-')),profile=resolve(out,'profile');assert.ok(ownedProfile(profile));
mkdirSync(profile);mkdirSync(resolve(profile,'tmp'));
const started=Date.now(),report={out,profile,startedAt:new Date().toISOString(),freeBytes:freemem(),
  scope:'Native helper stage diagnosis on one owned blank Chrome window; no app navigation or acceptance claim',
  helperSha256:createHash('sha256').update(readFileSync(resolve(BASE,'native-shortcut.ps1'))).digest('hex'),
  steps:[],blockedBackgroundRequests:0,passed:false};
const env=Object.fromEntries(['SystemRoot','WINDIR','SystemDrive','USERPROFILE','APPDATA','LOCALAPPDATA','ProgramData','ProgramFiles','ProgramFiles(x86)','ProgramW6432','PATH','ComSpec','PSModulePath'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
env.TEMP=env.TMP=resolve(profile,'tmp');
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
const sockets=new Set();let chrome,proxy;
async function helper(args,timeoutMs){
  const step={args,timeoutMs,startedMs:Date.now()-started,stdout:'',stderr:''};report.steps.push(step);
  const process=spawn(POWERSHELL,['-NoProfile','-NonInteractive','-File',resolve(BASE,'native-shortcut.ps1'),...args,'-Trace'],
    {cwd:ROOT,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  process.stdout.on('data',b=>{step.stdout+=b;});process.stderr.on('data',b=>{step.stderr+=b;});
  await new Promise((done,reject)=>{
    const timer=setTimeout(()=>{step.timedOut=true;process.kill();},timeoutMs);
    process.once('error',error=>{clearTimeout(timer);reject(error);});
    process.once('close',(code,signal)=>{clearTimeout(timer);step.code=code;step.signal=signal;done();});
  });
  step.elapsedMs=Date.now()-started-step.startedMs;
  assert.ok(!step.timedOut&&step.code===0,JSON.stringify(step));
  step.value=JSON.parse(step.stdout.replace(/^\uFEFF/,''));
}
try{
  assert.ok(report.freeBytes>=1024**3,'Requires1GiB available');
  await helper(['-SelfTest'],30000);
  proxy=createServer((req,res)=>{report.blockedBackgroundRequests++;req.resume();res.writeHead(403).end();});
  proxy.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
  proxy.on('connect',(_req,socket)=>{report.blockedBackgroundRequests++;socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');});
  await new Promise((ok,no)=>{proxy.once('error',no);proxy.listen(0,'127.0.0.1',ok);});
  const args=['--no-first-run','--no-default-browser-check','--disable-extensions','--disable-default-apps','--disable-background-networking','--disable-component-update','--disable-sync','--disable-breakpad','--disable-crash-reporter','--disable-quic',
    '--window-size=1440,950','--force-device-scale-factor=1',`--proxy-server=http://127.0.0.1:${proxy.address().port}`,
    '--proxy-bypass-list=127.0.0.1;localhost','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    '--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,`--crash-dumps-dir=${profile}`,`--log-file=${resolve(profile,'chrome.log')}`,'about:blank'];
  chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args,{cwd:ROOT,env,windowsHide:true,stdio:'ignore'});
  report.chromePid=chrome.pid;writeFileSync(resolve(out,'owned-child.json'),JSON.stringify({pid:chrome.pid,profile})+'\n',{flag:'wx'});
  chrome.on('exit',(code,signal)=>{report.chromeExit={code,signal};});
  const end=Date.now()+15000;
  while(!existsSync(resolve(profile,'DevToolsActivePort'))&&Date.now()<end)await delay(100);
  assert.ok(existsSync(resolve(profile,'DevToolsActivePort')),'Chrome startup deadline');
  for(const action of ['inspect','reset'])await helper(['-BrowserPid',String(chrome.pid),'-Profile',profile,'-Action',action],20000);
  report.passed=true;
}catch(error){report.failure=error.stack;}
finally{
  if(chrome?.exitCode===null&&chrome?.signalCode===null){chrome.kill();const end=Date.now()+8000;while(chrome.exitCode===null&&chrome.signalCode===null&&Date.now()<end)await delay(100);}
  report.childExited=chrome?.exitCode!==null||chrome?.signalCode!==null;
  for(const socket of sockets)socket.destroy();if(proxy)await new Promise(ok=>proxy.close(ok));
  report.elapsedMs=Date.now()-started;
  writeFileSync(resolve(out,'native-probe.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
}
