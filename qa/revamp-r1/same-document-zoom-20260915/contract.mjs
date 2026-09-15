import assert from 'node:assert/strict';
import { win32 } from 'node:path';

export const ROOT = 'C:\\sgSHIOK2026';
export const POWERSHELL = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe';
export const BASE = ROOT + '\\qa\\revamp-r1\\same-document-zoom-20260915';
export const METRICS = ['Walk distance', 'Covered', 'Uncovered', 'Longest gap'];
export const BUDGET = { total: 600000, work: 420000, cleanup: 60000, supervisor: 90000, receipt: 30000 };

export function knownBlockedBrowserTraffic(entry){
  if(entry.kind==='connect')return ['www.gstatic.com:443','accounts.google.com:443','www.google.com:443'].includes(entry.url);
  if(entry.kind!=='proxy'||entry.method!=='GET')return false;
  try{
    const url=new URL(entry.url);
    return url.origin==='http://clients2.google.com'&&url.pathname==='/time/1/current'&&!url.username&&!url.password;
  }catch{return false;}
}

export function ownedProfile(profile) {
  const relative = win32.relative(BASE, profile);
  return profile === win32.resolve(profile) && /^observed-[A-Za-z0-9]{6}\\profile$/.test(relative);
}

export function config(value) {
  assert.equal(value?.approved, 'exact-preview-go', 'Parent exact-preview approval required');
  const url = new URL(value.target);
  assert.ok(url.protocol === 'http:' && url.hostname === '127.0.0.1' && /^\d+$/.test(url.port), 'Loopback preview only');
  assert.ok(!url.username && !url.password && !url.hash && url.pathname === '/', 'Unexpected preview URL');
  assert.equal(url.searchParams.get('debugMap'), '1');
  assert.equal(url.searchParams.get('postal'), '018956', 'Use the published non-resident fixture postal');
  assert.equal(url.searchParams.get('transit'), 'mrt_lrt');
  assert.equal(url.searchParams.get('stop'), 'mrt:21677', 'Explicit saved nondefault selection');
  assert.ok(typeof value.buildId === 'string' && /^[\w-]{1,100}$/.test(value.buildId), 'Build identity required');
  assert.ok(Array.isArray(value.sources) && value.sources.length > 0, 'Exact candidate sources required');
  for (const source of value.sources) {
    assert.ok(typeof source.path === 'string' && !win32.isAbsolute(source.path) && !source.path.split(/[\\/]/).includes('..'), 'Repository relative source only');
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
  }
  assert.ok(value.captureDisplayImages===undefined||typeof value.captureDisplayImages==='boolean');
  // Frozen replies remain exact. Explicit display-image capture has a separate bounded allowlist.
  for (const tile of value.localReplies ?? []) {
    const remote = new URL(tile.url);
    assert.equal(remote.origin, 'https://www.onemap.gov.sg');
    assert.ok(!remote.search && (/^\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(remote.pathname) || remote.pathname === '/web-assets/images/logo/om_logo.png'));
    assert.ok(!win32.isAbsolute(tile.path) && !tile.path.split(/[\\/]/).includes('..'));
    assert.match(tile.sha256, /^[a-f0-9]{64}$/);
  }
  return { ...value, target: url.href, origin: url.origin };
}

export function sameSelection(before, after, { focus = false } = {}) {
  const valid = value => Number.isFinite(value.timeOrigin) && value.timeOrigin > 0 &&
    ['documentToken','url','routeKey','geometry','destination','postal','pressed'].every(k => typeof value[k] === 'string' && value[k].length > 0) &&
    value.geometry !== '[]' && value.geometry !== 'null';
  return valid(before) && valid(after) && before.timeOrigin === after.timeOrigin && before.documentToken === after.documentToken &&
    before.url === after.url && before.routeKey === after.routeKey &&
    before.geometry === after.geometry && before.destination === after.destination &&
    before.postal === after.postal && before.pressed === after.pressed &&
    (!focus || (before.focusSame === true && after.focusSame === true && typeof before.focusToken === 'string' && before.focusToken.length > 0 && before.focusToken === after.focusToken));
}

export function nativeZoom(before, after, factor, windowBefore, windowAfter) {
  const approx = (a,b,tolerance) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b) <= tolerance;
  return approx(before.dpr,1,0.02) && approx(after.dpr,factor,0.02) &&
    before.scale === 1 && after.scale === 1 && ['1','normal'].includes(after.cssZoom) &&
    ['1','normal'].includes(after.bodyZoom) && approx(before.inner[0]/after.inner[0],factor,0.015) &&
    approx(before.inner[1]/after.inner[1],factor,0.025) &&
    before.outer[0] === after.outer[0] && before.outer[1] === after.outer[1] &&
    windowBefore.hwnd === windowAfter.hwnd && windowBefore.pid === windowAfter.pid &&
    windowBefore.client.width === windowAfter.client.width && windowBefore.client.height === windowAfter.client.height &&
    windowBefore.window.width === windowAfter.window.width && windowBefore.window.height === windowAfter.window.height &&
    windowBefore.dpi === windowAfter.dpi && windowAfter.visible && !windowAfter.minimized;
}

export function allMetrics(readings, expected) {
  const found = new Map();
  for (const {before,after} of readings) for (const metric of before) {
    const later = after.find(m => m.label === metric.label);
    if (later && metric.visible && later.visible && metric.value === later.value) found.set(metric.label,metric.value);
  }
  return METRICS.every(label => found.has(label) && found.get(label) === expected[label]);
}

export async function transition({snapshot, shortcut, wait, factor}) {
  const start = await snapshot();
  const commands = [];
  if (factor === 2) {
    for (let i = 0; i < 5; i++) {
      commands.push(await shortcut('in'));
      await wait(i === 4 ? 2 : [1.1,1.25,1.5,1.75][i]);
    }
  } else {
    assert.equal(factor,1);
    commands.push(await shortcut('reset'));
    await wait(1);
  }
  const end = await snapshot();
  assert.ok(sameSelection(start,end,{focus:true}), 'Native zoom changed document/selection/focus');
  return {start,end,commands};
}
