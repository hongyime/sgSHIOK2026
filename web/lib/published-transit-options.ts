import { decodePolyline, type LatLng } from './polyline';
import type { TransitAccessMode } from './types';

export type PublishedTransitCategory = Exclude<TransitAccessMode, 'best_transit'>;
export interface PublishedSourceContext { bundle: string; postal: string }
export interface PublishedTransitNormalizationInput extends PublishedSourceContext {
  category: PublishedTransitCategory;
  score: unknown;
  geometry: unknown | null;
  scoreContext: PublishedSourceContext;
  geometryContext: PublishedSourceContext;
}
export type MetricCapability =
  | { status: 'valid'; value: number; sourceField: string }
  | { status: 'missing' | 'invalid'; reason: string; sourceField: string };
export interface PublishedOptionMetrics {
  shortest_m: MetricCapability;
  sheltered_m: MetricCapability;
  covered_ratio: MetricCapability;
  shortest_covered_ratio: MetricCapability;
  covered_m: MetricCapability;
  direct_distance_m: MetricCapability;
  routed_m: MetricCapability;
}
export interface GeometryCapability {
  status: 'missing' | 'invalid' | 'partial' | 'complete';
  parts: { sourceIndex: number; encoded: string; points: LatLng[] }[];
  invalidPartIndices: number[];
  signature: string | null;
  reasons: string[];
}
export interface LogicalGapCapability {
  status: 'missing' | 'invalid' | 'partial' | 'complete' | 'unavailable';
  entries: {
    sourceIndex: number;
    length: MetricCapability;
    label: string | null;
    anchor: { lat: number; lon: number } | null;
    anchorReason: string | null;
  }[];
  total_m: MetricCapability;
  longest_m: MetricCapability;
  reasons: string[];
}
export interface FragmentCapability {
  status: 'missing' | 'invalid' | 'partial' | 'complete' | 'unavailable';
  entries: {
    sourceIndex: number;
    length: MetricCapability;
    encoded: string | null;
    points: LatLng[] | null;
    partIndex: number | null;
    highlightable: boolean;
    reasons: string[];
  }[];
  reasons: string[];
}
export type PublishedOptionSelectionRef =
  | { kind: 'category_default'; category: PublishedTransitCategory }
  | { kind: 'top_default' }
  | { kind: 'candidate'; nodeId: string };
export type PublishedRouteClassification = 'routed' | 'unrouted' | 'unclassified' | 'preview' | 'conflict';
export interface PublishedOptionSource {
  selectionRef: PublishedOptionSelectionRef;
  // Diagnostic evidence only. Renderers must use validated geometry/gaps, never rawGeometry.
  // This source is not a synthesized score record or independent candidate provenance.
  raw: unknown;
  rawGeometry: unknown;
}
export interface PublishedTransitOption {
  key: string;
  category: PublishedTransitCategory;
  aliases: string[];
  selectionRef: PublishedOptionSelectionRef;
  name: string | null;
  state: unknown;
  classification: PublishedRouteClassification;
  status: 'published_routed' | 'published_routed_partial_metrics' | 'published_unrouted'
    | 'geometry_unavailable' | 'geometry_partial' | 'identity_invalid' | 'trust_unclassified'
    | 'preview_only' | 'evidence_conflict';
  metrics: PublishedOptionMetrics;
  // Segment coloring is intentionally unavailable, even if raw source segments are valid.
  geometry: { shortest: GeometryCapability; sheltered: GeometryCapability; routeSegmentsAvailable: false };
  gaps: {
    sheltered: { logical: LogicalGapCapability; fragments: FragmentCapability };
    shortest: { logical: LogicalGapCapability; fragments: FragmentCapability };
  };
  distanceRankable: boolean;
  coverageRankable: boolean;
  retainable: boolean;
  diagnostics: string[];
  selectedSource: PublishedOptionSource;
  sources: PublishedOptionSource[];
}
export interface PublishedTransitNormalizationResult {
  contextStatus: 'valid' | 'invalid' | 'preview_only';
  options: PublishedTransitOption[];
  rejectedSources: { raw: unknown; reasons: string[] }[];
  diagnostics: string[];
  contextProvenance: unknown;
}

type Obj = Record<string, unknown>;
type MetricRule = 'positive' | 'nonnegative' | 'ratio';
type Role = PublishedOptionSelectionRef['kind'];
interface Representation extends PublishedOptionSource {
  role: Role;
  key: string;
  strongId: string | null;
  name: string | null;
  state: unknown;
  classification: PublishedRouteClassification;
  identityValid: boolean;
  metrics: PublishedOptionMetrics;
  geometry: PublishedTransitOption['geometry'];
  gaps: PublishedTransitOption['gaps'];
  diagnostics: string[];
}
const rolePriority: Record<Role, number> = { category_default: 0, top_default: 1, candidate: 2 };
const directType = 'direct_bus_fallback_unrouted';
const baseTypes = ['sheltered', 'shortest_fallback', 'shortest_due_to_detour'];
const own = (o: Obj | null, key: string): boolean => !!o && Object.prototype.hasOwnProperty.call(o, key);
const object = (value: unknown): Obj | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Obj : null;
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const unique = (values: string[]): string[] => [...new Set(values)].sort(compare);
const meaningful = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.trim() === v && !/[\x00-\x1f\x7f]/.test(v);
const categoryForType = (type: unknown): PublishedTransitCategory | null => type === 'bus_stop' ? 'bus' : type === 'mrt_lrt_exit' ? 'mrt_lrt' : null;

function missing(sourceField: string, reason = 'metric_missing'): MetricCapability {
  return { status: 'missing', sourceField, reason };
}
function metric(value: unknown, rule: MetricRule, sourceField: string): MetricCapability {
  if (value == null) return missing(sourceField);
  let reason: string | null = null;
  if (typeof value !== 'number') reason = 'metric_type_invalid';
  else if (!Number.isFinite(value)) reason = 'metric_nonfinite';
  else if (rule === 'ratio' && (value < 0 || value > 1)) reason = 'ratio_out_of_range';
  else if (value < 0) reason = 'metric_negative';
  else if (rule === 'positive' && value === 0) reason = 'zero_walk_length_unestablished';
  return reason ? { status: 'invalid', reason, sourceField } : { status: 'valid', value: value as number, sourceField };
}

// The shared decoder is permissive; validate the precision-5 wire format first.
function inspectPolyline(value: unknown): { points: LatLng[] | null; reason: 'geometry_part_invalid' | 'geometry_degenerate' | null } {
  const invalid = { points: null, reason: 'geometry_part_invalid' as const };
  if (typeof value !== 'string' || value.length === 0) return invalid;
  const components: number[] = [];
  for (let i = 0; i < value.length;) {
    let unsigned = 0;
    let group = 0;
    let done = false;
    while (i < value.length && group < 7) {
      const code = value.charCodeAt(i++);
      if (code < 63 || code > 126) return invalid;
      const byte = code - 63;
      unsigned += (byte & 31) * 2 ** (5 * group++);
      if (unsigned > 0xffffffff) return invalid;
      if (byte < 32) { done = true; break; }
    }
    if (!done) return invalid;
    components.push(unsigned % 2 ? -(unsigned + 1) / 2 : unsigned / 2);
  }
  if (components.length % 2) return invalid;
  if (components.length < 4) return { points: null, reason: 'geometry_degenerate' };
  let lat = 0;
  let lon = 0;
  let first: [number, number] | null = null;
  let distinct = false;
  for (let i = 0; i < components.length; i += 2) {
    lat += components[i]; lon += components[i + 1];
    if (!Number.isSafeInteger(lat) || !Number.isSafeInteger(lon) || Math.abs(lat) > 9000000 || Math.abs(lon) > 18000000) return invalid;
    if (first) distinct ||= first[0] !== lat || first[1] !== lon;
    else first = [lat, lon];
  }
  return distinct ? { points: decodePolyline(value), reason: null } : { points: null, reason: 'geometry_degenerate' };
}
const strictPolyline = (value: unknown): LatLng[] | null => inspectPolyline(value).points;
function emptyGeometry(status: 'missing' | 'invalid', reason: string): GeometryCapability {
  return { status, parts: [], invalidPartIndices: [], signature: null, reasons: [reason] };
}
function geometryCapability(raw: unknown, variant: 'shortest' | 'sheltered'): GeometryCapability {
  if (raw == null) return emptyGeometry('missing', 'geometry_missing');
  const row = object(raw);
  if (!row) return emptyGeometry('invalid', 'geometry_schema_invalid');
  const parts = row[`${variant}_parts`];
  if (parts != null && !Array.isArray(parts)) return emptyGeometry('invalid', 'geometry_schema_invalid');
  const authoritative = Array.isArray(parts) && parts.length > 0;
  const encoded = authoritative ? parts : row[variant] == null || row[variant] === '' ? [] : [row[variant]];
  if (!encoded.length) return emptyGeometry('missing', 'geometry_missing');
  const good: GeometryCapability['parts'] = [];
  const bad: number[] = [];
  const reasons: string[] = [];
  encoded.forEach((part, sourceIndex) => {
    const { points, reason } = inspectPolyline(part);
    if (points && typeof part === 'string') good.push({ sourceIndex, encoded: part, points });
    else { bad.push(sourceIndex); if (reason) reasons.push(reason); }
  });
  if (authoritative && row[variant] != null && !strictPolyline(row[variant])) reasons.push('unused_geometry_invalid');
  return {
    status: bad.length ? good.length ? 'partial' : 'invalid' : 'complete',
    parts: good, invalidPartIndices: bad, signature: bad.length ? null : JSON.stringify(encoded), reasons: unique(reasons),
  };
}
function unavailableLogical(reason: string, status: LogicalGapCapability['status'] = 'unavailable'): LogicalGapCapability {
  return { status, entries: [], total_m: missing('exposure_gaps', reason), longest_m: missing('exposure_gaps', reason), reasons: [reason] };
}
function logicalGaps(raw: unknown, classification: PublishedRouteClassification, role: Role): LogicalGapCapability {
  if (classification !== 'routed') return unavailableLogical('published_routed_gaps_unavailable');
  if (role === 'candidate') return unavailableLogical('logical_gaps_not_published');
  if (raw == null) return unavailableLogical('logical_gaps_missing', 'missing');
  if (!Array.isArray(raw)) return unavailableLogical('logical_gaps_invalid', 'invalid');
  const entries = raw.map((gap, sourceIndex) => {
    const row = object(gap);
    const location = object(row?.location);
    const lat = location?.lat;
    const lon = location?.lon;
    const validAnchor = typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
    return {
      sourceIndex, length: metric(row?.len_m, 'nonnegative', `exposure_gaps[${sourceIndex}].len_m`),
      label: typeof row?.label === 'string' ? row.label : null,
      anchor: validAnchor ? { lat, lon } : null,
      anchorReason: validAnchor ? null : row?.location == null ? 'gap_anchor_missing' : 'gap_anchor_invalid',
    };
  });
  const reasons = entries.flatMap(entry => entry.anchorReason ? [entry.anchorReason] : []);
  if (entries.some(entry => entry.length.status !== 'valid')) {
    reasons.push('logical_gap_length_invalid');
    return { ...unavailableLogical('logical_gap_length_invalid', 'partial'), entries, reasons: unique(reasons) };
  }
  const lengths = entries.map(entry => entry.length.status === 'valid' ? entry.length.value : 0);
  const total = lengths.reduce((sum, len) => sum + len, 0);
  const longest = lengths.reduce((max, len) => Math.max(max, len), 0);
  if (!Number.isFinite(total)) return { ...unavailableLogical('logical_gap_length_invalid', 'partial'), entries, reasons: unique([...reasons, 'logical_gap_length_invalid']) };
  return { status: 'complete', entries, total_m: metric(total, 'nonnegative', 'exposure_gaps'), longest_m: metric(longest, 'nonnegative', 'exposure_gaps'), reasons: unique(reasons) };
}
function fragments(raw: unknown): FragmentCapability {
  if (raw == null) return { status: 'missing', entries: [], reasons: ['gap_fragments_missing'] };
  if (!Array.isArray(raw)) return { status: 'invalid', entries: [], reasons: ['gap_fragments_invalid'] };
  const entries = raw.map((gap, sourceIndex) => {
    const row = object(gap);
    const points = strictPolyline(row?.geom);
    const length = metric(row?.len_m, 'nonnegative', `geometry.exposure_gaps[${sourceIndex}].len_m`);
    const indexValid = !own(row, 'part_index') || (typeof row?.part_index === 'number' && Number.isSafeInteger(row.part_index) && row.part_index >= 0);
    const reasons = [...(!points ? ['gap_fragment_geometry_invalid'] : []), ...(length.status !== 'valid' ? ['gap_fragment_length_invalid'] : []), ...(!indexValid ? ['gap_fragment_index_invalid'] : [])];
    return { sourceIndex, length, points, encoded: points && typeof row?.geom === 'string' ? row.geom : null,
      partIndex: indexValid && typeof row?.part_index === 'number' ? row.part_index : null, highlightable: reasons.length === 0, reasons };
  });
  return { status: entries.some(entry => !entry.highlightable) ? 'partial' : 'complete', entries, reasons: unique(entries.flatMap(entry => entry.reasons)) };
}
function classify(row: Obj | null, role: Role, category: PublishedTransitCategory, metrics: PublishedOptionMetrics, preview: boolean, diagnostics: string[]): PublishedRouteClassification {
  if (preview) return 'preview';
  const paths = object(row?.paths);
  const type = role === 'candidate' ? row?.routing_type : paths?.routing_type;
  const trust = role === 'candidate' ? row?.route_trust : undefined;
  if (type === 'live_onemap_preview' || trust === 'live_onemap_preview') return 'preview';
  const nodeType = category === 'bus' ? 'bus_stop' : 'mrt_lrt_exit';
  const acceptedTypes = [...baseTypes, ...baseTypes.map(base => `${base}_with_${nodeType}_access_connector`)];
  const graphTrust = trust === `graph_routed_${nodeType}` || trust === `graph_routed_${nodeType}_with_access_connector`;
  const stateValid = typeof row?.state === 'string' && ['SCORED', 'SCORED_PARTIAL', 'NO_TRANSIT_IN_RANGE', 'NOT_YET_SCORED'].includes(row.state);
  if (!stateValid) diagnostics.push('state_invalid');
  if (!stateValid || row?.state === 'NOT_YET_SCORED') return 'unclassified';
  if (row?.state === 'NO_TRANSIT_IN_RANGE') diagnostics.push('scoring_eligibility_unavailable');
  if (type === directType || trust === directType) {
    if ((type === directType && graphTrust) || (typeof type === 'string' && acceptedTypes.includes(type) && trust === directType)) {
      diagnostics.push('routing_trust_conflict'); return 'conflict';
    }
    return category === 'bus' && type === directType && (role !== 'candidate' || trust === directType)
      ? 'unrouted' : 'unclassified';
  }
  if (!paths || typeof type !== 'string' || !acceptedTypes.includes(type)) return 'unclassified';
  if (role === 'candidate') {
    if (!graphTrust) return 'unclassified';
  } else {
    if (!object(row?.best_node)) return 'unclassified';
    if (metrics.routed_m.status === 'valid' && metrics.shortest_m.status === 'valid' && metrics.routed_m.value !== metrics.shortest_m.value) {
      diagnostics.push('default_routed_distance_conflict'); return 'conflict';
    }
  }
  return 'routed';
}
function optionalSegmentsInvalid(raw: unknown): boolean {
  if (raw == null) return false;
  const segments = object(raw);
  if (!segments) return true;
  return ['shortest', 'sheltered'].some(variant => {
    const entries = segments[variant];
    return entries != null && (!Array.isArray(entries) || entries.some(segment => {
      const row = object(segment);
      return !strictPolyline(row?.geom) || metric(row?.len_m, 'nonnegative', 'len_m').status !== 'valid' || typeof row?.is_covered !== 'boolean';
    }));
  });
}
function representation(raw: unknown, rawGeometry: unknown, selectionRef: PublishedOptionSelectionRef, key: string, category: PublishedTransitCategory, preview: boolean, geometryReason?: string): Representation {
  const row = object(raw);
  const paths = object(row?.paths);
  const node = object(row?.best_node);
  const role = selectionRef.kind;
  const candidate = role === 'candidate';
  const diagnostics: string[] = [];
  const metrics: PublishedOptionMetrics = {
    shortest_m: metric(paths?.shortest_m, 'positive', 'paths.shortest_m'),
    sheltered_m: metric(paths?.sheltered_m, 'positive', 'paths.sheltered_m'),
    covered_ratio: metric(paths?.covered_ratio, 'ratio', 'paths.covered_ratio'),
    shortest_covered_ratio: metric(candidate ? undefined : paths?.shortest_covered_ratio, 'ratio', 'paths.shortest_covered_ratio'),
    covered_m: metric(candidate ? undefined : paths?.covered_m, 'nonnegative', 'paths.covered_m'),
    direct_distance_m: metric(candidate ? row?.direct_distance_m : node?.straight_line_m, 'nonnegative', candidate ? 'direct_distance_m' : 'best_node.straight_line_m'),
    routed_m: metric(candidate ? undefined : node?.routed_m, 'positive', 'best_node.routed_m'),
  };
  const identityValid = candidate || categoryForType(node?.type) === category;
  if (!identityValid) diagnostics.push('identity_invalid');
  const checkedClassification = classify(row, role, category, metrics, preview, diagnostics);
  const classification = identityValid || checkedClassification === 'preview' ? checkedClassification : 'unclassified';
  if (classification === 'unclassified') diagnostics.push('trust_unclassified');
  const geometry = {
    shortest: geometryCapability(rawGeometry, 'shortest'), sheltered: geometryCapability(rawGeometry, 'sheltered'), routeSegmentsAvailable: false as const,
  };
  if (geometryReason) {
    const status = geometryReason === 'geometry_reference_mismatch' ? 'invalid' : 'missing';
    geometry.shortest = emptyGeometry(status, geometryReason); geometry.sheltered = emptyGeometry(status, geometryReason);
  }
  if (optionalSegmentsInvalid(object(rawGeometry)?.route_segments)) diagnostics.push('optional_route_segments_invalid');
  const fragmentEvidence = fragments(object(rawGeometry)?.exposure_gaps);
  const gaps: PublishedTransitOption['gaps'] = {
    sheltered: { logical: logicalGaps(row?.exposure_gaps, classification, role), fragments: fragmentEvidence },
    shortest: { logical: unavailableLogical('shortest_gaps_not_published'), fragments: { status: 'unavailable', entries: [], reasons: ['shortest_gaps_not_published'] } },
  };
  const strongId = selectionRef.kind === 'candidate' ? selectionRef.nodeId : identityValid && category === 'bus' && typeof node?.exit === 'string' && /^[0-9]{5}$/.test(node.exit) ? `bus:${node.exit}` : null;
  const name = candidate ? row?.node_name : node?.name;
  return { raw, rawGeometry, selectionRef, role, key, strongId, identityValid, name: meaningful(name) ? name : null, state: row?.state,
    classification, metrics, geometry, gaps, diagnostics: unique([...diagnostics,
      ...Object.values(metrics).filter(m => m.status === 'invalid').map(m => `${m.sourceField}:${m.status === 'invalid' ? m.reason : ''}`),
      ...geometry.shortest.reasons.map(reason => `shortest:${reason}`), ...geometry.sheltered.reasons.map(reason => `sheltered:${reason}`),
      ...gaps.sheltered.logical.reasons, ...fragmentEvidence.reasons,
    ]) };
}

// Stable semantic and metadata comparisons never use candidate-array position.
function stable(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const row = object(value);
  if (row) return `{${Object.keys(row).sort(compare).map(key => `${JSON.stringify(key)}:${stable(row[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'undefined';
}
function comparable(rep: Representation): boolean {
  return rep.identityValid && ['routed', 'unrouted', 'conflict'].includes(rep.classification)
    && rep.geometry.sheltered.status !== 'invalid' && rep.geometry.sheltered.status !== 'partial';
}
function usable(rep: Representation): boolean {
  return rep.identityValid && rep.classification === 'routed' && rep.geometry.sheltered.status === 'complete';
}
function sameRoleSemantics(rep: Representation): string {
  const metricValues = Object.fromEntries(Object.entries(rep.metrics).map(([key, m]) => [key, m.status === 'valid' ? [m.status, m.value] : [m.status, m.reason]]));
  return stable({ metrics: metricValues, classification: rep.classification,
    geometry: [rep.geometry.shortest.status, rep.geometry.shortest.signature, rep.geometry.sheltered.status, rep.geometry.sheltered.signature],
    logicalGaps: rep.gaps.sheltered.logical.entries.map(entry => [entry.length, entry.anchor]), logicalStatus: rep.gaps.sheltered.logical.status });
}
function conflictReasons(reps: Representation[]): string[] {
  const known = reps.filter(comparable);
  const reasons: string[] = [];
  if (known.some(rep => rep.classification === 'conflict')) reasons.push('evidence_conflict');
  for (let i = 0; i < known.length; i++) for (let j = i + 1; j < known.length; j++) {
    const a = known[i]; const b = known[j];
    if (a.role === b.role && sameRoleSemantics(a) !== sameRoleSemantics(b)) reasons.push('duplicate_representation_conflict');
    if ([a.classification, b.classification].includes('unrouted') && [a.classification, b.classification].includes('routed')) reasons.push('evidence_conflict');
    if (a.classification !== 'routed' || b.classification !== 'routed') continue;
    for (const name of ['shortest_m', 'sheltered_m', 'covered_ratio'] as const) {
      const x = a.metrics[name]; const y = b.metrics[name];
      if (x.status === 'valid' && y.status === 'valid' && x.value !== y.value) reasons.push(`evidence_conflict:${name}`);
    }
    if (a.geometry.sheltered.signature !== null && b.geometry.sheltered.signature !== null && a.geometry.sheltered.signature !== b.geometry.sheltered.signature) reasons.push('evidence_conflict:sheltered_geometry');
  }
  return unique(reasons);
}
function weakMatch(a: Representation, b: Representation): boolean {
  if (a.strongId && b.strongId && a.strongId !== b.strongId) return false;
  return a.identityValid && b.identityValid && a.name !== null && a.name === b.name && a.geometry.sheltered.signature !== null && a.geometry.sheltered.signature === b.geometry.sheltered.signature;
}
function normalizeGroup(reps: Representation[], category: PublishedTransitCategory): PublishedTransitOption {
  const ordered = [...reps].sort((a, b) => rolePriority[a.role] - rolePriority[b.role] || compare(a.key, b.key) || compare(stable(a.raw), stable(b.raw)) || compare(stable(a.rawGeometry), stable(b.rawGeometry)));
  const conflicts = conflictReasons(ordered);
  const chosen = conflicts.length ? ordered[0] : ordered.find(usable) ?? ordered[0];
  const retainable = conflicts.length === 0 && usable(chosen);
  const distanceRankable = retainable && chosen.metrics.sheltered_m.status === 'valid';
  const coverageRankable = retainable && chosen.metrics.covered_ratio.status === 'valid';
  const classification = conflicts.length ? 'conflict' : chosen.classification;
  const status: PublishedTransitOption['status'] = classification === 'conflict' ? 'evidence_conflict'
    : classification === 'preview' ? 'preview_only' : !chosen.identityValid ? 'identity_invalid'
      : classification === 'unrouted' ? 'published_unrouted' : classification !== 'routed' ? 'trust_unclassified'
        : chosen.geometry.sheltered.status === 'partial' ? 'geometry_partial' : chosen.geometry.sheltered.status !== 'complete' ? 'geometry_unavailable'
          : distanceRankable && coverageRankable ? 'published_routed' : 'published_routed_partial_metrics';
  const source = (rep: Representation): PublishedOptionSource => ({ selectionRef: rep.selectionRef, raw: rep.raw, rawGeometry: rep.rawGeometry });
  return { key: ordered[0].key, category, aliases: unique(ordered.flatMap(rep => rep.strongId ? [rep.strongId] : [])),
    selectionRef: chosen.selectionRef, name: chosen.name, state: chosen.state, classification, status, metrics: chosen.metrics, geometry: chosen.geometry,
    gaps: chosen.gaps, distanceRankable, coverageRankable, retainable, diagnostics: unique([...conflicts, ...ordered.flatMap(rep => rep.diagnostics)]),
    selectedSource: source(chosen), sources: ordered.map(source) };
}

/** Normalize one already-loaded published evidence pool. No requests, winner selection or UI mutation. */
export function normalizePublishedTransitOptions(input: PublishedTransitNormalizationInput): PublishedTransitNormalizationResult {
  const score = object(input?.score);
  const geom = object(input?.geometry);
  const result: PublishedTransitNormalizationResult = { contextStatus: 'valid', options: [], rejectedSources: [], diagnostics: [], contextProvenance: score?.provenance };
  const context = (value: unknown): boolean => {
    const row = object(value);
    return !!row && row.bundle === input.bundle && row.postal === input.postal;
  };
  if (!input || !meaningful(input.bundle) || typeof input.postal !== 'string' || !/^[0-9]{6}$/.test(input.postal) || !['bus', 'mrt_lrt'].includes(input.category)
    || !context(input.scoreContext) || !context(input.geometryContext) || score?.postal !== input.postal || (input.geometry != null && geom?.postal !== input.postal)) {
    return { ...result, contextStatus: 'invalid', diagnostics: ['source_context_invalid'] };
  }
  const provenance = object(score?.provenance);
  const preview = object(score?.paths)?.routing_type === 'live_onemap_preview' || provenance?.source === 'live_onemap_preview'
    || provenance?.routing_type === 'live_onemap_preview' || score?.provenance === 'live_onemap_preview' || provenance?.authoritative_score === false;
  if (preview) result.contextStatus = 'preview_only';
  const key = (role: 'default' | 'top-default' | 'candidate', id?: string): string => JSON.stringify(['pw', 1, input.bundle, input.postal, input.category, role, ...(id ? [id] : [])]);
  const reps: Representation[] = [];
  const categories = object(score?.route_options);
  const categoryPresent = own(categories, input.category);
  if (categoryPresent) reps.push(representation(categories![input.category], object(geom?.route_options)?.[input.category], { kind: 'category_default', category: input.category }, key('default'), input.category, preview));
  const topType = categoryForType(object(score?.best_node)?.type);
  if (topType === input.category || (!categoryPresent && !topType)) reps.push(representation(score, input.geometry, { kind: 'top_default' }, key(categoryPresent ? 'top-default' : 'default'), input.category, preview));
  if (score?.candidates != null && !Array.isArray(score.candidates)) result.diagnostics.push('candidates_schema_invalid');
  for (const raw of Array.isArray(score?.candidates) ? score.candidates : []) {
    const candidate = object(raw);
    const id = candidate?.node_id;
    const category = categoryForType(candidate?.node_type);
    const prefix = category === 'bus' ? 'bus:' : 'mrt:';
    if (!category || !meaningful(id) || !id.startsWith(prefix) || !meaningful(id.slice(prefix.length))) {
      result.rejectedSources.push({ raw, reasons: ['identity_invalid'] }); continue;
    }
    if (category !== input.category) continue;
    const ref = candidate?.geometry_ref;
    const geometryReason = ref == null ? 'geometry_reference_missing' : ref !== `${input.postal}_${id}` ? 'geometry_reference_mismatch' : undefined;
    const candidateGeom = geometryReason ? null : object(geom?.candidates)?.[id];
    reps.push(representation(raw, candidateGeom, { kind: 'candidate', nodeId: id }, key('candidate', id), input.category, preview, geometryReason));
  }
  const groups: Representation[][] = [];
  for (const rep of reps) {
    const existing = rep.strongId ? groups.find(group => group.some(other => other.strongId === rep.strongId)) : undefined;
    if (existing) existing.push(rep); else groups.push([rep]);
  }
  // Only defaults can acquire weak aliases; distinct candidate IDs never merge by name/line.
  for (const rep of reps.filter(rep => rep.role !== 'candidate' && !rep.strongId)) {
    const matches = unique(reps.filter(other => other.role === 'candidate' && weakMatch(rep, other)).flatMap(other => other.strongId ? [other.strongId] : []));
    if (matches.length > 1) { rep.diagnostics.push('alias_ambiguous'); continue; }
    if (matches.length === 1) {
      const from = groups.find(group => group.includes(rep))!;
      const to = groups.find(group => group.some(other => other.strongId === matches[0]))!;
      if (from !== to) { to.push(...from); groups.splice(groups.indexOf(from), 1); }
    }
  }
  const defaults = reps.filter(rep => rep.role !== 'candidate');
  for (let i = 0; i < defaults.length; i++) for (let j = i + 1; j < defaults.length; j++) {
    const a = groups.find(group => group.includes(defaults[i]))!;
    const b = groups.find(group => group.includes(defaults[j]))!;
    const ids = unique([...a, ...b].flatMap(rep => rep.strongId ? [rep.strongId] : []));
    if (a !== b && ids.length <= 1 && weakMatch(defaults[i], defaults[j])) { a.push(...b); groups.splice(groups.indexOf(b), 1); }
  }
  result.options = groups.map(group => normalizeGroup(group, input.category)).sort((a, b) => compare(a.key, b.key));
  result.rejectedSources.sort((a, b) => compare(stable(a), stable(b)));
  result.diagnostics = unique(result.diagnostics);
  return result;
}
