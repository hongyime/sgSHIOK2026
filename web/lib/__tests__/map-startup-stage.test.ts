import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { RouteEvidenceMap } from '../../components/route-evidence-map';
import type { PostalGeom } from '../types';
import { readPublishedFixture } from './fixtures/published-data';

// Real component effects, import boundaries and route probe; deterministic hooks
// and MapLibre doubles do not establish browser download or rendering performance.
const hooks = vi.hoisted(() => {
  let index = 0, dirty = false;
  const slots: any[] = [], effects: (() => void)[] = [];
  const changed = (a: unknown[] | undefined, b: unknown[]) => !a || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
  const cleanup = (slot: any) => { const fn = slot.cleanup; slot.cleanup = undefined; fn?.(); };
  return {
    begin() { index = 0; dirty = false; },
    flush() { effects.splice(0).forEach(fn => fn()); return dirty; },
    reset() { slots.length = 0; effects.length = 0; },
    unmount() { slots.forEach(cleanup); },
    useRef(value: unknown) { const i = index++; return slots[i] ??= { current: value }; },
    useState(initial: any) {
      const i = index++, slot = slots[i] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slot.value, (update: any) => {
        const value = typeof update === 'function' ? update(slot.value) : update;
        if (!Object.is(value, slot.value)) { slot.value = value; dirty = true; }
      }];
    },
    useMemo(make: () => unknown, deps: unknown[]) {
      const i = index++;
      if (changed(slots[i]?.deps, deps)) slots[i] = { value: make(), deps };
      return slots[i].value;
    },
    useEffect(effect: () => void | (() => void), deps: unknown[]) {
      const i = index++, old = slots[i];
      if (!changed(old?.deps, deps)) return;
      const slot = slots[i] = { deps, cleanup: old?.cleanup };
      effects.push(() => { cleanup(slot); slot.cleanup = effect(); });
    },
  };
});
vi.mock('react', async original => ({ ...await original<typeof import('react')>(), ...hooks }));

function deferred() {
  let resolve!: () => void, reject!: (failure: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  void promise.catch(() => undefined);
  return { promise, resolve, reject };
}
function fakeMap() {
  const handlers = new Map<string, Set<(...args: any[]) => void>>();
  const sources = new Map<string, any>(), layers = new Map<string, any>();
  const canvas = { style: { cursor: '' }, setAttribute: vi.fn() };
  const map = {
    handlers,
    on(event: string, ...args: any[]) {
      const key = args.length === 2 ? `${event}:${args[0]}` : event;
      const set = handlers.get(key) ?? new Set(); set.add(args.at(-1)); handlers.set(key, set); return map;
    },
    off(event: string, listener: (...args: any[]) => void) { handlers.get(event)?.delete(listener); return map; },
    emit(event: string, value = {}) { [...(handlers.get(event) ?? [])].forEach(listener => listener(value)); },
    getCanvas: () => canvas, getZoom: () => 16,
    getSource: (id: string) => sources.get(id), getLayer: (id: string) => layers.get(id),
    isSourceLoaded: () => true,
    addSource(id: string, spec: any) { sources.set(id, { ...spec, setData: vi.fn() }); },
    addLayer(spec: any) { layers.set(spec.id, spec); },
    moveLayer: vi.fn(), setLayoutProperty: vi.fn(), setFilter: vi.fn(), resize: vi.fn(), fitBounds: vi.fn(), easeTo: vi.fn(), triggerRepaint: vi.fn(),
    isMoving: () => false, queryRenderedFeatures: () => [],
    remove: vi.fn(() => handlers.clear()),
  };
  return map;
}
type Props = ComponentProps<typeof RouteEvidenceMap>;
let Component: typeof RouteEvidenceMap, props: Props, map: ReturnType<typeof fakeMap>;
let importGate: ReturnType<typeof deferred>, importEntered: ReturnType<typeof deferred>;
let construct: ReturnType<typeof vi.fn>, addProtocol: ReturnType<typeof vi.fn>, status: ReturnType<typeof vi.fn>;
let frames: (() => void)[];
const container = {
  closest: () => ({ querySelectorAll: () => [] }),
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 844 }),
};
function render(update: Partial<Props> = {}) {
  props = { ...props, ...update };
  let again = true, passes = 0;
  while (again) {
    if (++passes > 20) throw Error('Unbounded component effect loop');
    hooks.begin();
    const tree = Component(props);
    tree.props.children[0].props.ref.current = container;
    again = hooks.flush();
    if (frames.length) { frames.splice(0).forEach(fn => fn()); again = true; }
  }
}
async function settle() {
  await vi.dynamicImportSettled();
  for (let i = 0; i < 12; i++) await Promise.resolve();
}
async function start() {
  render(); await importEntered.promise;
  importGate.resolve(); await settle();
  expect(construct).toHaveBeenCalledTimes(1);
  expect(map.handlers.get('load')?.size).toBe(1);
}
function load() { map.emit('style.load'); map.emit('load'); render(); }
function lastIssue() { return status.mock.calls.at(-1)?.[3]; }
const privateFailure = 'https://private.invalid/path?postal=018956&token=private-marker';

beforeEach(async () => {
  vi.useFakeTimers(); vi.resetModules(); hooks.reset(); frames = [];
  map = fakeMap(); importGate = deferred(); importEntered = deferred();
  construct = vi.fn(() => map); addProtocol = vi.fn(); status = vi.fn();
  props = { routes: [], mode: 'shiokest', onStatusChange: status };
  vi.stubGlobal('window', { location: { search: '' }, matchMedia: () => ({ matches: true }) });
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { frames.push(fn); return frames.length; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  vi.doMock('maplibre-gl', async () => {
    importEntered.resolve(); await importGate.promise;
    return { Map: class { constructor() { return construct(); } }, Popup: class {}, setWorkerUrl: vi.fn(), addProtocol };
  });
  ({ RouteEvidenceMap: Component } = await import('../../components/route-evidence-map'));
});
afterEach(async () => {
  hooks.unmount(); importGate.resolve(); await settle();
  vi.doUnmock('maplibre-gl'); vi.useRealTimers(); vi.unstubAllGlobals(); vi.resetModules();
});

describe('phase-aware map startup issues', () => {
  it('identifies a pending library timeout without extending the 30-second deadline', async () => {
    render(); await importEntered.promise;
    vi.advanceTimersByTime(29_999); expect(status).toHaveBeenLastCalledWith('mounting');
    vi.advanceTimersByTime(1);
    expect(status).toHaveBeenLastCalledWith('error',
      'The map library could not load. Reload the page to try again. Walk evidence is still available.',
      'reload', { stage: 'library-download', reason: 'timeout', elapsedMs: 30_000 });
    expect(construct).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['resolve', 'reject'] as const)('ignores a late library %s after the terminal deadline', async outcome => {
    render(); await importEntered.promise; vi.advanceTimersByTime(30_000);
    expect(lastIssue()?.stage).toBe('library-download'); status.mockClear();
    if (outcome === 'resolve') importGate.resolve(); else importGate.reject(new Error(privateFailure));
    await settle(); vi.advanceTimersByTime(30_000);
    expect(status).not.toHaveBeenCalled(); expect(construct).not.toHaveBeenCalled();
  });

  it('reports a rejected library with fixed copy and safe issue fields only', async () => {
    render(); await importEntered.promise; vi.advanceTimersByTime(1_250);
    importGate.reject(new Error(privateFailure)); await settle();
    expect(status).toHaveBeenLastCalledWith('error',
      'The map library could not load. Reload the page to try again. Walk evidence is still available.',
      'reload', { stage: 'library-download', reason: 'rejected', elapsedMs: 1_250 });
    expect(JSON.stringify(status.mock.calls)).not.toMatch(/private|018956|https:/);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('distinguishes rejected glyph setup from library download and construction', async () => {
    addProtocol.mockImplementation(() => { throw new Error(privateFailure); });
    render(); await importEntered.promise; importGate.resolve(); await settle();
    expect(status).toHaveBeenLastCalledWith('error',
      'Map labels could not be prepared. Reload the page to try again. Walk evidence is still available.',
      'reload', { stage: 'glyph-setup', reason: 'rejected', elapsedMs: 0 });
    expect(construct).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });

  it('identifies a thrown constructor without publishing its raw exception', async () => {
    construct.mockImplementation(() => { throw new Error(privateFailure); });
    render(); await importEntered.promise; importGate.resolve(); await settle();
    expect(status).toHaveBeenLastCalledWith('error',
      'The map could not be created. Reload the page to try again. Walk evidence is still available.',
      'reload', { stage: 'map-construction', reason: 'error', elapsedMs: 0 });
    expect(map.remove).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
    expect(JSON.stringify(status.mock.calls)).not.toMatch(/private|018956|https:/);
  });

  it('uses the remaining deadline after a slow import instead of granting another 30 seconds', async () => {
    render(); await importEntered.promise; vi.advanceTimersByTime(8_000);
    importGate.resolve(); await settle();
    vi.advanceTimersByTime(21_999); expect(status).toHaveBeenLastCalledWith('initializing');
    vi.advanceTimersByTime(1);
    expect(status).toHaveBeenLastCalledWith('error',
      'The map did not finish starting. Reload the page to try again. Walk evidence is still available.',
      'reload', { stage: 'map-startup', reason: 'timeout', elapsedMs: 30_000 });
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('does not mistake style.load for finished map startup', async () => {
    await start(); map.emit('style.load'); render(); vi.advanceTimersByTime(30_000);
    expect(lastIssue()).toEqual({ stage: 'map-startup', reason: 'timeout', elapsedMs: 30_000 });
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('reports pre-load worker errors as startup errors without claiming a specific worker cause', async () => {
    await start(); vi.advanceTimersByTime(750);
    map.emit('error', { sourceId: 'worker', error: new Error(privateFailure) });
    expect(lastIssue()).toEqual({ stage: 'map-startup', reason: 'error', elapsedMs: 750 });
    expect(status.mock.calls.at(-1)?.[2]).toBe('reload');
    expect(JSON.stringify(status.mock.calls)).not.toMatch(/private|018956|https:/);
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('keeps a pre-load basemap failure partial and retains the startup deadline', async () => {
    await start(); vi.advanceTimersByTime(750); map.emit('error', { sourceId: 'onemap' });
    expect(status).toHaveBeenLastCalledWith('partial',
      'Some basemap tiles could not load. Walk evidence is still available.', undefined,
      { stage: 'basemap-tiles', reason: 'error', elapsedMs: 750 });
    expect(map.remove).not.toHaveBeenCalled(); vi.advanceTimersByTime(29_250);
    expect(lastIssue()).toEqual({ stage: 'map-startup', reason: 'timeout', elapsedMs: 30_000 });
  });

  it('retains a partial basemap issue when load completes with no selected route', async () => {
    await start(); map.emit('error', { sourceId: 'onemap' }); const issue = lastIssue(); load();
    expect(issue).toEqual({ stage: 'basemap-tiles', reason: 'error', elapsedMs: 0 });
    expect(status.mock.calls.at(-1)?.[0]).toBe('partial'); expect(lastIssue()).toEqual(issue);
    expect(map.remove).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });

  it('reports post-load rendering failure without escalating it to page reload', async () => {
    await start(); load(); vi.advanceTimersByTime(500);
    map.emit('error', { error: new Error(privateFailure) });
    expect(status).toHaveBeenLastCalledWith('error',
      'The map could not render. Walk evidence is still available.', undefined,
      { stage: 'route-render', reason: 'error', elapsedMs: 500 });
    expect(map.remove).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });

  it('labels the selected-route visibility timeout separately from startup', async () => {
    const geom = readPublishedFixture<PostalGeom[]>('geom/h3/886520db39fffff.json').find(row => row.postal === '018956')!;
    props.routes = [{ id: '018956', label: 'Fixture', color: '#008f86', geom }];
    await start(); load(); vi.advanceTimersByTime(15_000);
    expect(status).toHaveBeenLastCalledWith('error', 'The selected walk is not visible. Retry the map.', undefined,
      { stage: 'route-render', reason: 'timeout', elapsedMs: 15_000 });
    expect(map.remove).not.toHaveBeenCalled(); expect(JSON.stringify(lastIssue())).not.toContain('018956');
  });

  it('cancels the deadline on successful load without introducing progress messages', async () => {
    await start(); load(); status.mockClear(); vi.advanceTimersByTime(60_000);
    expect(status).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
    expect(map.remove).not.toHaveBeenCalled();
  });

  it('does not construct or report an issue after unmount during import', async () => {
    render(); await importEntered.promise; hooks.unmount(); status.mockClear();
    importGate.resolve(); await settle(); vi.advanceTimersByTime(60_000);
    expect(construct).not.toHaveBeenCalled(); expect(status).not.toHaveBeenCalled();
  });

  it('keeps the replacement attempt deadline and ownership after an import overlaps remount', async () => {
    render(); await importEntered.promise; vi.advanceTimersByTime(7_000);
    hooks.unmount(); hooks.reset(); render(); status.mockClear(); importGate.resolve(); await settle();
    expect(construct).toHaveBeenCalledTimes(1); vi.advanceTimersByTime(23_000);
    expect(status.mock.calls.some(([state]) => state === 'error')).toBe(false);
    vi.advanceTimersByTime(7_000);
    expect(lastIssue()).toEqual({ stage: 'map-startup', reason: 'timeout', elapsedMs: 30_000 });
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('reports once even if teardown throws and ignores detached events after terminal failure', async () => {
    await start();
    const late = ['load', 'style.load', 'error'].map(event => [...map.handlers.get(event)!][0]);
    map.remove.mockImplementation(() => { throw new Error(privateFailure); });
    vi.advanceTimersByTime(30_000);
    expect(lastIssue()).toEqual({ stage: 'map-startup', reason: 'timeout', elapsedMs: 30_000 });
    status.mockClear(); late.forEach(listener => listener({ error: new Error(privateFailure) }));
    hooks.unmount(); vi.advanceTimersByTime(30_000);
    expect(status).not.toHaveBeenCalled(); expect(map.remove).toHaveBeenCalledTimes(1);
  });
});
