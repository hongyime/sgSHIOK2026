import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
const token=process.env.SHIOK_SUPABASE_ACCESS_TOKEN; assert.ok(token);
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-health-20260915','clock-'));
const query=`select current_user, clock_timestamp() database_now,
  row_security_active('cron.job') job_rls_active,
  row_security_active('cron.job_run_details') runs_rls_active,
  (select count(*) from cron.job where jobid=1 or jobname='shiok-report-cleanup-v1') visible_job_count,
  (select count(*) from cron.job_run_details where jobid=1) visible_run_count,
  (select cleanup_verified_at from shiok_reports.control where singleton) verified_at;`;
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
const started=Date.now(), monotonic=performance.now();
const response=await fetch('https://api.supabase.com/v1/projects/ztjilsfgoephcdcsgcks/database/query',{
  method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),
  headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query,read_only:true}),
});
assert.equal(response.status,201);
const rows=await response.json(); const ended=Date.now();
assert.equal(rows.length,1);
const result={localStarted:new Date(started).toISOString(),localEnded:new Date(ended).toISOString(),
  elapsedMonotonicMs:performance.now()-monotonic,httpDate:response.headers.get('date'),query,
  querySha256:createHash('sha256').update(query).digest('hex'),row:rows[0],
  databaseAheadOfLocalEndMs:Date.parse(rows[0].database_now)-ended};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));
