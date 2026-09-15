const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ROOT = 'C:\\sgSHIOK2026';
const BASE = resolve(ROOT, 'qa/revamp-r1/startup-diagnosis-20260915');
assert.equal(process.cwd(), ROOT);
function run(source) {
  const dir = mkdtempSync(resolve(BASE, 'fixture-'));
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => ['PATH','SYSTEMROOT','WINDIR','SYSTEMDRIVE','COMSPEC','PATHEXT'].includes(name.toUpperCase())));
  Object.assign(env, { TEMP: resolve(ROOT, 'tmp'), TMP: resolve(ROOT, 'tmp'), SHIOK_QA_STARTUP_TRACE: resolve(dir, 'modules.jsonl') });
  const child = spawnSync(process.execPath, ['--require', resolve(BASE, 'preload.cjs'), '-e', source],
    { cwd: ROOT, env, windowsHide: true, encoding: 'utf8', timeout: 10000 });
  assert.equal(child.status, 0, child.stderr || child.error?.message);
  const bytes = readFileSync(resolve(dir, 'modules.jsonl'));
  return { bytes, lines: bytes.toString().trim().split('\n').map(JSON.parse) };
}
test('observer preserves native require success and module-not-found exception', () => {
  const result = run("const a=require('node:assert/strict');a.equal(require('node:path').basename('a/b'),'b');a.throws(()=>require('nonexistent-shiok-fixture'),{code:'MODULE_NOT_FOUND'});");
  assert.equal(result.lines[0].kind, 'preload-enter');
  assert.ok(result.lines.some(entry => entry.kind === 'module-enter' && entry.request === 'nonexistent-shiok-fixture'));
  assert.ok(result.lines.some(entry => entry.kind === 'module-exit' && entry.request === 'nonexistent-shiok-fixture'));
});
test('recording cap does not stop module execution', () => {
  const result = run("for(let i=0;i<1500;i++)require('node:path');require('node:assert/strict').equal(2+2,4);");
  assert.ok(result.bytes.length <= 262144);
  assert.ok(result.lines.length <= 1000);
  assert.equal(result.lines.at(-1).kind, 'trace-cap');
});
test('inherited preload does not collide with a worker trace', () => {
  const result = run("const {Worker}=require('node:worker_threads');const w=new Worker(\"require('node:assert/strict').equal(3,3)\",{eval:true});w.on('error',()=>process.exit(1));w.on('exit',code=>process.exitCode=code);");
  assert.equal(result.lines.filter(entry => entry.kind === 'preload-enter').length, 1);
});
