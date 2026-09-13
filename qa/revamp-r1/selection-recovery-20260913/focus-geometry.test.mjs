import assert from 'node:assert/strict';
import { test } from 'node:test';
import { focusGeometry } from './focus-geometry.mjs';
const clip = { left: 0, top: 0, right: 712, bottom: 399 };
const canvas = { ...clip, bottom: 400 };
test('recorded canvas has a clipped border box but an exposed inset ring', () => {
  const value = focusGeometry(canvas, clip, true, 3, -6);
  assert.equal(value.controlFits, false);
  assert.equal(value.ringFits, true);
  assert.equal(value.fits, true);
  assert.deepEqual(value.ring, { left: 3, top: 3, right: 709, bottom: 397 });
});
test('the same clipping is still rejected for ordinary controls', () => {
  assert.equal(focusGeometry(canvas, clip, false, 3, -6).fits, false);
});
test('a clipped canvas ring is rejected', () => {
  assert.equal(focusGeometry({ ...canvas, bottom: 404 }, clip, true, 3, -6).fits, false);
});
test('a missing outline cannot prove canvas focus', () => {
  assert.equal(focusGeometry(canvas, clip, true, 0, 0).fits, false);
});
test('positive outline offset is rejected against an exactly clipping parent', () => {
  const value = focusGeometry(clip, clip, false, 3, 2);
  assert.equal(value.controlFits, true);
  assert.equal(value.ringFits, false);
});
test('inset segmented ring fits an exactly clipping parent', () => {
  assert.equal(focusGeometry(clip, clip, false, 3, -4).ringFits, true);
});
