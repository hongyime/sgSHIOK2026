import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import os from 'node:os';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';

const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const out = resolve(root, 'qa/revamp-r1/release-runtime-20260913');
const analysis = JSON.parse(readFileSync(resolve(out, 'runtime-analysis.json')));
const sources = analysis.samples.filter(s => s.sanitizers.length).map(s => ({name:s.name, ...s.sanitizers[0]}));
for (const s of sources) assert.equal(createHash('sha256').update(s.code).digest('hex'), s.sha256);
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const started = Date.now(), deadline = started + 120000;
const report = {root, hostname:process.env.COMPUTERNAME, startedAt:new Date().toISOString(),
  profile, browserFallback:'Browser plugin bootstrap failed os error3; owned Chrome/CDP on about:blank.',
  scope:'Extracted unmodified static sanitizer methods; inert DOMParser output only. No insertion, event execution, production browser or source/provider request.',
  checks:[], errors:[], network:[], sources:sources.map(({code,...s})=>s)};
let chrome, ws, stderr='', sequence=0, session, closing=false;
const pending = new Map();
const delay = ms => new Promise(r=>setTimeout(r,ms));
async function until(fn) {
  while(Date.now()<deadline-30000){const v=await fn();if(v)return v;await delay(100);}
  throw Error('Probe deadline');
}
function send(method, params={}, sessionId='') {
  return new Promise((done,reject)=>{
    const id=++sequence, timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},10000);
    pending.set(id, message=>{clearTimeout(timer);pending.delete(id);message.error?reject(Error(JSON.stringify(message.error))):done(message.result);});
    ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
  });
}
try {
  report.availableMiB=os.freemem()/1048576; assert.ok(report.availableMiB>=1024,'Host memory gate');
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
    '--headless=new','--no-first-run','--disable-background-networking','--disable-component-update',
    '--disable-sync','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
  ],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  report.pid=chrome.pid;chrome.stderr.on('data',b=>{stderr+=b;});
  chrome.on('error',e=>report.errors.push(e.message));
  const endpoint=await until(()=>/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1]);
  ws=new WebSocket(endpoint);
  await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('CDP connection timeout')),10000);ws.onopen=()=>{clearTimeout(timer);done();};ws.onerror=()=>{clearTimeout(timer);reject(Error('CDP connection failed'));};});
  ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id)pending.get(m.id)?.(m);else if(m.method==='Network.requestWillBeSent')report.network.push({url:m.params.request.url,method:m.params.request.method});};
  const page=(await send('Target.getTargets')).targetInfos.find(t=>t.type==='page'&&t.url==='about:blank');assert.ok(page);
  session=(await send('Target.attachToTarget',{targetId:page.targetId,flatten:true})).sessionId;
  await send('Runtime.enable',{},session);await send('Network.enable',{},session);
  await send('Network.setBlockedURLs',{urls:['*']},session);
  report.browser=await send('Browser.getVersion');
  const cases=[
    {name:'adjacent-event-attributes',html:'<div onclick="1" onmouseover="2">walk</div>'},
    {name:'attribution-details-shape',html:'<details open onload="1" ontoggle="2">walk</details>'},
    {name:'url-before-event',html:'<a href="javascript:1" onclick="2">walk</a>'},
    {name:'safe-attribution',html:'<a href="https://www.onemap.gov.sg/">OneMap</a>'},
  ];
  report.results=[];
  for(const source of sources){
    const expression=`(()=>{const Sanitizer=(${source.code});return ${JSON.stringify(cases)}.map(c=>{const output=Sanitizer.sanitize(c.html);const doc=new DOMParser().parseFromString(output,'text/html');const dangerous=[...doc.body.querySelectorAll('*')].flatMap(e=>[...e.attributes].filter(a=>a.name.startsWith('on')||(['href','src','xlink:href'].includes(a.name)&&/javascript:|data:/i.test(a.value.replace(/\\s/g,'')))).map(a=>({tag:e.tagName,name:a.name,value:a.value})));return {name:c.name,input:c.html,output,dangerous};});})()`;
    const result=await send('Runtime.evaluate',{expression,returnByValue:true},session);
    assert.equal(result.exceptionDetails,undefined);const casesResult=result.result.value;
    report.results.push({name:source.name,cases:casesResult});
    for(const c of casesResult){
      const expected=source.name==='current-installed-vendor'||c.name==='safe-attribution'?0:1;
      const pass=c.dangerous.length===expected;
      report.checks.push({name:source.name+'/'+c.name,expectedRemaining:expected,actualRemaining:c.dangerous.length,pass});assert.ok(pass);
    }
  }
  assert.equal(report.network.length,0,'No network requests permitted');
  report.pass=true;
} catch(error) {report.errors.push(error.stack||String(error));report.pass=false;process.exitCode=1;}
finally {
  closing=true;
  if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close');}catch{}ws.close();}
  if(chrome){report.cleanup=cleanup(profile);if(!report.cleanup.verified){report.pass=false;process.exitCode=1;}}
  report.elapsedMs=Date.now()-started;report.completedAt=new Date().toISOString();
  writeFileSync(resolve(out,'sanitizer-probe.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,network:report.network.length,
    cleanup:report.cleanup?.verified,errors:report.errors,elapsedMs:report.elapsedMs},null,2));
}
