import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COUNTERS, stages } from './analyze.mjs';
const r = JSON.parse(readFileSync(new URL('./observed-OUYeAZ/browser.json', import.meta.url)));
test('counter paths have one leading and separating backslash, not remote-host syntax', () => {
  for (const c of COUNTERS) { assert.ok(c.startsWith('\\')); assert.ok(!c.includes('\\\\')); assert.equal(c.split('\\').length, 3); }
});
test('both observed captures retain four selected route features', () => {
  for (const s of r.samples) { assert.equal(s.capture.before.count, 4); assert.equal(s.capture.after.count, 4); assert.equal(s.capture.before.routeKey, s.capture.after.routeKey); }
});
test('geometry body completed before score body in both real samples', () => {
  for (const s of r.samples.map(stages)) { assert.ok(s.geometryBodyCompleteMs > 0); assert.ok(s.geometryBodyCompleteMs < s.scoreBodyCompleteMs); }
});
test('missing stage remains unknown, not zero-duration success', () => {
  assert.equal(stages({page:{events:[],navigation:[{responseStart:2,requestStart:1}],longTasks:[]}}).routeObservedMs, null);
});
test('original strict failure and missing paging counters remain failures', () => {
  assert.equal(r.ok, false); assert.notEqual(r.samplerExit, 0); assert.match(r.hostCounters, /No valid counters/);
});
