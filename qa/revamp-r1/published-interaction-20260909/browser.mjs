import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, build] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label || '') || !/^[\w-]+$/.test(build || '')) throw Error('Run label and expected build required');
const out = resolve(root, 'qa/revamp-r1/published-interaction-20260909', `${label}-${Date.now()}`);
mkdirSync(out);
const profile = mkdtempSync(resolve(root, 'tmp/published-walk-browser-'));
const origin = 'http://127.0.0.1:4326';
const report = { root, hostname: process.env.COMPUTERNAME, build, out, profile, startedAt: new Date().toISOString(),
  checks: [], captures: [], actions: [], errors: [], console: [], network: [], cleanup: {},
  policy: 'Functional CDP browser acceptance; fresh owned profile, real unmodified static data, no installations or pipeline. Local API requests deliberately return503. Not representative performance.' };
let chrome, ws, id = 0, stderr = '';
const pending = new Map();
const deadline = Date.now() + 600000;
const delay = ms => new Promise(done => setTimeout(done, ms));
function check(name, pass, detail) {
  report.checks.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass) throw Error(name);
}
function send(method, params = {}) {
  return new Promise((done, reject) => {
    const n = ++id;
    const timer = setTimeout(() => { pending.delete(n); reject(Error('CDP timeout: ' + method)); }, 15000);
    pending.set(n, { done: value => { clearTimeout(timer); done(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
}
async function evaluate(expression) {
  const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (value.exceptionDetails) throw Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
  return value.result.value;
}
const facts = `(() => {
  if(!document.documentElement)return{status:'document_pending'};
  const map=window.__shiokRouteMap,debug=window.__shiokRouteDebug;
  const summary=document.querySelector('[aria-label="Walk summary"]');
  const rect=n=>{const r=n?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null};
  let features=[];try{features=map?.queryRenderedFeatures({layers:['shiokest-route-line']})||[]}catch{}
  return {url:location.href,status:document.querySelector('main')?.dataset.mapStatus,
    name:summary?.querySelector('p strong')?.textContent,postal:summary?.dataset.postal,
    metrics:summary?[...summary.querySelectorAll('div > strong')].map(n=>{const range=document.createRange();range.selectNodeContents(n);const lines=[...range.getClientRects()],cell=n.parentElement.getBoundingClientRect();return{value:n.textContent,label:n.parentElement.querySelector('span')?.textContent,lines:lines.length,fits:lines.every(r=>r.left>=cell.left-0.5&&r.right<=cell.right+0.5)}}):[],
    key:debug?.routeKey,currentFeatures:features.filter(f=>f.properties?.render_key===debug?.routeKey).length,
    basemap:!!map?.getSource('onemap')&&map.isSourceLoaded('onemap'),moving:map?.isMoving(),
    choicesOpen:document.querySelector('[aria-label="Published walks"]')?.closest('details')?.open,
    categories:[...document.querySelectorAll('[aria-label="Transit stop or exit type"] button')].map(n=>{const box=n.getBoundingClientRect();return{text:n.textContent,height:box.height,fits:[...n.children].every(c=>{const range=document.createRange();range.selectNodeContents(c);return [...range.getClientRects()].every(r=>r.left>=box.left+1&&r.right<=box.right-1)})}}),
    choices:[...document.querySelectorAll('[aria-label="Published walks"] button')].map(n=>({text:n.textContent,selected:n.getAttribute('aria-pressed')})),
    overflow:document.documentElement.scrollWidth>innerWidth,viewport:[innerWidth,innerHeight],
    brand:rect(document.querySelector('h1')),search:rect(document.querySelector('form')),panel:rect(document.querySelector('aside')),
    canvas:rect(map?.getCanvas()),padding:map?.getPadding(),summary:rect(summary),
    about:rect([...document.querySelectorAll('summary')].find(n=>n.textContent==='About data'))};
})()`;
async function waitReady(name, expected, ms = 70000) {
  const end = Math.min(deadline, Date.now() + ms); let current;
  while (Date.now() < end) {
    current = await evaluate(facts);
    if (current.status === 'ready' && current.basemap && !current.moving && current.currentFeatures > 0 &&
        (!expected || current.name === expected)) return current;
    await delay(500);
  }
  check(name + ' ready', false, current);
}
async function click(expression, keyboard = false) {
  const hit = await evaluate(`(() => {const n=${expression};if(!n)return{error:'missing control'};n.focus({preventScroll:true});n.scrollIntoView({block:'nearest'});const r=n.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;return{x,y,text:n.textContent,hit:document.elementFromPoint(x,y)?.closest('button,summary')===n,visible:n.checkVisibility()}})()`);
  check('control hit-test: ' + hit.text, hit.hit, hit);
  report.actions.push({ ...hit, keyboard });
  if (keyboard) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  } else {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
  }
  await evaluate('new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))');
}
async function capture(name) {
  await evaluate('document.fonts.ready.then(() => true)');
  const before = await evaluate(facts);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const bytes = Buffer.from(shot.data, 'base64'); const path = resolve(out, name + '.png');
  writeFileSync(path, bytes, { flag: 'wx' });
  const after = await evaluate(facts);
  report.captures.push({ name, path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), before, after });
  check(name + ' current route during screenshot', before.key === after.key && before.currentFeatures > 0 && after.currentFeatures > 0, { before, after });
  check(name + ' no page overflow', !after.overflow, after.viewport);
  check(name + ' metric text fits without split words', after.metrics.every(m => m.lines === 1 && m.fits), after.metrics);
  check(name + ' category labels fit their touch targets', after.categories.every(c => c.height >= 44 && c.fits), after.categories);
}
const summaryNamed = name => `[...document.querySelectorAll('summary')].find(n=>n.textContent.startsWith(${JSON.stringify(name)}))`;
const categoryButton = label => `[...document.querySelectorAll('[aria-label="Transit stop or exit type"] button')].find(n=>n.querySelector('span')?.textContent===${JSON.stringify(label)})`;
try {
  const status = await (await fetch(origin + '/__qa/status')).json();
  check('served snapshot is expected build', status.build === build, status);
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid;
  chrome.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-12000); });
  const start = Date.now(); let tabs;
  while (Date.now() - start < 40000 && !tabs) {
    const endpoint = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];
    if (endpoint) { const url = new URL(endpoint); url.protocol = 'http:'; url.pathname = '/json'; tabs = await (await fetch(url)).json(); }
    else await delay(250);
  }
  const target = tabs?.find(tab => tab.type === 'page');
  if (!target) throw Error('Owned browser did not start');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, reject) => { ws.onopen = done; ws.onerror = reject; });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (p) m.error ? p.reject(Error(m.error.message)) : p.done(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') report.errors.push(m.params);
    if (m.method === 'Runtime.consoleAPICalled' && report.console.length < 500) report.console.push(m.params);
    if (m.method === 'Network.responseReceived' && report.network.length < 1000) {
      const r = m.params.response; report.network.push({ requestId: m.params.requestId, url: r.url, status: r.status, type: m.params.type, cache: r.fromDiskCache, serviceWorker: r.fromServiceWorker });
    }
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin + '/?postal=018956&transit=mrt_lrt' });
  await waitReady('MRT default', 'BAYFRONT MRT STATION Exit E', 180000);
  const document = report.network.findLast(r => r.type === 'Document');
  const body = await send('Network.getResponseBody', { requestId: document.requestId });
  const html = Buffer.from(body.body, body.base64Encoded ? 'base64' : 'utf8');
  report.document = { ...document, bytes: html.length, sha256: createHash('sha256').update(html).digest('hex'), containsExpectedBuild: html.toString('utf8').includes(build) };
  check('actual received HTML is the expected build', report.document.containsExpectedBuild, report.document);
  await capture('mrt-default-390x844');
  await click(summaryNamed('Other walks'), true);
  check('keyboard opens native published choices', (await evaluate(facts)).choicesOpen === true);
  await capture('choices-open-390x844');
  await click(`[...document.querySelectorAll('[aria-label="Published walks"] button')].find(n=>n.textContent.includes('Shortest shown'))`, true);
  let current = await waitReady('MRT C', 'BAYFRONT MRT STATION Exit C');
  check('candidate measurements remain independent', JSON.stringify(current.metrics.map(m => m.value)) === JSON.stringify(['109 m', '0%', 'Unavailable', 'Unavailable']), current);
  check('candidate URL uses its real ID', new URL(current.url).searchParams.get('stop') === 'mrt:21624', current.url);
  await capture('mrt-c-390x844');
  await click(`document.querySelector('button[aria-label="Use published default"]')`, true);
  current = await waitReady('Reset E', 'BAYFRONT MRT STATION Exit E');
  check('default reset has no fabricated stop ID', !new URL(current.url).searchParams.has('stop'), current.url);
  await click(categoryButton('Bus stops'));
  current = await waitReady('Bus default', 'Bayfront Stn Exit B/MBS');
  check('bus measurements preserved', JSON.stringify(current.metrics.map(m => m.value)) === JSON.stringify(['81 m', '55%', '37 m', '20 m']), current);
  check('one default does not create a useless picker', current.choices.length === 0, current.choices);
  for (const [width, height] of [[1440, 950], [390, 844], [390, 667], [320, 667]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    current = await waitReady('Responsive bus', 'Bayfront Stn Exit B/MBS');
    check(`top-left equal-width stack ${width}`, current.brand.x >= 0 && current.search.y >= current.brand.y + current.brand.height &&
      current.panel.y >= current.search.y + current.search.height && Math.abs(current.search.width - current.panel.width) <= 2, current);
    check(`About data bottom-right ${width}`, current.about.x + current.about.width >= width - 25 && current.about.y > height / 2, current.about);
    await capture(`bus-${width}x${height}`);
  }
  await send('Page.navigate', { url: origin + '/?postal=018956&transit=mrt_lrt&stop=mrt%3A21624' });
  current = await waitReady('Restored shared candidate', 'BAYFRONT MRT STATION Exit C', 100000);
  await capture('shared-c-320x667');
  const finalStatus = await (await fetch(origin + '/__qa/status')).json();
  check('published choices made no live-preview request', !finalStatus.requests.some(r => r.path.startsWith('/api/')), finalStatus.requests.filter(r => r.path.startsWith('/api/')));
  check('no uncaught page errors', report.errors.length === 0, report.errors);
} catch (error) { report.failure = error.stack; console.error(error.stack); }
finally {
  if (ws?.readyState === 1) try { await send('Browser.close'); report.cleanup.closeSent = true; } catch (error) { report.cleanup.closeError = error.message; }
  if (chrome) { const end = Date.now() + 3000; while (chrome.exitCode === null && chrome.signalCode === null && Date.now() < end) await delay(100);
    if (chrome.exitCode === null && chrome.signalCode === null) {
      report.cleanup.killSent = chrome.kill();
      const killedEnd = Date.now() + 5000;
      while (chrome.exitCode === null && chrome.signalCode === null && Date.now() < killedEnd) await delay(100);
    }
    report.cleanup.chromeExited = chrome.exitCode !== null || chrome.signalCode !== null; }
  ws?.close(); for (const p of pending.values()) p.reject(Error('Browser acceptance ended')); pending.clear();
  report.stderr = stderr; report.finishedAt = new Date().toISOString(); report.ok = !report.failure && report.checks.every(c => c.pass);
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, captures: report.captures.length, cleanup: report.cleanup }));
  process.exitCode = report.ok ? 0 : 1;
}
