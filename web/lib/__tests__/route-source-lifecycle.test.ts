import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { PostalGeom } from '../types';
import { readPublishedFixture } from './fixtures/published-data';
import publishedOptions from './fixtures/published-options.json';
import { normalizePublishedTransitOptions } from '../published-transit-options';
import { publishedOptionGeometry } from '../published-walk-view';
import { publishedExposureSections, resolveMappedExposureFocus } from '../published-exposure-sections';
import { encodePolyline } from '../polyline';
import { overlayPadding } from '../map-viewport';

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
    replayEffects() {
      slots.forEach(s => {
        if ('cleanup' in s) { s.cleanup?.(); s.cleanup = undefined; s.deps = undefined; }
      });
    },
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
const lib = vi.hoisted(() => ({ instance: null as any, manifest: vi.fn(), construct: vi.fn() }));
vi.mock('maplibre-gl', () => ({ Map: class { constructor() { lib.construct(); return lib.instance; } }, Popup: class {}, setWorkerUrl: vi.fn(), addProtocol: vi.fn() }));
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
    getZoom: () => 16, getCanvas: () => ({ style: { cursor: '' }, setAttribute: vi.fn() }),
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
let map: ReturnType<typeof fakeMap>, props: Props, frames: (() => void)[], overlays: any[];
const container = { closest: () => ({ querySelectorAll: () => overlays }), getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 844 }) };
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
async function start() {
  render();
  await vi.dynamicImportSettled();
  for (let i = 0; i < 12; i++) await Promise.resolve();
}
async function mount() {
  await start();
  expect(map.handlers.get('load')?.size).toBe(1);
  map.emit('style.load'); map.emit('load'); render();
}
const routeWrites = () => map.writes.filter(w => routeIds.includes(w.id));
function mappedFixture() {
  const postal = '018956', bundle = 'fixture';
  const pool = normalizePublishedTransitOptions({
    postal, bundle, category: 'bus',
    score: publishedOptions['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === postal),
    geometry: publishedOptions['geom/h3/886520db39fffff.json'][0],
    scoreContext: { postal, bundle }, geometryContext: { postal, bundle },
  });
  const option = pool.options.find(row => row.selectionRef.kind === 'category_default')!;
  const model = publishedExposureSections(option, 'shiokest');
  const focus = resolveMappedExposureFocus(model, { contextKey: model.contextKey, sectionKey: model.sections[0].key })!;
  return { option, model, focus, geom: publishedOptionGeometry(postal, option)! };
}
beforeEach(() => {
  vi.useFakeTimers(); hooks.reset(); frames = []; overlays = []; map = fakeMap(); lib.instance = map;
  lib.manifest.mockReset().mockResolvedValue(null);
  lib.construct.mockReset();
  vi.stubGlobal('window', { location: { search: '' }, matchMedia: () => ({ matches: true }) });
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { frames.push(fn); return frames.length; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  const geom = readPublishedFixture<PostalGeom[]>('geom/h3/886520db39fffff.json').find(g => g.postal === '018956')!;
  props = { routes: [{ id: '018956', label: 'Published fixture', color: '#008f86', geom }], mode: 'shiokest', onStatusChange: vi.fn() };
});
afterEach(() => { hooks.unmount(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('M01/M08/M11: bounded map startup in the executed component', () => {
  it.each([true, false])('times out a silent startup with a selected walk=%s', async selected => {
    if (!selected) props = { ...props, routes: [] };
    await start();
    vi.advanceTimersByTime(29_999);
    expect(props.onStatusChange).toHaveBeenLastCalledWith('initializing');
    vi.advanceTimersByTime(1);
    expect(props.onStatusChange).toHaveBeenLastCalledWith('error', expect.stringContaining('Reload'), 'reload');
    expect(map.remove).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not mistake style.load for completed startup', async () => {
    await start();
    map.emit('style.load'); render();
    vi.advanceTimersByTime(30_000);
    expect(props.onStatusChange).toHaveBeenLastCalledWith('error', expect.stringContaining('Reload'), 'reload');
    expect(routeWrites()).toHaveLength(0);
  });

  it('cancels the startup deadline on load but waits for current route rendering', async () => {
    await mount();
    expect(props.onStatusChange).toHaveBeenLastCalledWith('initializing', undefined);
    map.render();
    expect(props.onStatusChange).toHaveBeenLastCalledWith('ready', undefined);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(props.onStatusChange).toHaveBeenLastCalledWith('ready', undefined);
    expect(map.remove).not.toHaveBeenCalled();
  });

  it('makes a pre-load worker failure terminal and ignores late events', async () => {
    await start();
    const lateLoad = [...map.handlers.get('load')!][0];
    const lateStyle = [...map.handlers.get('style.load')!][0];
    const lateError = [...map.handlers.get('error')!][0];
    map.emit('error', { sourceId: 'worker' });
    expect(props.onStatusChange).toHaveBeenLastCalledWith('error', expect.any(String), 'reload');
    expect(map.remove).toHaveBeenCalledTimes(1);
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    lateLoad(); lateStyle(); lateError({ sourceId: 'onemap' }); render();
    vi.advanceTimersByTime(60_000);
    expect(status).not.toHaveBeenCalled();
    expect(routeWrites()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retains a map that reaches load after a recoverable tile failure', async () => {
    await start();
    map.emit('error', { sourceId: 'onemap' });
    expect(props.onStatusChange).toHaveBeenLastCalledWith('partial', expect.any(String));
    expect(map.remove).not.toHaveBeenCalled();
    map.emit('style.load'); map.emit('load'); render(); map.render();
    expect(props.onStatusChange).toHaveBeenLastCalledWith('partial', expect.any(String));
    expect(routeWrites().map(w => w.id)).toEqual(routeIds);
    vi.advanceTimersByTime(60_000);
    expect(map.remove).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the startup deadline active after a tile failure that never settles', async () => {
    await start();
    vi.advanceTimersByTime(20_000);
    map.emit('error', { sourceId: 'onemap' });
    vi.advanceTimersByTime(10_000);
    expect(props.onStatusChange).toHaveBeenLastCalledWith('error', expect.stringContaining('Reload'), 'reload');
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('retries a pre-load tile failure using a fresh attempt before the deadline', async () => {
    await start();
    const failedMap = map;
    const lateLoad = [...failedMap.handlers.get('load')!][0];
    failedMap.emit('error', { sourceId: 'onemap' });
    map = fakeMap(); lib.instance = map;
    render({ retryKey: 1 });
    await mount(); map.render();
    expect(failedMap.remove).toHaveBeenCalledTimes(1);
    expect(props.onStatusChange).toHaveBeenLastCalledWith('ready', undefined);
    expect(lib.construct).toHaveBeenCalledTimes(2);
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    lateLoad(); vi.advanceTimersByTime(60_000);
    expect(status).not.toHaveBeenCalled();
    expect(map.remove).not.toHaveBeenCalled();
  });

  it('reports startup failure even if teardown throws and never repeats that teardown', async () => {
    await start();
    map.remove.mockImplementation(() => { throw Error('GPU context already gone'); });
    expect(() => vi.advanceTimersByTime(30_000)).not.toThrow();
    expect(props.onStatusChange).toHaveBeenLastCalledWith('error', expect.stringContaining('Reload'), 'reload');
    expect((window as unknown as { __shiokRouteMap: unknown }).__shiokRouteMap).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    hooks.unmount();
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('supports effect cleanup/setup replay with retained refs and a single owned map', async () => {
    await mount(); map.render();
    const previous = map;
    const lateLoad = [...previous.handlers.get('load')!][0];
    hooks.replayEffects();
    map = fakeMap(); lib.instance = map;
    await mount(); map.render();
    expect(previous.remove).toHaveBeenCalledTimes(1);
    expect(lib.construct).toHaveBeenCalledTimes(2);
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    lateLoad(); vi.advanceTimersByTime(60_000);
    expect(status).not.toHaveBeenCalled();
    hooks.unmount();
    expect(map.remove).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports a rejected constructor once without leaving a startup timer', async () => {
    lib.construct.mockImplementation(() => { throw Error('WebGL unavailable'); });
    await start();
    expect(props.onStatusChange).toHaveBeenLastCalledWith('error', expect.any(String), 'reload');
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    vi.advanceTimersByTime(60_000);
    expect(status).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('unmounts during import without constructing a map or reporting a late failure', async () => {
    render(); hooks.unmount();
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    await vi.dynamicImportSettled();
    vi.advanceTimersByTime(60_000);
    expect(lib.construct).not.toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('isolates attempt ownership across remounts without claiming a real worker pool reset', async () => {
    await start();
    const oldMap = map;
    const oldHandlers = ['load', 'style.load', 'error'].map(event => [...oldMap.handlers.get(event)!][0]);
    vi.advanceTimersByTime(30_000);
    expect(props.onStatusChange).toHaveBeenLastCalledWith('error', expect.any(String), 'reload');
    hooks.unmount(); hooks.reset();
    map = fakeMap(); lib.instance = map;
    await mount(); map.render();
    const status = props.onStatusChange as ReturnType<typeof vi.fn>; status.mockClear();
    oldHandlers.forEach(fn => fn({ sourceId: 'onemap' }));
    vi.advanceTimersByTime(60_000);
    expect(status).not.toHaveBeenCalled();
    expect(map.remove).not.toHaveBeenCalled();
    expect(oldMap.remove).toHaveBeenCalledTimes(1);
    expect(routeWrites().map(w => w.id)).toEqual(routeIds);
  });
});

describe('T07 mapped-section focus in the executed map component', () => {
  it('draws the exact validated line and fits its bounds with measured padding, then clear restores the walk', async () => {
    const { focus, geom, model } = mappedFixture();
    const panel = { left: 12, top: 12, right: 312, bottom: 330, edge: 'top-left' as const };
    overlays = [{ dataset: { mapOverlay: panel.edge }, getBoundingClientRect: () => panel }];
    props = { ...props, routes: [{ ...props.routes[0], geom }], mappedExposureContextKey: model.contextKey };
    await mount();
    const wholeWalkFit = structuredClone(map.fitBounds.mock.calls.at(-1));
    expect(wholeWalkFit![1].padding).toEqual(overlayPadding(390, 844, [panel]));
    map.writes.length = 0; map.fitBounds.mockClear();
    render({ focusedExposureGap: focus });
    const coordinates = focus.points.map(([lat, lon]) => [lon, lat]);
    expect(map.sources.get('active-exposure-gap').data.features).toEqual([
      expect.objectContaining({ geometry: { type: 'LineString', coordinates }, properties: expect.objectContaining({ key: focus.key }) }),
    ]);
    expect(map.layers.get('active-exposure-section-line')).toMatchObject({ type: 'line', source: 'active-exposure-gap' });
    expect(map.layers.get('active-exposure-section-casing')).toMatchObject({ type: 'line', source: 'active-exposure-gap' });
    expect(map.fitBounds).toHaveBeenCalledExactlyOnceWith([
      [Math.min(...coordinates.map(p => p[0])), Math.min(...coordinates.map(p => p[1]))],
      [Math.max(...coordinates.map(p => p[0])), Math.max(...coordinates.map(p => p[1]))],
    ], wholeWalkFit![1]);
    expect(map.easeTo).not.toHaveBeenCalled();
    expect(map.writes.map(w => w.id)).toEqual(['active-exposure-gap']);
    map.writes.length = 0; map.fitBounds.mockClear();
    render({ focusedExposureGap: null });
    expect(map.writes.map(w => w.id)).toEqual(['active-exposure-gap']);
    expect(map.sources.get('active-exposure-gap').data.features).toEqual([]);
    expect(map.fitBounds).toHaveBeenCalledExactlyOnceWith(...wholeWalkFit!);
  });

  it('equivalent focus objects and optional renders do not rewrite sources or snap back after a gesture', async () => {
    const { focus, geom, model } = mappedFixture();
    props = { ...props, routes: [{ ...props.routes[0], geom }], mappedExposureContextKey: model.contextKey, focusedExposureGap: focus };
    await mount(); map.emit('movestart', { originalEvent: {} });
    map.writes.length = 0; map.fitBounds.mockClear(); map.easeTo.mockClear();
    render({ focusedExposureGap: structuredClone(focus) });
    expect(map.writes).toEqual([]);
    render({ transitPois: { type: 'FeatureCollection', features: [] } });
    expect(map.writes.map(w => w.id)).toEqual(['transit-pois']);
    expect(map.fitBounds).not.toHaveBeenCalled(); expect(map.easeTo).not.toHaveBeenCalled();
  });

  it.each(['context', 'missing-context', 'shortest', 'no-route', 'other-geometry', 'other-base', 'foreign-points', 'foreign-encoding', 'length', 'nan', 'degenerate'])('rejects stale/foreign mapped focus: %s', async mutation => {
    const { focus, geom, model } = mappedFixture();
    props = { ...props, routes: [{ ...props.routes[0], geom }], mappedExposureContextKey: model.contextKey, focusedExposureGap: focus };
    await mount();
    expect(map.sources.get('active-exposure-gap').data.features[0]?.geometry.type).toBe('LineString');
    map.writes.length = 0;
    if (mutation === 'context') render({ mappedExposureContextKey: 'different-current-selection' });
    if (mutation === 'missing-context') render({ mappedExposureContextKey: null });
    if (mutation === 'shortest') render({ mode: 'shortest' });
    if (mutation === 'no-route') render({ routes: [] });
    if (mutation === 'other-geometry') render({ routes: [{ ...props.routes[0], geom: { ...geom, exposure_gaps: [] } }] });
    if (mutation === 'other-base') render({ routes: [{ ...props.routes[0], geom: { ...geom,
      sheltered: '', sheltered_parts: [encodePolyline([[1.3, 103.8], [1.301, 103.801]])], route_segments: undefined } }] });
    if (mutation === 'foreign-points') render({ focusedExposureGap: { ...focus, points: [[89, 170], [89.1, 170.1]] } });
    if (mutation === 'foreign-encoding') render({ focusedExposureGap: { ...focus, encoded: encodePolyline([[89, 170], [89.1, 170.1]]) } });
    if (mutation === 'length') render({ focusedExposureGap: { ...focus, lengthM: focus.lengthM + 1 } });
    if (mutation === 'nan') render({ focusedExposureGap: { ...focus, points: [[Number.NaN, 103.86], [1.28, 103.861]] } });
    if (mutation === 'degenerate') render({ focusedExposureGap: { ...focus, points: [focus.points[0], focus.points[0]] } });
    expect(map.sources.get('active-exposure-gap').data.features).toEqual([]);
    expect((window as any).__shiokRouteDebug.summary).not.toContain('Selected mapped exposed section');
  });

  it('allows sheltered focus in both mode and clears it when switching to shortest only', async () => {
    const { option, geom } = mappedFixture();
    const model = publishedExposureSections(option, 'both');
    const focus = resolveMappedExposureFocus(model, { contextKey: model.contextKey, sectionKey: model.sections[0].key })!;
    props = { ...props, mode: 'both', routes: [{ ...props.routes[0], geom }], mappedExposureContextKey: model.contextKey, focusedExposureGap: focus };
    await mount();
    expect(map.sources.get('active-exposure-gap').data.features[0]?.geometry.type).toBe('LineString');
    render({ mode: 'shortest' });
    expect(map.sources.get('active-exposure-gap').data.features).toEqual([]);
  });

  it('keeps mapped focus on surviving sheltered pieces when shortest is partial and the option is not retainable', async () => {
    const { option } = mappedFixture();
    const partial = structuredClone(option);
    partial.geometry.shortest.status = 'partial'; partial.geometry.shortest.signature = null;
    partial.geometry.shortest.parts = partial.geometry.shortest.parts.slice(0, 1);
    partial.retainable = false;
    const model = publishedExposureSections(partial, 'shiokest');
    const focus = resolveMappedExposureFocus(model, { contextKey: model.contextKey, sectionKey: model.sections[0].key })!;
    props = { ...props, routes: [{ ...props.routes[0], geom: publishedOptionGeometry('018956', partial)! }],
      mappedExposureContextKey: model.contextKey, focusedExposureGap: focus };
    await mount();
    expect(map.sources.get('active-exposure-gap').data.features[0]?.geometry.type).toBe('LineString');
    expect(map.sources.get('active-exposure-gap').data.features[0]?.geometry.coordinates).toEqual(focus.points.map(([lat, lon]) => [lon, lat]));
  });

  it('restores current line focus after style recreation without mutating readonly points', async () => {
    const { focus, geom, model } = mappedFixture();
    for (const point of focus.points) Object.freeze(point);
    Object.freeze(focus.points); Object.freeze(focus);
    props = { ...props, routes: [{ ...props.routes[0], geom }], mappedExposureContextKey: model.contextKey, focusedExposureGap: focus };
    await mount();
    const expected = structuredClone(map.sources.get('active-exposure-gap').data);
    expect(expected.features[0]?.geometry.type).toBe('LineString');
    for (const id of allIds) map.sources.delete(id);
    map.layers.clear(); map.writes.length = 0;
    map.emit('style.load'); render();
    expect(map.sources.get('active-exposure-gap').data).toEqual(expected);
    expect(map.layers.get('active-exposure-section-line')).toBeDefined();
  });
});

describe('M05/M10/M11: source ownership in the executed map component', () => {
  it('keeps the basemap usable with no selected walk instead of reporting missing geometry', async () => {
    props = { ...props, routes: [] };
    await mount();
    expect(map.handlers.get('load')?.size).toBe(1);
    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(props.onStatusChange).toHaveBeenLastCalledWith('idle', undefined);
    expect((props.onStatusChange as ReturnType<typeof vi.fn>).mock.calls.some(([status]) => status === 'error')).toBe(false);
  });
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
