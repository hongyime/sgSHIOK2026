import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const label = process.argv[2];
assert.match(label ?? '', /^cost-(baseline|rss)-[1-9][0-9]*$/);
const memory = process.memoryUsage;
const profile = { full: { calls: 0, ms: 0 }, rss: { calls: 0, ms: 0 } };
const measured = (kind, fn) => () => {
  const start = performance.now();
  try { return fn(); } finally { profile[kind].calls++; profile[kind].ms += performance.now() - start; }
};
process.memoryUsage = measured('full', memory);
process.memoryUsage.rss = measured('rss', memory.rss);
try {
  process.argv = [process.execPath, resolve(root, 'qa/revamp-r1/coverage-register-20260909/scan.mjs'), 'pilot', label];
  await import('../coverage-register-20260909/scan.mjs');
} finally {
  process.memoryUsage = memory;
  writeFileSync(resolve(root, 'qa/revamp-r1/coverage-cost-20260910', label, 'memory-profile.json'), JSON.stringify(profile, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ memoryProfile: profile }));
}
