import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const compile = process.env.SHIOK_MATCHER_COMPILE;
assert.match(compile ?? '', /^compile-[a-z0-9-]+$/);
const { createContiguousPartMatcher: matcher } = createRequire(import.meta.url)(resolve(root, 'qa/revamp-r1/normalization-profile-20260910', compile, 'compiled/contiguous-route-parts.js'));
const a = [1, 101], b = [2, 102], c = [3, 103];
const equal = (a, b) => a[0] === b[0] && a[1] === b[1];
function reference(points, parts) {
  for (const part of parts) for (let start = 0; start <= part.length - points.length; start++) {
    if (points.every((point, offset) => equal(point, part[start + offset]))
      || points.every((point, offset) => equal(point, part[start + points.length - 1 - offset]))) return true;
  }
  return false;
}
for (const [name, parts, query, expected] of [
  ['forward', [[a, b, c]], [a, b], true], ['reverse', [[a, b, c]], [c, b], true],
  ['skipped vertex', [[a, b, c]], [a, c], false], ['bridge', [[a, b], [c]], [b, c], false],
  ['shared endpoint bridge', [[a, b], [b, c]], [a, b, c], false],
  ['repeated start', [[a, b, a, b, c]], [a, b, c], true], ['reverse repeated start', [[a, b, a, b, c]], [c, b, a], true],
  ['repeated false match', [[a, b, a, b, c]], [a, b, a, b, a], false], ['no parts', [], [], false],
  ['empty part', [[]], [], true], ['empty part nonempty query', [[]], [a], false], ['one point', [[a]], [a], true],
  ['signed zero', [[[-0, 0], b]], [[0, -0], b], true], ['exact not near', [[a, b]], [a, [2.00001, 102]], false],
]) test(name, () => assert.equal(matcher(parts)(query), expected));
test('immutable inputs remain unchanged and indexes do not leak between routes', () => {
  const part = Object.freeze([Object.freeze([...a]), Object.freeze([...b])]);
  const parts = Object.freeze([part]), query = Object.freeze([part[1], part[0]]);
  assert.equal(matcher(parts)(query), true); assert.deepEqual(parts, [[a, b]]);
  assert.equal(matcher([[a, c]])(query), false);
});
test('exhaustive three-point words through length four agree with original matcher', () => {
  const words = [[]]; let current = [[]];
  for (let n = 1; n <= 4; n++) { current = current.flatMap(word => [a, b, c].map(point => [...word, point])); words.push(...current); }
  let checked = 0;
  for (const part of words) { const match = matcher([part]); for (const query of words) { assert.equal(match(query), reference(query, [part])); checked++; } }
  assert.equal(checked, 14641);
  for (let i = 0; i < words.length; i++) { const parts = [words[i], words[(i * 37) % words.length]], match = matcher(parts);
    for (const query of words) assert.equal(match(query), reference(query, parts)); }
});
test('unique starts avoid quadratic coordinate inspections across 1023 segments', () => {
  let accesses = 0;
  const points = Array.from({ length: 1024 }, (_, i) => new Proxy([i, i + 1], {
    get(target, key, receiver) { if (key === '0' || key === '1') accesses++; return Reflect.get(target, key, receiver); },
  }));
  const match = matcher([points]);
  for (let i = 1; i < points.length; i++) assert.equal(match([[i - 1, i], [i, i + 1]]), true);
  assert.ok(accesses < 20000, String(accesses));
});
