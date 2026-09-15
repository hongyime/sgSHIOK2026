import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { helperProcess } from './helper-process.mjs';
const options={cwd:'C:\\sgSHIOK2026',env:{...process.env,TEMP:'C:\\sgSHIOK2026\\tmp',TMP:'C:\\sgSHIOK2026\\tmp'},timeout:10000};
test('helper leaves parent event loop responsive to child HTTP requests',async()=>{
  const server=createServer((_req,res)=>res.end('parent-alive'));
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  try{
    const source=`fetch('http://127.0.0.1:${server.address().port}/').then(r=>r.text()).then(console.log)`;
    const result=await helperProcess(process.execPath,['-e',source],options);
    assert.equal(result.stdout.trim(),'parent-alive');
  }finally{await new Promise(ok=>server.close(ok));}
});
test('nonzero helper preserves separate stdout and stderr',async()=>{
  await assert.rejects(helperProcess(process.execPath,['-e',"console.log('partial');console.error('stage');process.exitCode=7"],options),error=>
    error.code===7&&error.stdout.trim()==='partial'&&error.stderr.trim()==='stage');
});
test('deadline terminates and reaps the owned helper',async()=>{
  await assert.rejects(helperProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{...options,timeout:1500}),error=>error.killed===true);
});
test('exhausted deadline refuses to spawn',async()=>{
  await assert.rejects(helperProcess('never-launch',[],{...options,timeout:0}),/deadline exhausted/);
});
