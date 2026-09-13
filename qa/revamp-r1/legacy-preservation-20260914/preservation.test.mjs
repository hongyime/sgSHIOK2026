import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { preparePreservation, preservedCacheEntry, validPreservationBaseline } from './preservation.mjs';

function context() {
  const local=new Map(), session=new Map(), cache=new Map();
  const storage=map=>({setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)});
  return vm.createContext({ localStorage:storage(local), sessionStorage:storage(session), Response,
    caches:{open:async name=>{assert.equal(name,'qa-unrelated-cache');return{put:async(k,v)=>cache.set(k,v),match:async k=>cache.get(k)?.clone()};}} });
}
test('all named steps execute and read back actual synthetic storage/cache', async()=>{
  const c=context(),records=[],operations=[];
  await preparePreservation({evaluate:fn=>vm.runInContext('('+fn.toString()+')()',c),now:()=>0,remaining:()=>180000,operation:v=>operations.push(v),records});
  assert.equal(records.length,5); assert.ok(records.every(r=>r.outcome==='verified'&&r.budgetMs===10000));
  assert.deepEqual(operations,['local-storage','session-storage','cache-open','cache-put','cache-readback'].map(n=>'preservation:'+n));
});
test('steps share one ten-second budget, not one budget each',async()=>{
  let clock=0;const budgets=[],records=[];
  await assert.rejects(preparePreservation({evaluate:async(fn,arg,budget)=>{budgets.push(budget);clock+=3000;return true;},now:()=>clock,remaining:()=>180000,operation:()=>{},records}),/aggregate deadline/);
  assert.deepEqual(budgets,[10000,7000,4000,1000]);assert.equal(records.at(-1).outcome,'failed');
});
test('remaining browser-work time caps preparation',async()=>{
  let clock=0;const budgets=[];
  await assert.rejects(preparePreservation({evaluate:async(fn,arg,budget)=>{budgets.push(budget);clock+=1000;return true;},now:()=>clock,remaining:()=>2000-clock,operation:()=>{},records:[]}),/aggregate deadline/);
  assert.deepEqual(budgets,[2000,1000]);
});
test('failed readback halts before any later step',async()=>{
  let calls=0;const records=[];
  await assert.rejects(preparePreservation({evaluate:async()=>++calls!==3,now:()=>0,remaining:()=>10000,operation:()=>{},records}),/cache-open readback/);
  assert.equal(calls,3);assert.equal(records.at(-1).outcome,'failed');
});
test('command failure retains command identity and stops',async()=>{
  const error=Object.assign(new Error('command timeout'),{commandId:25});const records=[];
  await assert.rejects(preparePreservation({evaluate:async()=>{throw error;},now:()=>0,remaining:()=>10000,operation:()=>{},records}),e=>e===error&&e.commandId===25);
  assert.equal(records.length,1);assert.equal(records[0].error,'command timeout');
});
const options={origin:'http://127.0.0.1:1234',documentSha256:'b'.repeat(64),documentBytes:200};
const entry={cache:'sgshiok-static-v1',url:options.origin+'/',sha256:'a'.repeat(64),bytes:100};
test('the exact received current HTML may replace the old canonical page',()=>{
  assert.equal(preservedCacheEntry(entry,{...entry,sha256:options.documentSha256,bytes:200},options),true);
});
test('unchanged canonical HTML remains acceptable',()=>assert.equal(preservedCacheEntry(entry,{...entry},options),true));
for(const [label,changes] of [
  ['immutableasset',{url:options.origin+'/_next/static/a.js'}],
  ['data',{url:options.origin+'/data/manifest.json'}],
  ['unrelatedcache',{cache:'qa-unrelated-cache'}],
  ['query',{url:options.origin+'/?postal=018956'}],
  ['otherorigin',{url:'http://127.0.0.1:4321/'}],
])test('does not permit changed '+label,()=>{
  const before={...entry,...changes};assert.equal(preservedCacheEntry(before,{...before,sha256:options.documentSha256,bytes:200},options),false);
  assert.equal(preservedCacheEntry(before,{...before},options),true);
});
test('missing entries, arbitrary HTML and incorrect byte sizes fail',()=>{
  for(const after of [undefined,{...entry,sha256:'c'.repeat(64),bytes:200},{...entry,sha256:options.documentSha256,bytes:199}])assert.equal(preservedCacheEntry(entry,after,options),false);
});
const baseline=()=>({local:{'__qa:reload-preserve':'local-sentinel'},session:{'__qa:reload-preserve':'session-sentinel'},entries:[{cache:'qa-unrelated-cache',url:options.origin+'/__qa/preserve',bytes:Buffer.byteLength('cache-sentinel'),sha256:createHash('sha256').update('cache-sentinel').digest('hex')}]});
test('baseline requires both storage sentinels and one exact cache sentinel',()=>assert.equal(validPreservationBaseline(baseline(),options.origin),true));
for(const [name,change] of [
  ['missinglocal',b=>delete b.local['__qa:reload-preserve']],
  ['wronglocal',b=>b.local['__qa:reload-preserve']='wrong'],
  ['missingsession',b=>delete b.session['__qa:reload-preserve']],
  ['wrongsession',b=>b.session['__qa:reload-preserve']='wrong'],
  ['missingcache',b=>b.entries=[]],
  ['wronghash',b=>b.entries[0].sha256='0'.repeat(64)],
  ['wrongsize',b=>b.entries[0].bytes++],
  ['wrongorigin',b=>b.entries[0].url='http://127.0.0.1:4321/__qa/preserve'],
  ['wrongcache',b=>b.entries[0].cache='sgshiok-static-v1'],
  ['duplicate',b=>b.entries.push({...b.entries[0]})],
])test('baseline rejects '+name,()=>{const b=baseline();change(b);assert.equal(validPreservationBaseline(b,options.origin),false);});
