import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const dir=resolve(root,'qa/revamp-r1/legacy-preservation-20260914');
const raw=readFileSync(resolve(dir,'preflight.json')),preflight=JSON.parse(raw);
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(preflight.host.status,0);assert.equal(preflight.host.samples.length,3);
assert.ok(preflight.host.samples.every(s=>Number.isFinite(s.availableMiB)&&s.availableMiB>=1024));
assert.ok(preflight.tests.every(r=>r.status===0));
for(const [path,hash] of Object.entries(preflight.sources))assert.equal(sha(readFileSync(resolve(dir,path))),hash,path);
const result={createdAt:new Date().toISOString(),preflightSha256:sha(raw),admitted:true,
  originalPreflightRetained:true,resampled:false,appSourceChanges:0,
  reason:'The added zero-page-in and CPU85 gates were not established policy. Use existing >=1024MiB admission plus unchanged180swork/240schild/300ssupervisor bounds. Runtime memory recheck remains.',
  originalFailure:'Rejected only by newly introduced zero-page-in criterion; not established host overload.',
  counters:'PagesInput can include DLL/executable/memory-mapped-file disk reads. CPU and page counters retained as observations, not a responsiveness or representative-performance proof.',
  source:'https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/how-to-determine-the-appropriate-page-file-size-for-64-bit-versions-of-windows',
  sourceSection:'Performance counters: Memory Page/sec and other hard page fault counters',
  peerReview:'Peirce agrees the new host criteria were unsupported; original memory rule and strict work bounds remain.'};
writeFileSync(resolve(dir,'admission.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result,null,2));
