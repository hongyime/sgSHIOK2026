import type { ScoreRecord } from './types';
import type { MetricCapability, PublishedTransitOption } from './published-transit-options';

export interface WalkMetrics {
  distance: number | null;
  coverage: number | null;
  uncovered: number | null;
  longest: number | null;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const nonnegative = (n: unknown): n is number => finite(n) && n >= 0;
const object = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const emptyMetrics = () => ({ distance: null, coverage: null, uncovered: null, longest: null });

function metricValue(metric: MetricCapability): number | null {
  return metric.status === 'valid' && nonnegative(metric.value) ? metric.value : null;
}

export function isPublishedRoute(option: PublishedTransitOption | null): boolean {
  return option?.classification === 'routed' && [
    'published_routed', 'published_routed_partial_metrics', 'geometry_unavailable', 'geometry_partial',
  ].includes(option.status);
}

// Compatibility path for the original default and explicitly labelled live preview.
function rawRouteKind(score: ScoreRecord | null): 'routed' | 'preview' | 'unavailable' {
  const type = score?.paths?.routing_type;
  const provenance = object(score?.provenance);
  if (type === 'live_onemap_preview' && provenance?.authoritative_score === false) return 'preview';
  if (!score || provenance?.authoritative_score === false || provenance?.source === 'live_onemap_preview' ||
      !['SCORED', 'SCORED_PARTIAL', 'NO_TRANSIT_IN_RANGE'].includes(score.state)) return 'unavailable';
  const nodeType = score.best_node?.type;
  if (nodeType !== 'bus_stop' && nodeType !== 'mrt_lrt_exit') return 'unavailable';
  const connector = nodeType === 'bus_stop' ? 'bus_stop' : 'mrt_lrt_exit';
  return ['sheltered', 'shortest_fallback', 'shortest_due_to_detour'].some(base =>
    type === base || type === `${base}_with_${connector}_access_connector`) ? 'routed' : 'unavailable';
}

export function walkMetrics(score: ScoreRecord | null, shortest = false, option?: PublishedTransitOption | null): WalkMetrics {
  if (option !== undefined) {
    if (!option || !isPublishedRoute(option)) return emptyMetrics();
    const distance = metricValue(shortest ? option.metrics.shortest_m : option.metrics.sheltered_m);
    const ratio = metricValue(shortest ? option.metrics.shortest_covered_ratio : option.metrics.covered_ratio);
    const gaps = shortest ? null : option.gaps.sheltered.logical;
    return {
      distance: distance !== null && distance > 0 ? distance : null,
      coverage: ratio !== null && ratio <= 1 ? Math.round(ratio * 100) : null,
      uncovered: gaps?.status === 'complete' ? metricValue(gaps.total_m) : null,
      longest: gaps?.status === 'complete' ? metricValue(gaps.longest_m) : null,
    };
  }
  if (rawRouteKind(score) === 'unavailable') return emptyMetrics();
  const paths = score?.paths;
  const distance = shortest ? paths?.shortest_m : paths?.sheltered_m;
  const ratio = shortest ? paths?.shortest_covered_ratio : paths?.covered_ratio;
  // Published exposure gaps describe the sheltered route. Do not attach them to a different walk.
  const gaps = shortest ? null : score?.exposure_gaps;
  const lengths = Array.isArray(gaps) ? gaps.map(gap => object(gap)?.len_m) : null;
  const complete = lengths !== null && lengths.every(nonnegative);
  const total = complete ? lengths.reduce((sum, length) => sum + length, 0) : null;
  const longest = complete ? lengths.reduce((max, length) => Math.max(max, length), 0) : null;
  return {
    distance: finite(distance) && distance > 0 ? distance : null,
    coverage: nonnegative(ratio) && ratio <= 1 ? Math.round(ratio * 100) : null,
    uncovered: nonnegative(total) ? total : null,
    longest: nonnegative(total) && nonnegative(longest) ? longest : null,
  };
}

export function availabilityNotice(score: ScoreRecord | null, option?: PublishedTransitOption | null): string | null {
  const normalized = option !== undefined;
  const routed = normalized ? isPublishedRoute(option) : rawRouteKind(score) === 'routed';
  const state = normalized ? option?.state : score?.state;
  const source = normalized ? object(option?.selectedSource.raw) : score;
  const reason = object(source?.provenance)?.reason;
  const routedM = normalized ? option && metricValue(option.metrics.routed_m) : score?.best_node?.routed_m;
  if (state === 'NO_TRANSIT_IN_RANGE' && (reason === 'all_routed_transit_candidates_beyond_access_range' ||
      (routed && finite(routedM) && routedM > 1200))) return 'Outside the 1.2 km scoring range.';
  if (!normalized && rawRouteKind(score) === 'preview') return 'Preview only; not a published walk.';
  if (normalized ? option?.classification === 'unrouted' : score?.paths?.routing_type === 'direct_bus_fallback_unrouted') {
    return 'Straight-line estimate; no verified walk.';
  }
  if (!normalized && !score) return 'No shelter-map walk is published for this postal yet.';
  if (!routed) return 'No published walk is available for this destination.';
  if (state === 'NO_TRANSIT_IN_RANGE') return 'Locked score unavailable for this destination.';
  return null;
}
