import { normalizePublishedTransitOptions } from './published-transit-options';

type Obj = Record<string, unknown>;
const object = (value: unknown): Obj | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Obj : null;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const increment = (counts: Record<string, number>, key: string) => { counts[key] = (counts[key] ?? 0) + 1; };

export interface CoverageInput {
  bundle: string;
  postal: string;
  indexed: boolean;
  score: unknown;
  geometry: unknown;
  geometryLookup: 'record_present' | 'not_read' | 'not_indexed' | 'indexed_file_missing' | 'indexed_record_missing';
}

/** Read-only capabilities, using the same normalizer as the visible walk picker. */
export function coverageGapRow(input: CoverageInput) {
  const row = object(input.score), provenance = object(row?.provenance), subscores = object(row?.subscores);
  const reason = typeof provenance?.reason === 'string' ? provenance.reason : null;
  const state = typeof row?.state === 'string' ? row.state : null;
  const knownStates = ['SCORED', 'SCORED_PARTIAL', 'NO_TRANSIT_IN_RANGE', 'NOT_YET_SCORED'];
  const identity = row?.postal === input.postal;
  const validRecord = identity && knownStates.includes(state ?? '');
  const evidenceReason = validRecord ? reason : null;
  const context = { bundle: input.bundle, postal: input.postal };
  const categories = input.geometryLookup === 'not_read' ? [] : (['bus', 'mrt_lrt'] as const).map(category => {
    const normalized = normalizePublishedTransitOptions({ ...context, category, score: input.score, geometry: input.geometry,
      scoreContext: context, geometryContext: context });
    const statuses: Record<string, number> = {}, classifications: Record<string, number> = {}, diagnostics: Record<string, number> = {};
    for (const item of normalized.options) {
      increment(statuses, item.status); increment(classifications, item.classification);
      for (const reason of item.diagnostics) increment(diagnostics, reason);
    }
    for (const reason of normalized.diagnostics) increment(diagnostics, reason);
    for (const rejected of normalized.rejectedSources) for (const reason of rejected.reasons) increment(diagnostics, reason);
    return { category, context: normalized.contextStatus, options: normalized.options.length,
      retainable: normalized.options.filter(option => option.retainable).length,
      candidateBackedOptions: normalized.options.filter(option => option.sources.some(source => source.selectionRef.kind === 'candidate')).length,
      statuses, classifications, diagnostics, rejectedSources: normalized.rejectedSources.length };
  });
  return {
    postal: input.postal,
    addressEvidence: input.indexed ? 'published_index' : 'outside_published_index_not_proof_of_missing_address',
    scoreRecord: input.score == null ? 'missing' : validRecord ? 'present' : 'invalid',
    state,
    completeLockedFields: !!validRecord && finite(row?.total) && ['access', 'bus', 'crossing', 'heat', 'rain'].every(key => finite(subscores?.[key])),
    reason,
    sourceStatus: typeof provenance?.source_status === 'string' ? provenance.source_status : null,
    coordinateGap: state === 'NOT_YET_SCORED' && evidenceReason === 'missing_coordinates_after_bounded_geocode'
      && provenance?.source_status === 'NEEDS_GEOCODE' ? 'explicit_recorded_coordinate_gap' : 'not_established',
    routeDisconnection: evidenceReason === 'transit_candidates_graph_disconnected' ? 'explicit_recorded_reason' : 'not_established',
    // NO_TRANSIT_IN_RANGE also represents trust/availability rejection. It is not a measured distance.
    rangeLimit: evidenceReason === 'all_routed_transit_candidates_beyond_access_range'
      ? finite(provenance?.nearest_routed_m) && finite(provenance?.access_zero_credit_m)
        && provenance.access_zero_credit_m >= 0 && provenance.nearest_routed_m > provenance.access_zero_credit_m
        ? 'explicit_recorded_distance_limit' : 'recorded_range_reason_unverified'
      : validRecord && state === 'NO_TRANSIT_IN_RANGE' ? 'eligibility_state_distance_cause_not_established' : 'not_established',
    trustRejection: evidenceReason === 'all_numeric_transit_candidates_rejected_by_bus_route_trust_gate',
    geometryLookup: input.geometryLookup,
    categoryInspection: input.geometryLookup === 'not_read' ? 'not_read' : 'inspected',
    categories,
  };
}
