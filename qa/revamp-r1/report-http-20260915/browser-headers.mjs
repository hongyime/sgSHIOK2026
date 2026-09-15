import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const ROOT = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), ROOT, 'Wrong working root');
assert.equal(realpathSync(ROOT).toLowerCase(), ROOT.toLowerCase(), 'Unexpected root indirection');
const started = performance.now();
const WORK_MS = 35_000;
const MIN_MS = 10_000;
const MAX_MS = 60_000;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = resolve(ROOT, 'qa/revamp-r1/report-http-20260915');
const SOURCE = resolve(ROOT, 'web/lib/report-submission.ts');
const SELF = fileURLToPath(import.meta.url);
assert.equal(SELF, resolve(BASE, 'browser-headers.mjs'));
assert.ok(existsSync(CHROME), 'Existing Chrome binary required; no install fallback');
assert.equal(realpathSync(BASE).toLowerCase(), BASE.toLowerCase(), 'Unexpected output indirection');
const out = mkdtempSync(resolve(BASE, 'browser-headers-'));
const profile = resolve(out, 'profile');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const elapsed = () => performance.now() - started;
const receipt = {
  kind: 'synthetic-browser-header-probe', startedAt: new Date().toISOString(),
  scope: 'Loopback header behavior only; not app HTTP end-to-end or reporting activation.',
  root: ROOT, out, profile, boundsMs: { minimum: MIN_MS, work: WORK_MS, maximum: MAX_MS },
  requests: [], commands: [], checks: [], errors: [], cleanup: {}, proxyRejected: 0,
};
// Chrome's non-default-profile check needs the real Windows known-folder environment.
// Keep OS paths only; never inherit provider credentials or change the default profile location.
const ownedEnvironment = Object.fromEntries([
  'SystemRoot', 'WINDIR', 'SystemDrive', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA',
  'ProgramData', 'ProgramFiles', 'ProgramFiles(x86)', 'ProgramW6432', 'PATH', 'ComSpec', 'PSModulePath',
].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
ownedEnvironment.TEMP = resolve(profile, 'tmp');
ownedEnvironment.TMP = resolve(profile, 'tmp');

function output(name, bytes) {
  const target = resolve(out, name);
  const child = relative(out, target);
  assert.ok(isAbsolute(target) && child && !child.startsWith('..') && !isAbsolute(child));
  writeFileSync(target, bytes, { flag: 'wx' });
}
function json(name, value) { output(name, JSON.stringify(value, null, 2) + '\n'); }
function check(name, condition) {
  receipt.checks.push({ name, passed: Boolean(condition) });
  assert.ok(condition, name);
}
function bounded(promise, milliseconds, label) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(Error(`${label} timed out`)), Math.max(1, milliseconds));
  })]).finally(() => clearTimeout(timer));
}
function work(promise, label, cap = 8000) {
  return bounded(promise, Math.min(cap, WORK_MS - elapsed()), label);
}
function trackSockets(server) {
  const sockets = new Set();
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  return sockets;
}
async function listen(server) {
  await work(new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { server.removeListener('error', reject); done(); });
  }), 'loopback listen', 3000);
  return server.address().port;
}
function runOwnedCommand(file, args, timeout = 6000) {
  receipt.commands.push({ file, args, cwd: ROOT, windowsHide: true, timeout });
  return new Promise((done, reject) => execFile(file, args, {
    cwd: ROOT, windowsHide: true, timeout, maxBuffer: 65_536, env: ownedEnvironment,
  }, (error, stdout, stderr) => {
    if (error) reject(Error(`Owned cleanup command failed: ${error.code ?? error.message}; ${stderr.slice(0, 512)}`));
    else done(stdout);
  }));
}
async function portClosed(port) {
  if (!port) return true;
  return new Promise(done => {
    const socket = connect({ host: '127.0.0.1', port });
    const finish = value => { socket.removeAllListeners(); socket.destroy(); done(value); };
    socket.setTimeout(1000, () => finish(false));
    socket.once('connect', () => finish(false));
    socket.once('error', error => finish(error.code === 'ECONNREFUSED'));
  });
}

let chrome, chromeClosed, ws, pageSession, originPort, proxyPort, cdpPort;
let sequence = 0, stderr = '', closing = false;
const pending = new Map();
const events = new Map();
const cdp = [];
const page = '<!doctype html><meta charset="utf-8"><title>Synthetic header probe</title>'
  + '<link rel="icon" href="data:,"><main>Synthetic header probe</main>';
const pagePath = '/probe?synthetic=header-privacy';
const syntheticBody = JSON.stringify({ probe: 'synthetic-header-only' });
const server = createServer((request, response) => {
  if (receipt.requests.length >= 8) { request.destroy(); receipt.errors.push('Unexpected request overflow'); return; }
  const entry = { method: request.method, url: request.url, headers: request.headers, rawHeaders: request.rawHeaders, body: '' };
  receipt.requests.push(entry);
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'GET' && request.url === pagePath) {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Content-Security-Policy', "default-src 'none'; connect-src 'self'; img-src data:; base-uri 'none'");
    response.end(page);
    return;
  }
  if (request.method !== 'POST' || !['/old', '/corrected'].includes(request.url)) {
    receipt.errors.push('Unexpected probe request'); response.writeHead(404).end(); return;
  }
  const chunks = [];
  let size = 0;
  request.on('data', chunk => {
    size += chunk.length;
    if (size > 1024) { receipt.errors.push('Oversized synthetic body'); request.destroy(); }
    else chunks.push(chunk);
  });
  request.on('error', () => { receipt.errors.push('Synthetic request stream failed'); });
  request.on('end', () => {
    entry.body = Buffer.concat(chunks).toString('utf8');
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ synthetic: true }));
  });
});
server.requestTimeout = 5000;
server.headersTimeout = 5000;
const proxy = createServer((request, response) => { receipt.proxyRejected++; request.resume(); response.writeHead(403).end(); });
proxy.on('connect', (_request, socket) => { receipt.proxyRejected++; socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); });
const serverSockets = trackSockets(server);
const proxySockets = trackSockets(proxy);

function send(method, params = {}, sessionId = pageSession, timeout = 6000) {
  const id = ++sequence;
  cdp.push({ direction: 'send', id, method, params, ...(sessionId ? { sessionId } : {}) });
  return bounded(new Promise((done, reject) => {
    pending.set(id, { done, reject });
    try { ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
    catch (error) { reject(error); }
  }), Math.min(timeout, closing ? timeout : WORK_MS - elapsed()), method).finally(() => pending.delete(id));
}
function nextEvent(method) {
  return new Promise(done => events.set(method, done));
}

try {
  output('runner.mjs', readFileSync(SELF));
  const sourceBytes = readFileSync(SOURCE);
  const source = sourceBytes.toString('utf8');
  const calls = [...source.matchAll(/transport\('\/api\/reports',\s*\{([\s\S]*?)\n\s*\}\)/g)];
  assert.equal(calls.length, 1, 'Expected exactly one app transport options block');
  const expected = { method: 'POST', mode: 'same-origin', credentials: 'omit', redirect: 'error', cache: 'no-store', referrer: '', referrerPolicy: 'same-origin' };
  const extracted = {};
  for (const [key, value] of Object.entries(expected)) {
    const matches = [...calls[0][1].matchAll(new RegExp(`\\b${key}:\\s*'([^']*)'`, 'g'))];
    assert.equal(matches.length, 1, `Unambiguous source option ${key}`);
    assert.equal(matches[0][1], value, `Corrected source option ${key}`);
    extracted[key] = matches[0][1];
  }
  receipt.sourceBinding = { path: SOURCE, sha256: sha256(sourceBytes), bytes: sourceBytes.length,
    importedOrExecuted: false, method: 'Exact single static transport block and literal option extraction',
    firstLine: source.slice(0, calls[0].index).split('\n').length, options: extracted,
    syntheticSubstitutions: ['Endpoint paths', 'Report body', 'Retry-secret header value', 'Abort controller'] };
  json('source-binding.json', receipt.sourceBinding);
  const corrected = { ...extracted, headers: { 'Content-Type': 'application/json', 'x-shiok-retry-secret': 'synthetic-header-probe' }, body: syntheticBody };
  const old = { ...corrected, referrerPolicy: 'no-referrer' };
  delete old.referrer;
  receipt.testOptions = { old, corrected };
  mkdirSync(profile);
  for (const name of ['tmp', 'appdata', 'localappdata', 'programdata']) mkdirSync(resolve(profile, name));
  originPort = await listen(server);
  proxyPort = await listen(proxy);
  const origin = `http://127.0.0.1:${originPort}`;
  receipt.origin = origin;
  const args = ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-default-apps', '--disable-background-networking', '--disable-component-update', '--disable-sync',
    '--disable-breakpad', '--disable-crash-reporter', '--disable-domain-reliability', '--disable-quic', '--disable-gpu',
    '--disable-features=MediaRouter,OptimizationHints,AutofillServerCommunication',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    `--proxy-server=http://127.0.0.1:${proxyPort}`, '--proxy-bypass-list=127.0.0.1;localhost',
    '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`,
    `--crash-dumps-dir=${profile}`, `--log-file=${resolve(profile, 'chrome.log')}`, 'about:blank'];
  receipt.commands.push({ file: process.execPath, args: [SELF], cwd: ROOT });
  receipt.commands.push({ file: CHROME, args, cwd: ROOT, windowsHide: true,
    environment: 'Allowlisted Windows OS paths; owned TEMP/TMP; no inherited provider credentials',
    environmentNames: Object.keys(ownedEnvironment) });
  chrome = spawn(CHROME, args, { cwd: ROOT, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: ownedEnvironment });
  receipt.chromePid = chrome.pid;
  chromeClosed = new Promise(done => chrome.once('close', (code, signal) => { receipt.chromeExit = { code, signal }; done(); }));
  const endpoint = await work(new Promise((done, reject) => {
    chrome.once('error', reject);
    chrome.once('exit', () => reject(Error('Chrome exited before CDP startup')));
    chrome.stderr.on('data', bytes => {
      stderr = (stderr + bytes.toString()).slice(-32_768);
      const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr);
      if (match) done(match[1]);
    });
  }), 'single Chrome launch', 15_000);
  const endpointUrl = new URL(endpoint);
  assert.equal(endpointUrl.protocol, 'ws:');
  assert.equal(endpointUrl.hostname, '127.0.0.1');
  cdpPort = Number(endpointUrl.port);
  ws = new WebSocket(endpoint);
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      cdp.push({ direction: 'reply', ...message });
      const handler = pending.get(message.id);
      if (message.error) handler?.reject(Error(message.error.message)); else handler?.done(message.result);
    } else if (events.has(message.method)) { events.get(message.method)(message.params); events.delete(message.method); }
  });
  ws.addEventListener('close', () => { for (const handler of pending.values()) handler.reject(Error('CDP closed')); });
  await work(new Promise((done, reject) => { ws.addEventListener('open', done, { once: true }); ws.addEventListener('error', () => reject(Error('CDP connection failed')), { once: true }); }), 'CDP connection', 4000);
  receipt.browserVersion = await send('Browser.getVersion', {}, undefined);
  const targets = await send('Target.getTargets', {}, undefined);
  const target = targets.targetInfos.find(value => value.type === 'page' && value.url === 'about:blank');
  assert.ok(target, 'Owned initial blank page');
  pageSession = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, undefined)).sessionId;
  await send('Page.enable');
  await send('Runtime.enable');
  const loaded = nextEvent('Page.loadEventFired');
  await send('Page.navigate', { url: origin + pagePath });
  await work(loaded, 'synthetic page load', 5000);
  const expression = `(async () => {
    const results = [];
    for (const [path, options] of ${JSON.stringify([['/old', old], ['/corrected', corrected]])}) {
      const response = await fetch(path, { ...options, signal: AbortSignal.timeout(4000) });
      results.push({ path, status: response.status, body: await response.json() });
    }
    return { origin: location.origin, results };
  })()`;
  const evaluated = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, pageSession, 10_000);
  assert.ok(!evaluated.exceptionDetails, JSON.stringify(evaluated.exceptionDetails));
  receipt.browserResult = evaluated.result.value;
  check('Browser stayed on exact local origin', receipt.browserResult.origin === origin);
  check('Both synthetic POSTs completed', receipt.browserResult.results.length === 2 && receipt.browserResult.results.every(value => value.status === 200 && value.body.synthetic === true));
  await work(new Promise(done => setTimeout(done, Math.max(0, MIN_MS - elapsed()))), 'minimum observation window', MIN_MS);
  const oldCapture = receipt.requests.find(value => value.url === '/old');
  const correctedCapture = receipt.requests.find(value => value.url === '/corrected');
  check('Exactly one page GET and exactly two POSTs', receipt.requests.length === 3 && receipt.requests[0].method === 'GET'
    && receipt.requests.filter(value => value.method === 'POST').length === 2);
  check('Old policy sends literal null Origin', oldCapture?.headers.origin === 'null');
  check('Corrected policy sends exact local Origin', correctedCapture?.headers.origin === origin);
  check('Referer absent in both cases', !Object.hasOwn(oldCapture.headers, 'referer') && !Object.hasOwn(correctedCapture.headers, 'referer'));
  check('Both request bodies are synthetic and identical', oldCapture.body === syntheticBody && correctedCapture.body === syntheticBody);
  check('Only synthetic proof; no cookies or authorization', [oldCapture, correctedCapture].every(value => value.headers['x-shiok-retry-secret'] === 'synthetic-header-probe'
    && !Object.hasOwn(value.headers, 'cookie') && !Object.hasOwn(value.headers, 'authorization')));
  receipt.sourceBinding.sha256After = sha256(readFileSync(SOURCE));
  check('Client source unchanged during observation', receipt.sourceBinding.sha256 === receipt.sourceBinding.sha256After);
} catch (error) {
  receipt.errors.push(error.stack ?? String(error));
} finally {
  closing = true;
  if (ws?.readyState === WebSocket.OPEN) {
    try { await send('Browser.close', {}, null, 1500); } catch { /* Chrome can close before acknowledging. */ }
  }
  try { ws?.close(); } catch { /* Ownership cleanup below remains authoritative. */ }
  if (chromeClosed) { try { await bounded(chromeClosed, 2000, 'Chrome graceful exit'); } catch {} }
  try {
    if (chrome?.pid) {
      const powershell = resolve(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe');
      const quote = value => `'${value.replaceAll("'", "''")}'`;
      // Match the fresh profile on an exact executable before stopping any PID; never stop by name.
      const script = `$ErrorActionPreference='Stop'
if ((Get-Location).ProviderPath -ne ${quote(ROOT)}) { throw 'Wrong cleanup root' }
$profile=${quote(profile)}
$exe=${quote(CHROME)}
$pattern='(?:^|\\s)--user-data-dir="?' + [regex]::Escape($profile) + '(?:"|\\s|$)'
$owned=@(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.ExecutablePath -ieq $exe -and $_.CommandLine -match $pattern })
$before=@($owned | Where-Object { Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue } | ForEach-Object { [int]$_.ProcessId })
foreach ($item in $owned) {
  $current=Get-CimInstance Win32_Process -Filter ('ProcessId=' + $item.ProcessId)
  if ($current -and (Get-Process -Id $current.ProcessId -ErrorAction SilentlyContinue) -and $current.CreationDate -eq $item.CreationDate -and $current.CommandLine -match $pattern) {
    & "$env:SystemRoot\\System32\\taskkill.exe" /PID $item.ProcessId /T /F | Out-Null
  }
}
$after=@(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.ExecutablePath -ieq $exe -and $_.CommandLine -match $pattern } | Where-Object { Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue } | ForEach-Object { [int]$_.ProcessId })
@{matchedBefore=$before;remaining=$after} | ConvertTo-Json -Compress`;
      receipt.cleanup.processes = JSON.parse(await runOwnedCommand(powershell, ['-NoProfile', '-NonInteractive', '-Command', script], 8000));
      if (chromeClosed) await bounded(chromeClosed, 1500, 'owned Chrome reaped');
    }
  } catch (error) { receipt.errors.push(error.message); }
  for (const [name, localServer, sockets] of [['origin', server, serverSockets], ['proxy', proxy, proxySockets]]) {
    for (const socket of sockets) socket.destroy();
    try { await bounded(new Promise(done => localServer.close(done)), 1000, `${name} close`); }
    catch (error) { receipt.errors.push(error.message); }
  }
  receipt.cleanup.chromeReaped = !chrome || chrome.exitCode !== null || chrome.signalCode !== null;
  receipt.cleanup.originPortClosed = await portClosed(originPort);
  receipt.cleanup.proxyPortClosed = await portClosed(proxyPort);
  receipt.cleanup.cdpPortClosed = await portClosed(cdpPort);
  receipt.cleanup.profileRetained = true;
  receipt.cleanup.verified = receipt.cleanup.chromeReaped && (!chrome || receipt.cleanup.processes?.remaining?.length === 0)
    && receipt.cleanup.originPortClosed && receipt.cleanup.proxyPortClosed && receipt.cleanup.cdpPortClosed;
  receipt.durationMs = elapsed();
  receipt.passed = receipt.errors.length === 0 && receipt.checks.every(value => value.passed)
    && receipt.cleanup.verified && receipt.durationMs >= MIN_MS && receipt.durationMs <= MAX_MS;
  json('commands.json', receipt.commands);
  json('headers.json', receipt.requests);
  json('cdp.json', cdp);
  output('chrome.stderr.txt', stderr);
  json('summary.json', receipt);
  process.stdout.write(JSON.stringify({ out, passed: receipt.passed, durationMs: receipt.durationMs, requests: receipt.requests.length, checks: receipt.checks, cleanup: receipt.cleanup, errors: receipt.errors }, null, 2) + '\n',
    () => process.exit(receipt.passed ? 0 : 1));
}
