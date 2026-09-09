import { resolveComparisonWalk, type ComparisonRow } from './comparison';
import {
  comparisonRequestMatches, emptyComparisonState, readComparisonState,
  transitionComparison, writeComparisonState, type ComparisonAction,
  type ComparisonRejection, type ComparisonRequest, type ComparisonState,
  type ComparisonStorageAccess,
} from './comparison-state';
import type { PublishedTransitOption } from './published-transit-options';
import type { PostalGeom, ScoreRecord } from './types';

export interface ComparisonSource {
  bundle: string;
  score(postal: string): Promise<ScoreRecord | null>;
  geometry(postal: string): Promise<PostalGeom | null>;
}

export interface ComparisonEntry {
  postal: string;
  status: 'loading' | 'ready' | 'error';
  geometryStatus: 'loading' | 'ready' | 'error';
  row: ComparisonRow | null;
  option: PublishedTransitOption | null;
}

export interface ComparisonSnapshot {
  state: ComparisonState;
  open: boolean;
  restored: boolean;
  storageUnavailable: boolean;
  entries: Readonly<Record<string, ComparisonEntry>>;
}

interface PendingEntry {
  token: ComparisonRequest;
  score: ScoreRecord | null;
  geometry: PostalGeom | null;
  scoreStatus: ComparisonEntry['status'];
  geometryStatus: ComparisonEntry['geometryStatus'];
}

/** Owns request lifetimes; transport caching remains in the existing static-data reader. */
export function createComparisonController(initialSource: ComparisonSource, storage: ComparisonStorageAccess) {
  let source = initialSource;
  let serial = 0;
  let snapshot: ComparisonSnapshot = {
    state: emptyComparisonState(), open: false, restored: false,
    storageUnavailable: false, entries: {},
  };
  const pending = new Map<string, PendingEntry>();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  const current = (entry: PendingEntry) => comparisonRequestMatches(
    entry.token, pending.get(entry.token.postal)?.token ?? null,
    { state: snapshot.state, open: snapshot.open, bundle: source.bundle },
  );

  function publish(entry: PendingEntry) {
    if (!current(entry)) return;
    const { postal, bundle, category } = entry.token;
    const walk = entry.scoreStatus === 'ready' ? resolveComparisonWalk({
      bundle, postal, category, score: entry.score, geometry: entry.geometry,
      scoreContext: { bundle, postal: entry.score?.postal ?? postal },
      geometryContext: { bundle, postal: entry.geometry?.postal ?? postal },
    }) : { row: null, option: null };
    snapshot = { ...snapshot, entries: { ...snapshot.entries, [postal]: {
      postal, status: entry.scoreStatus, geometryStatus: entry.geometryStatus, ...walk,
    } } };
    emit();
  }

  function load(postal: string) {
    if (!snapshot.open || !snapshot.state.postals.includes(postal)) return;
    const entry: PendingEntry = {
      token: { postal, bundle: source.bundle, category: snapshot.state.category, requestId: ++serial },
      score: null, geometry: null, scoreStatus: 'loading', geometryStatus: 'loading',
    };
    const transport = source;
    pending.set(postal, entry);
    publish(entry);
    // Even synchronous transport throws are isolated to this column. No automatic retries.
    void Promise.resolve().then(() => current(entry) ? transport.score(postal) : null).then(score => {
      if (!current(entry)) return;
      entry.score = score;
      entry.scoreStatus = 'ready';
      publish(entry);
    }).catch(() => {
      if (!current(entry)) return;
      entry.scoreStatus = 'error';
      publish(entry);
    });
    void Promise.resolve().then(() => current(entry) ? transport.geometry(postal) : null).then(geometry => {
      if (!current(entry)) return;
      entry.geometry = geometry;
      entry.geometryStatus = 'ready';
      publish(entry);
    }).catch(() => {
      if (!current(entry)) return;
      entry.geometryStatus = 'error';
      publish(entry);
    });
  }

  function restore() {
    if (snapshot.restored) return;
    const result = readComparisonState(storage);
    snapshot = { ...snapshot, state: result.state, restored: true, storageUnavailable: result.status === 'unavailable' };
    emit();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    restore,
    dispatch(action: ComparisonAction): ComparisonRejection | null {
      restore();
      const previous = snapshot.state;
      const result = transitionComparison(previous, action);
      if (result.reason || result.state === previous || (action.type === 'reset' && previous.postals.length === 0)) return result.reason;
      const categoryChanged = previous.category !== result.state.category;
      const entries = { ...snapshot.entries };
      for (const postal of pending.keys()) {
        if (categoryChanged || !result.state.postals.includes(postal)) {
          pending.delete(postal);
          delete entries[postal];
        }
      }
      snapshot = { ...snapshot, state: result.state, entries,
        storageUnavailable: writeComparisonState(storage, result.state) !== 'saved' };
      emit();
      if (snapshot.open) snapshot.state.postals.forEach(postal => { if (!pending.has(postal)) load(postal); });
      return null;
    },
    setOpen(open: boolean) {
      restore();
      if (snapshot.open === open) return;
      pending.clear();
      snapshot = { ...snapshot, open, entries: {} };
      emit();
      if (open) snapshot.state.postals.forEach(load);
    },
    retry(postal: string) { load(postal); },
    setSource(next: ComparisonSource) {
      if (source === next) return;
      pending.clear();
      source = next;
      snapshot = { ...snapshot, entries: {} };
      emit();
      if (snapshot.open) snapshot.state.postals.forEach(load);
    },
  };
}
