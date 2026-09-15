'use strict';
// Diagnostic only: preserve Module._load arguments/result, observe shallow imports.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const { isMainThread } = require('node:worker_threads');
if (!isMainThread || process.env.SHIOK_QA_TRACE_OWNER) return;
process.env.SHIOK_QA_TRACE_OWNER = String(process.pid);
const ROOT = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), ROOT);
const file = process.env.SHIOK_QA_STARTUP_TRACE;
const base = path.join(ROOT, 'qa/revamp-r1/startup-diagnosis-20260915');
assert.equal(path.dirname(path.dirname(file)), base);
assert.equal(path.basename(file), 'modules.jsonl');
const fd = fs.openSync(file, 'wx');
const started = performance.now();
let depth = 0, sequence = 0, bytes = 0, capped = false;
function emit(event) {
  if (capped) return;
  const line = JSON.stringify({ ms: +(performance.now() - started).toFixed(3), ...event }) + '\n';
  if (++sequence >= 1000 || bytes + Buffer.byteLength(line) > 262016) {
    fs.writeSync(fd, JSON.stringify({ kind: 'trace-cap', sequence, bytes }) + '\n'); capped = true; return;
  }
  bytes += fs.writeSync(fd, line);
}
emit({ kind: 'preload-enter', pid: process.pid, cpu: process.cpuUsage(), rss: process.memoryUsage().rss });
const original = Module._load;
Module._load = function(request, parent, isMain) {
  depth++;
  const observed = depth <= 3;
  const entry = { request: String(request).slice(0, 1024), parent: parent?.filename?.slice(0, 1024), depth };
  if (observed) emit({ kind: 'module-enter', ...entry });
  try { return Reflect.apply(original, this, arguments); }
  finally {
    if (observed) emit({ kind: 'module-exit', ...entry,
      ...(sequence % 50 === 0 ? { cpu: process.cpuUsage(), rss: process.memoryUsage().rss } : {}) });
    depth--;
  }
};
setImmediate(() => emit({ kind: 'first-immediate', cpu: process.cpuUsage(), rss: process.memoryUsage().rss }));
process.once('exit', code => { emit({ kind: 'process-exit', code }); fs.closeSync(fd); });
