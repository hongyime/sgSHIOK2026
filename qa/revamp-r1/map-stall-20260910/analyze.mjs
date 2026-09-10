import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Working root guard');
const base = resolve(root, 'qa/revamp-r1/map-stall-20260910');
const read = path => JSON.parse(readFileSync(resolve(base, path), 'utf8'));
const identity = path => {
  const bytes = readFileSync(resolve(base, path));
  return { path, bytes:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex') };
};
function profile(label) {
  const path = `${label}/page.cpuprofile`, p = read(path);
  const nodes = new Map(p.nodes.map(n => [n.id,n])), parents = new Map();
  for (const node of p.nodes) for (const child of node.children ?? []) parents.set(child,node.id);
  const counts = new Map();
  for (const id of p.samples) counts.set(id,(counts.get(id) ?? 0)+1);
  const top = [...counts].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([id,count]) => {
    const stack = []; let current = id;
    for (let n=0; current !== undefined && n<20; n++,current=parents.get(current)) {
      stack.push(nodes.get(current).callFrame);
    }
    return { count, samplePercent:100*count/p.samples.length, stack };
  });
  assert.equal([...counts.values()].reduce((a,b)=>a+b,0),p.samples.length);
  return { ...identity(path), seconds:(p.endTime-p.startTime)/1e6, samples:p.samples.length, top };
}
function trace(label) {
  const r = read(`${label}/result.json`), starts = [], queries = [];
  for (const event of r.trace) {
    if (event.kind === 'queryRenderedFeatures:start') starts.push(event);
    if (event.kind === 'queryRenderedFeatures:end') {
      const start = starts.shift(); assert.ok(start, 'query end without start');
      queries.push({ start:start.at, end:event.at, milliseconds:event.milliseconds,
        expectedKey:start.currentKey, keys:event.keys, count:event.count,
        current:event.keys.includes(start.currentKey) });
    }
  }
  assert.equal(starts.length,0);
  return { queries, queryCount:queries.length, queryMilliseconds:queries.reduce((s,q)=>s+q.milliseconds,0),
    maxQueryMilliseconds:Math.max(...queries.map(q=>q.milliseconds)),
    staleNonemptyQueries:queries.filter(q=>q.count>0&&!q.current).length,
    emptyQueries:queries.filter(q=>!q.count).length, currentQueries:queries.filter(q=>q.current).length,
    status:r.trace.filter(e=>e.kind==='map-status'), keys:r.trace.filter(e=>e.kind==='route-debug'),
    gl:r.trace.filter(e=>['createProgram:end','compileShader:end','linkProgram:end'].includes(e.kind)) };
}
const p1=read('probe-1/result.json'), p2=read('probe-2/result.json');
const summary = { root, base:'373c73fb6fafc148cc69af2b380ce325a2d43ae6', applicationChanged:false,
  profiles:[profile('probe-1'),profile('probe-2')], trace:trace('probe-2'),
  probe1:{ok:p1.ok, failure:p1.failure, captures:p1.captures, availableMiB:p1.availableMiB, availableMiBAfter:p1.availableMiBAfter},
  probe2:{ok:p2.ok, captures:p2.captures, availableMiB:p2.availableMiB, availableMiBAfter:p2.availableMiBAfter,
    text:p2.boundaries.find(b=>b.name==='visible text query')},
  captureIdentities:[...p1.captures.map(c=>identity(`probe-1/${c.name}.png`)),...p2.captures.map(c=>identity(`probe-2/${c.name}.png`))],
  findings:[
    'Probe1 failed before the QA feature query. Its negative screenshot shows a route and a selected-walk-not-visible error; screenshot alone does not prove the current render key.',
    'Probe1 CPU sample hotspots include shader/program construction, the application visibility watcher query and React DOM insertion. Sample shares are not wall-time attribution or proof of a bottleneck.',
    'Probe2 observed current-key rendered features and ready status without an application edit. All 35 timed queries completed; 10 were empty, 24 returned stale-key features and one returned the current key. This does not reproduce a slow-query bottleneck.',
    'Probe2 observation succeeded but its process-cleanup deadline failed, so the runner result remains false. Later read-only ownership check found zero live processes. No original result is rewritten.',
    'Probe3 stopped before creating its output directory or launching Chrome because free RAM was below1024MiB. Exact free value was not emitted. Four-viewport acceptance remains open.',
    'No application timeout, query sampling policy or source geometry was changed. No speedup or hardware-only cause is established.'
  ],
  disagreements:[
    'A sampled hotspot is not enough evidence to throttle the readiness query: a directly timed run measured121.1ms combined, with correct rejection of stale keys.',
    'A successful mobile observation does not supersede the earlier failure or establish reliable startup across viewports and host conditions.'
  ],
  verification:{applicationSuite:'Prior unchanged application:1785tests/65files, plus42native guard cases; worker-alignment-20260910/summary.json. Not rerun in this diagnostic-only continuation.', pipelineRuns:0, deployments:0,
    independentReview:'Unavailable: peer quota exhausted until2026-09-15 09:34; parent only.'} };
assert.equal(summary.trace.queryCount,35);
assert.equal(summary.trace.emptyQueries+summary.trace.staleNonemptyQueries+summary.trace.currentQueries,35);
assert.equal(summary.trace.currentQueries,1);
assert.equal(summary.trace.status.at(-1).status,'ready');
assert.ok(summary.probe1.failure.includes('CDP timeout: Runtime.evaluate'));
writeFileSync(resolve(base,'analysis.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({profiles:summary.profiles.map(p=>({seconds:p.seconds,samples:p.samples})),queryCount:summary.trace.queryCount,
  queryMilliseconds:summary.trace.queryMilliseconds,maxQueryMilliseconds:summary.trace.maxQueryMilliseconds,
  empty:summary.trace.emptyQueries,stale:summary.trace.staleNonemptyQueries,current:summary.trace.currentQueries,assertions:'passed'}));
