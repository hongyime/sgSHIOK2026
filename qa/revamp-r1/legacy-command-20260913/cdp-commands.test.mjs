import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCommandChannel } from './cdp-commands.mjs';

function fixture(options = {}) {
  const sent = [], start = Date.now();
  const channel = createCommandChannel({ write: message => sent.push(JSON.parse(message)), remaining: () => 1000, context: () => ({ phase: 'old', operation: 'screenshot:after', contextId: 5, ignored: 'secret-context' }), now: () => Date.now() - start, ...options });
  return { ...channel, sent };
}
test('records command identity and timing without request/result payloads', async () => {
  const c = fixture(), result = c.send('Runtime.evaluate', { expression: 'secret-expression' }, 's');
  c.receive({ id: c.sent[0].id, result: { value: 'secret-result' } });
  assert.deepEqual(await result, { value: 'secret-result' });
  const entry = c.snapshot().entries[0];
  assert.equal(entry.sessionId, 's'); assert.equal(entry.operation, 'screenshot:after'); assert.equal(entry.contextId, 5);
  assert.equal(entry.outcome, 'response'); assert.ok(entry.elapsedMs >= 0);
  assert.doesNotMatch(JSON.stringify(c.snapshot()), /secret-/);
});
test('timeout is identified and a late reply cannot satisfy a later command', async () => {
  const c = fixture(), first = c.send('Runtime.evaluate', {}, 's', 10);
  await assert.rejects(first, error => error.commandId === 1 && error.message.includes('command 1'));
  const second = c.send('Browser.getVersion');
  c.receive({ id: 1, result: 'late' }); assert.equal(c.snapshot().pending, 1);
  c.receive({ id: 2, result: 'browser-alive' }); assert.equal(await second, 'browser-alive');
  assert.equal(c.snapshot().entries[0].outcome, 'timeout'); assert.equal(c.snapshot().entries[0].lateReplies, 1);
});
test('protocol errors preserve caller semantics but do not enter the journal', async () => {
  const c = fixture(), result = c.send('Runtime.evaluate');
  c.receive({ id: 1, error: { message: 'Execution context was destroyed secret-error' } });
  await assert.rejects(result, /Execution context was destroyed/);
  assert.equal(c.snapshot().entries[0].outcome, 'protocol-error'); assert.doesNotMatch(JSON.stringify(c.snapshot()), /secret-error/);
});
test('write failures remove pending timers and identify the command', async () => {
  const c = fixture({ write: () => { throw new Error('write failed'); } });
  await assert.rejects(c.send('Page.reload'), error => error.commandId === 1);
  assert.equal(c.snapshot().pending, 0); assert.equal(c.snapshot().entries[0].outcome, 'write-error');
});
test('close settles all outstanding commands and rejects later admission', async () => {
  const c = fixture(), results = [c.send('A'), c.send('B')];
  c.close();
  for (const result of results) await assert.rejects(result, /CDP closed/);
  await assert.rejects(c.send('C'), /CDP closed/); assert.equal(c.snapshot().pending, 0);
  assert.ok(c.snapshot().entries.every(e => e.outcome === 'closed'));
});
test('work deadline and command count bound admission', async () => {
  const dead = fixture({ remaining: () => 0 }); await assert.rejects(dead.send('A'), /work deadline/); assert.equal(dead.sent.length, 0);
  const c = fixture({ maxCommands: 1 }); const first = c.send('A'); c.receive({ id: 1, result: true }); await first;
  await assert.rejects(c.send('B'), /command limit/); assert.equal(c.snapshot().limitHit, true); assert.equal(c.sent.length, 1);
});
test('per-command wait is capped by remaining work budget', async () => {
  const c = fixture({ remaining: () => 10 });
  await assert.rejects(c.send('A', {}, '', 1000), /timeout/); assert.equal(c.snapshot().entries[0].budgetMs, 10);
});
test('events and unrelated reply IDs do not consume pending commands', async () => {
  const c = fixture(), result = c.send('A');
  assert.equal(c.receive({ method: 'Page.loadEventFired' }), false);
  c.receive({ id: 99, result: 'unknown' }); assert.equal(c.snapshot().pending, 1);
  c.receive({ id: 1, result: true }); assert.equal(await result, true);
});
