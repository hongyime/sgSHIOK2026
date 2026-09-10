import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspectLifecycle, workerEntryHandoffs } from './analyze.mjs';
const receipt = () => JSON.parse(readFileSync(new URL('./lifecycle-2-qhnLlG/browser.json', import.meta.url)));
test('real body trace separates notification arrival from its earlier network timestamp', () => {
  const result = inspectLifecycle(receipt());
  assert.equal(result.bodies.length, 6);
  for (const body of result.bodies) {
    assert.deepEqual(body.terminalCounts, body.path.endsWith('/ignored') ? [0, 0, 1] : [0, 1, 1]);
    assert.ok(body.terminalNotifiedAtMs > body.responseNotifiedAtMs);
    assert.equal(body.terminalMethod, body.path.endsWith('/cancel') ? 'Network.loadingFailed' : 'Network.loadingFinished');
    assert.equal(body.terminalTimestampPredatesResponseNotificationTimestamp, !body.path.endsWith('/cancel'));
  }
});
test('real worker entry starts in page session and finishes in explicitly attached child session', () => {
  const result = inspectLifecycle(receipt());
  assert.equal(result.workers.confirmed.length, 1); assert.equal(result.workers.unresolved.length, 0);
  const item = result.workers.confirmed[0];
  assert.notEqual(item.request.sessionId, item.terminal.sessionId);
  assert.equal(item.request.params.requestId, item.terminal.params.requestId);
});
test('all three synthetic worker resources still pass the parent interception boundary', () => {
  const r = receipt();
  for (const path of ['/worker.mjs', '/worker-helper.mjs', '/worker-data.json']) {
    const pauses = r.entries.filter(e => e.method === 'Fetch.requestPaused' && e.params.request.url === r.origin + path);
    assert.equal(pauses.length, 1);
    assert.equal(pauses[0].sessionId, r.mainSession);
    assert.ok(pauses[0].params.networkId);
    const continued = r.entries.filter(e => e.kind === 'send' && e.method === 'Fetch.continueRequest' && e.sessionId === r.mainSession && e.params.requestId === pauses[0].params.requestId);
    assert.equal(continued.length, 1);
    assert.ok(r.entries.some(e => e.kind === 'reply' && e.id === continued[0].id && !e.error));
  }
});
test('missing body phases or changed request identities cannot produce an analysis', () => {
  const missing = receipt(); missing.phases.pop(); assert.throws(() => inspectLifecycle(missing), /Missing body/);
  const changed = receipt(); changed.phases[1].requests[0].states[0].requestId = 'unrelated';
  assert.throws(() => inspectLifecycle(changed), /identity changed/);
});
const changes = [
  ['missing attachment', (r, child) => { r.entries = r.entries.filter(e => e !== child); }],
  ['wrong parent target', (r, child) => { child.params.targetInfo.parentId = 'unrelated'; }],
  ['wrong target identity', (r, child) => { child.params.targetInfo.targetId = 'unrelated'; }],
  ['wrong entry URL', (r, child) => { child.params.targetInfo.url += '?wrong'; }],
  ['duplicate attachment', (r, child) => { r.entries.push(structuredClone(child)); }],
  ['completion in unrelated session', (r, child, finish) => { finish.sessionId = 'other'; }],
  ['worker failure', (r, child, finish) => { finish.method = 'Network.loadingFailed'; }],
  ['contradictory terminal events', (r, child, finish) => { r.entries.push({ ...structuredClone(finish), method: 'Network.loadingFailed' }); }],
  ['failed worker entry response', (r, child, finish, response) => { response.params.response.status = 404; }],
  ['response URL mismatch', (r, child, finish, response) => { response.params.response.url += '?wrong'; }],
  ['completion before attachment', (r, child, finish) => { finish.sequence = child.sequence - 1; }],
];
for (const [name, change] of changes) test(name + ' cannot authorize a worker handoff', () => {
  const r = receipt();
  const child = r.entries.find(e => e.method === 'Target.attachedToTarget' && e.params.targetInfo.type === 'worker');
  const finish = r.entries.find(e => e.method === 'Network.loadingFinished' && e.params.requestId === child.params.targetInfo.targetId);
  const response = r.entries.find(e => e.method === 'Network.responseReceived' && e.params.requestId === child.params.targetInfo.targetId);
  change(r, child, finish, response);
  assert.equal(workerEntryHandoffs(r.entries).confirmed.length, 0);
  assert.equal(workerEntryHandoffs(r.entries).unresolved.length, 1);
});
