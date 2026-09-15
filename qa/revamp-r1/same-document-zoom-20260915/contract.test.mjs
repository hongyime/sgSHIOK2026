import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, BUDGET, METRICS, config, ownedProfile, sameSelection, nativeZoom, allMetrics, transition, knownBlockedBrowserTraffic } from './contract.mjs';
const input = { approved:'exact-preview-go',target:'http://127.0.0.1:4500/?debugMap=1&postal=018956&transit=mrt_lrt&stop=mrt%3A21677',buildId:'test',sources:[{path:'web/app/page.tsx',sha256:'a'.repeat(64)}] };
const doc = {timeOrigin:1,documentToken:'id',url:input.target,routeKey:'walk',geometry:'line',destination:'Exit E',postal:'018956',pressed:'MRT',focusToken:'token',focusSame:true};
const normal = {dpr:1,scale:1,cssZoom:'1',bodyZoom:'1',inner:[1424,799],outer:[1440,950]};
const doubled = {...normal,dpr:2,inner:[712,399]};
const win = {hwnd:10,pid:20,client:{width:1424,height:912},window:{width:1440,height:950},dpi:96,visible:true,minimized:false};
test('bounds reserve independent cleanup and receipt time',()=>assert.equal(BUDGET.work+BUDGET.cleanup+BUDGET.supervisor+BUDGET.receipt,BUDGET.total));
test('accept exact parent config',()=>assert.equal(config(input).origin,'http://127.0.0.1:4500'));
for (const [name,change] of Object.entries({approval:{approved:undefined},remote:{target:input.target.replace('127.0.0.1','example.com')},credentials:{target:input.target.replace('http://','http://user:pass@')},withoutSelection:{target:'http://127.0.0.1:4500/'},withoutSources:{sources:[]},absoluteSource:{sources:[{path:'X:\\file',sha256:'a'.repeat(64)}]},escapeSource:{sources:[{path:'../file',sha256:'a'.repeat(64)}]},badHash:{sources:[{path:'web/app/page.tsx',sha256:'wrong'}]},remoteReply:{localReplies:[{url:'https://other.example/tile',path:'qa/tile.png',sha256:'a'.repeat(64)}]}})) test(`reject ${name}`,()=>assert.throws(()=>config({...input,...change})));
test('one exact owned profile',()=>assert.equal(ownedProfile(BASE+'\\observed-Ab12Cd\\profile'),true));
for(const profile of [BASE+'\\observed-Ab12Cd\\profile\\child',BASE+'\\observed-Ab12Cd\\..\\profile','C:\\sgSHIOK2026\\tmp\\profile','X:\\profile'])test(`reject profile ${profile}`,()=>assert.equal(ownedProfile(profile),false));
test('identity preserves document and focused DOM object',()=>assert.equal(sameSelection(doc,doc,{focus:true}),true));
for(const key of ['timeOrigin','documentToken','url','routeKey','geometry','destination','postal','pressed','focusToken'])test(`reject changed ${key}`,()=>assert.equal(sameSelection(doc,{...doc,[key]:'different'},{focus:true}),false));
test('reject replaced same-label focused element',()=>assert.equal(sameSelection(doc,{...doc,focusSame:false},{focus:true}),false));
for(const key of ['timeOrigin','documentToken','url','routeKey','geometry','destination','postal','pressed','focusToken'])test(`cannot preserve missing ${key}`,()=>{const missing={...doc,[key]:undefined};assert.equal(sameSelection(missing,missing,{focus:true}),false);});
test('empty geometry cannot establish selected route',()=>assert.equal(sameSelection({...doc,geometry:'[]'},{...doc,geometry:'[]'}),false));
test('native double zoom requires stable physical window and DPR',()=>assert.equal(nativeZoom(normal,doubled,2,win,win),true));
test('native reset',()=>assert.equal(nativeZoom(normal,normal,1,win,win),true));
for(const [name,change]of Object.entries({pinch:{scale:2},css:{cssZoom:'2'},body:{bodyZoom:'2'},metricsOnly:{dpr:1},resize:{outer:[720,950]},widthOnly:{inner:[712,799]}}))test(`reject zoom substitute ${name}`,()=>assert.equal(nativeZoom(normal,{...doubled,...change},2,win,win),false));
for(const [name,change]of Object.entries({window:{window:{width:720,height:950}},client:{client:{width:712,height:912}},otherWindow:{hwnd:11},otherPid:{pid:30},dpi:{dpi:192},hidden:{visible:false},minimized:{minimized:true}}))test(`reject native ${name}`,()=>assert.equal(nativeZoom(normal,doubled,2,win,{...win,...change}),false));
const values=Object.fromEntries(METRICS.map((m,i)=>[m,`${i+1} m`]));
const metrics=METRICS.map(label=>({label,value:values[label],visible:true}));
test('all four metrics read across scroll captures',()=>assert.equal(allMetrics(metrics.map(m=>({before:[m],after:[m]})),values),true));
for(const changes of [{visible:false},{value:'changed'}])test(`reject unreadable metric ${JSON.stringify(changes)}`,()=>assert.equal(allMetrics([{before:metrics,after:metrics.map((m,i)=>i===3?{...m,...changes}:m)}],values),false));
test('not merely count four labels',()=>assert.equal(allMetrics([{before:metrics.slice(0,3),after:metrics.slice(0,3)}],values),false));
test('five native shortcuts observe every genuine intermediate DPR',async()=>{const actions=[],waits=[];const r=await transition({snapshot:async()=>doc,shortcut:async x=>(actions.push(x),x),wait:async n=>waits.push(n),factor:2});assert.deepEqual(actions,Array(5).fill('in'));assert.deepEqual(waits,[1.1,1.25,1.5,1.75,2]);assert.equal(r.commands.length,5);});
test('reset uses native Ctrl0 once',async()=>{const actions=[],waits=[];await transition({snapshot:async()=>doc,shortcut:async x=>actions.push(x),wait:async n=>waits.push(n),factor:1});assert.deepEqual(actions,['reset']);assert.deepEqual(waits,[1]);});
test('native send refusal stops without loop or substitution',async()=>{let calls=0;await assert.rejects(transition({snapshot:async()=>doc,shortcut:async()=>{calls++;throw Error('no foreground');},wait:async()=>{},factor:2}),/no foreground/);assert.equal(calls,1);});
test('missing DPR change stops without another shortcut',async()=>{let calls=0;await assert.rejects(transition({snapshot:async()=>doc,shortcut:async()=>++calls,wait:async()=>{throw Error('DPR unchanged');},factor:2}),/DPR unchanged/);assert.equal(calls,1);});
test('document navigation cannot pass transition',async()=>{let calls=0;await assert.rejects(transition({snapshot:async()=>calls++?{...doc,timeOrigin:2}:doc,shortcut:async()=>{},wait:async()=>{},factor:1}),/document\/selection\/focus/);});
for(const url of ['www.gstatic.com:443','accounts.google.com:443','www.google.com:443'])test('classifies only observed blocked browser CONNECT '+url,()=>assert.equal(knownBlockedBrowserTraffic({kind:'connect',url}),true));
test('classifies blocked Chrome time request without exposing query values',()=>assert.equal(knownBlockedBrowserTraffic({kind:'proxy',method:'GET',url:'http://clients2.google.com/time/1/current?test=1'}),true));
for(const entry of [
  {kind:'page',method:'GET',url:'http://clients2.google.com/time/1/current'},
  {kind:'proxy',method:'POST',url:'http://clients2.google.com/time/1/current'},
  {kind:'proxy',method:'GET',url:'http://clients2.google.com/other'},
  {kind:'connect',url:'www.onemap.gov.sg:443'},
  {kind:'connect',url:'www.google.com:8443'},
  {kind:'proxy',method:'GET',url:'http://user@clients2.google.com/time/1/current'}
])test('does not exempt application or unknown traffic '+JSON.stringify(entry),()=>assert.equal(knownBlockedBrowserTraffic(entry),false));
