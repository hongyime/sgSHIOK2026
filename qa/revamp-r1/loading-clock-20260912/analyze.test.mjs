import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { responseClocks } from './analyze.mjs';
const entry = (timing = { requestTime: 10, receiveHeadersEnd: 20 }) => ({ sessionId: 'page', method: 'Network.responseReceived', params: {
  requestId: 'a', timestamp: 11, response: { url: 'https://example.test/data/a.json', status: 200, timing } } });
test('separates header elapsed from response event instead of labeling both server time', () => {
  const [r] = responseClocks([entry()], 'page');
  assert.equal(r.headersElapsedMs, 20); assert.equal(r.responseEventElapsedMs, 1000);
  assert.equal(r.afterHeadersToResponseEventMs, 980);
});
test('missing and unavailable timing stays unknown', () => {
  for (const t of [null, {}, { requestTime: 10, receiveHeadersEnd: -1 }])
    assert.equal(responseClocks([entry(t)], 'page')[0].headersElapsedMs, null);
});
test('never joins another target session', () => assert.deepEqual(responseClocks([entry()], 'worker'), []));
test('negative clock deltas remain visible, not silently clamped', () => {
  assert.equal(responseClocks([entry({ requestTime: 12, receiveHeadersEnd: 20 })], 'page')[0].afterHeadersToResponseEventMs, -1020);
});
test('real trace retains all four failed probes and distinguishes delayed response notification', () => {
  const r = JSON.parse(readFileSync(new URL('../worker-lifecycle-20260912/observed-Btxfds/browser.json', import.meta.url)));
  const rows = responseClocks(r.entries, r.mainSession);
  assert.equal(rows.filter(x => x.status === 404).length, 4);
  const geom = rows.find(x => x.url.endsWith('/geom/h3/886520db39fffff.json.gz'));
  assert.equal(geom.headersElapsedMs, 7.811);
  assert.ok(geom.afterHeadersToResponseEventMs > 1200);
});
