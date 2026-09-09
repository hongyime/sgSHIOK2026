import { resolveComparisonWalk, type ComparisonRow } from './comparison';
import {
  comparisonRequestMatches, decodeComparisonState, emptyComparisonState, encodeComparisonState, readComparisonState,
  transitionComparison, writeComparisonState, type ComparisonAction,
  type ComparisonRejection, type ComparisonRequest, type ComparisonState,
  type ComparisonStorageAccess,
} from './comparison-state';
import type { PublishedTransitOption } from './published-transit-options';
import type { PostalGeom, ScoreRecord } from './types';
import { getArtifactFailure, type ArtifactFailure } from './artifact-failure';

export interface ComparisonSource {
  bundle: string;
  score(postal: string): Promise<ScoreRecord | null>;
  geometry(postal: string): Promise<PostalGeom | null>;
}

export interface ComparisonEntry {
  postal: string;
  requestKey: number;
  status: 'loading' | 'ready' | 'error';
  geometryStatus: 'loading' | 'ready' | 'error';
  scoreFailure?: ArtifactFailure | null;
  geometryFailure?: ArtifactFailure | null;
  row: ComparisonRow | null;
  option: PublishedTransitOption | null;
}

export interface ComparisonSnapshot {
  state: ComparisonState;
  open: boolean;
  restored: boolean;
  shared: boolean;
  storageUnavailable: boolean;
  entries: Readonly<Record<string, ComparisonEntry>>;
}

interface PendingEntry {
  token: ComparisonRequest;
  score: ScoreRecord | null;
  geometry: PostalGeom | null;
  scoreStatus: ComparisonEntry['status'];
  geometryStatus: ComparisonEntry['geometryStatus'];
  scoreFailure?: ArtifactFailure | null;
  geometryFailure?: ArtifactFailure | null;
}

/** Owns request lifetimes; transport caching remains in the existing static-data reader. */
export function createComparisonController(initialSource: ComparisonSource, storage: ComparisonStorageAccess) {
  let source = initialSource;
  let serial = 0;
  let snapshot: ComparisonSnapshot = {
    state: emptyComparisonState(), open: false, restored: false, shared: false,
    storageUnavailable: false, entries: {},
  };
  let localState = snapshot.state;
  let localStorageUnavailable = false;
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
      postal, requestKey: entry.token.requestId,
      status: entry.scoreStatus, geometryStatus: entry.geometryStatus,
      ...(entry.scoreStatus === 'error' ? { scoreFailure: entry.scoreFailure ?? null } : {}),
      ...(entry.geometryStatus === 'error' ? { geometryFailure: entry.geometryFailure ?? null } : {}),
      ...walk,
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
    }).catch(error => {
      if (!current(entry)) return;
      entry.scoreStatus = 'error';
      entry.scoreFailure = getArtifactFailure(error);
      publish(entry);
    });
    void Promise.resolve().then(() => current(entry) ? transport.geometry(postal) : null).then(geometry => {
      if (!current(entry)) return;
      entry.geometry = geometry;
      entry.geometryStatus = 'ready';
      publish(entry);
    }).catch(error => {
      if (!current(entry)) return;
      entry.geometryStatus = 'error';
      entry.geometryFailure = getArtifactFailure(error);
      publish(entry);
    });
  }

  function restore() {
    if (snapshot.restored) return;
    const result = readComparisonState(storage);
    snapshot = { ...snapshot, state: result.state, restored: true, storageUnavailable: result.status === 'unavailable' };
    localState = result.state;
    localStorageUnavailable = snapshot.storageUnavailable;
    emit();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    restore,
    loadShared(state: ComparisonState): boolean {
      const encoded = encodeComparisonState(state);
      const validated = encoded === null ? null : decodeComparisonState(encoded);
      if (!validated || validated.postals.length === 0) return false;
      restore();
      pending.clear();
      snapshot = { ...snapshot, state: validated, shared: true, open: true, entries: {} };
      emit();
      snapshot.state.postals.forEach(load);
      return true;
    },
    saveShared(): boolean {
      if (!snapshot.shared) return true;
      if (writeComparisonState(storage, snapshot.state) !== 'saved') {
        snapshot = { ...snapshot, storageUnavailable: true };
        emit();
        return false;
      }
      localState = snapshot.state;
      localStorageUnavailable = false;
      snapshot = { ...snapshot, shared: false, storageUnavailable: false };
      emit();
      return true;
    },
    discardShared() {
      if (!snapshot.shared) return;
      pending.clear();
      snapshot = { ...snapshot, state: localState, shared: false,
        storageUnavailable: localStorageUnavailable, entries: {} };
      emit();
      if (snapshot.open) snapshot.state.postals.forEach(load);
    },
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
      if (!snapshot.shared) {
        localState = result.state;
        localStorageUnavailable = writeComparisonState(storage, result.state) !== 'saved';
      }
      snapshot = { ...snapshot, state: result.state, entries,
        storageUnavailable: snapshot.shared ? snapshot.storageUnavailable : localStorageUnavailable };
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
