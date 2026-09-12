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
  const stateUpdates: unknown[] = [];
  const changed = (a?: readonly unknown[], b?: readonly unknown[]) =>
    !a || !b || a.length !== b.length || b.some((value, i) => !Object.is(value, a[i]));
  function memo<T>(make: () => T, deps: readonly unknown[]): T {
    const i = index++;
    const previous = slots[i];
    if (!previous || changed(previous.deps, deps)) slots[i] = { value: make(), deps };
    return slots[i].value as T;
  }
  return {
    stateUpdates,
    begin() { index = 0; dirty = false; },
    isDirty() { return dirty; },
    reset() {
      generation++;
      for (const slot of slots) slot.cleanup?.();
      slots.length = 0;
      pending.clear();
      stateUpdates.length = 0;
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
          if (!Object.is(value, slot.value)) { stateUpdates.push(value); slot.value = value; dirty = true; }
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
vi.mock('../../components/route-map-loader', () => ({ RouteMapLoader: dependencies.MapChild, preloadRouteMap: vi.fn() }));
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

import Home, { DataDetails, ScoreCard } from '../../app/page';
import { WalkSummary, walkMetrics } from '../../components/walk-summary';
import { TransitStopPicker } from '../../components/transit-stop-picker';
import { ExposureSectionExplorer } from '../../components/exposure-section-explorer';
import { HomeComparison } from '../../components/home-comparison';
import { ComparisonShareDialog } from '../../components/comparison-share-dialog';
import { FailureDiagnosticsControl } from '../../components/failure-diagnostics-control';
import { recordArtifactFailure } from '../artifact-failure';
import { comparisonLinkFragment } from '../comparison-link';
import { COMPARISON_STORAGE_KEY } from '../comparison-state';
import { requestServiceWorkerCache } from '../service-worker-cache';

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
let comparisonStored: string | null;
let comparisonWrites: string[];
let replaceState: ReturnType<typeof vi.fn>;
let pushState: ReturnType<typeof vi.fn>;
let navigationListeners: Map<string, Set<() => void>>;
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
  expect(nodeText(tree)).toContain('Checking this stop...');
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
const explorer = () => child<ComponentProps<typeof ExposureSectionExplorer>>(ExposureSectionExplorer).props;
function focusFirstSection() {
  const section = explorer().model.sections[0];
  expect(section).toBeDefined();
  explorer().onSelect(section.key);
  render();
  expect(map().focusedExposureGap).toMatchObject({ kind: 'mapped-section', key: section.key });
  expect(map().mappedExposureContextKey).toBe(explorer().model.contextKey);
  return section;
}

function render(commitEffects = true) {
  for (let attempt = 0; attempt < 40; attempt++) {
    host.begin();
    tree = Home();
    // Models a pending passive-effect commit, not browser hydration or event replay.
    if (!commitEffects) return;
    host.commitEffects();
    if (!host.isDirty()) return;
  }
  throw new Error('Home effects did not settle within 40 renders');
}

const diagnostics = () => elements(tree).filter(element => element.type === FailureDiagnosticsControl)
  .map(element => element.props as unknown as ComponentProps<typeof FailureDiagnosticsControl>);

describe('T03 page diagnostic ownership', () => {
  it('shows no diagnostics on success and preserves a global map failure across category changes', async () => {
    await loadA();
    expect(diagnostics()).toEqual([]);
    map().onStatusChange!('error', 'The map library could not load.', 'reload',
      { stage: 'library-download', reason: 'rejected', elapsedMs: 20 });
    render();
    expect(diagnostics()).toHaveLength(1);
    const failure = diagnostics()[0];
    expect(JSON.parse(failure.value)).toMatchObject({ area: 'map', stage: 'library-download', reason: 'rejected' });
    expect(failure.value).not.toContain(A);
    await setMode('mrt_lrt');
    expect(diagnostics()).toEqual([failure]);
    map().onStatusChange!('error', 'The map library could not load.', 'reload',
      { stage: 'library-download', reason: 'rejected', elapsedMs: 20 });
    render();
    expect(diagnostics()).toEqual([failure]);
  });

  it('keeps a terminal outer render failure global instead of falsely recovering on route change', async () => {
    await loadA();
    map().onStatusChange!('error', 'The map could not be displayed.', 'reload', { stage: 'route-render', reason: 'error' });
    render();
    const failure = diagnostics()[0];
    await setMode('mrt_lrt');
    await setRouteMode('shortest');
    expect(diagnostics()).toEqual([failure]);
    expect(nodeText(tree)).toContain('Reload page');
  });

  it('rejects a prior selected-route probe across a category ABA and clears the old snapshot synchronously', async () => {
    await loadA();
    const before = map();
    const issue = { stage: 'route-render' as const, reason: 'timeout' as const, elapsedMs: 200,
      selectionContext: before.diagnosticContext };
    before.onStatusChange!('error', 'The selected walk is not visible.', undefined, issue);
    render();
    expect(diagnostics()).toHaveLength(1);
    await setMode('mrt_lrt');
    expect(diagnostics()).toEqual([]);
    await setMode('best_transit');
    expect(map().diagnosticContext).not.toBe(before.diagnosticContext);
    before.onStatusChange!('error', 'Old A error', undefined, issue);
    render();
    expect(diagnostics()).toEqual([]);
    expect(nodeText(tree)).not.toContain('Old A error');
  });

  it('rejects callbacks from a retired map instance after Retry map', async () => {
    await loadA();
    const before = map();
    before.onStatusChange!('error', 'Synthetic render failure', undefined, { stage: 'route-render', reason: 'error' });
    render();
    await clickPageButton('Retry map');
    expect(diagnostics()).toEqual([]);
    before.onStatusChange!('error', 'Retired instance error', undefined, { stage: 'map-startup', reason: 'error' });
    render();
    expect(diagnostics()).toEqual([]);
    expect(nodeText(tree)).not.toContain('Retired instance error');
  });

  it('copies geometry role/status but never the artifact path or thrown message', async () => {
    mount('?postal=' + A);
    const error = Error('geom/private/' + A + '?token=secret');
    recordArtifactFailure(error, { stage: 'artifact-fetch', reason: 'http', artifactRole: 'geometry-shard', httpStatus: 503, elapsedMs: 10 });
    scores.get(A)!.resolve(sourceScore);
    geometries.get(A)!.reject(error);
    await settle();
    expect(diagnostics()).toHaveLength(1);
    expect(JSON.parse(diagnostics()[0].value)).toMatchObject({ area: 'geometry-data', stage: 'artifact-fetch', http_status: 503 });
    expect(diagnostics()[0].value).not.toMatch(/secret|private|018956/);
    expect(nodeText(tree)).not.toContain('token=');
    expect(summary()).toBeDefined();
  });

  it('replaces raw selection errors with fixed copy and rejects an older postal failure', async () => {
    mount('?postal=' + A);
    void submit(B);
    scores.get(A)!.reject(Error('A-private-token'));
    scores.get(B)!.reject(Error('B-private-token'));
    await settle();
    const errorView = elements(tree).find(element => typeof element.props.error === 'string' && typeof element.props.searched === 'boolean')!;
    expect(errorView.props.error).toBe('Shelter-map data could not load. Try this postal code again.');
    expect(errorView.props.error).not.toContain('private-token');
    expect(diagnostics()).toHaveLength(1);
    expect(JSON.parse(diagnostics()[0].value)).toMatchObject({ area: 'score-data', stage: 'unknown', reason: 'unknown' });
    expect(diagnostics()[0].value).not.toMatch(/018956|079908|private-token/);
  });

  it('does not let a superseded same-postal geometry retry replace a newer success', async () => {
    mount('?postal=' + A);
    scores.get(A)!.resolve(sourceScore);
    geometries.get(A)!.reject(Error('initial geometry failed'));
    await settle();
    const retry = elements(tree).find(element => element.type === 'button' && nodeText(element) === 'Retry geometry')!;
    expect(retry).toBeDefined();
    const first = deferred<PostalGeom | null>(), second = deferred<PostalGeom | null>();
    dependencies.fetchGeomForPostal.mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    const pendingFirst = (retry.props.onClick as () => Promise<void>)();
    const pendingSecond = (retry.props.onClick as () => Promise<void>)();
    render();
    second.resolve(sourceGeometry);
    await pendingSecond; await settle();
    const recovered = clone(map().routes);
    first.reject(Error('obsolete retry'));
    await pendingFirst; await settle();
    expect(map().routes).toEqual(recovered);
    expect(diagnostics()).toEqual([]);
    expect(nodeText(tree)).not.toContain('Walk geometry could not load');
  });

  it('does not attach a previous network diagnostic or retry to input-validation feedback', async () => {
    mount('?postal=' + A);
    scores.get(A)!.reject(Error('old data failure'));
    await settle();
    expect(diagnostics()).toHaveLength(1);
    await submit('');
    await settle();
    expect(diagnostics()).toEqual([]);
    expect(nodeText(tree)).not.toContain('Retry selection');
  });

  it('clears failed geometry and its diagnostic when navigating to the plain map', async () => {
    mount('?postal=' + A);
    scores.get(A)!.resolve(sourceScore);
    geometries.get(A)!.reject(Error('geometry failed'));
    await settle();
    expect(diagnostics()).toHaveLength(1);
    url = new URL('https://example.test/');
    for (const listener of navigationListeners.get('popstate') ?? []) listener();
    render(); await settle();
    expect(diagnostics()).toEqual([]);
    expect(nodeText(tree)).not.toContain('Walk geometry could not load');
  });
});
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
function inputPostal(postal: string, commitEffects = true) {
  const input = elements(tree).find(element => element.type === 'input' && element.props.id === 'postal-search-input')!;
  expect(input).toBeDefined();
  (input.props.onChange as (event: unknown) => void)({ target: { value: postal } });
  render(commitEffects);
}
// The hook host has no DOM. Model only the named input/type boundary; native form
// submission and constraint validation require the parent's held-script browser run.
class PostalInputDouble {
  constructor(public value: string) {}
}
function submitControl(control: PostalInputDouble | object | null) {
  const form = elements(tree).find(element => element.type === 'form')!;
  const preventDefault = vi.fn();
  const namedItem = vi.fn((name: string) => name === 'postal' ? control : null);
  const promise = (form.props.onSubmit as (event: unknown) => Promise<void>)({
    preventDefault, currentTarget: { elements: { namedItem } },
  });
  return { promise, preventDefault, namedItem };
}
function submit(postal: string) {
  inputPostal(postal);
  const input = elements(tree).find(element => element.props.id === 'postal-search-input')!;
  const { promise } = submitControl(new PostalInputDouble(String(input.props.value)));
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
  comparisonStored = null;
  comparisonWrites = [];
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
  storageRead = vi.fn((_key?: string) => JSON.stringify({ cached_at: Date.now(), payload: {
    ok: true, route_geometry: originalGeometry.shortest, total_distance_m: 9999,
  } }));
  url = new URL('https://example.test/');
  replaceState = vi.fn((_state, _title, next: string) => { url = new URL(next, url); });
  pushState = vi.fn((_state, _title, next: string) => { url = new URL(next, url); });
  navigationListeners = new Map();
  vi.stubGlobal('HTMLInputElement', PostalInputDouble);
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('window', {
    location: { get href() { return url.href; }, get search() { return url.search; }, get hash() { return url.hash; } },
    history: { replaceState, pushState },
    addEventListener: (name: string, handler: () => void) => {
      if (!navigationListeners.has(name)) navigationListeners.set(name, new Set());
      navigationListeners.get(name)!.add(handler);
    },
    removeEventListener: (name: string, handler: () => void) => navigationListeners.get(name)?.delete(handler),
    localStorage: {
      getItem: (key: string) => key === COMPARISON_STORAGE_KEY ? comparisonStored : storageRead(key),
      setItem: vi.fn((key: string, value: string) => { if (key === COMPARISON_STORAGE_KEY) { comparisonStored = value; comparisonWrites.push(value); } }),
      removeItem: vi.fn(), key: vi.fn(), length: 0,
    },
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

describe('T30 native postal search and initial navigation ownership', () => {
  it.each(['', B])('reads the input synchronously instead of React query %j', async staleQuery => {
    mount();
    if (staleQuery) inputPostal(staleQuery);
    const control = new PostalInputDouble(A);
    const submitted = submitControl(control);
    control.value = B;
    expect(submitted.preventDefault).toHaveBeenCalledTimes(1);
    expect(submitted.namedItem.mock.calls).toEqual([['postal']]);
    expect(dependencies.fetchScoreForPostal.mock.calls).toEqual([[A]]);
    expect(dependencies.fetchGeomForPostal.mock.calls).toEqual([[A, undefined, undefined]]);
    render();
    expect(elements(tree).find(element => element.props.id === 'postal-search-input')!.props.value).toBe(A);
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry);
    await settle(); await submitted.promise;
    expect(summary().postal).toBe(A);
    expect(url.search).toBe(`?postal=${A}`);
    expect(dependencies.fetchManifest).not.toHaveBeenCalled();
    expect(dependencies.fetchScoreForPostal).toHaveBeenCalledTimes(1);
    expect(dependencies.fetchGeomForPostal).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('trims a valid DOM postal without dropping its leading zero', async () => {
    mount();
    const { promise } = submitControl(new PostalInputDouble(` ${A} `));
    render();
    expect(dependencies.fetchScoreForPostal.mock.calls).toEqual([[A]]);
    expect(elements(tree).find(element => element.props.id === 'postal-search-input')!.props.value).toBe(A);
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry);
    await settle(); await promise;
    expect(url.searchParams.get('postal')).toBe(A);
  });

  it.each(['', '01895', '0189567', '01895a', '  ', '\uff10\uff11\uff18\uff19\uff15\uff16'])(
    'rejects invalid actual input %j even when React query is valid', async value => {
      mount(); inputPostal(A);
      const { promise, preventDefault } = submitControl(new PostalInputDouble(value));
      expect(dependencies.fetchScoreForPostal).not.toHaveBeenCalled();
      expect(dependencies.fetchGeomForPostal).not.toHaveBeenCalled();
      expect(dependencies.fetchManifest).not.toHaveBeenCalled();
      expect(preventDefault).toHaveBeenCalledTimes(1);
      await promise; render();
      expect(url.search).toBe('');
      expect(replaceState).not.toHaveBeenCalled();
    },
  );

  it.each([null, { value: A }])('rejects a missing or wrong-kind named control %j', async control => {
    mount(); inputPostal(A);
    const { promise } = submitControl(control);
    expect(dependencies.fetchScoreForPostal).not.toHaveBeenCalled();
    expect(dependencies.fetchGeomForPostal).not.toHaveBeenCalled();
    await promise; render();
    expect(url.search).toBe('');
  });

  it.each(['', `?postal=${B}&transit=mrt_lrt&stop=mrt:21624&route=shortest`])(
    'keeps an explicit submit authoritative when the first URL effect is still pending: %s', async initial => {
      url = new URL(`https://example.test/${initial}`);
      render(false);
      inputPostal(A, false);
      const { promise } = submitControl(new PostalInputDouble(A));
      expect(dependencies.fetchScoreForPostal.mock.calls).toEqual([[A]]);
      render();
      await settle();
      expect(dependencies.fetchScoreForPostal.mock.calls).toEqual([[A]]);
      expect(dependencies.fetchGeomForPostal.mock.calls).toEqual([[A, undefined, undefined]]);
      scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry);
      await settle(); await promise;
      expect(summary().postal).toBe(A);
      expect(modeControl().props.mode).toBe('best_transit');
      expect(url.search).toBe(`?postal=${A}`);
      expect(dependencies.fetchManifest).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it('consumes a native GET postal once after mount with no submit handler call', async () => {
    mount(`?postal=${A}`);
    render(); render();
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry);
    await settle();
    expect(dependencies.fetchManifest).not.toHaveBeenCalled();
    expect(dependencies.fetchScoreForPostal.mock.calls).toEqual([[A]]);
    expect(dependencies.fetchGeomForPostal.mock.calls).toEqual([[A, undefined, undefined]]);
    expect(summary().postal).toBe(A);
    expect(url.search).toBe(`?postal=${A}`);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each(['', '01895', '0189567', '01895a', '\uff10\uff11\uff18\uff19\uff15\uff16', '<script>'])(
    'rejects invalid direct-URL postal %j without loading any record or API', async value => {
      mount(`?postal=${encodeURIComponent(value)}&transit=mrt_lrt&route=shortest`);
      await settle(); render();
      expect(dependencies.fetchManifest).not.toHaveBeenCalled();
      expect(dependencies.fetchScoreForPostal).not.toHaveBeenCalled();
      expect(dependencies.fetchGeomForPostal).not.toHaveBeenCalled();
      expect(elements(tree).some(element => element.type === WalkSummary)).toBe(false);
      expect(elements(tree).find(element => element.props.id === 'postal-search-input')!.props.value).toBe('');
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );
});

describe('Home cache bootstrap across entry paths', () => {
  it.each(['', '#compare=1&postals=018956&transit=bus&active=018956', '#compare=broken'])(
    'requests cache bootstrap on initial entry %s without requiring a postal search', fragment => {
      vi.mocked(requestServiceWorkerCache).mockClear();
      url = new URL('https://example.test/' + fragment);
      render();
      expect(requestServiceWorkerCache).toHaveBeenCalledTimes(1);
      render();
      expect(requestServiceWorkerCache).toHaveBeenCalledTimes(1);
    },
  );
});

describe('Home shared comparison URL lifecycle', () => {
  const view = () => child<ComponentProps<typeof HomeComparison>>(HomeComparison).props;
  const state = (postals = [A], activePostal = postals[0], category: 'bus' | 'mrt_lrt' = 'bus') =>
    ({ version: 1 as const, postals, activePostal, category });
  const hash = (postals = [A], activePostal = postals[0]) => comparisonLinkFragment(state(postals, activePostal))!;
  const navigate = async (next: string, event = 'popstate') => {
    url = new URL(next, url);
    navigationListeners.get(event)?.forEach(handler => handler());
    render(); await settle();
  };
  const noView = () => expect(elements(tree).some(element => element.type === HomeComparison)).toBe(false);

  it('gives a valid fragment precedence over saved state and postal query without saving or querying the ignored postal', async () => {
    const saved = comparisonStored = JSON.stringify(state([B]));
    mount(`?postal=${B}&stop=private${hash()}`); await settle();
    expect(view().shared).toBe(true);
    expect(view().state).toEqual(state());
    expect(dependencies.fetchScoreForPostal.mock.calls).toEqual([[A]]);
    expect(dependencies.fetchGeomForPostal.mock.calls).toEqual([[A]]);
    expect(comparisonStored).toBe(saved);
    expect(comparisonWrites).toEqual([]);
    expect(url.search).toBe('');
    expect(url.hash).toBe(hash());
  });

  it('rejects an invalid owned fragment without loading records or changing storage', async () => {
    const saved = comparisonStored = JSON.stringify(state([B]));
    mount(`?postal=${A}#compare=2`); await settle();
    noView();
    expect(nodeText(tree)).toContain('This comparison link is invalid. Your saved shortlist is unchanged.');
    expect(dependencies.fetchScoreForPostal).not.toHaveBeenCalled();
    expect(comparisonStored).toBe(saved);
    await clickPageButton('Open saved comparison');
    expect(view().state.postals).toEqual([B]);
    expect(view().shared).toBe(false);
    expect(url.hash).toBe('');
    expect(comparisonWrites).toEqual([]);
  });

  it('keeps ordinary single-postal links with unrelated fragments working', async () => {
    mount(`?postal=${A}&transit=mrt_lrt&stop=mrt:21624&route=shortest#walk`);
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry);
    await settle();
    noView();
    expect(summary().option?.name).toBe('BAYFRONT MRT STATION Exit C');
    expect(url.searchParams.get('route')).toBe('shortest');
    // This published candidate has identical shortest/sheltered geometry, so one map line is intentional.
    expect(map().routes).toHaveLength(1);
  });

  it('changes a shared category and active postal only in memory and the owned fragment', async () => {
    const saved = comparisonStored = JSON.stringify(state([B]));
    mount(hash([A, B])); await settle();
    view().onCategory('mrt_lrt'); render();
    view().onActivate(B); render(); await settle();
    expect(view().state).toEqual(state([A, B], B, 'mrt_lrt'));
    expect(url.hash).toBe(comparisonLinkFragment(view().state));
    expect(comparisonStored).toBe(saved);
    expect(comparisonWrites).toEqual([]);
  });

  it('copies only chosen comparison state, not the current query or other view fields', async () => {
    comparisonStored = JSON.stringify(state());
    mount('?debugMap=1&note=private'); await clickPageButton('Compare (1)');
    view().onShare(); render();
    const dialog = child<ComponentProps<typeof ComparisonShareDialog>>(ComparisonShareDialog).props;
    expect(dialog.open).toBe(true);
    expect(dialog.link).toBe(`https://example.test/${hash()}`);
    expect(url.search).toBe('?debugMap=1&note=private');
    expect(comparisonWrites).toEqual([]);
    dialog.onClose(); render();
    expect(view().state.postals).toEqual([A]);
  });

  it('saves an imported state only on explicit Save and strips the fragment', async () => {
    comparisonStored = JSON.stringify(state([B]));
    mount(hash()); await settle();
    view().onSaveShared(); render(); await settle();
    expect(view().shared).toBe(false);
    expect(JSON.parse(comparisonStored!)).toEqual(state());
    expect(comparisonWrites).toHaveLength(1);
    expect(url.hash).toBe('');
  });

  it('retains the shared view, link and previous saved state on denied Save', async () => {
    const saved = comparisonStored = JSON.stringify(state([B]));
    mount(hash()); await settle();
    vi.mocked(window.localStorage.setItem).mockImplementation(() => { throw Error('denied'); });
    view().onSaveShared(); render(); await settle();
    expect(view().shared).toBe(true);
    expect(view().storageUnavailable).toBe(true);
    expect(comparisonStored).toBe(saved);
    expect(url.hash).toBe(hash());
    view().onDiscardShared(); render(); await settle();
    expect(view().state.postals).toEqual([B]);
    expect(view().shared).toBe(false);
    expect(url.hash).toBe('');
  });

  it('Close restores the local shortlist and creates a history entry whose Back target reopens the link', async () => {
    const saved = comparisonStored = JSON.stringify(state([B]));
    mount(hash()); await settle();
    const sharedHref = url.href;
    view().onClose(); render(); await settle();
    noView(); expect(url.hash).toBe('');
    expect(pushState).toHaveBeenCalledTimes(1);
    await clickPageButton('Compare (1)');
    expect(view().state.postals).toEqual([B]);
    await navigate(sharedHref);
    expect(view().state.postals).toEqual([A]);
    expect(view().shared).toBe(true);
    expect(comparisonStored).toBe(saved);
    expect(comparisonWrites).toEqual([]);
  });

  it('Add closes for a postal search without losing or saving the ephemeral shared list', async () => {
    const saved = comparisonStored = JSON.stringify(state([B]));
    mount(hash()); await settle();
    view().onAdd(); render(); await settle();
    noView(); expect(url.hash).toBe('');
    const submitted = submit(B);
    scores.get(B)!.resolve(null); geometries.get(B)!.resolve(null);
    await settle(); await submitted;
    await clickPageButton('Add to comparison');
    expect(view().state.postals).toEqual([A, B]);
    expect(view().shared).toBe(true);
    expect(comparisonStored).toBe(saved);
    expect(comparisonWrites).toEqual([]);
    view().onShare(); render();
    expect(child<ComponentProps<typeof ComparisonShareDialog>>(ComparisonShareDialog).props.link)
      .toBe(`https://example.test/${hash([A, B], B)}`);
  });

  it('clearing an imported list clears the map and fragment without clearing the saved list', async () => {
    const saved = comparisonStored = JSON.stringify(state([B]));
    mount(hash()); await settle();
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry); await settle();
    expect(map().routes).toHaveLength(1);
    view().onClear(); render(); await settle();
    expect(view().state.postals).toEqual([]);
    expect(map().routes).toEqual([]);
    expect(url.hash).toBe('');
    expect(comparisonStored).toBe(saved);
  });

  it('deduplicates the popstate/hashchange pair for one shared navigation', async () => {
    mount(); await settle();
    await navigate(hash());
    await navigate(url.href, 'hashchange');
    expect(dependencies.fetchScoreForPostal.mock.calls).toEqual([[A]]);
    expect(dependencies.fetchGeomForPostal.mock.calls).toEqual([[A]]);
  });

  it('invalidates pending primary score and geometry before opening a different shared postal', async () => {
    mount(); const submitted = submit(A);
    await navigate(hash([B]));
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry);
    await settle(); await submitted;
    expect(view().state.postals).toEqual([B]);
    expect(view().entries[B].status).toBe('loading');
    expect(map().routes).toEqual([]);
    expect(url.hash).toBe(hash([B]));
    expect(elements(tree).some(element => element.type === WalkSummary)).toBe(false);
  });

  it('invalidates a shared load when navigating to an ordinary postal query', async () => {
    mount(hash()); await settle();
    await navigate(`?postal=${B}`);
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry);
    scores.get(B)!.resolve(null); geometries.get(B)!.resolve(null); await settle();
    noView(); expect(summary().postal).toBe(B);
    expect(map().routes).toEqual([]);
    expect(url.searchParams.get('postal')).toBe(B);
  });

  it('leaves neither a stale map nor an open share dialog after navigating out of a shared comparison', async () => {
    mount(hash()); await settle();
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry); await settle();
    view().onShare(); render();
    await navigate('/');
    noView(); expect(map().routes).toEqual([]);
    expect(elements(tree).some(element => element.type === ComparisonShareDialog)).toBe(false);
  });

  it('removes both navigation listeners when Home unmounts', async () => {
    mount(hash()); await settle();
    expect(navigationListeners.get('popstate')?.size).toBe(1);
    expect(navigationListeners.get('hashchange')?.size).toBe(1);
    host.reset();
    expect(navigationListeners.get('popstate')?.size).toBe(0);
    expect(navigationListeners.get('hashchange')?.size).toBe(0);
  });
});

describe('Home comparison through actual page handlers', () => {
  const view = () => child<ComponentProps<typeof HomeComparison>>(HomeComparison).props;
  const restoreList = (postals: string[], activePostal = postals[0]) => {
    comparisonStored = JSON.stringify({ version: 1, postals, category: 'bus', activePostal });
  };
  it('restores a closed shortlist without loading its records or writing storage', async () => {
    restoreList([A, B]);
    mount(); await settle();
    expect(nodeText(tree)).toContain('Compare (2)');
    expect(dependencies.fetchScoreForPostal).not.toHaveBeenCalled();
    expect(dependencies.fetchGeomForPostal).not.toHaveBeenCalled();
    expect(comparisonWrites).toEqual([]);
    expect(map().routes).toEqual([]);
  });
  it('maps the common category default, not the candidate inspected before adding', async () => {
    await loadA();
    await setMode('mrt_lrt');
    await choose('mrt:21624');
    const inspected = clone(map().routes);
    await clickPageButton('Add to comparison');
    expect(view().state).toMatchObject({ postals: [A], category: 'mrt_lrt', activePostal: A });
    expect(view().entries[A].row?.destination).toBe('BAYFRONT MRT STATION Exit E');
    expect(map().routes[0].geom.sheltered_parts).toEqual(originalGeometry.route_options.mrt_lrt.sheltered_parts);
    expect(map().routes).not.toEqual(inspected);
    expect(map().onSelectTransitStop).toBeUndefined();
    expect(map().transitPois.features).toEqual([]);
    expect(map().focusedExposureGap).toBeNull();
    expect(map().feedbackEnabled).toBe(false);
    view().onClose(); render(); await settle();
    expect(map().routes).toEqual(inspected);
    expect(summary().option?.name).toBe('BAYFRONT MRT STATION Exit C');
  });
  it('keeps inactive completed evidence from replacing a pending active column on the map', async () => {
    restoreList([A, B], B);
    mount(); await clickPageButton('Compare (2)');
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry);
    await settle();
    expect(view().entries[A].status).toBe('ready');
    expect(view().entries[B].status).toBe('loading');
    expect(map().routes).toEqual([]);
    view().onActivate(A); render(); await settle();
    expect(map().routes[0].geom.postal).toBe(A);
    expect(map().routes[0].geom.sheltered_parts).toEqual(originalGeometry.route_options.bus.sheltered_parts);
    scores.get(B)!.reject(Error('isolated score failure')); geometries.get(B)!.resolve(null);
    await settle();
    expect(view().entries[B].status).toBe('error');
    expect(map().routes[0].geom.postal).toBe(A);
  });
  it('keeps score measurements with failed geometry and removes the previous column route', async () => {
    restoreList([A]); mount(); await clickPageButton('Compare (1)');
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.reject(Error('geometry unavailable'));
    await settle();
    expect(view().entries[A].row?.metrics).toMatchObject({ distance: 81.2, coverage: 55, longest: 20.2 });
    expect(view().entries[A].geometryStatus).toBe('error');
    expect(map().routes).toEqual([]);
  });
  it.each(['missing', 'invalid'] as const)('does not send shortest-only geometry to the sheltered map when sheltered parts are %s', async failure => {
    const geometry = clone(originalGeometry) as unknown as PostalGeom;
    const declared = geometry.route_options!.bus!;
    if (failure === 'missing') {
      delete declared.sheltered;
      delete declared.sheltered_parts;
    } else declared.sheltered_parts = ['_'];
    restoreList([A]); mount(); await clickPageButton('Compare (1)');
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(geometry);
    await settle();
    expect(view().entries[A].option?.selectedSource.selectionRef).toEqual({ kind: 'category_default', category: 'bus' });
    expect(view().entries[A].option?.geometry.shortest.status).toBe('complete');
    expect(view().entries[A].option?.geometry.sheltered.parts).toEqual([]);
    expect(view().entries[A].row?.metrics).toEqual({ distance: 81.2, coverage: 55, uncovered: 36.5, longest: 20.2 });
    expect(map().routes).toEqual([]);
  });
  it('new postal search closes comparison and keeps its saved shortlist', async () => {
    restoreList([A]); mount(); await clickPageButton('Compare (1)');
    const saved = comparisonStored;
    const submitted = submit(B);
    expect(elements(tree).some(element => element.type === HomeComparison)).toBe(false);
    scores.get(B)!.resolve(null); geometries.get(B)!.resolve(null);
    scores.get(A)!.resolve(sourceScore); geometries.get(A)!.resolve(sourceGeometry);
    await settle(); await submitted;
    expect(comparisonStored).toBe(saved);
    expect(map().routes).toEqual([]);
    expect(summary().postal).toBe(B);
  });
  it('clearing the shortlist clears only comparison state and its route', async () => {
    await loadA(); await clickPageButton('Add to comparison');
    view().onClear(); render(); await settle();
    expect(view().state.postals).toEqual([]);
    expect(map().routes).toEqual([]);
    expect(JSON.parse(comparisonStored!).postals).toEqual([]);
    view().onClose(); render(); await settle();
    expect(summary().postal).toBe(A);
    expect(map().routes[0].geom.postal).toBe(A);
  });
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

  it('publishes already-settled geometry with the first score selection, without an intermediate empty map', async () => {
    mount();
    const submitted = submit(A);
    geometries.get(A)!.resolve(sourceGeometry);
    await settle();
    scores.get(A)!.resolve(sourceScore);
    await settle();
    await submitted;
    const selections = host.stateUpdates.filter((value): value is { score: ScoreRecord; geom: PostalGeom } =>
      !!value && typeof value === 'object' && 'score' in value && value.score === sourceScore && 'geom' in value);
    expect(selections).toHaveLength(1);
    expect(selections[0].geom).toBe(sourceGeometry);
    assertCoherent('Bayfront Stn Exit B/MBS', 81.2, 0.551, originalGeometry.route_options.bus.sheltered_parts);
  });

  it.each(['missing', 'rejected'] as const)('keeps score text when geometry has already %s without republishing identical selection', async outcome => {
    mount();
    const submitted = submit(A);
    if (outcome === 'missing') geometries.get(A)!.resolve(null);
    else geometries.get(A)!.reject(new Error('geometry unavailable'));
    await settle();
    scores.get(A)!.resolve(sourceScore);
    await settle();
    await submitted;
    const selections = host.stateUpdates.filter(value =>
      !!value && typeof value === 'object' && 'score' in value && value.score === sourceScore && 'geom' in value);
    expect(selections).toHaveLength(1);
    expect(summary().postal).toBe(A);
    expect(summary().score).not.toBeNull();
    expect(map().routes).toHaveLength(0);
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
      expect(nodeText(tree)).toContain('No route could be loaded to this stop.');
      expect(nodeText(tree)).toContain('Retry preview');
      expect(summary()).toEqual(baseline.summary);
      expect(map().routes).toEqual(baseline.routes);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      await clickPageButton('Back to saved walk');
      expect(nodeText(tree)).not.toContain('No route could be loaded to this stop.');
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
    expect(nodeText(tree)).toContain('Checking this stop...');
    second.resolve(Response.json({ ok: false }, { status: 503 }));
    await settle();
    expect(summary()).toEqual(baseline.summary);
    expect(map().routes).toEqual(baseline.routes);
    expect(nodeText(tree)).toContain('No route could be loaded to this stop.');
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
    expect(nodeText(tree)).not.toContain('Checking this stop...');
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
      expect(nodeText(tree)).not.toContain('No route could be loaded to this stop.');
      expect(nodeText(tree)).not.toContain('Checking this stop...');
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

describe('Home mapped-exposure selection ownership', () => {
  it('keeps technical score content out of both collapsed and expanded walk controls', async () => {
    await loadA();
    const panel = () => elements(tree).find(e => e.type === 'aside')!;
    expect(elements(panel()).some(e => e.type === ScoreCard)).toBe(false);
    expect(elements(panel()).find(e => e.props.id === 'walk-details')?.props.hidden).toBe(true);
    await clickPageButton('Walk details');
    expect(elements(panel()).find(e => e.props.id === 'walk-details')?.props.hidden).toBe(false);
    expect(elements(panel()).some(e => e.type === ScoreCard)).toBe(false);
    const data = child<React.ComponentProps<typeof DataDetails>>(DataDetails);
    const technical = elements(data.props.children).find(e => e.type === 'details')!;
    expect(technical.props.open).toBeUndefined();
    expect(elements(technical).some(e => e.type === ScoreCard)).toBe(true);
  });

  it('uses one-line transit choices and disables choices without recorded paths', async () => {
    await loadA();
    const c = modeControl();
    const absent = { ...sourceScore, route_options: { ...sourceScore.route_options, mrt_lrt: undefined } };
    const rendered = (c.type as (props: typeof c.props) => ReactNode)({ ...c.props, score: absent });
    const buttons = elements(rendered).filter(e => e.type === 'button');
    expect(buttons).toHaveLength(3);
    expect(buttons.find(e => e.key === 'mrt_lrt')?.props.disabled).toBe(true);
    expect(buttons.find(e => e.key === 'bus')?.props.disabled).toBe(false);
    expect(elements(rendered).some(e => e.type === 'small')).toBe(false);
  });
  it('provides the explorer a stable walk-control focus return target', async () => {
    await loadA();
    const control = elements(tree).find(element => element.type === 'button' && element.props['aria-controls'] === 'walk-details')!;
    const focus = vi.fn();
    (control.props.ref as React.RefObject<HTMLButtonElement|null>).current = { focus } as unknown as HTMLButtonElement;
    explorer().onFocusedRemoval!();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    const callback = explorer().onFocusedRemoval;
    await clickPageButton('Walk details');
    expect(explorer().onFocusedRemoval).toBe(callback);
  });
  it('exposes three real fragments without replacing complete logical statistics', async () => {
    await loadA();
    const before = walkMetrics(summary().score, summary().shortest, summary().option);
    expect(explorer().model.sections).toHaveLength(3);
    expect(explorer().model.sections.map(section => section.lengthM).sort((a,b) => a-b)).toEqual([9.1,11,16.3]);
    const section = focusFirstSection();
    expect(map().focusedExposureGap).toMatchObject({ encoded: section.encoded, points: section.points });
    expect(explorer().selectedKey).toBe(section.key);
    expect(walkMetrics(summary().score, summary().shortest, summary().option)).toEqual(before);
    expect(before.uncovered).toBeCloseTo(36.5);
    expect(before.longest).toBe(20.2);
    expect(child<ComponentProps<typeof ScoreCard>>(ScoreCard).props.hideExposureDetails).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('clears explicitly while preserving the selected walk and URL', async () => {
    await loadA();
    focusFirstSection();
    const before = { summary: summary(), routes: map().routes, href: url.href };
    explorer().onSelect(null);
    render();
    expect(map().focusedExposureGap).toBeNull();
    expect(explorer().selectedKey).toBeNull();
    expect(summary()).toEqual(before.summary);
    expect(map().routes).toBe(before.routes);
    expect(url.href).toBe(before.href);
  });

  it('keeps the same focus object on unrelated detail and lighting changes', async () => {
    await loadA();
    focusFirstSection();
    const focused = map().focusedExposureGap;
    await clickPageButton('Walk details');
    expect(map().focusedExposureGap).toBe(focused);
    await clickPageButton('Night lighting');
    expect(map().focusedExposureGap).toBe(focused);
    await clickPageButton('Collapse walk details');
    expect(map().focusedExposureGap).toBe(focused);
  });

  it('rejects a previous category callback before it can replace or clear new focus', async () => {
    await loadA();
    const oldProps = explorer();
    const oldSection = focusFirstSection();
    await setMode('mrt_lrt');
    expect(map().focusedExposureGap).toBeNull();
    focusFirstSection();
    const focused = map().focusedExposureGap;
    oldProps.onSelect(oldSection.key);
    render();
    expect(map().focusedExposureGap).toBe(focused);
    oldProps.onSelect(null);
    render();
    expect(map().focusedExposureGap).toBe(focused);
  });

  it('candidate selection clears old focus and retains its own mapped fragments', async () => {
    await loadA();
    await setMode('mrt_lrt');
    const oldSection = focusFirstSection();
    await choose('mrt:21624');
    expect(map().focusedExposureGap).toBeNull();
    expect(explorer().model.sections.length).toBeGreaterThan(0);
    expect(explorer().model.sections.some(section => section.key === oldSection.key)).toBe(false);
    focusFirstSection();
    expect(walkMetrics(summary().score, false, summary().option)).toMatchObject({ distance: 109.2, coverage: 0, uncovered: null, longest: null });
    expect(elements(tree).filter(element => element.type === ScoreCard)).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shortest excludes sheltered sections and returning does not resurrect old focus', async () => {
    await loadA();
    await setMode('mrt_lrt');
    focusFirstSection();
    await setRouteMode('shortest');
    expect(map().focusedExposureGap).toBeNull();
    expect(explorer().model.status).toBe('unavailable');
    expect(explorer().model.sections).toHaveLength(0);
    await setRouteMode('shiokest');
    expect(explorer().model.sections.length).toBeGreaterThan(0);
    expect(map().focusedExposureGap).toBeNull();
  });

  it('same-postal resubmission clears focus immediately while the next reads wait', async () => {
    await loadA();
    focusFirstSection();
    const nextScore = deferred<ScoreRecord|null>(), nextGeometry = deferred<PostalGeom|null>();
    scores.set(A,nextScore);
    geometries.set(A,nextGeometry);
    const pending = submit(A);
    expect(map().focusedExposureGap).toBeNull();
    nextScore.resolve(sourceScore);
    nextGeometry.resolve(sourceGeometry);
    await settle();
    await pending;
    expect(map().focusedExposureGap).toBeNull();
  });

  it('opening About data clears a focus whose explorer is no longer visible', async () => {
    await loadA();
    focusFirstSection();
    const about = child<ComponentProps<typeof DataDetails>>(DataDetails).props;
    about.onToggle!({ currentTarget: { open: true } } as React.ToggleEvent<HTMLDetailsElement>);
    render();
    expect(map().focusedExposureGap).toBeNull();
    expect(elements(tree).filter(element => element.type === ExposureSectionExplorer)).toHaveLength(0);
  });

  it('a successful explicit preview cannot retain or reopen a published section', async () => {
    await previewReady();
    const oldProps = explorer();
    const oldSection = focusFirstSection();
    const request = allowPreview();
    await startPreview();
    expect(map().focusedExposureGap).toBeNull();
    request.resolve(Response.json({ ok: true, route_geometry: originalGeometry.candidates['mrt:21624'].sheltered_parts[0], total_distance_m:109.2 }));
    await settle();
    expect(summary().option).toBeUndefined();
    expect(explorer().model.status).toBe('unavailable');
    oldProps.onSelect(oldSection.key);
    render();
    expect(map().focusedExposureGap).toBeNull();
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
      expect(nodeText(tree)).not.toContain('Checking this stop...');
      expect(nodeText(tree)).not.toContain('No route could be loaded to this stop.');
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

describe('T03 displayed comparison diagnostic context', () => {
  it('keeps the comparison context and route identities when hidden primary geometry completes', async () => {
    const view = () => child<ComponentProps<typeof HomeComparison>>(HomeComparison).props;
    comparisonStored = JSON.stringify({ version: 1, postals: [A], category: 'bus', activePostal: A });
    mount();
    const primaryLoad = submit(A);
    scores.get(A)!.resolve(sourceScore);
    await settle();
    expect(summary().postal).toBe(A);
    expect(map().routes).toEqual([]);
    expect(dependencies.fetchGeomForPostal).toHaveBeenCalledTimes(1);

    // Complete only the comparison request; the primary request stays pending.
    dependencies.fetchGeomForPostal.mockImplementationOnce(() => Promise.resolve(sourceGeometry));
    await clickPageButton('Compare (1)');
    expect(dependencies.fetchGeomForPostal).toHaveBeenCalledTimes(2);
    expect(view().entries[A]).toMatchObject({ status: 'ready', geometryStatus: 'ready' });
    expect(view().entries[A].row?.metrics).toEqual({ distance: 81.2, coverage: 55, uncovered: 36.5, longest: 20.2 });
    expect(map().routes).toHaveLength(1);
    expect(map().routes[0].id).toBe(`comparison:${A}`);
    expect(map().routes[0].geom.sheltered_parts).toEqual(originalGeometry.route_options.bus.sheltered_parts);
    const displayed = map();
    const entry = view().entries[A];
    expect(displayed.diagnosticContext).toBeDefined();

    geometries.get(A)!.resolve(sourceGeometry);
    await primaryLoad;
    await settle();
    expect(view().state).toMatchObject({ category: 'bus', activePostal: A });
    expect(view().entries[A]).toBe(entry);
    expect(map().routes).toBe(displayed.routes);
    expect(map().diagnosticContext).toBe(displayed.diagnosticContext);
    expect(map().mode).toBe(displayed.mode);
    expect(diagnostics()).toEqual([]);

    // Closing proves the hidden delivery was accepted, not ignored to preserve identity.
    view().onClose();
    render();
    await settle();
    expect(summary().postal).toBe(A);
    expect(map().routes).toHaveLength(1);
    expect(map().routes[0].geom.postal).toBe(A);
    expect(map().routes[0].geom.sheltered_parts).toEqual(originalGeometry.sheltered_parts);
    expect(map().diagnosticContext).not.toBe(displayed.diagnosticContext);
    expect(dependencies.fetchGeomForPostal).toHaveBeenCalledTimes(2);
  });
});
