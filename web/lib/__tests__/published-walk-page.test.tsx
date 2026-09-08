import React, { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteEvidenceMap } from '../../components/route-evidence-map';
import type { PostalGeom, ScoreRecord, TransitAccessMode, TransitPoiCollection } from '../types';
import fixture from './fixtures/published-options.json';
import { decodePolyline } from '../polyline';

// Deterministic Home-only hook host: run dependency-bound effects and cleanups,
// retain actual page handlers, and batch their updates between explicit renders.
// Child rendering/React DOM/MapLibre and browser scheduling are not simulated.
const host = vi.hoisted(() => {
  type Slot = {
    value?: unknown;
    deps?: readonly unknown[];
    setter?: (update: unknown) => void;
    effect?: () => void | (() => void);
    cleanup?: () => void;
  };
  let index = 0;
  let generation = 0;
  let dirty = false;
  const slots: Slot[] = [];
  const pending = new Set<number>();
  const changed = (a?: readonly unknown[], b?: readonly unknown[]) =>
    !a || !b || a.length !== b.length || b.some((value, i) => !Object.is(value, a[i]));
  function memo<T>(make: () => T, deps: readonly unknown[]): T {
    const i = index++;
    const previous = slots[i];
    if (!previous || changed(previous.deps, deps)) slots[i] = { value: make(), deps };
    return slots[i].value as T;
  }
  return {
    begin() { index = 0; dirty = false; },
    isDirty() { return dirty; },
    reset() {
      generation++;
      for (const slot of slots) slot.cleanup?.();
      slots.length = 0;
      pending.clear();
      index = 0;
      dirty = false;
    },
    commitEffects() {
      const scheduled = [...pending];
      pending.clear();
      for (const i of scheduled) {
        const slot = slots[i];
        slot.cleanup?.();
        slot.cleanup = slot.effect?.() || undefined;
      }
    },
    useState<T>(initial: T | (() => T)): [T, (update: T | ((value: T) => T)) => void] {
      const i = index++;
      if (!slots[i]) {
        const ownedGeneration = generation;
        const slot: Slot = { value: typeof initial === 'function' ? (initial as () => T)() : initial };
        slot.setter = update => {
          if (generation !== ownedGeneration) return;
          const value = typeof update === 'function' ? (update as (value: T) => T)(slot.value as T) : update;
          if (!Object.is(value, slot.value)) { slot.value = value; dirty = true; }
        };
        slots[i] = slot;
      }
      return [slots[i].value as T, slots[i].setter!];
    },
    useRef<T>(initial: T): { current: T } {
      const i = index++;
      slots[i] ??= { value: { current: initial } };
      return slots[i].value as { current: T };
    },
    useMemo: memo,
    useCallback<T>(callback: T, deps: readonly unknown[]) { return memo(() => callback, deps); },
    useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
      const i = index++;
      const previous = slots[i];
      if (!previous || changed(previous.deps, deps)) {
        slots[i] = { ...previous, deps, effect };
        pending.add(i);
      }
    },
  };
});

const dependencies = vi.hoisted(() => ({
  MapChild: function MapChild() { return null; },
  fetchScoreForPostal: vi.fn(), fetchGeomForPostal: vi.fn(), fetchManifest: vi.fn(),
  fetchTransitPois: vi.fn(), fetchTransitPoisForGeom: vi.fn(), fetchRankRecordsForPostalArea: vi.fn(),
}));
vi.mock('react', async original => {
  const actual = await original<typeof import('react')>();
  const hooks = {
    useState: host.useState, useRef: host.useRef, useMemo: host.useMemo,
    useCallback: host.useCallback, useEffect: host.useEffect,
  };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});
vi.mock('next/dynamic', () => ({ default: () => dependencies.MapChild }));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('maplibre-gl', () => ({}));
vi.mock('../../components/route-evidence-map', () => ({ RouteEvidenceMap: dependencies.MapChild }));
vi.mock('../service-worker-cache', () => ({ requestServiceWorkerCache: vi.fn() }));
vi.mock('../data', async () => {
  const data = (await import('./fixtures/published-options.json')).default;
  return {
    ...dependencies,
    DATA_BASE: '/data/generated_20260805_prefer_scored_routed',
    PINNED_DATA_MANIFEST: data['manifest.json'],
  };
});

import Home, { ScoreCard } from '../../app/page';
import { WalkSummary, walkMetrics } from '../../components/walk-summary';
import { TransitStopPicker } from '../../components/transit-stop-picker';

type Element = ReactElement<Record<string, unknown> & { children?: ReactNode }>;
type MapProps = ComponentProps<typeof RouteEvidenceMap>;
type SummaryProps = ComponentProps<typeof WalkSummary>;
type PickerProps = ComponentProps<typeof TransitStopPicker>;
const A = '018956';
const B = '079908';
const originalScore = fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === A)!;
const originalGeometry = fixture['geom/h3/886520db39fffff.json'][0];
const clone = <T,>(value: T): T => structuredClone(value);
function freeze(value: unknown): void {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze);
  Object.freeze(value);
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
let scores: Map<string, ReturnType<typeof deferred<ScoreRecord | null>>>;
let geometries: Map<string, ReturnType<typeof deferred<PostalGeom | null>>>;
let poiGate: ReturnType<typeof deferred<TransitPoiCollection>>;
let tree: ReactNode;
let url: URL;
let fetchSpy: ReturnType<typeof vi.fn>;
let storageRead: ReturnType<typeof vi.fn>;
let replaceState: ReturnType<typeof vi.fn>;
let sourceScore: ScoreRecord;
let sourceGeometry: PostalGeom;
let approvedPreviews: Array<{
  response: ReturnType<typeof deferred<Response>>;
  target: { lat: number; lng: number };
  consumed: boolean;
}>;
const previewStopId = 'mrt:synthetic-preview-only';
const previewTarget = { lat: 1.281234, lng: 103.860123 };

function allowPreview() {
  const response = deferred<Response>();
  approvedPreviews.push({ response, target: previewTarget, consumed: false });
  return response;
}

function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (React.isValidElement<Element['props']>(node)) return nodeText(node.props.children);
  return '';
}

async function clickPageButton(label: string) {
  const matches = elements(tree).filter(element => element.type === 'button' && nodeText(element) === label);
  expect(matches).toHaveLength(1);
  (matches[0].props.onClick as () => void)();
  render();
  await settle();
}

async function previewReady() {
  await loadA();
  await setMode('mrt_lrt');
  storageRead.mockReturnValue(null);
  // A deliberately synthetic, unpublished POI enables the real preview handler.
  // Published metrics/geometry still come exclusively from the unchanged fixture.
  poiGate.resolve({ type: 'FeatureCollection', features: [{ type: 'Feature',
    geometry: { type: 'Point', coordinates: [previewTarget.lng, previewTarget.lat] },
    properties: { id: previewStopId, kind: 'mrt_exit', name: 'Synthetic preview-only exit' },
  }] });
  await settle();
  expect(fetchSpy).not.toHaveBeenCalled();
  return { summary: clone(summary()), routes: clone(map().routes) };
}

async function startPreview() {
  map().onSelectTransitStop!(previewStopId);
  render();
  await settle();
  expect(nodeText(tree)).toContain('Loading walking preview. Published walk shown.');
}

function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Element['props']>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function child<P>(type: unknown): ReactElement<P> {
  const matches = elements(tree).filter(element => element.type === type);
  expect(matches).toHaveLength(1);
  return matches[0] as ReactElement<P>;
}
const map = () => child<MapProps>(dependencies.MapChild).props;
const summary = () => child<SummaryProps>(WalkSummary).props;
const picker = () => child<PickerProps>(TransitStopPicker).props;

function render() {
  for (let attempt = 0; attempt < 40; attempt++) {
    host.begin();
    tree = Home();
    host.commitEffects();
    if (!host.isDirty()) return;
  }
  throw new Error('Home effects did not settle within 40 renders');
}
async function settle() {
  // Includes Promise.all, geometry continuation, POI continuation and effect rerenders.
  for (let turn = 0; turn < 30; turn++) {
    await Promise.resolve();
    if (host.isDirty()) render();
  }
}
function mount(search = '') {
  url = new URL(`https://example.test/${search}`);
  render();
}
function inputPostal(postal: string) {
  const input = elements(tree).find(element => element.type === 'input' && element.props.id === 'postal-search-input')!;
  expect(input).toBeDefined();
  (input.props.onChange as (event: unknown) => void)({ target: { value: postal } });
  render();
}
function submit(postal: string) {
  inputPostal(postal);
  const form = elements(tree).find(element => element.type === 'form')!;
  const promise = (form.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault: vi.fn() });
  render();
  return promise;
}
function modeControl() {
  const controls = elements(tree).filter(element => typeof element.type === 'function' &&
    typeof element.props.setMode === 'function' && element.props.score !== undefined);
  expect(controls).toHaveLength(1);
  return controls[0];
}
async function setMode(mode: TransitAccessMode) {
  const control = modeControl();
  const controlTree = (control.type as (props: typeof control.props) => ReactNode)(control.props);
  const button = elements(controlTree).find(element => element.type === 'button' && element.key === mode)!;
  expect(button).toBeDefined();
  (button.props.onClick as () => void)();
  render();
  await settle();
}
async function setRouteMode(mode: 'shiokest' | 'shortest' | 'both') {
  const controls = elements(tree).filter(element => typeof element.type === 'function' &&
    typeof element.props.setMode === 'function' && typeof element.props.sameRoute === 'boolean');
  expect(controls).toHaveLength(1);
  const control = controls[0];
  const controlTree = (control.type as (props: typeof control.props) => ReactNode)(control.props);
  const label = { shiokest: 'Sheltered walk', shortest: 'Shortest walk', both: 'Both walks' }[mode];
  const button = elements(controlTree).find(element => element.type === 'button' && nodeText(element) === label)!;
  expect(button).toBeDefined();
  expect(button.props.disabled).toBe(false);
  (button.props.onClick as () => void)();
  render();
  await settle();
}
async function choose(alias: string) {
  const option = picker().selection.choices.find(choice => choice.option.aliases.includes(alias))?.option;
  expect(option, `Missing published choice ${alias}`).toBeDefined();
  picker().onSelect(option!.key);
  render();
  await settle();
}
async function loadA(search = '') {
  mount(search);
  const submitted = search ? null : submit(A);
  scores.get(A)!.resolve(sourceScore);
  geometries.get(A)!.resolve(sourceGeometry);
  await settle();
  if (submitted) await submitted;
}
function assertCoherent(name: string, distance: number, covered: number, encodedParts: string[]) {
  const shown = summary();
  expect(shown.postal).toBe(A);
  expect(shown.option?.name).toBe(name);
  expect(shown.option?.metrics.sheltered_m).toMatchObject({ status: 'valid', value: distance });
  expect(shown.option?.metrics.covered_ratio).toMatchObject({ status: 'valid', value: covered });
  expect(walkMetrics(shown.score, shown.shortest, shown.option)).toMatchObject({ distance, coverage: Math.round(covered * 100) });
  expect(map().routes).toHaveLength(1);
  expect(map().routes[0].geom.postal).toBe(A);
  expect(map().routes[0].geom.sheltered_parts).toEqual(encodedParts);
  const selection = picker().selection;
  expect(selection.choices.length).toBeLessThanOrEqual(3);
  expect(new Set(selection.choices.map(choice => choice.option.key)).size).toBe(selection.choices.length);
  expect(selection.selectedKey).toBe(shown.option?.key);
}

beforeEach(() => {
  host.reset();
  vi.clearAllMocks();
  scores = new Map([A, B].map(postal => [postal, deferred<ScoreRecord | null>()]));
  geometries = new Map([A, B].map(postal => [postal, deferred<PostalGeom | null>()]));
  poiGate = deferred<TransitPoiCollection>();
  sourceScore = clone(originalScore) as unknown as ScoreRecord;
  sourceGeometry = clone(originalGeometry) as unknown as PostalGeom;
  freeze(sourceScore);
  freeze(sourceGeometry);
  dependencies.fetchScoreForPostal.mockImplementation((postal: string) => scores.get(postal)!.promise);
  dependencies.fetchGeomForPostal.mockImplementation((postal: string) => geometries.get(postal)!.promise);
  dependencies.fetchTransitPoisForGeom.mockImplementation(() => poiGate.promise);
  dependencies.fetchTransitPois.mockResolvedValue({ type: 'FeatureCollection', features: [] });
  dependencies.fetchRankRecordsForPostalArea.mockResolvedValue([]);
  dependencies.fetchManifest.mockResolvedValue(fixture['manifest.json']);
  approvedPreviews = [];
  fetchSpy = vi.fn((input: RequestInfo | URL) => {
    const request = new URL(input instanceof Request ? input.url : String(input), url);
    const approved = approvedPreviews.find(item => !item.consumed &&
      request.origin === url.origin && request.pathname === '/api/onemap-route' &&
      request.searchParams.get('endLat') === item.target.lat.toFixed(6) &&
      request.searchParams.get('endLng') === item.target.lng.toFixed(6));
    if (!approved) return Promise.reject(new Error(`Unapproved network request: ${request.href}`));
    expect([...request.searchParams.keys()].sort()).toEqual(['endLat', 'endLng', 'startLat', 'startLng']);
    expect(Number.isFinite(Number(request.searchParams.get('startLat')))).toBe(true);
    expect(Number.isFinite(Number(request.searchParams.get('startLng')))).toBe(true);
    approved.consumed = true;
    return approved.response.promise;
  });
  // An available valid persisted preview must not override published evidence.
  storageRead = vi.fn(() => JSON.stringify({ cached_at: Date.now(), payload: {
    ok: true, route_geometry: originalGeometry.shortest, total_distance_m: 9999,
  } }));
  url = new URL('https://example.test/');
  replaceState = vi.fn((_state, _title, next: string) => { url = new URL(next, url); });
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('window', {
    location: { get href() { return url.href; }, get search() { return url.search; }, get hash() { return url.hash; } },
    history: { replaceState },
    localStorage: { getItem: storageRead, setItem: vi.fn(), removeItem: vi.fn(), key: vi.fn(), length: 0 },
  });
});
afterEach(() => {
  try {
    // Tests must explicitly authorize every preview request, including retries.
    // No duplicate, background fan-out or unrelated API request is silently allowed.
    expect(fetchSpy).toHaveBeenCalledTimes(approvedPreviews.length);
    expect(approvedPreviews.every(request => request.consumed)).toBe(true);
    expect(sourceScore).toEqual(originalScore);
    expect(sourceGeometry).toEqual(originalGeometry);
    expect(dependencies.fetchRankRecordsForPostalArea).not.toHaveBeenCalled();
  } finally {
    host.reset();
    vi.unstubAllGlobals();
  }
});

describe('Home published-walk integration through actual handlers', () => {
  it('keeps an existing postal summary and category controls without a null-score legacy card for an unavailable category', async () => {
    // Synthetic omission: retain the real top-level bus record and geometry,
    // but remove every MRT score source. Orphan geometry cannot create an option.
    const busOnlyScore = clone(originalScore) as unknown as ScoreRecord;
    delete busOnlyScore.route_options!.mrt_lrt;
    busOnlyScore.candidates = busOnlyScore.candidates!.filter(candidate => candidate.node_type !== 'mrt_lrt_exit');
    const before = clone(busOnlyScore);
    freeze(busOnlyScore);
    mount();
    const submitted = submit(A);
    scores.get(A)!.resolve(busOnlyScore);
    geometries.get(A)!.resolve(sourceGeometry);
    await settle();
    await submitted;
    const originalCard = child<ComponentProps<typeof ScoreCard>>(ScoreCard);
    expect(originalCard.props.selection?.score).not.toBeNull();
    expect(modeControl().props.score).toBe(busOnlyScore);

    await setMode('mrt_lrt');
    expect(summary().postal).toBe(A);
    expect(summary().score).toBeNull();
    expect(summary().option).toBeNull();
    expect(modeControl().props.mode).toBe('mrt_lrt');
    expect(modeControl().props.score).toBe(busOnlyScore);
    expect(picker().selection.choices).toHaveLength(0);
    expect(map().routes).toHaveLength(0);
    expect(elements(tree).filter(element => element.type === ScoreCard)).toHaveLength(0);
    const summaryText = nodeText(WalkSummary(summary()));
    expect(summaryText).toContain('No published walk is available for this destination.');
    expect(summaryText).not.toContain('outside');
    expect(nodeText(tree)).not.toContain('No full score is recorded for this alternative walk.');

    await setMode('bus');
    assertCoherent('Bayfront Stn Exit B/MBS', 81.2, 0.551, originalGeometry.route_options.bus.sheltered_parts);
    expect(child<ComponentProps<typeof ScoreCard>>(ScoreCard).props.selection?.score).not.toBeNull();
    expect(busOnlyScore).toEqual(before);
    expect(storageRead).not.toHaveBeenCalled();
  });

  it('loads text independently, then renders the matching published default once deferred geometry arrives', async () => {
    mount();
    const submitted = submit(A);
    expect(dependencies.fetchScoreForPostal).toHaveBeenCalledExactlyOnceWith(A);
    expect(dependencies.fetchGeomForPostal).toHaveBeenCalledWith(A, undefined, undefined);
    scores.get(A)!.resolve(sourceScore);
    await settle();
    expect(summary().postal).toBe(A);
    expect(map().routes).toHaveLength(0);
    expect(dependencies.fetchTransitPoisForGeom).not.toHaveBeenCalled();
    geometries.get(A)!.resolve(sourceGeometry);
    await settle();
    await submitted;
    assertCoherent('Bayfront Stn Exit B/MBS', 81.2, 0.551, originalGeometry.route_options.bus.sheltered_parts);
    expect(storageRead).not.toHaveBeenCalled();
  });

  it('MRT -> candidate C -> bus -> MRT preserves original candidates and coherent summary/map values', async () => {
    await loadA();
    await setMode('mrt_lrt');
    assertCoherent('BAYFRONT MRT STATION Exit E', 308.4, 0.241, originalGeometry.route_options.mrt_lrt.sheltered_parts);
    await choose('mrt:21624');
    assertCoherent('BAYFRONT MRT STATION Exit C', 109.2, 0, originalGeometry.candidates['mrt:21624'].sheltered_parts);
    expect(summary().score).toBeNull();
    expect(url.searchParams.get('stop')).toBe('mrt:21624');
    expect(url.searchParams.get('transit')).toBe('mrt_lrt');
    await setMode('bus');
    assertCoherent('Bayfront Stn Exit B/MBS', 81.2, 0.551, originalGeometry.route_options.bus.sheltered_parts);
    await setMode('mrt_lrt');
    assertCoherent('BAYFRONT MRT STATION Exit E', 308.4, 0.241, originalGeometry.route_options.mrt_lrt.sheltered_parts);
    await choose('mrt:21624');
    assertCoherent('BAYFRONT MRT STATION Exit C', 109.2, 0, originalGeometry.candidates['mrt:21624'].sheltered_parts);
    expect(dependencies.fetchGeomForPostal).toHaveBeenCalledTimes(1);
    expect(storageRead).not.toHaveBeenCalled();
  });

  it('resets to category-only Exit E with transit=mrt_lrt and no synthetic stop URL', async () => {
    await loadA();
    await setMode('mrt_lrt');
    const declaredKey = picker().selection.defaultKey;
    await choose('mrt:21624');
    picker().onSelect(null);
    render();
    await settle();
    expect(picker().selection.selectedKey).toBe(declaredKey);
    expect(summary().option?.selectionRef).toEqual({ kind: 'category_default', category: 'mrt_lrt' });
    assertCoherent('BAYFRONT MRT STATION Exit E', 308.4, 0.241, originalGeometry.route_options.mrt_lrt.sheltered_parts);
    expect(url.searchParams.get('postal')).toBe(A);
    expect(url.searchParams.get('transit')).toBe('mrt_lrt');
    expect(url.searchParams.has('stop')).toBe(false);
    expect(url.href).not.toContain('pw');
  });

  it('map stop callbacks select a published candidate and update category and URL without POIs or preview fetch', async () => {
    await loadA();
    map().onSelectTransitStop!('mrt:21624');
    render();
    await settle();
    expect(modeControl().props.mode).toBe('mrt_lrt');
    expect(map().chosenStopId).toBe('mrt:21624');
    assertCoherent('BAYFRONT MRT STATION Exit C', 109.2, 0, originalGeometry.candidates['mrt:21624'].sheltered_parts);
    expect(url.searchParams.get('transit')).toBe('mrt_lrt');
    expect(url.searchParams.get('stop')).toBe('mrt:21624');
    map().onSelectTransitStop!('bus:03511');
    render();
    await settle();
    expect(modeControl().props.mode).toBe('bus');
    assertCoherent('Aft Bayfront Stn Exit E', 180.2, 0, originalGeometry.candidates['bus:03511'].sheltered_parts);
    expect(url.searchParams.get('transit')).toBe('bus');
    expect(url.searchParams.get('stop')).toBe('bus:03511');
    expect(storageRead).not.toHaveBeenCalled();
  });

  it('ignores a stale/wrong-category canonical picker key instead of changing the map or URL', async () => {
    await loadA();
    await setMode('mrt_lrt');
    const before = { option: summary().option, routes: map().routes, href: url.href };
    picker().onSelect(JSON.stringify(['pw', 1, 'other-bundle', A, 'bus', 'candidate', 'bus:03511']));
    render();
    await settle();
    expect(summary().option).toEqual(before.option);
    expect(map().routes).toEqual(before.routes);
    expect(url.href).toBe(before.href);
  });

  it('restores a published candidate URL before optional POIs arrive', async () => {
    await loadA(`?postal=${A}&transit=mrt_lrt&stop=mrt%3A21624`);
    assertCoherent('BAYFRONT MRT STATION Exit C', 109.2, 0, originalGeometry.candidates['mrt:21624'].sheltered_parts);
    expect(modeControl().props.mode).toBe('mrt_lrt');
    expect(url.searchParams.get('stop')).toBe('mrt:21624');
    expect(storageRead).not.toHaveBeenCalled();
  });

  it('unknown stop URL cannot select a walk and is removed after optional POIs settle', async () => {
    await loadA(`?postal=${A}&transit=mrt_lrt&stop=unknown-stop`);
    poiGate.resolve({ type: 'FeatureCollection', features: [] });
    await settle();
    assertCoherent('BAYFRONT MRT STATION Exit E', 308.4, 0.241, originalGeometry.route_options.mrt_lrt.sheltered_parts);
    expect(url.searchParams.has('stop')).toBe(false);
    expect(url.searchParams.get('transit')).toBe('mrt_lrt');
    expect(storageRead).not.toHaveBeenCalled();
  });

  it('a URL explicitly asking for bus must not restore an MRT stop after delayed POI arrival', async () => {
    await loadA(`?postal=${A}&transit=bus&stop=mrt%3A21624`);
    // Optional POIs carry real fixture identities and endpoint coordinates only;
    // they do not supply ranking, geometry or metrics to the published selector.
    const points = decodePolyline(originalGeometry.candidates['mrt:21624'].sheltered_parts[0]);
    const [lat, lon] = points[points.length - 1];
    poiGate.resolve({ type: 'FeatureCollection', features: [{ type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: { id: 'mrt:21624', kind: 'mrt_exit', name: 'BAYFRONT MRT STATION Exit C' },
    }] });
    await settle();
    expect(modeControl().props.mode).toBe('bus');
    assertCoherent('Bayfront Stn Exit B/MBS', 81.2, 0.551, originalGeometry.route_options.bus.sheltered_parts);
    expect(url.searchParams.has('stop')).toBe(false);
    expect(url.searchParams.get('transit')).toBe('bus');
  });

  it('late postal A geometry cannot overwrite the newer postal B result', async () => {
    mount();
    const a = submit(A);
    scores.get(A)!.resolve(sourceScore);
    await settle();
    expect(summary().postal).toBe(A);
    const b = submit(B);
    const bScore = clone(fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === B)) as unknown as ScoreRecord;
    freeze(bScore);
    scores.get(B)!.resolve(bScore);
    geometries.get(B)!.resolve(null);
    await settle();
    await b;
    expect(summary().postal).toBe(B);
    expect(map().routes).toHaveLength(0);
    geometries.get(A)!.resolve(sourceGeometry);
    await settle();
    await a;
    expect(summary().postal).toBe(B);
    expect(map().routes).toHaveLength(0);
    expect(url.searchParams.get('postal')).toBe(B);
    expect(picker().selection.choices).toHaveLength(0);
  });
});

describe('Home explicit preview failure and stale-response boundaries', () => {
  it.each(['transport', 'non-ok-payload', 'invalid-json'] as const)(
    'keeps published metrics/geometry on %s failure and resets without another request', async failure => {
      const baseline = await previewReady();
      const request = allowPreview();
      await startPreview();
      expect(summary()).toEqual(baseline.summary);
      expect(map().routes).toEqual(baseline.routes);
      if (failure === 'transport') request.reject(new Error('Synthetic preview transport failure'));
      else if (failure === 'non-ok-payload') request.resolve(Response.json({ ok: false }, { status: 503 }));
      else request.resolve(new Response('not JSON', { status: 200 }));
      await settle();
      expect(nodeText(tree)).toContain('Walking preview unavailable. Published walk shown.');
      expect(nodeText(tree)).toContain('Retry preview');
      expect(summary()).toEqual(baseline.summary);
      expect(map().routes).toEqual(baseline.routes);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      await clickPageButton('Keep published walk');
      expect(nodeText(tree)).not.toContain('Walking preview unavailable.');
      expect(url.searchParams.has('stop')).toBe(false);
      expect(url.searchParams.get('transit')).toBe('mrt_lrt');
      expect(summary()).toEqual(baseline.summary);
      expect(map().routes).toEqual(baseline.routes);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    },
  );

  it('does not automatically retry a failed preview; explicit Retry preview permits exactly one additional request', async () => {
    const baseline = await previewReady();
    const first = allowPreview();
    await startPreview();
    first.resolve(Response.json({ ok: false }, { status: 503 }));
    await settle();
    render();
    await settle();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const second = allowPreview();
    await clickPageButton('Retry preview');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(nodeText(tree)).toContain('Loading walking preview. Published walk shown.');
    second.resolve(Response.json({ ok: false }, { status: 503 }));
    await settle();
    expect(summary()).toEqual(baseline.summary);
    expect(map().routes).toEqual(baseline.routes);
    expect(nodeText(tree)).toContain('Walking preview unavailable. Published walk shown.');
  });

  it('positive control: the same successful payload can create a labelled preview when the request is current', async () => {
    await previewReady();
    const request = allowPreview();
    await startPreview();
    request.resolve(Response.json({ ok: true,
      route_geometry: originalGeometry.candidates['mrt:21624'].sheltered_parts[0],
      total_distance_m: 109.2,
    }));
    await settle();
    expect(summary().option).toBeUndefined();
    expect(summary().score?.best_node?.name).toBe('Synthetic preview-only exit');
    expect(summary().score?.provenance).toMatchObject({ source: 'live_onemap_preview', authoritative_score: false });
    expect(map().routes).toHaveLength(1);
    expect(nodeText(tree)).not.toContain('Loading walking preview.');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it.each(['success', 'rejection'] as const)(
    'ignores late preview %s after selecting published candidate C', async outcome => {
      await previewReady();
      const request = allowPreview();
      await startPreview();
      await choose('mrt:21624');
      assertCoherent('BAYFRONT MRT STATION Exit C', 109.2, 0, originalGeometry.candidates['mrt:21624'].sheltered_parts);
      const selected = { summary: clone(summary()), routes: clone(map().routes), href: url.href };
      if (outcome === 'success') request.resolve(Response.json({ ok: true,
        route_geometry: originalGeometry.candidates['mrt:21624'].sheltered_parts[0], total_distance_m: 109.2,
      }));
      else request.reject(new Error('Synthetic stale preview failure'));
      await settle();
      expect(summary()).toEqual(selected.summary);
      expect(map().routes).toEqual(selected.routes);
      expect(url.href).toBe(selected.href);
      expect(nodeText(tree)).not.toContain('Walking preview unavailable.');
      expect(nodeText(tree)).not.toContain('Loading walking preview.');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    },
  );

  it('a late successful preview for postal A cannot replace postal B or repopulate its map', async () => {
    await previewReady();
    const request = allowPreview();
    await startPreview();
    const submitted = submit(B);
    const bScore = clone(fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === B)) as unknown as ScoreRecord;
    freeze(bScore);
    scores.get(B)!.resolve(bScore);
    geometries.get(B)!.resolve(null);
    await settle();
    await submitted;
    expect(summary().postal).toBe(B);
    request.resolve(Response.json({ ok: true,
      route_geometry: originalGeometry.candidates['mrt:21624'].sheltered_parts[0], total_distance_m: 109.2,
    }));
    await settle();
    expect(summary().postal).toBe(B);
    expect(summary().score?.provenance?.source).not.toBe('live_onemap_preview');
    expect(map().routes).toHaveLength(0);
    expect(url.searchParams.get('postal')).toBe(B);
    expect(url.searchParams.has('stop')).toBe(false);
    expect(picker().selection.choices).toHaveLength(0);
  });
});

describe('Home route URL restoration', () => {
  it.each(['shortest', 'both'] as const)('restores route=%s for the category-only default with matching variant metrics', async route => {
    await loadA(`?postal=${A}&transit=mrt_lrt&route=${route}`);
    expect(summary().option?.name).toBe('BAYFRONT MRT STATION Exit E');
    expect(modeControl().props.mode).toBe('mrt_lrt');
    expect(map().mode).toBe(route);
    expect(summary().shortest).toBe(route === 'shortest');
    expect(map().routes[0].geom.shortest_parts).toEqual(originalGeometry.route_options.mrt_lrt.shortest_parts);
    expect(map().routes[0].geom.sheltered_parts).toEqual(originalGeometry.route_options.mrt_lrt.sheltered_parts);
    expect(walkMetrics(summary().score, summary().shortest, summary().option)).toMatchObject({
      distance: route === 'shortest' ? 293.6 : 308.4,
      coverage: route === 'shortest' ? 0 : 24,
    });
    if (route === 'shortest') expect(walkMetrics(summary().score, true, summary().option)).toMatchObject({ uncovered: null, longest: null });
    expect(url.searchParams.get('route')).toBe(route);
    expect(url.searchParams.get('transit')).toBe('mrt_lrt');
    expect(url.searchParams.has('stop')).toBe(false);
    expect(storageRead).not.toHaveBeenCalled();
  });

  it('does not restore an unsupported route mode from the URL', async () => {
    await loadA(`?postal=${A}&transit=mrt_lrt&route=synthetic-unknown`);
    expect(map().mode).toBe('shiokest');
    expect(summary().shortest).toBe(false);
    expect(summary().option?.name).toBe('BAYFRONT MRT STATION Exit E');
    expect(storageRead).not.toHaveBeenCalled();
  });
});

describe('Home URL-intent and load-completion ownership regressions', () => {
  function oldIntentPois(): TransitPoiCollection {
    return { type: 'FeatureCollection', features: [{ type: 'Feature',
      geometry: { type: 'Point', coordinates: [previewTarget.lng, previewTarget.lat] },
      properties: { id: previewStopId, kind: 'mrt_exit', name: 'Synthetic old shared-link exit' },
    }] };
  }

  it.each(['category', 'picker', 'map-stop'] as const)(
    'an explicit %s selection supersedes a shared unknown stop before delayed POIs resolve', async action => {
      await loadA(`?postal=${A}&transit=mrt_lrt&stop=${encodeURIComponent(previewStopId)}`);
      expect(modeControl().props.mode).toBe('mrt_lrt');
      expect(url.searchParams.get('stop')).toBe(previewStopId);
      if (action === 'category') await setMode('bus');
      else if (action === 'picker') await choose('mrt:21624');
      else {
        map().onSelectTransitStop!('bus:03511');
        render();
        await settle();
      }
      const chosen = { summary: clone(summary()), routes: clone(map().routes),
        key: picker().selection.selectedKey, mode: modeControl().props.mode, href: url.href };
      expect(url.searchParams.get('stop')).not.toBe(previewStopId);
      // These POIs would make the original shared stop resolvable. They must not
      // resurrect that intent after a later explicit user choice.
      poiGate.resolve(oldIntentPois());
      await settle();
      expect(summary()).toEqual(chosen.summary);
      expect(map().routes).toEqual(chosen.routes);
      expect(picker().selection.selectedKey).toBe(chosen.key);
      expect(modeControl().props.mode).toBe(chosen.mode);
      expect(url.href).toBe(chosen.href);
      expect(map().chosenStopId).not.toBe(previewStopId);
      expect(nodeText(tree)).not.toContain('Loading walking preview.');
      expect(nodeText(tree)).not.toContain('Walking preview unavailable.');
      expect(storageRead).not.toHaveBeenCalled();
    },
  );

  it('a new postal search supersedes unresolved shared-link intent even if the old stop exists in later POIs', async () => {
    await loadA(`?postal=${A}&transit=mrt_lrt&stop=${encodeURIComponent(previewStopId)}`);
    expect(url.searchParams.get('stop')).toBe(previewStopId);
    const submitted = submit(B);
    const bScore = clone(fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === B)) as unknown as ScoreRecord;
    freeze(bScore);
    scores.get(B)!.resolve(bScore);
    geometries.get(B)!.resolve(null);
    await settle();
    await submitted;
    expect(summary().postal).toBe(B);
    const newSummary = clone(summary());
    poiGate.resolve(oldIntentPois());
    await settle();
    expect(summary()).toEqual(newSummary);
    expect(map().routes).toHaveLength(0);
    expect(modeControl().props.mode).toBe('best_transit');
    expect(map().chosenStopId).not.toBe(previewStopId);
    expect(url.searchParams.get('postal')).toBe(B);
    expect(url.searchParams.has('stop')).toBe(false);
    expect(url.searchParams.has('transit')).toBe(false);
    expect(url.searchParams.has('route')).toBe(false);
    expect(storageRead).not.toHaveBeenCalled();
  });

  it.each(['search', 'shared-link'] as const)(
    'MRT chosen while %s geometry is pending survives completion with its URL and metrics', async source => {
      mount(source === 'shared-link' ? `?postal=${A}&transit=bus` : '');
      const submitted = source === 'search' ? submit(A) : null;
      scores.get(A)!.resolve(sourceScore);
      await settle();
      expect(summary().postal).toBe(A);
      expect(map().routes).toHaveLength(0);
      await setMode('mrt_lrt');
      expect(modeControl().props.mode).toBe('mrt_lrt');
      expect(summary().option?.name).toBe('BAYFRONT MRT STATION Exit E');
      expect(url.searchParams.get('transit')).toBe('mrt_lrt');
      const selectedUrl = url.href;
      geometries.get(A)!.resolve(sourceGeometry);
      await settle();
      if (submitted) await submitted;
      expect(modeControl().props.mode).toBe('mrt_lrt');
      assertCoherent('BAYFRONT MRT STATION Exit E', 308.4, 0.241, originalGeometry.route_options.mrt_lrt.sheltered_parts);
      expect(url.href).toBe(selectedUrl);
      expect(url.searchParams.has('stop')).toBe(false);
      expect(storageRead).not.toHaveBeenCalled();
    },
  );

  it('re-searching the same postal resets to its default and clears stop/transit/route at score readiness', async () => {
    await loadA();
    await setMode('mrt_lrt');
    await setRouteMode('shortest');
    expect(map().mode).toBe('shortest');
    await choose('mrt:21624');
    expect(summary().option?.name).toBe('BAYFRONT MRT STATION Exit C');
    expect(url.searchParams.get('stop')).toBe('mrt:21624');
    expect(url.searchParams.get('transit')).toBe('mrt_lrt');
    expect(url.searchParams.get('route')).toBe('shortest');

    const newScore = deferred<ScoreRecord | null>();
    const newGeometry = deferred<PostalGeom | null>();
    scores.set(A, newScore);
    geometries.set(A, newGeometry);
    const submitted = submit(A);
    expect(dependencies.fetchScoreForPostal).toHaveBeenCalledTimes(2);
    expect(dependencies.fetchGeomForPostal).toHaveBeenCalledTimes(2);
    newScore.resolve(sourceScore);
    await settle();
    expect(summary().option?.name).toBe('Bayfront Stn Exit B/MBS');
    expect(modeControl().props.mode).toBe('best_transit');
    expect(map().routes).toHaveLength(0);
    expect(url.searchParams.get('postal')).toBe(A);
    expect(url.searchParams.has('stop')).toBe(false);
    expect(url.searchParams.has('transit')).toBe(false);
    expect(url.searchParams.has('route')).toBe(false);
    const resetUrl = url.href;
    newGeometry.resolve(sourceGeometry);
    await settle();
    await submitted;
    assertCoherent('Bayfront Stn Exit B/MBS', 81.2, 0.551, originalGeometry.route_options.bus.sheltered_parts);
    expect(modeControl().props.mode).toBe('best_transit');
    expect(map().mode).toBe('shiokest');
    expect(url.href).toBe(resetUrl);
    expect(storageRead).not.toHaveBeenCalled();
  });
});

describe('Home full walk-URL serialization races', () => {
  const pendingPois = (): TransitPoiCollection => ({ type: 'FeatureCollection', features: [{ type: 'Feature',
    geometry: { type: 'Point', coordinates: [previewTarget.lng, previewTarget.lat] },
    properties: { id: previewStopId, kind: 'mrt_exit', name: 'Synthetic cancelled URL exit' },
  }] });

  it.each([
    ['geometry-first', 'category-default'],
    ['geometry-first', 'candidate'],
    ['already-resolved', 'category-default'],
    ['already-resolved', 'candidate'],
  ] as const)('preserves initial shared selection and URL with %s data for %s', async (order, kind) => {
    const expectedQuery: Record<string, string> = kind === 'category-default'
      ? { postal: A, transit: 'mrt_lrt', route: 'shortest' }
      : { postal: A, transit: 'mrt_lrt', stop: 'mrt:21624' };
    const query = new URLSearchParams(expectedQuery).toString();
    if (order === 'already-resolved') {
      // Both helpers return promises already fulfilled before Home mounts.
      scores.get(A)!.resolve(sourceScore);
      geometries.get(A)!.resolve(sourceGeometry);
      mount(`?${query}`);
    } else {
      mount(`?${query}`);
      geometries.get(A)!.resolve(sourceGeometry);
      await settle();
      expect(elements(tree).some(element => element.type === WalkSummary)).toBe(false);
      expect(Object.fromEntries(url.searchParams)).toEqual(expectedQuery);
      scores.get(A)!.resolve(sourceScore);
    }
    await settle();
    expect(dependencies.fetchScoreForPostal).toHaveBeenCalledExactlyOnceWith(A);
    expect(dependencies.fetchGeomForPostal).toHaveBeenCalledTimes(1);
    expect(modeControl().props.mode).toBe('mrt_lrt');
    if (kind === 'category-default') {
      expect(summary().option?.name).toBe('BAYFRONT MRT STATION Exit E');
      expect(map().mode).toBe('shortest');
      expect(summary().shortest).toBe(true);
      expect(walkMetrics(summary().score, true, summary().option)).toMatchObject({ distance: 293.6, coverage: 0 });
      expect(map().routes[0].geom.shortest_parts).toEqual(originalGeometry.route_options.mrt_lrt.shortest_parts);
    } else {
      assertCoherent('BAYFRONT MRT STATION Exit C', 109.2, 0, originalGeometry.candidates['mrt:21624'].sheltered_parts);
      expect(map().chosenStopId).toBe('mrt:21624');
    }
    expect(Object.fromEntries(url.searchParams)).toEqual(expectedQuery);
    const restored = { summary: clone(summary()), routes: clone(map().routes), href: url.href };
    poiGate.resolve({ type: 'FeatureCollection', features: [] });
    await settle();
    render();
    await settle();
    expect(summary()).toEqual(restored.summary);
    expect(map().routes).toEqual(restored.routes);
    expect(url.href).toBe(restored.href);
    expect(storageRead).not.toHaveBeenCalled();
  });

  it('changing route while an unknown shared stop awaits POIs clears its URL and preserves the new route', async () => {
    await loadA(`?postal=${A}&transit=mrt_lrt&stop=${encodeURIComponent(previewStopId)}&route=both`);
    expect(map().mode).toBe('both');
    expect(url.searchParams.get('stop')).toBe(previewStopId);
    await setRouteMode('shortest');
    expect(map().mode).toBe('shortest');
    expect(summary().shortest).toBe(true);
    expect(Object.fromEntries(url.searchParams)).toEqual({ postal: A, transit: 'mrt_lrt', route: 'shortest' });
    const selected = { summary: clone(summary()), routes: clone(map().routes), href: url.href };
    poiGate.resolve(pendingPois());
    await settle();
    expect(summary()).toEqual(selected.summary);
    expect(map().routes).toEqual(selected.routes);
    expect(map().mode).toBe('shortest');
    expect(url.href).toBe(selected.href);
    expect(map().chosenStopId).not.toBe(previewStopId);
    expect(storageRead).not.toHaveBeenCalled();
  });

  it('category click while initial geometry is pending cancels unapplied route and stop query values', async () => {
    mount(`?postal=${A}&transit=bus&stop=${encodeURIComponent(previewStopId)}&route=shortest`);
    scores.get(A)!.resolve(sourceScore);
    await settle();
    expect(map().routes).toHaveLength(0);
    expect(url.searchParams.get('route')).toBe('shortest');
    await setMode('mrt_lrt');
    expect(modeControl().props.mode).toBe('mrt_lrt');
    expect(Object.fromEntries(url.searchParams)).toEqual({ postal: A, transit: 'mrt_lrt' });
    geometries.get(A)!.resolve(sourceGeometry);
    await settle();
    assertCoherent('BAYFRONT MRT STATION Exit E', 308.4, 0.241, originalGeometry.route_options.mrt_lrt.sheltered_parts);
    expect(map().mode).toBe('shiokest');
    expect(summary().shortest).toBe(false);
    poiGate.resolve(pendingPois());
    await settle();
    expect(Object.fromEntries(url.searchParams)).toEqual({ postal: A, transit: 'mrt_lrt' });
    expect(summary().option?.name).toBe('BAYFRONT MRT STATION Exit E');
    expect(map().mode).toBe('shiokest');
    expect(map().chosenStopId).not.toBe(previewStopId);
    expect(storageRead).not.toHaveBeenCalled();
  });
});
