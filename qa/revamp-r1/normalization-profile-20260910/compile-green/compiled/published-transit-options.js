"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePublishedTransitOptions = normalizePublishedTransitOptions;
const polyline_1 = require("./polyline");
const contiguous_route_parts_1 = require("./contiguous-route-parts");
const rolePriority = { category_default: 0, top_default: 1, candidate: 2 };
const directType = 'direct_bus_fallback_unrouted';
const baseTypes = ['sheltered', 'shortest_fallback', 'shortest_due_to_detour'];
const own = (o, key) => !!o && Object.prototype.hasOwnProperty.call(o, key);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const unique = (values) => [...new Set(values)].sort(compare);
const meaningful = (v) => typeof v === 'string' && v.length > 0 && v.trim() === v && !/[\x00-\x1f\x7f]/.test(v);
const categoryForType = (type) => type === 'bus_stop' ? 'bus' : type === 'mrt_lrt_exit' ? 'mrt_lrt' : null;
function missing(sourceField, reason = 'metric_missing') {
    return { status: 'missing', sourceField, reason };
}
function metric(value, rule, sourceField) {
    if (value == null)
        return missing(sourceField);
    let reason = null;
    if (typeof value !== 'number')
        reason = 'metric_type_invalid';
    else if (!Number.isFinite(value))
        reason = 'metric_nonfinite';
    else if (rule === 'ratio' && (value < 0 || value > 1))
        reason = 'ratio_out_of_range';
    else if (value < 0)
        reason = 'metric_negative';
    else if (rule === 'positive' && value === 0)
        reason = 'zero_walk_length_unestablished';
    return reason ? { status: 'invalid', reason, sourceField } : { status: 'valid', value: value, sourceField };
}
// The shared decoder is permissive; validate the precision-5 wire format first.
function inspectPolyline(value) {
    const invalid = { points: null, reason: 'geometry_part_invalid' };
    if (typeof value !== 'string' || value.length === 0)
        return invalid;
    const components = [];
    for (let i = 0; i < value.length;) {
        let unsigned = 0;
        let group = 0;
        let done = false;
        while (i < value.length && group < 7) {
            const code = value.charCodeAt(i++);
            if (code < 63 || code > 126)
                return invalid;
            const byte = code - 63;
            unsigned += (byte & 31) * 2 ** (5 * group++);
            if (unsigned > 0xffffffff)
                return invalid;
            if (byte < 32) {
                done = true;
                break;
            }
        }
        if (!done)
            return invalid;
        components.push(unsigned % 2 ? -(unsigned + 1) / 2 : unsigned / 2);
    }
    if (components.length % 2)
        return invalid;
    if (components.length < 4)
        return { points: null, reason: 'geometry_degenerate' };
    let lat = 0;
    let lon = 0;
    let first = null;
    let distinct = false;
    for (let i = 0; i < components.length; i += 2) {
        lat += components[i];
        lon += components[i + 1];
        if (!Number.isSafeInteger(lat) || !Number.isSafeInteger(lon) || Math.abs(lat) > 9000000 || Math.abs(lon) > 18000000)
            return invalid;
        if (first)
            distinct ||= first[0] !== lat || first[1] !== lon;
        else
            first = [lat, lon];
    }
    return distinct ? { points: (0, polyline_1.decodePolyline)(value), reason: null } : { points: null, reason: 'geometry_degenerate' };
}
const strictPolyline = (value) => inspectPolyline(value).points;
function emptyGeometry(status, reason) {
    return { status, parts: [], invalidPartIndices: [], signature: null, reasons: [reason] };
}
function geometryCapability(raw, variant) {
    if (raw == null)
        return emptyGeometry('missing', 'geometry_missing');
    const row = object(raw);
    if (!row)
        return emptyGeometry('invalid', 'geometry_schema_invalid');
    const parts = row[`${variant}_parts`];
    if (parts != null && !Array.isArray(parts))
        return emptyGeometry('invalid', 'geometry_schema_invalid');
    const authoritative = Array.isArray(parts) && parts.length > 0;
    const encoded = authoritative ? parts : row[variant] == null || row[variant] === '' ? [] : [row[variant]];
    if (!encoded.length)
        return emptyGeometry('missing', 'geometry_missing');
    const good = [];
    const bad = [];
    const reasons = [];
    encoded.forEach((part, sourceIndex) => {
        const { points, reason } = inspectPolyline(part);
        if (points && typeof part === 'string')
            good.push({ sourceIndex, encoded: part, points });
        else {
            bad.push(sourceIndex);
            if (reason)
                reasons.push(reason);
        }
    });
    if (authoritative && row[variant] != null && !strictPolyline(row[variant]))
        reasons.push('unused_geometry_invalid');
    return {
        status: bad.length ? good.length ? 'partial' : 'invalid' : 'complete',
        parts: good, invalidPartIndices: bad, signature: bad.length ? null : JSON.stringify(encoded), reasons: unique(reasons),
    };
}
function unavailableLogical(reason, status = 'unavailable') {
    return { status, entries: [], total_m: missing('exposure_gaps', reason), longest_m: missing('exposure_gaps', reason), reasons: [reason] };
}
function logicalGaps(raw, classification, role) {
    if (classification !== 'routed')
        return unavailableLogical('published_routed_gaps_unavailable');
    if (role === 'candidate')
        return unavailableLogical('logical_gaps_not_published');
    if (raw == null)
        return unavailableLogical('logical_gaps_missing', 'missing');
    if (!Array.isArray(raw))
        return unavailableLogical('logical_gaps_invalid', 'invalid');
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
    if (!Number.isFinite(total))
        return { ...unavailableLogical('logical_gap_length_invalid', 'partial'), entries, reasons: unique([...reasons, 'logical_gap_length_invalid']) };
    return { status: 'complete', entries, total_m: metric(total, 'nonnegative', 'exposure_gaps'), longest_m: metric(longest, 'nonnegative', 'exposure_gaps'), reasons: unique(reasons) };
}
function fragments(raw, base) {
    if (raw == null)
        return { status: 'missing', entries: [], reasons: ['gap_fragments_missing'] };
    if (!Array.isArray(raw))
        return { status: 'invalid', entries: [], reasons: ['gap_fragments_invalid'] };
    const parts = base.parts.map(part => distinctConsecutive(part.points));
    const matchesPart = (0, contiguous_route_parts_1.createContiguousPartMatcher)(parts);
    const entries = raw.map((gap, sourceIndex) => {
        const row = object(gap);
        const points = strictPolyline(row?.geom);
        const length = metric(row?.len_m, 'nonnegative', `geometry.exposure_gaps[${sourceIndex}].len_m`);
        const indexValid = !own(row, 'part_index') || (typeof row?.part_index === 'number' && Number.isSafeInteger(row.part_index) && row.part_index >= 0);
        const reasons = [...(!points ? ['gap_fragment_geometry_invalid'] : []), ...(length.status !== 'valid' ? ['gap_fragment_length_invalid'] : []), ...(!indexValid ? ['gap_fragment_index_invalid'] : [])];
        if (points && !matchesPart(distinctConsecutive(points))) {
            reasons.push(parts.length ? 'gap_fragment_path_mismatch' : 'gap_fragment_path_unavailable');
        }
        return { sourceIndex, length, label: typeof row?.label === 'string' ? row.label : null, points, encoded: points && typeof row?.geom === 'string' ? row.geom : null,
            partIndex: indexValid && typeof row?.part_index === 'number' ? row.part_index : null, highlightable: reasons.length === 0, reasons };
    });
    return { status: entries.some(entry => !entry.highlightable) ? 'partial' : 'complete', entries, reasons: unique(entries.flatMap(entry => entry.reasons)) };
}
function classify(row, role, category, metrics, preview, diagnostics) {
    if (preview)
        return 'preview';
    const paths = object(row?.paths);
    const type = role === 'candidate' ? row?.routing_type : paths?.routing_type;
    const trust = role === 'candidate' ? row?.route_trust : undefined;
    if (type === 'live_onemap_preview' || trust === 'live_onemap_preview')
        return 'preview';
    const nodeType = category === 'bus' ? 'bus_stop' : 'mrt_lrt_exit';
    const acceptedTypes = [...baseTypes, ...baseTypes.map(base => `${base}_with_${nodeType}_access_connector`)];
    const graphTrust = trust === `graph_routed_${nodeType}` || trust === `graph_routed_${nodeType}_with_access_connector`;
    const stateValid = typeof row?.state === 'string' && ['SCORED', 'SCORED_PARTIAL', 'NO_TRANSIT_IN_RANGE', 'NOT_YET_SCORED'].includes(row.state);
    if (!stateValid)
        diagnostics.push('state_invalid');
    if (!stateValid || row?.state === 'NOT_YET_SCORED')
        return 'unclassified';
    if (row?.state === 'NO_TRANSIT_IN_RANGE')
        diagnostics.push('scoring_eligibility_unavailable');
    if (type === directType || trust === directType) {
        if ((type === directType && graphTrust) || (typeof type === 'string' && acceptedTypes.includes(type) && trust === directType)) {
            diagnostics.push('routing_trust_conflict');
            return 'conflict';
        }
        return category === 'bus' && type === directType && (role !== 'candidate' || trust === directType)
            ? 'unrouted' : 'unclassified';
    }
    if (!paths || typeof type !== 'string' || !acceptedTypes.includes(type))
        return 'unclassified';
    if (role === 'candidate') {
        if (!graphTrust)
            return 'unclassified';
    }
    else {
        if (!object(row?.best_node))
            return 'unclassified';
        if (metrics.routed_m.status === 'valid' && metrics.shortest_m.status === 'valid' && metrics.routed_m.value !== metrics.shortest_m.value) {
            diagnostics.push('default_routed_distance_conflict');
            return 'conflict';
        }
    }
    return 'routed';
}
const segmentMetadata = ['source_class', 'source_layer', 'synth_class', 'confidence', 'source_summary'];
const samePoint = (a, b) => a[0] === b[0] && a[1] === b[1];
const edgeKey = (a, b) => JSON.stringify(JSON.stringify(a) < JSON.stringify(b) ? [a, b] : [b, a]);
function distinctConsecutive(points) {
    return points.filter((point, index) => index === 0 || !samePoint(point, points[index - 1]));
}
function segmentCapability(raw, variant, base) {
    const unavailable = (status, reason) => ({ status, segments: [], reasons: [reason] });
    if (raw == null)
        return unavailable('missing', 'optional_route_segments_missing');
    const container = object(raw);
    if (!container)
        return unavailable('invalid', 'optional_route_segments_invalid');
    const entries = container[variant];
    if (entries == null || (Array.isArray(entries) && entries.length === 0))
        return unavailable('missing', 'optional_route_segments_missing');
    if (!Array.isArray(entries))
        return unavailable('invalid', 'optional_route_segments_invalid');
    const validated = [];
    for (const entry of entries) {
        const row = object(entry);
        const points = strictPolyline(row?.geom);
        const length = metric(row?.len_m, 'nonnegative', 'route_segments.len_m');
        // Export's part_index is local to a source-class group, not an index into base.parts.
        const indexValid = !own(row, 'part_index') || (typeof row?.part_index === 'number' && Number.isSafeInteger(row.part_index) && row.part_index >= 0);
        if (!points || typeof row?.geom !== 'string' || length.status !== 'valid' || typeof row?.is_covered !== 'boolean'
            || !indexValid || segmentMetadata.some(key => own(row, key) && typeof row?.[key] !== 'string')) {
            return unavailable('invalid', 'optional_route_segments_invalid');
        }
        const segment = { geom: row.geom, len_m: length.value, is_covered: row.is_covered };
        for (const key of segmentMetadata)
            if (typeof row[key] === 'string')
                segment[key] = row[key];
        validated.push({ segment, points: distinctConsecutive(points) });
    }
    if (base.status !== 'complete')
        return unavailable('unavailable', 'optional_route_segments_base_incomplete');
    const parts = base.parts.map(part => distinctConsecutive(part.points));
    const matchesPart = (0, contiguous_route_parts_1.createContiguousPartMatcher)(parts);
    const remaining = new Map();
    for (const part of parts)
        for (let index = 1; index < part.length; index++) {
            const key = edgeKey(part[index - 1], part[index]);
            remaining.set(key, (remaining.get(key) ?? 0) + 1);
        }
    // A renderer prefers any segment list over ALL base parts. Only an exact, disjoint
    // coordinate partition may replace them; malformed, partial or unrelated detail is omitted.
    // Edge multiplicities avoid greedy placement when the published route repeats a stretch.
    for (const entry of validated) {
        if (!matchesPart(entry.points))
            return unavailable('invalid', 'optional_route_segments_path_mismatch');
        for (let index = 1; index < entry.points.length; index++) {
            const key = edgeKey(entry.points[index - 1], entry.points[index]);
            const count = remaining.get(key) ?? 0;
            if (count <= 0)
                return unavailable('invalid', 'optional_route_segments_path_mismatch');
            remaining.set(key, count - 1);
        }
    }
    if ([...remaining.values()].some(count => count > 0))
        return unavailable('invalid', 'optional_route_segments_incomplete');
    return { status: 'complete', segments: validated.map(entry => entry.segment), reasons: [] };
}
function representation(raw, rawGeometry, selectionRef, key, category, preview, geometryReason) {
    const row = object(raw);
    const paths = object(row?.paths);
    const node = object(row?.best_node);
    const role = selectionRef.kind;
    const candidate = role === 'candidate';
    const diagnostics = [];
    const metrics = {
        shortest_m: metric(paths?.shortest_m, 'positive', 'paths.shortest_m'),
        sheltered_m: metric(paths?.sheltered_m, 'positive', 'paths.sheltered_m'),
        covered_ratio: metric(paths?.covered_ratio, 'ratio', 'paths.covered_ratio'),
        shortest_covered_ratio: metric(candidate ? undefined : paths?.shortest_covered_ratio, 'ratio', 'paths.shortest_covered_ratio'),
        covered_m: metric(candidate ? undefined : paths?.covered_m, 'nonnegative', 'paths.covered_m'),
        direct_distance_m: metric(candidate ? row?.direct_distance_m : node?.straight_line_m, 'nonnegative', candidate ? 'direct_distance_m' : 'best_node.straight_line_m'),
        routed_m: metric(candidate ? undefined : node?.routed_m, 'positive', 'best_node.routed_m'),
    };
    const identityValid = candidate || categoryForType(node?.type) === category;
    if (!identityValid)
        diagnostics.push('identity_invalid');
    const checkedClassification = classify(row, role, category, metrics, preview, diagnostics);
    const classification = identityValid || checkedClassification === 'preview' ? checkedClassification : 'unclassified';
    if (classification === 'unclassified')
        diagnostics.push('trust_unclassified');
    let shortest = geometryCapability(rawGeometry, 'shortest');
    let sheltered = geometryCapability(rawGeometry, 'sheltered');
    if (geometryReason) {
        const status = geometryReason === 'geometry_reference_mismatch' ? 'invalid' : 'missing';
        shortest = emptyGeometry(status, geometryReason);
        sheltered = emptyGeometry(status, geometryReason);
    }
    const segmentSource = object(rawGeometry)?.route_segments;
    const routeSegments = { shortest: segmentCapability(segmentSource, 'shortest', shortest), sheltered: segmentCapability(segmentSource, 'sheltered', sheltered) };
    const geometry = { shortest, sheltered, routeSegments,
        routeSegmentsAvailable: Object.values(routeSegments).some(capability => capability.status === 'complete') };
    for (const [variant, capability] of Object.entries(routeSegments)) {
        if (capability.status === 'invalid')
            diagnostics.push('optional_route_segments_invalid');
        if (capability.status !== 'missing')
            diagnostics.push(...capability.reasons.map(reason => `${variant}:${reason}`));
    }
    const fragmentEvidence = fragments(object(rawGeometry)?.exposure_gaps, sheltered);
    const gaps = {
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
function stable(value) {
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'number' && !Number.isFinite(value))
        return String(value);
    if (Array.isArray(value))
        return `[${value.map(stable).join(',')}]`;
    const row = object(value);
    if (row)
        return `{${Object.keys(row).sort(compare).map(key => `${JSON.stringify(key)}:${stable(row[key])}`).join(',')}}`;
    return JSON.stringify(value) ?? 'undefined';
}
function comparable(rep) {
    return rep.identityValid && ['routed', 'unrouted', 'conflict'].includes(rep.classification)
        && rep.geometry.sheltered.status !== 'invalid' && rep.geometry.sheltered.status !== 'partial';
}
function usable(rep) {
    return rep.identityValid && rep.classification === 'routed' && rep.geometry.sheltered.status === 'complete';
}
function sameRoleSemantics(rep) {
    const metricValues = Object.fromEntries(Object.entries(rep.metrics).map(([key, m]) => [key, m.status === 'valid' ? [m.status, m.value] : [m.status, m.reason]]));
    return stable({ metrics: metricValues, classification: rep.classification,
        geometry: [rep.geometry.shortest.status, rep.geometry.shortest.signature, rep.geometry.sheltered.status, rep.geometry.sheltered.signature],
        logicalGaps: rep.gaps.sheltered.logical.entries.map(entry => [entry.length, entry.anchor]), logicalStatus: rep.gaps.sheltered.logical.status });
}
function conflictReasons(reps) {
    const known = reps.filter(comparable);
    const reasons = [];
    if (known.some(rep => rep.classification === 'conflict'))
        reasons.push('evidence_conflict');
    for (let i = 0; i < known.length; i++)
        for (let j = i + 1; j < known.length; j++) {
            const a = known[i];
            const b = known[j];
            if (a.role === b.role && sameRoleSemantics(a) !== sameRoleSemantics(b))
                reasons.push('duplicate_representation_conflict');
            if ([a.classification, b.classification].includes('unrouted') && [a.classification, b.classification].includes('routed'))
                reasons.push('evidence_conflict');
            if (a.classification !== 'routed' || b.classification !== 'routed')
                continue;
            for (const name of ['shortest_m', 'sheltered_m', 'covered_ratio']) {
                const x = a.metrics[name];
                const y = b.metrics[name];
                if (x.status === 'valid' && y.status === 'valid' && x.value !== y.value)
                    reasons.push(`evidence_conflict:${name}`);
            }
            if (a.geometry.sheltered.signature !== null && b.geometry.sheltered.signature !== null && a.geometry.sheltered.signature !== b.geometry.sheltered.signature)
                reasons.push('evidence_conflict:sheltered_geometry');
        }
    return unique(reasons);
}
function weakMatch(a, b) {
    if (a.strongId && b.strongId && a.strongId !== b.strongId)
        return false;
    return a.identityValid && b.identityValid && a.name !== null && a.name === b.name && a.geometry.sheltered.signature !== null && a.geometry.sheltered.signature === b.geometry.sheltered.signature;
}
function normalizeGroup(reps, category) {
    const ordered = [...reps].sort((a, b) => rolePriority[a.role] - rolePriority[b.role] || compare(a.key, b.key) || compare(stable(a.raw), stable(b.raw)) || compare(stable(a.rawGeometry), stable(b.rawGeometry)));
    const conflicts = conflictReasons(ordered);
    const chosen = conflicts.length ? ordered[0] : ordered.find(usable) ?? ordered[0];
    const retainable = conflicts.length === 0 && usable(chosen);
    const distanceRankable = retainable && chosen.metrics.sheltered_m.status === 'valid';
    const coverageRankable = retainable && chosen.metrics.covered_ratio.status === 'valid';
    const classification = conflicts.length ? 'conflict' : chosen.classification;
    const status = classification === 'conflict' ? 'evidence_conflict'
        : classification === 'preview' ? 'preview_only' : !chosen.identityValid ? 'identity_invalid'
            : classification === 'unrouted' ? 'published_unrouted' : classification !== 'routed' ? 'trust_unclassified'
                : chosen.geometry.sheltered.status === 'partial' ? 'geometry_partial' : chosen.geometry.sheltered.status !== 'complete' ? 'geometry_unavailable'
                    : distanceRankable && coverageRankable ? 'published_routed' : 'published_routed_partial_metrics';
    const source = (rep) => ({ selectionRef: rep.selectionRef, raw: rep.raw, rawGeometry: rep.rawGeometry });
    return { key: ordered[0].key, category, aliases: unique(ordered.flatMap(rep => rep.strongId ? [rep.strongId] : [])),
        selectionRef: chosen.selectionRef, name: chosen.name, state: chosen.state, classification, status, metrics: chosen.metrics, geometry: chosen.geometry,
        gaps: chosen.gaps, distanceRankable, coverageRankable, retainable, diagnostics: unique([...conflicts, ...ordered.flatMap(rep => rep.diagnostics)]),
        selectedSource: source(chosen), sources: ordered.map(source) };
}
/** Normalize one already-loaded published evidence pool. No requests, winner selection or UI mutation. */
function normalizePublishedTransitOptions(input) {
    const score = object(input?.score);
    const geom = object(input?.geometry);
    const result = { contextStatus: 'valid', options: [], rejectedSources: [], diagnostics: [], contextProvenance: score?.provenance };
    const context = (value) => {
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
    if (preview)
        result.contextStatus = 'preview_only';
    const key = (role, id) => JSON.stringify(['pw', 1, input.bundle, input.postal, input.category, role, ...(id ? [id] : [])]);
    const reps = [];
    const categories = object(score?.route_options);
    const categoryPresent = own(categories, input.category);
    if (categoryPresent)
        reps.push(representation(categories[input.category], object(geom?.route_options)?.[input.category], { kind: 'category_default', category: input.category }, key('default'), input.category, preview));
    const topType = categoryForType(object(score?.best_node)?.type);
    if (topType === input.category || (!categoryPresent && !topType))
        reps.push(representation(score, input.geometry, { kind: 'top_default' }, key(categoryPresent ? 'top-default' : 'default'), input.category, preview));
    if (score?.candidates != null && !Array.isArray(score.candidates))
        result.diagnostics.push('candidates_schema_invalid');
    for (const raw of Array.isArray(score?.candidates) ? score.candidates : []) {
        const candidate = object(raw);
        const id = candidate?.node_id;
        const category = categoryForType(candidate?.node_type);
        const prefix = category === 'bus' ? 'bus:' : 'mrt:';
        if (!category || !meaningful(id) || !id.startsWith(prefix) || !meaningful(id.slice(prefix.length))) {
            result.rejectedSources.push({ raw, reasons: ['identity_invalid'] });
            continue;
        }
        if (category !== input.category)
            continue;
        const ref = candidate?.geometry_ref;
        const geometryReason = ref == null ? 'geometry_reference_missing' : ref !== `${input.postal}_${id}` ? 'geometry_reference_mismatch' : undefined;
        const candidateGeom = geometryReason ? null : object(geom?.candidates)?.[id];
        reps.push(representation(raw, candidateGeom, { kind: 'candidate', nodeId: id }, key('candidate', id), input.category, preview, geometryReason));
    }
    const groups = [];
    for (const rep of reps) {
        const existing = rep.strongId ? groups.find(group => group.some(other => other.strongId === rep.strongId)) : undefined;
        if (existing)
            existing.push(rep);
        else
            groups.push([rep]);
    }
    // Only defaults can acquire weak aliases; distinct candidate IDs never merge by name/line.
    for (const rep of reps.filter(rep => rep.role !== 'candidate' && !rep.strongId)) {
        const matches = unique(reps.filter(other => other.role === 'candidate' && weakMatch(rep, other)).flatMap(other => other.strongId ? [other.strongId] : []));
        if (matches.length > 1) {
            rep.diagnostics.push('alias_ambiguous');
            continue;
        }
        if (matches.length === 1) {
            const from = groups.find(group => group.includes(rep));
            const to = groups.find(group => group.some(other => other.strongId === matches[0]));
            if (from !== to) {
                to.push(...from);
                groups.splice(groups.indexOf(from), 1);
            }
        }
    }
    const defaults = reps.filter(rep => rep.role !== 'candidate');
    for (let i = 0; i < defaults.length; i++)
        for (let j = i + 1; j < defaults.length; j++) {
            const a = groups.find(group => group.includes(defaults[i]));
            const b = groups.find(group => group.includes(defaults[j]));
            const ids = unique([...a, ...b].flatMap(rep => rep.strongId ? [rep.strongId] : []));
            if (a !== b && ids.length <= 1 && weakMatch(defaults[i], defaults[j])) {
                a.push(...b);
                groups.splice(groups.indexOf(b), 1);
            }
        }
    result.options = groups.map(group => normalizeGroup(group, input.category)).sort((a, b) => compare(a.key, b.key));
    result.rejectedSources.sort((a, b) => compare(stable(a), stable(b)));
    result.diagnostics = unique(result.diagnostics);
    return result;
}
