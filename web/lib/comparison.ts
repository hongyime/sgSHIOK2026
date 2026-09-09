import {
  normalizePublishedTransitOptions,
  type GeometryCapability,
  type LogicalGapCapability,
  type MetricCapability,
  type PublishedOptionSelectionRef,
  type PublishedOptionSource,
  type PublishedTransitCategory,
  type PublishedTransitNormalizationInput,
  type PublishedTransitNormalizationResult,
  type PublishedTransitOption,
} from './published-transit-options';
import { declaredPublishedTransitDefault } from './published-transit-choices';
import { availabilityNotice, isPublishedRoute, walkMetrics, type WalkMetrics } from './walk-metrics';

export type ComparisonRowReason =
  | 'context_invalid' | 'preview_only' | 'default_missing' | 'default_invalid'
  | 'default_unrouted' | 'evidence_conflict' | 'metrics_unavailable'
  | 'geometry_incomplete' | 'metrics_incomplete' | 'destination_missing';

export interface ComparisonRow {
  policy: 'category_default_sheltered_v1';
  routeVariant: 'sheltered';
  bundle: string;
  postal: string;
  category: PublishedTransitCategory;
  // Group identity; selectionRef pins the source rather than the group's selected alternate.
  optionKey: string | null;
  selectionRef: PublishedOptionSelectionRef | null;
  destination: string | null;
  availability: 'available' | 'partial' | 'unavailable';
  reason: ComparisonRowReason | null;
  metrics: WalkMetrics;
  notice: string | null;
  evidence: {
    contextStatus: PublishedTransitNormalizationResult['contextStatus'];
    optionStatus: PublishedTransitOption['status'] | null;
    geometryStatus: GeometryCapability['status'] | null;
    logicalGapStatus: LogicalGapCapability['status'] | null;
    // Original source units: coverage remains a ratio here, but metrics.coverage is percent.
    metricCapabilities: Record<keyof WalkMetrics, MetricCapability> | null;
    diagnostics: string[];
    // Original-score field locators, not audited digests or embedded source payloads.
    provenanceRefs: string[];
  };
}

type ObjectRecord = Record<string, unknown>;
const object = (value: unknown): ObjectRecord | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as ObjectRecord : null;
const own = (value: ObjectRecord | null, key: string): boolean => !!value && Object.prototype.hasOwnProperty.call(value, key);

function sameSource(a: PublishedOptionSelectionRef, b: PublishedOptionSelectionRef): boolean {
  if (a.kind === 'category_default') return b.kind === a.kind && b.category === a.category;
  if (a.kind === 'candidate') return b.kind === a.kind && b.nodeId === a.nodeId;
  return b.kind === 'top_default';
}

// Keep the source's role and original evidence; remove only competing representations.
function normalizeSource(input: PublishedTransitNormalizationInput, source: PublishedOptionSource): PublishedTransitOption | null {
  const score: ObjectRecord = { ...object(input.score), candidates: [] };
  if (source.selectionRef.kind !== 'top_default') delete score.best_node;
  if (source.selectionRef.kind !== 'category_default') {
    const categories = { ...object(score.route_options) };
    delete categories[input.category];
    score.route_options = categories;
  }
  if (source.selectionRef.kind === 'candidate') score.candidates = [source.raw];
  const pool = normalizePublishedTransitOptions({ ...input, score });
  return pool.options.find(option => sameSource(option.selectedSource.selectionRef, source.selectionRef)) ?? null;
}

function comparisonMetricConflicts(input: PublishedTransitNormalizationInput, group: PublishedTransitOption): string[] {
  // Partial geometry cannot verify a line, but its valid metrics can contradict an alias.
  const sources = group.sources.map(source => normalizeSource(input, source)).filter(
    (option): option is PublishedTransitOption => option !== null && isPublishedRoute(option) && option.geometry.sheltered.status !== 'invalid',
  );
  return (['shortest_m', 'sheltered_m', 'covered_ratio'] as const).flatMap(field => {
    const values = new Set(sources.flatMap(option => {
      const capability = option.metrics[field];
      return capability.status === 'valid' ? [capability.value] : [];
    }));
    return values.size > 1 ? [`comparison_evidence_conflict:${field}`] : [];
  });
}

/** Resolve one declared walk once so comparison text and map use the same source. */
export function resolveComparisonWalk(input: PublishedTransitNormalizationInput): {
  row: ComparisonRow; option: PublishedTransitOption | null;
} {
  const pool = normalizePublishedTransitOptions(input);
  const score = object(input.score);
  const categories = object(score?.route_options);
  const categoryDeclared = own(categories, input.category);
  const group = declaredPublishedTransitDefault(pool, input.category);
  const diagnostics = [...pool.diagnostics, ...(group?.diagnostics ?? [])];
  let resolved: PublishedTransitOption | null = null;
  let reason: ComparisonRowReason | null = null;

  if (pool.contextStatus !== 'valid') {
    reason = pool.contextStatus === 'preview_only' ? 'preview_only' : 'context_invalid';
  } else if (score?.route_options != null && !categories) {
    reason = 'default_invalid';
    diagnostics.push('route_options_invalid');
  } else if (!group) {
    reason = categoryDeclared ? 'default_invalid' : 'default_missing';
  } else {
    const expectedSource = (ref: PublishedOptionSelectionRef): boolean => categoryDeclared
      ? ref.kind === 'category_default' && ref.category === input.category
      : ref.kind === 'top_default';
    const declaredSource = group.sources.find(source => expectedSource(source.selectionRef));
    if (!declaredSource) {
      reason = 'default_invalid';
      diagnostics.push('declared_default_missing_from_pool');
    } else if (group.classification === 'conflict') {
      // Pinning a source must not erase a contradiction established by its aliases.
      resolved = group;
      reason = 'evidence_conflict';
    } else if (expectedSource(group.selectedSource.selectionRef)) {
      resolved = group;
    } else {
      // A group can own the default key while selecting a healthier alternate.
      const declared = normalizeSource(input, declaredSource);
      if (declared && expectedSource(declared.selectedSource.selectionRef)) {
        resolved = declared;
        diagnostics.push(...declared.diagnostics);
      } else {
        reason = 'default_invalid';
        diagnostics.push('declared_source_unresolved');
      }
    }
  }

  if (reason === null && group && resolved && isPublishedRoute(resolved) && resolved.geometry.sheltered.status !== 'invalid') {
    const conflicts = comparisonMetricConflicts(input, group);
    if (conflicts.length) {
      reason = 'evidence_conflict';
      diagnostics.push(...conflicts);
    }
  }

  const metrics = walkMetrics(null, false, reason === 'evidence_conflict' ? null : resolved ?? null);
  let availability: ComparisonRow['availability'] = 'unavailable';
  if (reason === null && resolved) {
    if (resolved.classification === 'preview') reason = 'preview_only';
    else if (resolved.classification === 'conflict') reason = 'evidence_conflict';
    else if (resolved.classification === 'unrouted') reason = 'default_unrouted';
    else if (!isPublishedRoute(resolved)) reason = 'default_invalid';
    else if (Object.values(metrics).every(value => value === null)) reason = 'metrics_unavailable';
    else {
      availability = 'partial';
      if (resolved.geometry.sheltered.status !== 'complete') reason = 'geometry_incomplete';
      else if (Object.values(metrics).some(value => value === null)) reason = 'metrics_incomplete';
      else if (resolved.name === null) reason = 'destination_missing';
      else availability = 'available';
    }
  }

  const provenanceRefs: string[] = [];
  if (pool.contextStatus === 'valid' && own(score, 'provenance') && score?.provenance != null) provenanceRefs.push('provenance');
  const selectedSource = object(resolved?.selectedSource.raw);
  if (resolved?.selectedSource.selectionRef.kind === 'category_default' &&
      own(selectedSource, 'provenance') && selectedSource?.provenance != null) {
    provenanceRefs.push(`route_options.${input.category}.provenance`);
  }
  const gaps = resolved?.gaps.sheltered.logical;
  const row: ComparisonRow = {
    policy: 'category_default_sheltered_v1',
    routeVariant: 'sheltered',
    bundle: input.bundle,
    postal: input.postal,
    category: input.category,
    optionKey: resolved ? group?.key ?? resolved.key : null,
    selectionRef: resolved?.selectedSource.selectionRef ?? null,
    destination: resolved?.name ?? null,
    availability,
    reason,
    metrics,
    notice: resolved ? availabilityNotice(null, resolved) : null,
    evidence: {
      contextStatus: pool.contextStatus,
      optionStatus: resolved?.status ?? null,
      geometryStatus: resolved?.geometry.sheltered.status ?? null,
      logicalGapStatus: gaps?.status ?? null,
      metricCapabilities: resolved && gaps ? {
        distance: resolved.metrics.sheltered_m,
        coverage: resolved.metrics.covered_ratio,
        uncovered: gaps.total_m,
        longest: gaps.longest_m,
      } : null,
      diagnostics: [...new Set(diagnostics)].sort(),
      provenanceRefs,
    },
  };
  return {
    row,
    option: row.availability !== 'unavailable' && isPublishedRoute(resolved) ? resolved : null,
  };
}

/** Project one postal's declared default, not its ranked or currently inspected alternative. */
export function buildComparisonRow(input: PublishedTransitNormalizationInput): ComparisonRow {
  return resolveComparisonWalk(input).row;
}
