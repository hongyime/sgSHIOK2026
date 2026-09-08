import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { PostalGeom } from '../types';
import { readPublishedFixture } from './fixtures/published-data';

// A deterministic effect host for the actual component: dependency comparison,
// state/ref/memo persistence and cleanup run; DOM/WebGL are replaced by spies.
// This proves publication/lifecycle behavior, not browser rendering or latency.
const hooks = vi.hoisted(() => {
  let index = 0, dirty = false;
  const slots: any[] = [], effects: (() => void)[] = [];
  const changed = (a: unknown[] | undefined, b: unknown[]) => !a || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
  return {
    begin() { index = 0; dirty = false; },
    flush() { effects.splice(0).forEach(fn => fn()); return dirty; },
    reset() { slots.length = 0; effects.length = 0; },
    unmount() { slots.forEach(s => s.cleanup?.()); },
    useRef(value: unknown) { const i = index++; return slots[i] ??= { current: value }; },
    useState(initial: any) {
      const i = index++;
      const slot = slots[i] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slot.value, (update: any) => { const value = typeof update === 'function' ? update(slot.value) : update; if (!Object.is(value, slot.value)) { slot.value = value; dirty = true; } }];
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
      effects.push(() => { slot.cleanup?.(); slot.cleanup = effect(); });
    },
  };
});
vi.mock('react', async original => ({ ...await original<typeof import('react')>(), ...hooks }));
const lib = vi.hoisted(() => ({ instance: null as any, manifest: vi.fn() }));
vi.mock('maplibre-gl', () => ({ Map: class { constructor() { return lib.instance; } }, Popup: class {}, setWorkerUrl: vi.fn(), addProtocol: vi.fn() }));
vi.mock('../lamp-overlay', async original => ({ ...await original<typeof import('../lamp-overlay')>(), fetchLampOverlayManifest: lib.manifest }));
import { RouteEvidenceMap } from '../../components/route-evidence-map';

type Props = ComponentProps<typeof RouteEvidenceMap>;
const routeIds = ['shortest-route', 'shiokest-route', 'exposure-gaps', 'transit-node'];
const allIds = [...routeIds, 'active-exposure-gap', 'transit-pois', 'feedback-route', 'feedback-points', 'lamp-posts'];
function fakeMap() {
  const sources = new Map<string, any>(), layers = new Map<string, any>(), handlers = new Map<string, Set<(...args: any[]) => void>>();
  const writes: { id: string; data: any }[] = [];
  let rendered: any[] = [];
  const map = {
    sources, layers, handlers, writes,
    on(event: string, ...args: any[]) { const key = args.length === 2 ? `${event}:${args[0]}` : event; const set = handlers.get(key) ?? new Set(); set.add(args.at(-1)); handlers.set(key, set); return map; },
    off(event: string, fn: (...args: any[]) => void) { handlers.get(event)?.delete(fn); return map; },
    emit(event: string, data = {}) { [...(handlers.get(event) ?? [])].forEach(fn => fn(data)); },
    getSource: (id: string) => sources.get(id), getLayer: (id: string) => layers.get(id),
    addSource(id: string, spec: any) { sources.set(id, { data: spec.data, setData(data: any) { writes.push({ id, data }); this.data = data; } }); },
    addLayer(spec: any) { layers.set(spec.id, spec); },
    getZoom: () => 16, getCanvas: () => ({ style: { cursor: '' } }),
    getBounds: () => ({ getWest: () => 103.8, getEast: () => 103.9, getSouth: () => 1.2, getNorth: () => 1.4 }),
    moveLayer: vi.fn(), setLayoutProperty: vi.fn(), setFilter: vi.fn(), resize: vi.fn(), fitBounds: vi.fn(), easeTo: vi.fn(),
    isMoving: () => false, isSourceLoaded: () => true,
    queryRenderedFeatures: () => rendered,
    render(data = sources.get('shiokest-route').data.features) { rendered = data; map.emit('render'); },
    remove: vi.fn(() => handlers.clear()),
  };
  sources.set('onemap', { setTiles: vi.fn() });
  return map;
}
let map: ReturnType<typeof fakeMap>, props: Props, frames: (() => void)[];
const container = { closest: () => ({ querySelectorAll: () => [] }), getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 844 }) };
function render(update: Partial<Props> = {}) {
  props = { ...props, ...update };
  let again = true, runs = 0;
  while (again) {
    if (++runs > 20) throw Error('Unbounded component effect loop');
    hooks.begin();
    const tree = RouteEvidenceMap(props);
    tree.props.children[0].props.ref.current = container;
    again = hooks.flush();
    if (frames.length) { frames.splice(0).forEach(fn => fn()); again = true; }
  }
}
async function mount() {
  render();
  await vi.dynamicImportSettled();
  for (let i = 0; i < 12; i++) await Promise.resolve();
  expect(map.handlers.get('load')?.size).toBe(1);
  map.emit('style.load'); map.emit('load'); render();
}
const routeWrites = () => map.writes.filter(w => routeIds.includes(w.id));
beforeEach(() => {
  vi.useFakeTimers(); hooks.reset(); frames = []; map = fakeMap(); lib.instance = map;
  lib.manifest.mockReset().mockResolvedValue(null);
  vi.stubGlobal('window', { location: { search: '' }, matchMedia: () => ({ matches: true }) });
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { frames.push(fn); return frames.length; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  const geom = readPublishedFixture<PostalGeom[]>('geom/h3/886520db39fffff.json').find(g => g.postal === '018956')!;
  props = { routes: [{ id: '018956', label: 'Published fixture', color: '#008f86', geom }], mode: 'shiokest', onStatusChange: vi.fn() };
});
afterEach(() => { hooks.unmount(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('M05/M10/M11: source ownership in the executed map component', () => {
  it('publishes all sources initially, then optional POIs/feedback/lamps do not rewrite or refit the route', async () => {
    await mount();
    expect(routeWrites().map(w => w.id)).toEqual(routeIds);
    expect(new Set(map.writes.map(w => w.id))).toEqual(new Set(allIds));
    map.writes.length = 0; map.fitBounds.mockClear();
    render({ transitPois: { type: 'FeatureCollection', features: [] } });
    expect(map.writes.map(w => w.id)).toEqual(['transit-pois']);
    map.writes.length = 0;
    render({ feedbackPoints: [{ lng: 103.86, lat: 1.28 }, { lng: 103.861, lat: 1.281 }] });
    expect(map.writes.map(w => w.id)).toEqual(['feedback-route', 'feedback-points']);
    map.writes.length = 0;
    render({ showLampOverlay: true });
    for (let i = 0; i < 4; i++) await Promise.resolve();
    render();
    expect(map.writes.map(w => w.id)).toEqual(['lamp-posts']);
    expect(routeWrites()).toHaveLength(0); expect(map.fitBounds).not.toHaveBeenCalled();
  });
  it('gap focus/clear writes only the highlight and retains intentional camera movement', async () => {
    await mount(); map.writes.length = 0;
    render({ focusedExposureGap: { key: 'gap', lat: 1.28, lon: 103.86 } });
    expect(map.writes.map(w => w.id)).toEqual(['active-exposure-gap']);
    expect(map.easeTo).toHaveBeenCalledTimes(1);
    map.writes.length = 0; render({ focusedExposureGap: null });
    expect(map.writes.map(w => w.id)).toEqual(['active-exposure-gap']);
    expect(map.writes[0].data.features).toEqual([]);
  });
  it('replaces routes, rejects old callbacks/features, and clears all route-owned sources', async () => {
    await mount();
    const old = map.sources.get('shiokest-route').data.features;
    const stale = [...map.handlers.get('render')!][0];
    map.writes.length = 0;
    render({ routes: [{ ...props.routes[0], id: 'B' }] });
    expect(routeWrites().map(w => w.id)).toEqual(routeIds);
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    stale(); map.render(old); expect(status).not.toHaveBeenCalled();
    map.render(); expect(status).toHaveBeenCalledWith('ready', undefined);
    expect(map.handlers.get('render')?.size).toBe(0);
    map.writes.length = 0; render({ routes: [] });
    expect(routeWrites()).toHaveLength(4);
    for (const id of routeIds) expect(map.sources.get(id).data.features).toEqual([]);
  });
  it('propagates changed geometry with the same route identity', async () => {
    await mount();
    const previous = structuredClone(map.sources.get('shiokest-route').data);
    const geom = structuredClone(props.routes[0].geom);
    // Real alternate geometry from the portable fixture, same selected postal/id.
    Object.assign(geom, geom.candidates!['mrt:21678']);
    map.writes.length = 0;
    render({ routes: [{ ...props.routes[0], geom }] });
    expect(routeWrites()).toHaveLength(4);
    expect(map.sources.get('shiokest-route').data.features.map((f: any) => f.geometry))
      .not.toEqual(previous.features.map((f: any) => f.geometry));
  });
  it('republishes current data after style recreation and keeps one readiness listener', async () => {
    await mount();
    const expected = map.sources.get('shiokest-route').data;
    const stale = [...map.handlers.get('render')!][0];
    for (const id of allIds) map.sources.delete(id);
    map.layers.clear(); map.writes.length = 0;
    map.emit('style.load'); render();
    expect(map.sources.get('shiokest-route')?.data).toEqual(expected);
    expect(routeWrites().map(w => w.id)).toEqual(routeIds);
    expect(map.handlers.get('render')?.size).toBe(1);
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    stale(); expect(status).not.toHaveBeenCalled();
    map.render(); expect(status).toHaveBeenCalledWith('ready', undefined);
  });
  it('retry recovers a missing source, retains useful data on tile failure, and cleans up', async () => {
    await mount(); map.render();
    const expected = map.sources.get('shiokest-route').data;
    map.emit('error', { sourceId: 'onemap' });
    expect(props.onStatusChange).toHaveBeenLastCalledWith('partial', expect.any(String));
    expect(map.sources.get('shiokest-route').data).toBe(expected);
    map.sources.delete('shiokest-route'); map.writes.length = 0;
    render({ retryKey: 1 });
    expect(map.sources.get('shiokest-route')?.data).toEqual(expected);
    expect(map.sources.get('onemap').setTiles).toHaveBeenCalledTimes(1);
    map.render(); map.emit('sourcedata');
    expect(props.onStatusChange).toHaveBeenCalledWith('ready', undefined);
    expect(props.onStatusChange).toHaveBeenLastCalledWith('ready');
    expect(map.handlers.get('sourcedata')?.size).toBe(0);
    hooks.unmount(); expect(map.handlers.size).toBe(0);
  });
  it('gesture cancellation cannot time out or refit on a later optional update', async () => {
    await mount(); map.fitBounds.mockClear();
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    map.emit('movestart', { originalEvent: {} });
    render({ transitPois: { type: 'FeatureCollection', features: [] } });
    vi.runAllTimers(); expect(status).not.toHaveBeenCalled();
    expect(map.fitBounds).not.toHaveBeenCalled();
  });
  it('repeated recovery replaces listeners and detached callbacks stay inert after unmount', async () => {
    await mount();
    const stale: (() => void)[] = [];
    const staleRecovery: (() => void)[] = [];
    for (let retryKey = 1; retryKey <= 3; retryKey++) {
      stale.push(...map.handlers.get('render')!);
      staleRecovery.push(...(map.handlers.get('sourcedata') ?? []));
      render({ retryKey });
      expect(map.handlers.get('render')?.size).toBe(1);
      expect(map.handlers.get('sourcedata')?.size).toBe(1);
    }
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    stale.forEach(fn => fn()); expect(status).not.toHaveBeenCalled();
    map.render(); status.mockClear(); // A current visible route must not revive old retry callbacks.
    staleRecovery.forEach(fn => fn()); expect(status).not.toHaveBeenCalled();
    staleRecovery.push(...map.handlers.get('sourcedata')!);
    hooks.unmount(); stale.forEach(fn => fn()); staleRecovery.forEach(fn => fn()); vi.runAllTimers();
    expect(status).not.toHaveBeenCalled(); expect(map.handlers.size).toBe(0);
  });
});
