import type { SearchResult } from './onemap-search';
import type { PostalGeom, ScoreRecord, TransitAccessMode, TransitPoiCollection } from './types';
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
  transitPois?: TransitPoiCollection | null,
  origin?: { lat: number; lng: number } | null,
): PublishedTransitOption | null {
  if (!stopId || pool.contextStatus !== 'valid') return null;
  const exact = pool.options.filter(option => option.aliases.includes(stopId));
  if (exact.length) return exact.length === 1 && exact[0].retainable ? exact[0] : null;
  if (!/^mrt:\d+$/.test(stopId) || !transitPois || !origin
      || !Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return null;
  const features = transitPois.features;
  const identified = features.filter(feature => feature.properties?.id === stopId);
  if (identified.length !== 1) return null;
  const poi = identified[0];
  const coordinates = poi.geometry?.coordinates;
  if (poi.properties.kind !== 'mrt_exit' || poi.geometry?.type !== 'Point'
      || !Array.isArray(coordinates) || coordinates.length !== 2
      || !coordinates.every(value => typeof value === 'number' && Number.isFinite(value))
      || Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 90) return null;
  const destination = coordinateKey(coordinates[1], coordinates[0]);
  const start = coordinateKey(origin.lat, origin.lng);
  if (destination === start) return null;
  const matches = pool.options.filter(option => {
    if (!option.retainable || option.classification !== 'routed' || option.category !== 'mrt_lrt'
        || option.aliases.length || option.selectedSource.selectionRef.kind === 'candidate') return false;
    const raw = option.selectedSource.raw;
    const node = raw && typeof raw === 'object' ? (raw as { best_node?: unknown }).best_node : null;
    if (!node || typeof node !== 'object') return false;
    const identity = node as Record<string, unknown>;
    if (identity.type !== 'mrt_lrt_exit' || !(['station', 'exit', 'name'] as const).every(field =>
      typeof identity[field] === 'string' && identity[field] !== '' && identity[field] === poi.properties[field])) return false;
    // Identity ambiguity is rejected before coordinates can act as a tie-breaker.
    if (features.filter(feature => feature.properties?.kind === 'mrt_exit'
        && feature.properties.station === identity.station && feature.properties.exit === identity.exit).length !== 1) return false;
    if (option.geometry.sheltered.status !== 'complete') return false;
    return (['shortest', 'sheltered'] as const).every(variant => {
      const geometry = option.geometry[variant];
      if (geometry.status === 'missing') return true;
      return routeConnectsEndpoints(geometry, start, destination);
    });
  });
  return matches.length === 1 ? matches[0] : null;
}

function coordinateKey(lat: number, lng: number): string {
  // Match the stored precision-5 polyline grid, not a nearest-point distance radius.
  return `${Math.round(lat * 1e5)},${Math.round(lng * 1e5)}`;
}

function routeConnectsEndpoints(geometry: PublishedTransitOption['geometry']['shortest'], start: string, destination: string): boolean {
  if (geometry.status !== 'complete' || !geometry.parts.length) return false;
  const endpoints = new Map<string, number>();
  const neighbors = new Map<string, Set<string>>();
  for (const part of geometry.parts) {
    if (!Array.isArray(part?.points) || part.points.length < 2 || !part.points.every(point =>
      Array.isArray(point) && point.length === 2 && point.every(value => typeof value === 'number' && Number.isFinite(value))
      && Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180)) return false;
    const keys = part.points.map(([lat, lng]) => coordinateKey(lat, lng));
    if (new Set(keys).size < 2) return false;
    for (const key of [keys[0], keys[keys.length - 1]]) endpoints.set(key, (endpoints.get(key) ?? 0) + 1);
    for (let i = 0; i < keys.length; i++) {
      if (!neighbors.has(keys[i])) neighbors.set(keys[i], new Set());
      if (i > 0) {
        neighbors.get(keys[i])!.add(keys[i - 1]);
        neighbors.get(keys[i - 1])!.add(keys[i]);
      }
    }
  }
  // Multipart order is not direction, and two outer ends alone permit disjoint cycles.
  const outer = [...endpoints].filter(([, count]) => count === 1).map(([key]) => key);
  if ([...endpoints.values()].some(count => count > 2)
      || outer.length !== 2 || !outer.includes(start) || !outer.includes(destination)) return false;
  const reached = new Set<string>();
  const pending = [start];
  while (pending.length) {
    const key = pending.pop()!;
    if (reached.has(key)) continue;
    reached.add(key);
    for (const neighbor of neighbors.get(key) ?? []) if (!reached.has(neighbor)) pending.push(neighbor);
  }
  return reached.size === neighbors.size;
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
