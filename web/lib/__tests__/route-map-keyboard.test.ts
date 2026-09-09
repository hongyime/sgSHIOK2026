import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { PostalGeom } from '../types';
import { readPublishedFixture } from './fixtures/published-data';

// Execute the component's effects against a canvas double. Real Tab order,
// event bubbling, focus visibility and MapLibre movement need browser acceptance.
const hooks = vi.hoisted(() => {
  let index = 0, dirty = false;
  const slots: any[] = [], effects: (() => void)[] = [];
  const changed = (a: unknown[] | undefined, b: unknown[]) =>
    !a || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const cleanup = (slot: any) => {
    const run = slot.cleanup;
    slot.cleanup = undefined;
    run?.();
  };
  return {
    begin() { index = 0; dirty = false; },
    flush() { effects.splice(0).forEach(run => run()); return dirty; },
    reset() { slots.length = 0; effects.length = 0; },
    unmount() { slots.forEach(cleanup); },
    useRef(value: unknown) { const i = index++; return slots[i] ??= { current: value }; },
    useState(initial: any) {
      const i = index++;
      const slot = slots[i] ??= { value: typeof initial === 'function' ? initial() : initial };
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
const lib = vi.hoisted(() => ({ instance: null as any, construct: vi.fn() }));
vi.mock('maplibre-gl', () => ({
  Map: class { constructor(options: unknown) { lib.construct(options); return lib.instance; } },
  Popup: class {}, setWorkerUrl: vi.fn(), addProtocol: vi.fn(),
}));
import { RouteEvidenceMap } from '../../components/route-evidence-map';

type Props = ComponentProps<typeof RouteEvidenceMap>;
function incompleteMap() {
  // These defaults are the installed MapLibre 6.1 canvas contract (map.ts).
  const attributes = new Map([['tabindex', '0'], ['role', 'region'], ['aria-label', 'Map']]);
  const canvas = {
    style: { cursor: '' },
    setAttribute: vi.fn((name: string, value: string) => { attributes.set(name, value); }),
    getAttribute: (name: string) => attributes.get(name) ?? null,
  };
  const handlers = new Map<string, Set<(...args: any[]) => void>>();
  const map = {
    canvas, handlers,
    getCanvas: () => canvas,
    on(event: string, listener: (...args: any[]) => void) {
      const listeners = handlers.get(event) ?? new Set();
      listeners.add(listener); handlers.set(event, listeners); return map;
    },
    emit(event: string, value: unknown) { [...(handlers.get(event) ?? [])].forEach(listener => listener(value)); },
    remove: vi.fn(() => handlers.clear()),
  };
  return map;
}

let map: ReturnType<typeof incompleteMap>, props: Props;
let tree: ReturnType<typeof RouteEvidenceMap>;
const container = {};
function render(update: Partial<Props> = {}) {
  props = { ...props, ...update };
  let again = true, passes = 0;
  while (again) {
    if (++passes > 20) throw Error('Unbounded component effect loop');
    hooks.begin();
    tree = RouteEvidenceMap(props);
    tree.props.children[0].props.ref.current = container;
    again = hooks.flush();
  }
}
async function settle() {
  await vi.dynamicImportSettled();
  for (let i = 0; i < 12; i++) await Promise.resolve();
}
function summary() {
  return tree.props.children.find((child: any) => child?.type === 'p' && child.props.id);
}

beforeEach(() => {
  vi.useFakeTimers(); hooks.reset(); lib.construct.mockReset();
  map = incompleteMap(); lib.instance = map;
  const geom = readPublishedFixture<PostalGeom[]>('geom/h3/886520db39fffff.json').find(row => row.postal === '018956')!;
  props = {
    routes: [{ id: '018956', label: 'Published fixture', color: '#008f86', geom }],
    mode: 'shiokest', onStatusChange: vi.fn(),
  };
  vi.stubGlobal('window', { location: { search: '' }, matchMedia: () => ({ matches: true }) });
});
afterEach(async () => {
  hooks.unmount(); await settle(); vi.useRealTimers(); vi.unstubAllGlobals();
});

describe('T25: keyboard focus belongs to the MapLibre canvas', () => {
  it('does not add a dead outer Tab stop or image semantics around the interactive canvas', async () => {
    render(); await settle();
    const wrapper = tree.props.children[0].props;
    expect(wrapper.tabIndex === undefined || wrapper.tabIndex < 0).toBe(true);
    expect(wrapper.role).not.toBe('img');
    expect(wrapper.onKeyDown).toBeUndefined();
    expect(map.canvas.getAttribute('tabindex')).toBe('0');
    expect(map.canvas.getAttribute('role')).toBe('region');
    expect(lib.construct.mock.calls[0][0].keyboard).not.toBe(false);
  });

  it('labels and describes the real focus target before the first load event', async () => {
    render(); await settle();
    expect(map.handlers.get('load')?.size).toBe(1);
    expect(map.canvas.getAttribute('aria-label')).toBe('Shelter-map view for Published fixture, showing sheltered walk');
    expect(map.canvas.getAttribute('aria-describedby')).toBe(summary().props.id);
    expect(summary().props.children).toContain('Published fixture');
    expect(props.onStatusChange).not.toHaveBeenCalledWith('error', expect.anything(), expect.anything());
  });

  it('updates selection and mode metadata without reconstructing the map', async () => {
    render(); await settle();
    const previousSummary = summary().props.children;
    const routes = props.routes.map(route => ({ ...route, label: 'Changed walk' }));
    render({ routes, mode: 'shortest' });
    expect(map.canvas.getAttribute('aria-label')).toBe('Shelter-map view for Changed walk, showing shortest walk');
    expect(map.canvas.getAttribute('aria-describedby')).toBe(summary().props.id);
    expect(summary().props.children).not.toBe(previousSummary);
    expect(summary().props.children).toContain('Changed walk');
    expect(lib.construct).toHaveBeenCalledTimes(1);
  });

  it('uses current metadata when selection changes before async construction completes', async () => {
    render();
    const routes = props.routes.map(route => ({ ...route, label: 'Latest walk' }));
    render({ routes, mode: 'both' }); await settle();
    expect(map.canvas.getAttribute('aria-label')).toBe('Shelter-map view for Latest walk, showing shortest and sheltered walks');
    expect(map.canvas.getAttribute('aria-describedby')).toBe(summary().props.id);
    expect(lib.construct).toHaveBeenCalledTimes(1);
  });

  it('removes stale walk labeling when the selected route is cleared', async () => {
    render(); await settle(); render({ routes: [] });
    expect(map.canvas.getAttribute('aria-label')).toBe('Singapore shelter route map');
    expect(summary().props.children).not.toContain('Published fixture');
    expect(lib.construct).toHaveBeenCalledTimes(1);
  });

  it('labels a replacement canvas after pre-load retry without mutating the retired canvas', async () => {
    render(); await settle();
    const retired = map;
    retired.emit('error', { sourceId: 'onemap' });
    map = incompleteMap(); lib.instance = map;
    render({ retryKey: 1 }); await settle(); render();
    expect(retired.remove).toHaveBeenCalledTimes(1);
    expect(map.canvas.getAttribute('aria-label')).toBe('Shelter-map view for Published fixture, showing sheltered walk');
    expect(map.canvas.getAttribute('aria-describedby')).toBe(summary().props.id);
    const retiredWrites = retired.canvas.setAttribute.mock.calls.length;
    render({ routes: [], mode: 'shortest' });
    expect(map.canvas.getAttribute('aria-label')).toBe('Singapore shelter route map');
    expect(retired.canvas.setAttribute).toHaveBeenCalledTimes(retiredWrites);
    expect(lib.construct).toHaveBeenCalledTimes(2);
  });
});
