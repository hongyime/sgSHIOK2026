import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'qa/prototypes');
const profile=resolve(root,'tmp/preview-browser-'+Date.now());mkdirSync(profile,{recursive:true});
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--no-sandbox','--disable-gpu','--no-first-run','--remote-debugging-port=9269','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','inherit']});
let ws;try {
 let tabs;for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:9269/json')).json();break}catch{await new Promise(r=>setTimeout(r,500))}}
 if(!tabs)throw Error('Browser startup failed');ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))});
 const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:950,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:pathToFileURL(resolve(out,'shelter-walk.html')).href});await new Promise(r=>setTimeout(r,15000));
 const results={};for(const [name,width,height,mobile] of [['desktop',1440,950,false],['mobile',390,844,true]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await new Promise(r=>setTimeout(r,1000));
 results[name]=await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,status:document.querySelector('#mapstatus').textContent,loadedTiles:[...cache.values()].filter(i=>i.complete&&i.naturalWidth).length})`);
 writeFileSync(resolve(out,'shelter-'+name+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 results.dialog=await evaluate(`document.querySelector('#report').click();document.querySelector('#feedback').open`);
 await evaluate(`document.querySelector('#feedback').close();document.querySelector('#expand').click()`);
 results.sheet=await evaluate(`document.querySelector('#panel').classList.contains('expanded')`);
 await evaluate(`document.querySelector('[data-gap="1"]').click()`);
 results.gap=await evaluate(`document.querySelector('[data-gap="1"]').getAttribute('aria-pressed')==='true'`);
 writeFileSync(resolve(out,'preview-check.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 if(results.desktop.overflow||results.mobile.overflow||!results.dialog||!results.sheet||!results.gap)process.exitCode=1;
 void send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();setTimeout(()=>process.exit(process.exitCode||0),1000).unref()}
