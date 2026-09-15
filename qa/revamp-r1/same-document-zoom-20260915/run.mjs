import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { ROOT,BASE,BUDGET,config,ownedProfile } from './contract.mjs';
assert.equal(process.cwd(),ROOT,'Wrong working root');
assert.equal(process.argv[2],'--go','Explicit parent go required');
const configuration=process.argv[3];assert.equal(dirname(configuration??''),BASE);
config(JSON.parse(readFileSync(configuration,'utf8')));
const started=Date.now(),out=mkdtempSync(resolve(BASE,'observed-')),profile=resolve(out,'profile');assert.ok(ownedProfile(profile));
const env={...process.env,TEMP:out,TMP:out};
const write=(name,value)=>writeFileSync(resolve(out,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const record={out,profile,startedAt:new Date(started).toISOString(),budget:BUDGET,scope:'Independent deadline and owned-browser cleanup supervisor',commands:[]};
let child;
try {
  child=spawnSync(process.execPath,[resolve(BASE,'browser.mjs'),'--go',configuration,out],{cwd:ROOT,env,windowsHide:true,encoding:'utf8',timeout:BUDGET.work+BUDGET.cleanup,maxBuffer:8*1024*1024});
  write('stdout.txt',child.stdout??'');write('stderr.txt',child.stderr??'');
  record.child={exit:child.status,pid:child.pid,signal:child.signal,error:child.error?.message};
}catch(error){record.failure=error.stack;}
finally {
  try {
    const ps=(args,ms)=>{
      const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-File',resolve(BASE,'processes.ps1'),'-Profile',profile,...args],{cwd:ROOT,env,windowsHide:true,encoding:'utf8',timeout:Math.min(ms,started+BUDGET.total-BUDGET.receipt-Date.now()),maxBuffer:1024*1024});
      record.commands.push({args,exit:result.status,stdout:result.stdout,stderr:result.stderr,error:result.error?.message});assert.equal(result.status,0,result.stderr||result.error?.message);return JSON.parse(result.stdout);
    };
    const driver=existsSync(resolve(out,'browser.json'))?JSON.parse(readFileSync(resolve(out,'browser.json'),'utf8')):null;
    const receipt=existsSync(resolve(out,'owned-child.json'))?JSON.parse(readFileSync(resolve(out,'owned-child.json'),'utf8')):null;
    const discovered=ps(['-Phase','discover'],15000);record.discovered=discovered;
    if(driver?.cleanup?.verified&&discovered.pids.length===0)record.cleanup={verified:true,driverReceiptVerified:true};
    else {
      const pid=receipt?.pid??discovered.pids[0];
      if(pid) {
        assert.ok(!receipt||receipt.profile===profile);
        const path=resolve(out,'owned-before-close.json');
        if(!existsSync(path))write('owned-before-close.json',ps(['-BrowserPid',String(pid),'-Phase','snapshot'],15000));
        record.cleanup=ps(['-BrowserPid',String(pid),'-Phase','cleanup','-Receipt',path],45000);
      } else record.cleanup={verified:true,noBrowserDiscovered:true};
    }
    record.browserPassed=driver?.passed===true;
  }catch(error){record.cleanup={verified:false,error:error.stack};}
  record.elapsedMs=Date.now()-started;record.passed=child?.status===0&&record.browserPassed&&record.cleanup?.verified&&record.elapsedMs<=BUDGET.total;
  record.arithmetic='420000 work +60000 driver cleanup +90000 independent cleanup +30000 receipt =600000 ms';
  write('supervisor.json',record);console.log(JSON.stringify(record,null,2));process.exitCode=record.passed?0:1;
}
