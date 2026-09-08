import type { SearchResult } from './onemap-search';
import type { PostalGeom, ScoreRecord, TransitAccessMode } from './types';
import {
  normalizePublishedTransitOptions,
  type PublishedTransitCategory,
  type PublishedTransitNormalizationResult,
  type PublishedTransitOption,
} from './published-transit-options';
import { publishedOptionGeometry } from './published-walk-view';

export interface PublishedWalkSelection {
  result: SearchResult;
  score: ScoreRecord | null;
  geom: PostalGeom | null;
  publishedOption?: PublishedTransitOption | null;
}

export function normalizePublishedSelection(
  selection: PublishedWalkSelection | null,
  category: PublishedTransitCategory,
  bundle: string,
): PublishedTransitNormalizationResult {
  const postal = selection?.result.POSTAL ?? '';
  return normalizePublishedTransitOptions({
    bundle, postal, category, score: selection?.score, geometry: selection?.geom,
    scoreContext: { bundle, postal: selection?.score?.postal ?? postal },
    geometryContext: { bundle, postal: selection?.geom?.postal ?? postal },
  });
}

export function publishedDefault(
  pool: PublishedTransitNormalizationResult,
  mode: TransitAccessMode,
): PublishedTransitOption | null {
  if (pool.contextStatus !== 'valid') return null;
  const kind = mode === 'best_transit' ? 'top_default' : 'category_default';
  return pool.options.find(option => option.sources.some(source =>
    source.selectionRef.kind === kind)) ?? null;
}

export function publishedOptionForStop(
  pool: PublishedTransitNormalizationResult,
  stopId: string | null,
): PublishedTransitOption | null {
  if (!stopId || pool.contextStatus !== 'valid') return null;
  return pool.options.find(option => option.retainable && option.aliases.includes(stopId)) ?? null;
}

export function publishedSelectionView(
  original: PublishedWalkSelection,
  option: PublishedTransitOption | null,
): PublishedWalkSelection {
  if (!option) return { result: original.result, score: null, geom: null, publishedOption: null };
  const source = option.selectedSource.selectionRef;
  let score: ScoreRecord | null = null;
  // Only a default has a score record of its own. Candidate evidence cannot inherit it.
  if (original.score && option.classification !== 'conflict') {
    if (source.kind === 'top_default') score = original.score;
    if (source.kind === 'category_default') {
      const record = original.score.route_options?.[source.category];
      if (record) score = {
        postal: original.score.postal,
        state: record.state,
        total: typeof record.total === 'number' && Number.isFinite(record.total) ? record.total : null,
        subscores: record.subscores ?? null,
        best_node: record.best_node ?? null,
        paths: record.paths ?? null,
        exposure_gaps: record.exposure_gaps ?? null,
        data_as_of: original.score.data_as_of,
        provenance: { source: 'published_category_view', category: source.category, context_provenance: original.score.provenance },
      };
    }
  }
  return {
    result: original.result,
    score,
    geom: publishedOptionGeometry(original.result.POSTAL, option),
    publishedOption: option,
  };
}

export function publishedChoiceTarget(option: PublishedTransitOption): {
  mode: TransitAccessMode; stopId: string | null;
} {
  const source = option.selectionRef;
  if (source.kind === 'top_default') return { mode: 'best_transit', stopId: null };
  if (source.kind === 'category_default') return { mode: source.category, stopId: null };
  return { mode: option.category, stopId: source.nodeId };
}
