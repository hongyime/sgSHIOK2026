import { describe, expect, it } from 'vitest';
import { coverageGapRow, type CoverageInput } from '../coverage-gap-register';
import fixture from './fixtures/published-walks.json';

const bundle = 'generated_20260805_prefer_scored_routed';
const records = Object.values(fixture).filter(Array.isArray).flat() as Array<Record<string, unknown>>;
const score = records.find(row => row?.postal === '018956' && 'state' in row)!;
const geometry = records.find(row => row?.postal === '018956' && 'shortest_parts' in row && !('state' in row))!;
const input: CoverageInput = { bundle, postal: '018956', indexed: true, score, geometry, geometryLookup: 'record_present' };
describe('read-only coverage gap classification', () => {
  it('uses real published evidence without changing its records', () => {
    const before = JSON.stringify(input), result = coverageGapRow(input);
    expect(score).toBeDefined(); expect(geometry).toBeDefined();
    expect(result.scoreRecord).toBe('present'); expect(result.completeLockedFields).toBe(true);
    expect(result.categories.map(c => c.category)).toEqual(['bus', 'mrt_lrt']);
    expect(result.categories.some(c => c.retainable > 0)).toBe(true);
    expect(JSON.stringify(input)).toBe(before);
  });
  it('does not infer distance failure from the real rejected-bus state', () => {
    const record = records.find(row => row?.postal === '079908' && 'state' in row)!;
    const result = coverageGapRow({ ...input, postal: '079908', score: record, geometry: null, geometryLookup: 'not_indexed' });
    expect(result.trustRejection).toBe(true);
    expect(result.rangeLimit).toBe('eligibility_state_distance_cause_not_established');
    expect(result.routeDisconnection).toBe('not_established');
    expect(result.completeLockedFields).toBe(false);
  });
  it('retains the real partial-score distinction', () => {
    const record = records.find(row => row?.postal === '018990' && 'state' in row)!;
    const result = coverageGapRow({ ...input, postal: '018990', score: record, geometry: null, geometryLookup: 'not_indexed' });
    expect(result.state).toBe('SCORED_PARTIAL'); expect(result.completeLockedFields).toBe(false);
    expect(result.scoreRecord).toBe('present'); expect(result.routeDisconnection).toBe('not_established');
  });
  it.each(['not_indexed', 'indexed_file_missing', 'indexed_record_missing'] as const)('keeps %s geometry distinct from scoring and disconnection', geometryLookup => {
    const result = coverageGapRow({ ...input, geometry: null, geometryLookup });
    expect(result.geometryLookup).toBe(geometryLookup); expect(result.completeLockedFields).toBe(true);
    expect(result.routeDisconnection).toBe('not_established');
  });
  it('requires an explicit recorded disconnection reason', () => {
    const result = coverageGapRow({ ...input, score: { ...score, provenance: { reason: 'transit_candidates_graph_disconnected' } } });
    expect(result.routeDisconnection).toBe('explicit_recorded_reason');
  });
  it('does not label uninspected geometry or category capabilities missing', () => {
    const result = coverageGapRow({ ...input, geometry: null, geometryLookup: 'not_read' });
    expect(result.categoryInspection).toBe('not_read'); expect(result.categories).toEqual([]);
  });
  it('uses recorded distance and threshold for an explicit range limitation', () => {
    const result = coverageGapRow({ ...input, score: { ...score, provenance: {
      reason: 'all_routed_transit_candidates_beyond_access_range', nearest_routed_m: 1300, access_zero_credit_m: 1200,
    } } });
    expect(result.rangeLimit).toBe('explicit_recorded_distance_limit');
  });
  it.each([{}, { nearest_routed_m: 1200, access_zero_credit_m: 1200 }, { nearest_routed_m: 10, access_zero_credit_m: -1 },
    { nearest_routed_m: '1300', access_zero_credit_m: 1200 }])('does not verify an unsupported range claim %j', fields => {
    const result = coverageGapRow({ ...input, score: { ...score, provenance: { reason: 'all_routed_transit_candidates_beyond_access_range', ...fields } } });
    expect(result.rangeLimit).toBe('recorded_range_reason_unverified');
  });
  it('does not mistake repaired or rejected alternative reasons for final disconnection', () => {
    const result = coverageGapRow({ ...input, score: { ...score, provenance: {
      origin_resnap: { reason: 'nearest_origin_component_cannot_reach_selected_transit_candidates' },
      candidate_selection: { reason: 'excluded_graph_routed_bus_candidates_beyond_routed_cap_from_default_choice' },
    } } });
    expect(result.routeDisconnection).toBe('not_established'); expect(result.rangeLimit).toBe('not_established');
  });
  it.each(['unknown', '', null])('does not classify an unrecognized reason %s', reason => {
    const result = coverageGapRow({ ...input, score: { ...score, provenance: { reason } } });
    expect(result.routeDisconnection).toBe('not_established'); expect(result.trustRejection).toBe(false);
  });
  it('does not equate absent index membership with a verified missing address', () => {
    expect(coverageGapRow({ ...input, indexed: false, score: null }).addressEvidence).toBe('outside_published_index_not_proof_of_missing_address');
  });
  it('separates missing records from unscored records', () => {
    expect(coverageGapRow({ ...input, score: null }).scoreRecord).toBe('missing');
    expect(coverageGapRow({ ...input, score: { ...score, state: 'NOT_YET_SCORED', total: null } }).scoreRecord).toBe('present');
  });
  it('flags identity mismatch without borrowing a different postal geometry', () => {
    const result = coverageGapRow({ ...input, geometry: { ...geometry, postal: '999999' } });
    expect(result.categories.every(c => c.context === 'invalid' && c.options === 0)).toBe(true);
  });
  it.each([null, Number.NaN, Number.POSITIVE_INFINITY])('does not treat missing/nonfinite locked fields as complete: %s', total => {
    expect(coverageGapRow({ ...input, score: { ...score, total } }).completeLockedFields).toBe(false);
  });
  it('keeps zero-valued complete score fields valid', () => {
    expect(coverageGapRow({ ...input, score: { ...score, total: 0, subscores: { access: 0, bus: 0, crossing: 0, heat: 0, rain: 0 } } }).completeLockedFields).toBe(true);
  });
  it.each([{postal:'999999'}, {state:'CORRUPT'}])('does not borrow cause claims from an invalid record %j', invalid => {
    for (const reason of ['transit_candidates_graph_disconnected', 'all_routed_transit_candidates_beyond_access_range',
      'all_numeric_transit_candidates_rejected_by_bus_route_trust_gate', 'missing_coordinates_after_bounded_geocode']) {
      const result=coverageGapRow({...input,score:{...score,state:'NO_TRANSIT_IN_RANGE',...invalid,provenance:{
        reason,source_status:'NEEDS_GEOCODE',nearest_routed_m:1300,access_zero_credit_m:1200,
      }}});
      expect(result.scoreRecord).toBe('invalid');expect(result.reason).toBe(reason);
      expect(result.routeDisconnection).toBe('not_established');expect(result.rangeLimit).toBe('not_established');
      expect(result.trustRejection).toBe(false);expect(result.coordinateGap).toBe('not_established');
      expect(result.completeLockedFields).toBe(false);
    }
  });
  it('separates explicitly recorded missing coordinates from an absent address or geometry', () => {
    const result=coverageGapRow({...input,geometry:null,geometryLookup:'not_indexed',score:{
      postal:input.postal,state:'NOT_YET_SCORED',total:null,subscores:null,
      provenance:{reason:'missing_coordinates_after_bounded_geocode',source_status:'NEEDS_GEOCODE'},
    }});
    expect(result.coordinateGap).toBe('explicit_recorded_coordinate_gap');
    expect(result.addressEvidence).toBe('published_index');expect(result.scoreRecord).toBe('present');
    expect(result.routeDisconnection).toBe('not_established');expect(result.rangeLimit).toBe('not_established');
  });
  it.each([
    {state:'NOT_YET_SCORED',provenance:{}},
    {state:'NOT_YET_SCORED',provenance:{reason:'missing_coordinates_after_bounded_geocode'}},
    {state:'NOT_YET_SCORED',provenance:{source_status:'NEEDS_GEOCODE'}},
    {state:'NOT_YET_SCORED',provenance:{reason:'unscorable_source_status:UNKNOWN',source_status:'UNKNOWN'}},
    {state:'SCORED',provenance:{reason:'missing_coordinates_after_bounded_geocode',source_status:'NEEDS_GEOCODE'}},
  ])('does not infer missing coordinates from incomplete or contradictory evidence %j', fields => {
    expect(coverageGapRow({...input,geometry:null,geometryLookup:'not_indexed',score:{...score,...fields}}).coordinateGap).toBe('not_established');
  });
});
