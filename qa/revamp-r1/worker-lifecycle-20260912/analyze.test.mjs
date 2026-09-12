import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from './analyze.mjs';
const load = () => JSON.parse(readFileSync(new URL('./observed-Btxfds/browser.json', import.meta.url)));
test('actual current app worker has a complete owned-session handoff', () => {
  const r = load(), a = analyze(r);
  assert.equal(r.ok, false);
  assert.equal(a.workerLifecycleConfirmed, true);
  assert.equal(a.workers.confirmed[0].request.params.request.url, r.origin + '/maplibre/6.4.1/maplibre-gl-worker.mjs');
  assert.equal(a.page.explainedCanceledTileCommands.length, 10);
  assert.equal(a.unexplainedErrors.length, 0);
  assert.equal(a.page.ok, false);
  assert.equal(a.page.httpFailures.length, 4);
});
test('wrong worker parent cannot explain a missing page terminal', () => {
  const r = load();
  r.entries.find(e => e.method === 'Target.attachedToTarget' && e.params.targetInfo.type === 'worker').params.targetInfo.parentId = 'other';
  assert.equal(analyze(r).workerLifecycleConfirmed, false);
});
test('a canceled worker entry is not successful loading', () => {
  const r = load(), original = analyze(r).workers.confirmed[0].terminal;
  r.entries.find(e => e.sequence === original.sequence).method = 'Network.loadingFailed';
  assert.equal(analyze(r).workerLifecycleConfirmed, false);
});
test('an error from a different session remains unexplained', () => {
  const r = load(); r.errors[0].cdp.sessionId = 'other';
  assert.equal(analyze(r).unexplainedErrors.length, 1);
});
test('runtime exceptions are not tile cancellations', () => {
  const r = load(); r.errors.push({ runtime: { text: 'app defect' }, sessionId: r.mainSession });
  assert.equal(analyze(r).unexplainedErrors.length, 1);
});
