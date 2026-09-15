import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const base = resolve(root, 'qa/revamp-r1/moderator-console-20260915');
const out = mkdtempSync(resolve(base, 'browser-')), profile = resolve(out, 'profile'); mkdirSync(profile); mkdirSync(resolve(profile, 'tmp'));
const r = createRequire(resolve(root, 'web/package.json'));
const { createServer: createVite } = await import(pathToFileURL(r.resolve('vite')));
const hash = x => createHash('sha256').update(x).digest('hex');
const result = { startedAt: new Date().toISOString(), scope: 'Synthetic real component and real browser client; NOT real Auth, DB, Next production or resident data', checks: [], captures: [], errors: [], passed: false };
const write = (name, value) => writeFileSync(resolve(out, name), value, { flag: 'wx' });
write('runner.mjs', readFileSync(new URL(import.meta.url)));
result.sources = Object.fromEntries(['web/components/moderation-console.tsx', 'web/components/moderation-console.module.css', 'web/components/report-location-preview.tsx', 'web/lib/moderator-client.ts', 'web/lib/reports.ts', 'qa/revamp-r1/moderator-console-20260915/console-entry.tsx', 'qa/revamp-r1/moderator-console-20260915/console.html'].map(p => [p, hash(readFileSync(resolve(root, p)))]));
const env = Object.fromEntries(['SystemRoot','WINDIR','SystemDrive','USERPROFILE','APPDATA','LOCALAPPDATA','ProgramData','ProgramFiles','ProgramFiles(x86)','ProgramW6432','PATH','ComSpec','PSModulePath'].filter(k => process.env[k] !== undefined).map(k => [k, process.env[k]]));
env.TEMP = env.TMP = resolve(profile, 'tmp');
let vite, chrome, exited, ws, seq = 0, session;
const pending = new Map(), delay = ms => new Promise(done => setTimeout(done, ms));
function bounded(promise, ms, label) { let t; return Promise.race([promise, new Promise((_, reject) => { t = setTimeout(() => reject(Error(`${label} timeout`)), ms); })]).finally(() => clearTimeout(t)); }
function send(method, params = {}, sid = session) { const id = ++seq; return bounded(new Promise((done, reject) => { pending.set(id, { done, reject }); ws.send(JSON.stringify({ id, method, params, ...(sid ? { sessionId: sid } : {}) })); }), 6000, method).finally(() => pending.delete(id)); }
async function value(expression) { const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (response.exceptionDetails) throw Error(JSON.stringify(response.exceptionDetails)); return response.result.value; }
function check(name, passed) { result.checks.push({ name, passed: !!passed }); assert.ok(passed, name); }
async function wait(expression) { for (let n = 0; n < 35; n++) { if (await value(expression)) return; await delay(200); } throw Error(`State not reached: ${expression}`); }
async function click(text) { await value(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Button absent or disabled');b.click()})()`); }
async function fill(selector, text) { await value(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(text)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`); }
async function login() { await fill('input[type=email]', 'moderator@example.test'); await fill('input[type=password]', 'synthetic password'); await click('Sign in'); await wait("document.querySelector('[aria-label=\"Report queue\"] button strong')?.textContent==='Mapping error'"); }
async function capture(label, width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }); await delay(100);
  const fit = await value(`({width:innerWidth,scroll:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>({label:b.textContent,w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))})`);
  check(`${label}-${width} no horizontal overflow`, fit.scroll <= width); check(`${label}-${width} targets`, fit.buttons.every(b => b.w >= 44 && b.h >= 44));
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); const bytes = Buffer.from(screenshot.data, 'base64'), file = `${label}-${width}x${height}.png`; write(file, bytes); result.captures.push({ file, sha256: hash(bytes), bytes: bytes.length, fit });
}
const sockets = new Set(), proxy = createServer((req, res) => { req.resume(); res.writeHead(403).end(); });
proxy.on('connection', s => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
proxy.on('connect', (_req, s) => s.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'));
try {
  result.freeKiB = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory | ConvertTo-Json -Compress'], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 10000 })).FreePhysicalMemory;
  assert.ok(result.freeKiB >= 1048576, 'Headroom gate: browser requires 1GiB free');
  vite = await createVite({ configFile: false, root: base, cacheDir: resolve(out, 'cache'), logLevel: 'error', resolve: { alias: ['react','react/jsx-runtime','react/jsx-dev-runtime','react-dom','react-dom/client'].map(name => ({ find: new RegExp(`^${name}$`), replacement: r.resolve(name) })) }, server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, fs: { strict: true, allow: [base, resolve(root,'web/components'),resolve(root,'web/lib'),resolve(root,'web/node_modules')], deny: ['**/.env*','**/public/data/**','**/raw/**','**/processed/**'] } } });
  await vite.listen(); result.origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  await new Promise(done => proxy.listen(0, '127.0.0.1', done));
  chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-default-apps','--disable-background-networking','--disable-component-update','--disable-sync','--disable-breakpad','--disable-crash-reporter','--disable-quic','--disable-gpu',`--proxy-server=http://127.0.0.1:${proxy.address().port}`,'--proxy-bypass-list=127.0.0.1;localhost','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,`--crash-dumps-dir=${profile}`,`--log-file=${resolve(profile,'chrome.log')}`,'about:blank'], { cwd: root, windowsHide: true, env, stdio: 'ignore' });
  result.chromePid = chrome.pid; exited = new Promise(done => chrome.once('exit', (code, signal) => { result.chromeExit = { code, signal }; done(); }));
  const portFile = resolve(profile, 'DevToolsActivePort');
  await bounded((async () => { while (!existsSync(portFile)) await delay(100); })(), 15000, 'Chrome startup');
  const [port, path] = readFileSync(portFile, 'utf8').trim().split(/\r?\n/); ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  ws.onmessage = event => { const m = JSON.parse(event.data); if (m.id) { const p = pending.get(m.id); if (m.error) p?.reject(Error(m.error.message)); else p?.done(m.result); } else if (m.method === 'Runtime.exceptionThrown') result.errors.push(m.params.exceptionDetails); };
  await bounded(new Promise((done, reject) => { ws.onopen = done; ws.onerror = reject; }), 4000, 'CDP');
  const page = await send('Target.createTarget', { url: 'about:blank' }, null); session = (await send('Target.attachToTarget', { targetId: page.targetId, flatten: true }, null)).sessionId;
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.navigate', { url: `${result.origin}/console.html` });
  await wait("!!document.querySelector('input[type=password]')"); await capture('login',320,667);
  await login(); await capture('queue',390,844);
  await value("document.querySelector('[aria-label=\"Report queue\"] button strong').closest('button').click()");
  await wait("!!document.querySelector('canvas')");
  for (const [w,h] of [[1440,950],[390,844],[320,667]]) await capture('detail',w,h);
  const pixels = await value("(()=>{const c=document.querySelector('canvas');const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let route=0,marker=0;for(let i=0;i<p.length;i+=4){if(p[i]===18&&p[i+1]===106&&p[i+2]===119)route++;if(p[i]===155&&p[i+1]===52&&p[i+2]===76)marker++}return{route,marker}})()");
  result.canvas = pixels; check('local geometry visible', pixels.route > 500 && pixels.marker > 30);
  check('resident markup remains text', await value("!document.querySelector('main script')&&document.body.textContent.includes('<script>not executable</script>')"));
  await fill('textarea', 'Synthetic owner reason'); await click('Review decision');
  check('no decision request before confirmation', await value("!fixture.requests.some(p=>p.endsWith('/decision'))"));
  await click('Save decision'); await wait("document.body.textContent.includes('Save not confirmed.')"); await capture('uncertain',320,667);
  await click('Check saved decision'); await wait("document.body.textContent.includes('Still pending at the last check.')");
  check('pending read does not enable another save', await value("![...document.querySelectorAll('button')].some(b=>b.textContent==='Save decision')&&fixture.requests.filter(p=>p.endsWith('/decision')).length===1"));
  await click('Check saved decision'); await wait("document.body.textContent.includes('Saved decision found.')"); await capture('reconciled',390,844);
  check('reconciliation identifies state, not writer attribution', await value("document.body.textContent.includes('Saved decision: Accepted')"));
  check('pagehide synchronously removes private DOM', await value("(()=>{dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));return document.querySelector('main').hidden&&!document.body.textContent.includes('Synthetic resident note')&&!document.querySelector('textarea')})()"));
  check('pageshow signed out before unhide', await value("(()=>{dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));return !document.querySelector('main').hidden&&!!document.querySelector('input[type=password]')&&!document.body.textContent.includes('Synthetic saved decision')})()"));
  await login(); await click('Sign out'); await wait("document.body.textContent.includes('Server sign-out was not confirmed.')");
  check('failed remote logout still clears report DOM', await value("!document.body.textContent.includes('Synthetic resident note')&&!document.querySelector('[aria-label=\"Report queue\"]')"));
  await capture('signed-out',320,667);
  check('no persistent browser session', await value('localStorage.length===0&&sessionStorage.length===0&&document.cookie===\'\''));
  check('no browser exceptions', result.errors.length === 0); result.passed = true;
} catch (error) { result.error = String(error.message); process.exitCode = 1; }
finally {
  write('before-cleanup.json', JSON.stringify(result,null,2)+'\n');
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close', {}, null); } catch {} ws.close(); }
  try { if (chrome) { try { await bounded(exited,6000,'Chrome exit'); } catch { chrome.kill(); await bounded(exited,5000,'Owned Chrome kill'); } } } catch (error) { result.cleanupError = String(error.message); result.passed = false; process.exitCode = 1; }
  try { await vite?.close(); for (const socket of sockets) socket.destroy(); if (proxy.listening) await new Promise(done=>proxy.close(done)); } catch(error) { result.serverCleanupError=String(error.message); result.passed=false; process.exitCode=1; }
  result.closed = !!result.chromeExit; result.finishedAt = new Date().toISOString(); result.sourcesUnchanged = Object.entries(result.sources).every(([p,h])=>hash(readFileSync(resolve(root,p)))===h);
  if(!result.sourcesUnchanged){result.passed=false;process.exitCode=1;}
  write('summary.json',JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify({out,...result},null,2));
}
