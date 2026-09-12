import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditErrors } from './error-audit.mjs';

const sessionId = 'owned-page';
test('empty telemetry cannot pass', () => assert.equal(auditErrors([], [], sessionId).ok, false));
function fixture() {
  const request = { url: 'https://www.onemap.gov.sg/maps/tiles/Grey_HD/14/12936/8150.png', method: 'GET' };
  const event = (method, params) => ({ kind: 'event', sessionId, method, params });
  return {
    entries: [event('Network.requestWillBeSent', { requestId: 'n1', request }),
      event('Fetch.requestPaused', { requestId: 'f1', networkId: 'n1', request }),
      { kind: 'send', sessionId, id: 7, method: 'Fetch.continueRequest', params: { requestId: 'f1' } },
      { kind: 'reply', sessionId, id: 7, fetchCommand: true, error: { kind: 'cdp', code: -32602, message: 'Invalid InterceptionId.' } },
      event('Network.loadingFailed', { requestId: 'n1', canceled: true, errorText: 'net::ERR_ABORTED' })],
    errors: [{ sessionId, commandId: 7, fault: 'Invalid InterceptionId.' }],
  };
}
test('explains only an identity-matched canceled tile and preserves raw errors', () => {
  const f = fixture(), before = structuredClone(f), result = auditErrors(f.entries, f.errors, sessionId);
  assert.equal(result.ok, true);
  assert.equal(result.explained.length, 1);
  assert.deepEqual(f, before);
});
for (const [name, change] of [
  ['missing command ID', f => { delete f.errors[0].commandId; }],
  ['wrong command ID', f => { f.errors[0].commandId = 8; }],
  ['wrong error session', f => { f.errors[0].sessionId = 'other'; }],
  ['cross-session cancellation', f => { f.entries[4].sessionId = 'other'; }],
  ['missing cancellation', f => { f.entries.pop(); }],
  ['runtime error', f => { f.entries.push({ kind: 'event', sessionId, method: 'Runtime.exceptionThrown', params: { exceptionDetails: { text: 'app bug' } } }); }],
]) test(name + ' remains a failure', () => {
  const f = fixture(); change(f);
  assert.equal(auditErrors(f.entries, f.errors, sessionId).ok, false);
});
test('HTTP/network completeness is not silently promoted to a pass', () => {
  const f = fixture();
  f.entries.push({ kind: 'event', sessionId, method: 'Network.responseReceived', params: { requestId: 'other', response: { status: 404, url: 'http://localhost/data/missing.json.gz' } } });
  const result = auditErrors(f.entries, f.errors, sessionId);
  assert.equal(result.transport.ok, false);
  assert.equal(result.transport.httpFailures.length, 1);
  assert.match(result.scope, /only/);
});
