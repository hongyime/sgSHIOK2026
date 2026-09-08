import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import { createTraceCollector, createWorkerRegistry } from './diagnostic-session.mjs';

test('trace completion waits for the event, retaining late chunks after end acknowledgement', async () => {
  const trace = createTraceCollector();
  let resolved = false;
  const pending = trace.finish(async () => ({})).then(result => { resolved = true; return result; });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(resolved, false);
  trace.receive({ method: 'Tracing.dataCollected', params: { value: [{ name: 'late' }] } });
  trace.receive({ method: 'Tracing.tracingComplete', params: {} });
  assert.deepEqual(await pending, { completed: true, events: 1, dropped: 0, incompleteReason: null });
});
test('completion before command acknowledgement is retained; a missing completion is explicit', async () => {
  const trace = createTraceCollector(1);
  const result = await trace.finish(async () => {
    trace.receive({ method: 'Tracing.dataCollected', params: { value: [{}, {}] } });
    trace.receive({ method: 'Tracing.tracingComplete', params: {} });
  });
  assert.equal(result.completed, true); assert.equal(result.dropped, 1);
  const absent = await createTraceCollector().finish(async () => {}, 5);
  assert.equal(absent.completed, false); assert.match(absent.incompleteReason, /deadline/);
});
test('detached cold workers are excluded from warm collection', async () => {
  const workers = createWorkerRegistry(), queried = [];
  workers.attach({ sessionId: 'cold', targetInfo: { type: 'worker', url: 'worker.js' } });
  workers.detach('cold');
  workers.attach({ sessionId: 'warm', targetInfo: { type: 'worker', url: 'worker.js' } });
  const result = await workers.collect(async (_method, _params, id) => { queried.push(id); return { result: { value: { resources: [] } } }; });
  assert.deepEqual(queried, ['warm']); assert.equal(result.timings.length, 1);
  assert.deepEqual(result.diagnostics, []); assert.ok(workers.history[0].detachedWall);
});
test('detach while querying is diagnostic, never an application exception or a future stale query', async () => {
  const workers = createWorkerRegistry();
  workers.attach({ sessionId: 'gone', targetInfo: { type: 'worker', url: 'worker.js' } });
  const result = await workers.collect(async () => { workers.detach('gone'); throw Error('Session with given id not found'); });
  assert.deepEqual(result.timings, []); assert.equal(result.diagnostics[0].kind, 'detached-during-collection');
  assert.equal(workers.sessions.size, 0);
});
test('other worker telemetry failures stay visible and retain the live session', async () => {
  const workers = createWorkerRegistry();
  workers.attach({ sessionId: 'live', targetInfo: { type: 'worker', url: 'worker.js' } });
  const result = await workers.collect(async () => { throw Error('Unexpected protocol error'); });
  assert.equal(result.diagnostics[0].kind, 'worker-telemetry-error'); assert.equal(workers.sessions.size, 1);
});
test('payload identity is cheap; equal keys with changed data differ only in off-window fingerprints', async () => {
  let serializations = 0;
  const context = { window: {}, crypto: webcrypto, TextEncoder, JSON: { stringify: value => { serializations++; return JSON.stringify(value); } } };
  vm.runInNewContext(readFileSync(new URL('./payload-probe.js', import.meta.url), 'utf8'), context);
  const probe = context.window.__sourcePayloads;
  const a = { render_key: 'same', coordinates: [103.8, 1.2] }, equal = structuredClone(a), b = { ...a, coordinates: [103.9, 1.3] };
  assert.equal(probe.identify(a), 1); assert.equal(probe.identify(a), 1);
  assert.equal(probe.identify(equal), 2); assert.equal(probe.identify(b), 3);
  assert.equal(serializations, 0);
  const result = await probe.finalize();
  assert.equal(serializations, 3);
  assert.equal(result.payloads[0].sha256, result.payloads[1].sha256);
  assert.notEqual(result.payloads[0].sha256, result.payloads[2].sha256);
});
