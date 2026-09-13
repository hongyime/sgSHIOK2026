import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publicTrace } from './publish-trace.mjs';

test('publication removes cookie, address, raw header and request body values', () => {
  const value = { headers: { 'set-cookie': 'secret-a', 'x-remote-addr': 'secret-b', 'content-type': 'text/html' }, params: { requestHeaders: { Authorization: 'secret-c' }, associatedCookies: [{ cookie: { value: 'secret-d' } }], headersText: 'secret-e', remoteIPAddress: 'secret-f', postData: 'secret-g' } };
  const result = publicTrace(value);
  assert.doesNotMatch(JSON.stringify(result), /secret-[a-g]/);
  assert.equal(result.trace.headers['content-type'], 'text/html');
  assert.equal(Object.values(result.redactions).reduce((a, b) => a + b, 0), 7);
  assert.equal(value.headers['set-cookie'], 'secret-a');
});
test('publication preserves document binding, URL and fingerprint proof', () => {
  const proof = { events: [{ method: 'Network.responseReceived', params: { requestId: 'r', loaderId: 'l', frameId: 'f', response: { url: 'http://127.0.0.1/?postal=018956', fromServiceWorker: true, status: 200 } } }], receivedDocument: { sha256: 'abc', bytes: 50 } };
  assert.deepEqual(publicTrace(proof), { trace: proof, redactions: {} });
});
