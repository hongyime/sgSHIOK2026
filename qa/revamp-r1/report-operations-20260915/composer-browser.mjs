import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const base=resolve(root,'qa/revamp-r1/report-operations-20260915');
const out=mkdtempSync(resolve(base,'composer-browser-'));
const profile=resolve(out,'profile');mkdirSync(profile);mkdirSync(resolve(profile,'tmp'));
const r=createRequire(resolve(root,'web/package.json'));
const {createServer:createVite}=await import(pathToFileURL(r.resolve('vite')));
const hash=x=>createHash('sha256').update(x).digest('hex');
const result={startedAt:new Date().toISOString(),scope:'Synthetic component, not integrated Home or real report submission',checks:[],captures:[],errors:[],passed:false};
const write=(name,value)=>writeFileSync(resolve(out,name),value,{flag:'wx'});
write('runner.mjs',readFileSync(new URL(import.meta.url)));
result.sources=Object.fromEntries(['web/components/report-composer.tsx','web/components/report-composer.module.css','web/lib/reports.ts','web/lib/report-submission.ts','qa/revamp-r1/report-operations-20260915/composer-entry.tsx','qa/revamp-r1/report-operations-20260915/composer.html'].map(p=>[p,hash(readFileSync(resolve(root,p)))]));
const env=Object.fromEntries(['SystemRoot','WINDIR','SystemDrive','USERPROFILE','APPDATA','LOCALAPPDATA','ProgramData','ProgramFiles','ProgramFiles(x86)','ProgramW6432','PATH','ComSpec','PSModulePath'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
env.TEMP=env.TMP=resolve(profile,'tmp');
let vite,chrome,closed,ws,seq=0,session;
const pending=new Map();
function bounded(promise,ms,label){let t;return Promise.race([promise,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error(`${label} timeout`)),ms);})]).finally(()=>clearTimeout(t));}
function send(method,params={},sid=session){const id=++seq;return bounded(new Promise((done,reject)=>{pending.set(id,{done,reject});ws.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));}),6000,method).finally(()=>pending.delete(id));}
async function value(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;}
const delay=ms=>new Promise(done=>setTimeout(done,ms));
function check(name,passed){result.checks.push({name,passed:!!passed});assert.ok(passed,name);}
async function wait(expression){for(let n=0;n<30;n++){if(await value(expression))return;await delay(200);}throw Error(`Fixture state not reached: ${expression}`);}
async function click(text){await value(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(text)});if(!b)throw Error('Button absent');b.click()})()`);}
async function capture(label,width,height){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(150);
  const fit=await value(`({width:innerWidth,scroll:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('button')].map(b=>({label:b.textContent,w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})),heading:document.querySelector('h2')?.textContent})`);
  check(`${label}-${width} no horizontal overflow`,fit.scroll<=width);
  check(`${label}-${width} target sizes`,fit.buttons.every(b=>b.w>=44&&b.h>=44));
  const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const bytes=Buffer.from(screenshot.data,'base64'),file=`${label}-${width}x${height}.png`;write(file,bytes);result.captures.push({file,sha256:hash(bytes),bytes:bytes.length,fit});
}
const sockets=new Set();const proxy=createServer((req,res)=>{req.resume();res.writeHead(403).end();});
proxy.on('connection',s=>{sockets.add(s);s.on('close',()=>sockets.delete(s));});
proxy.on('connect',(_req,s)=>s.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'));
try{
  const memory=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',"Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory | ConvertTo-Json -Compress"],{cwd:root,encoding:'utf8',windowsHide:true,timeout:10000}));
  result.freeKiB=memory.FreePhysicalMemory;assert.ok(result.freeKiB>=1024*1024,'Headroom gate: no browser below 1GiB available');
  vite=await createVite({configFile:false,root:base,cacheDir:resolve(out,'cache'),logLevel:'error',resolve:{alias:[{find:/^react$/,replacement:r.resolve('react')},{find:/^react\/jsx-runtime$/,replacement:r.resolve('react/jsx-runtime')},{find:/^react\/jsx-dev-runtime$/,replacement:r.resolve('react/jsx-dev-runtime')},{find:/^react-dom\/client$/,replacement:r.resolve('react-dom/client')}]},server:{host:'127.0.0.1',port:0,hmr:false,watch:null,fs:{strict:true,allow:[base,resolve(root,'web/components'),resolve(root,'web/lib'),resolve(root,'web/node_modules')],deny:['**/.env*','**/public/data/**','**/raw/**','**/processed/**']}}});
  await vite.listen();const port=vite.httpServer.address().port;result.origin=`http://127.0.0.1:${port}`;
  await new Promise(done=>proxy.listen(0,'127.0.0.1',done));const proxyPort=proxy.address().port;
  const args=['--headless=new','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-default-apps','--disable-background-networking','--disable-component-update','--disable-sync','--disable-breakpad','--disable-crash-reporter','--disable-quic','--disable-gpu',`--proxy-server=http://127.0.0.1:${proxyPort}`,'--proxy-bypass-list=127.0.0.1;localhost','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,`--crash-dumps-dir=${profile}`,`--log-file=${resolve(profile,'chrome.log')}`,'about:blank'];
  chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args,{cwd:root,windowsHide:true,env,stdio:['ignore','ignore','pipe']});result.chromePid=chrome.pid;
  closed=new Promise(done=>chrome.once('close',(code,signal)=>{result.chromeExit={code,signal};done();}));
  const endpoint=await bounded(new Promise((done,reject)=>{let stderr='';chrome.once('error',reject);chrome.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-16384);const found=/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr);if(found)done(found[1]);});}),15000,'Chrome startup');
  assert.equal(new URL(endpoint).hostname,'127.0.0.1');ws=new WebSocket(endpoint);
  ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.done(m.result);}else if(m.method==='Runtime.exceptionThrown')result.errors.push(m.params.exceptionDetails);};
  await bounded(new Promise((done,reject)=>{ws.onopen=done;ws.onerror=reject;}),4000,'CDP');
  const page=await send('Target.createTarget',{url:'about:blank'},null);session=(await send('Target.attachToTarget',{targetId:page.targetId,flatten:true},null)).sessionId;
  await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:`${result.origin}/composer.html`});
  await wait("document.querySelector('h2')?.textContent==='Draft report'");
  for(const [w,h]of[[1440,950],[390,844],[390,667],[320,667]])await capture('draft',w,h);
  await value("document.querySelector('input[value=mapping_error]').click()");await click('Review report');
  await wait("document.querySelector('h2')?.textContent==='Review report'");await capture('review',320,667);
  check('no dispatch before explicit Send',await value('window.fixture.requests.length===0'));
  await click('Send report');await wait("document.querySelector('h2')?.textContent==='Save not confirmed'");await capture('uncertain',320,667);
  check('uncertain remains unsaved',await value('window.fixture.unsaved===true'));
  await value("document.querySelector('[aria-label=\"Close report\"]').click()");await capture('close-uncertain',320,667);
  await click('Keep report open');await click('Retry same report');await wait("document.querySelector('h2')?.textContent==='Report received'");
  check('same immutable request body and retry secret',await value('window.fixture.requests.length===2&&window.fixture.requests[0].body===window.fixture.requests[1].body&&window.fixture.requests[0].secret===window.fixture.requests[1].secret'));
  check('receipt clears unsaved state',await value('window.fixture.unsaved===false'));
  await capture('received',320,667);await click('Done');await wait("document.querySelector('h2')?.textContent==='Closed'");
  check('no page exceptions',result.errors.length===0);result.passed=true;
}catch(error){result.error=String(error.message);process.exitCode=1;}
finally{
  write('work-before-cleanup.json',JSON.stringify(result,null,2)+'\n');
  if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close',{},null);}catch{}ws.close();}
  try{
    if(chrome){try{await bounded(closed,6000,'Chrome close');}catch{
      const filter=`*--user-data-dir=${profile}*`;
      const command=`$owned=@(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '${filter}' }); $ids=@($owned | ForEach-Object { $_.ProcessId }); foreach($p in $owned) { Stop-Process -Id $p.ProcessId -ErrorAction SilentlyContinue; Wait-Process -Id $p.ProcessId -Timeout 5 -ErrorAction SilentlyContinue }; $remaining=@(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '${filter}' }); [PSCustomObject]@{Selected=$ids;Remaining=$remaining.Count} | ConvertTo-Json -Compress`;
      result.cleanupReconciliation=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',command],{cwd:root,windowsHide:true,env,timeout:15000,encoding:'utf8'}));
      assert.equal(result.cleanupReconciliation.Remaining,0);
      chrome.stderr.destroy();await bounded(closed,5000,'reconciled Chrome close');
    }}
  }catch(error){result.cleanupError=String(error.message);result.passed=false;process.exitCode=1;}
  try{await vite?.close();for(const socket of sockets)socket.destroy();await new Promise(done=>proxy.close(done));}
  catch(error){result.serverCleanupError=String(error.message);result.passed=false;process.exitCode=1;}
  result.closed=!!result.chromeExit;result.finishedAt=new Date().toISOString();
  result.sourcesUnchanged=Object.entries(result.sources).every(([p,h])=>hash(readFileSync(resolve(root,p)))===h);
  if(!result.sourcesUnchanged){result.passed=false;process.exitCode=1;}
  write('summary.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({out,...result},null,2));
}
