import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = 'C:/sgSHIOK2026/';
const plan = readFileSync(root+'PRODUCT-PLAN.md','utf8');
const tasks = [...plan.matchAll(/^### \[([ x])\] (T\d+): (.+)$/gm)].map(m=>({id:m[2],title:m[3],markedDone:m[1]==='x'}));
const input = readFileSync(root+'qa/revamp-r1/coverage-register-20260909/resume-20260912-pilot/summary.json');
const projection = JSON.parse(input).projection;
const components = Object.entries(projection.components).filter(([key])=>!['normalizationMs','serializationMs'].includes(key));
const remainingSeconds = components.reduce((sum,[,ms])=>sum+ms,0)/1000;
const result = {root,hostname:process.env.COMPUTERNAME,base:'8a8217c',tasks,
  counts:{total:tasks.length,markedDone:tasks.filter(t=>t.markedDone).length,open:tasks.filter(t=>!t.markedDone).length},
  coverage:{pilotSha256:createHash('sha256').update(input).digest('hex'),originalGate:projection,
    hypothetical:'Remove all normalization and serialization cost, hold measured IO rates/volumes fixed; not a new measurement or permission.',
    remainingComponentsMs:components,remainingSeconds,bufferedSeconds:Math.ceil(remainingSeconds*1.25+30)},
  gates:[{tasks:['T01','T27','T29'],needs:'Actual release identity and retained-old-runtime security disposition; local compatibility is not deployment security approval.'},
    {tasks:['T02','T19','T20'],needs:'Materially changed performance conditions or separately agreed coverage budget. Latest host counters near100%CPU with paging; no repeated timing runs.'},
    {tasks:['T13','T14','T15','T16','T17','T18'],needs:'Owner provider/privacy/retention/caps/moderator/backup decisions. Questions already sent, no answer assumed.'},
    {tasks:['T21'],needs:'Named data job approval after coverage proposal; no pipeline authorized.'},
    {tasks:['T23'],needs:'Owner approval of scheduled metadata checks and notification destination; local checker already implemented.'},
    {tasks:['T25','T26'],needs:'Native platform/device and real-user acceptance; emulator checks do not substitute.'},
    {tasks:['T28'],needs:'Exact release approval, then deployment; push alone is not authorization.'}],
  review:'Subagent quota unavailable until2026-09-15 09:34; no quota-evasion retries.',
  FINDINGS:['31tasks remain14marked done+17open, not full completion. Latest app fix passed1788webtests+42guards and visual checks.',
    'CPU-only coverage optimization cannot close the current projection: residual2257s buffered still exceeds900s. No scan or input read was added.',
    'STATE was consolidated to remove superseded next-step instructions while preserving linked immutable evidence.'],
  DISAGREEMENTS:['Do not treat routine autonomy as approval to activate resident-data storage, run a larger scan, accept retained-runtime risk or deploy.'],
  goalStatus:'active',blockedAudit:'First equivalent impasse observation after prior progress; not eligible for blocked status yet.'};
writeFileSync(root+'qa/revamp-r1/completion-gates-20260912/summary.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({counts:result.counts,coverageBufferedSeconds:result.coverage.bufferedSeconds,goal:result.goalStatus}));
