import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { createJsonReader } from '../coverage-register-20260909/reader.mjs';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const reader = (extra = {}) => createJsonReader({ bundleRoot: mkdtempSync(root + '\\tmp\\coverage-budget-'), checksums: {}, deadline: Date.now() + 60000, ...extra });

test('budget requests fresh RSS only without collecting full heap statistics', t => {
  let calls = 0;
  const memory = t.mock.method(process, 'memoryUsage', () => { throw Error('Full heap inspection not needed'); });
  memory.rss = () => ++calls;
  const r = reader();
  const before = calls;
  assert.equal(r.checkBudget().rssBytes, before + 1);
  assert.equal(r.checkBudget().rssBytes, before + 2);
  assert.equal(r.getStats().maxObservedRssBytes, before + 2);
});
test('RSS cap equality passes, a fresh observation above the cap stops immediately', t => {
  let rss = 100;
  t.mock.method(process.memoryUsage, 'rss', () => rss);
  const r = reader({ maxRssBytes: 100 });
  assert.equal(r.checkBudget().rssBytes, 100);
  rss++;
  assert.throws(() => r.checkBudget(), { code: 'STOP_RSS_LIMIT', rssBytes: 101, limit: 100 });
});
test('RSS-only observation does not delay the deadline boundary', t => {
  t.mock.method(process.memoryUsage, 'rss', () => 100);
  const deadline = Date.now() + 60000, r = reader({ deadline });
  t.mock.method(Date, 'now', () => deadline);
  assert.throws(() => r.checkBudget(), { code: 'STOP_DEADLINE' });
});
test('metadata lookups still measure live RSS after construction', t => {
  let rss = 1;
  t.mock.method(process.memoryUsage, 'rss', () => rss);
  const r = reader({ maxRssBytes: 100 });
  rss = 101;
  assert.throws(() => r.inspect('missing.json'), { code: 'STOP_RSS_LIMIT' });
  assert.equal(r.getStats().lookupCalls, 0);
});
test('input reads still measure live RSS before touching the filesystem', t => {
  let rss = 1;
  t.mock.method(process.memoryUsage, 'rss', () => rss);
  const r = reader({ maxRssBytes: 100 });
  rss = 101;
  assert.throws(() => r.read('missing.json'), { code: 'STOP_RSS_LIMIT' });
  assert.equal(r.getStats().reads, 0);
});
