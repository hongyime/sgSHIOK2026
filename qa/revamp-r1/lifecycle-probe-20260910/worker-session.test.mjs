import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeWorker } from './worker-session.mjs';
test('worker observation binds every command to the child and resumes only after observers', async () => {
  const calls = [];
  await observeWorker(async (...args) => calls.push(args), 'child');
  assert.deepEqual(calls, [
    ['Network.enable', {}, 'child'], ['Runtime.enable', {}, 'child'], ['Runtime.runIfWaitingForDebugger', {}, 'child'],
  ]);
});
for (const failure of ['Network.enable', 'Runtime.enable']) test('observer failure is not swallowed: ' + failure, async () => {
  const calls = [];
  await assert.rejects(observeWorker(async method => { calls.push(method); if (method === failure) throw Error('fixture error'); }, 'child'), /fixture error/);
  assert.ok(!calls.includes('Runtime.runIfWaitingForDebugger'));
});
test('missing worker identity cannot send to the browser session by accident', async () => {
  await assert.rejects(observeWorker(() => assert.fail('must not send'), ''), /Worker session required/);
});
