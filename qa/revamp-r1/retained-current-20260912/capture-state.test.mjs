import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ready, stablePair, settleCounter } from './capture-state.mjs';
const record = JSON.parse(readFileSync(new URL('./observed-EAV2hq/browser.json', import.meta.url)));
const transition = record.captures.find(c => c.name === 'retained-A-on-B-320x667');
const good = transition.after;
test('real resize snapshot is transitional despite visible geometry', () => {
  assert.equal(transition.before.featureCount, 4);
  assert.equal(ready(transition.before), false);
  assert.equal(ready(good), true);
  assert.equal(stablePair(transition.before, good), false);
});
test('requires three consecutive ready samples after a transition', () => {
  const settled = settleCounter();
  assert.equal(settled(good), false);
  assert.equal(settled(transition.before), false);
  assert.equal(settled(good), false);
  assert.equal(settled(good), false);
  assert.equal(settled(good), true);
});
for (const [field, value] of [['routeKey', 'other'], ['timeOrigin', -1], ['url', 'http://other/'], ['viewport', [390, 844]], ['featureCount', 0], ['tiles', false], ['moving', true], ['renderedKeys', ['stale']]]) {
  test(field + ' transition rejects stable screenshot', () => assert.equal(stablePair(good, { ...good, [field]: value }), false));
}
test('real ready capture on the same selection passes', () => assert.equal(stablePair(good, good), true));
