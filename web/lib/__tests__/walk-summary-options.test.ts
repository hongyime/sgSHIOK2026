import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WalkSummary, walkMetrics } from '../../components/walk-summary';
import { normalizePublishedTransitOptions, type PublishedTransitOption } from '../published-transit-options';
import type { ScoreRecord } from '../types';
import fixture from './fixtures/published-options.json';

const bundle = 'generated_20260805_prefer_scored_routed';
const records = fixture['scores/DOWNTOWN_CORE_PART_001.json'];
const raw = (postal = '018956') => structuredClone(records.find(row => row.postal === postal)) as unknown as ScoreRecord;
const unknown = { distance: null, coverage: null, uncovered: null, longest: null };
function option(category: 'bus' | 'mrt_lrt' = 'bus', candidate?: string): PublishedTransitOption {
  const postal = '018956';
  const result = normalizePublishedTransitOptions({
    bundle, postal, category, score: raw(), geometry: fixture['geom/h3/886520db39fffff.json'][0],
    scoreContext: { bundle, postal }, geometryContext: { bundle, postal },
  });
  const found = candidate ? result.options.find(row => row.aliases.includes(candidate))
    : result.options.find(row => row.selectionRef.kind === 'category_default');
  if (!found) throw Error('Fixture option missing');
  return structuredClone(found);
}
function html(score: ScoreRecord | null, selected?: PublishedTransitOption | null, shortest = false) {
  return renderToStaticMarkup(React.createElement(WalkSummary, { postal: '018956', score, option: selected, shortest }));
}
const valid = (value: number) => ({ status: 'valid' as const, value, sourceField: 'synthetic-test' });

describe('T06 normalized walk summary', () => {
  it('names the selected transit category instead of implying every station-named stop is an exit', () => {
    expect(html(raw(), option('bus'))).toContain('Walk to bus stop');
    expect(html(raw(), option('mrt_lrt'))).toContain('Walk to MRT/LRT exit');
    expect(html(raw())).toContain('Walk to bus stop');
    expect(html(raw(), null)).not.toContain('Walk to bus stop');
  });

  it('uses selected identity and metrics without inheriting the raw default', () => {
    const selected = option('mrt_lrt');
    const before = structuredClone(selected);
    const score = raw();
    score.best_node!.name = 'Unrelated default';
    score.paths!.sheltered_m = 9999;
    const metrics = walkMetrics(score, false, selected);
    expect(selected.metrics.sheltered_m.status).toBe('valid');
    expect(metrics.distance).toBe(selected.metrics.sheltered_m.status === 'valid' ? selected.metrics.sheltered_m.value : null);
    expect(html(score, selected)).toContain(selected.name!);
    expect(html(score, selected)).not.toContain('Unrelated default');
    expect(html(null, selected)).not.toContain('No shelter-map walk');
    expect(selected).toEqual(before);
  });

  it('explicit null does not fall back to the default; omitted option remains compatible', () => {
    expect(walkMetrics(raw(), false, null)).toEqual(unknown);
    expect(walkMetrics(raw()).distance).toBe(raw().paths!.sheltered_m);
    expect(html(raw(), null)).not.toContain(raw().best_node!.name);
    expect(html(raw(), null)).toContain('Destination unavailable');
  });

  it('keeps logical default totals instead of summing clipped geometry fragments', () => {
    const selected = option();
    const metrics = walkMetrics(raw(), false, selected);
    expect(metrics.uncovered).toBeCloseTo(36.5);
    expect(metrics.longest).toBe(20.2);
    expect(selected.gaps.sheltered.fragments.entries).toHaveLength(3);
  });

  it('does not promote a candidate fragment maximum into logical longest gap', () => {
    const selected = option('mrt_lrt', 'mrt:21678');
    expect(selected.gaps.sheltered.fragments.entries.length).toBeGreaterThan(0);
    expect(walkMetrics(raw(), false, selected).distance).toBe(110);
    expect(walkMetrics(raw(), false, selected).uncovered).toBeNull();
    expect(walkMetrics(raw(), false, selected).longest).toBeNull();
  });

  it('shortest uses its own distance and ratio, never sheltered gaps', () => {
    const selected = option();
    selected.metrics.shortest_m = valid(71.25);
    selected.metrics.shortest_covered_ratio = valid(0.125);
    expect(walkMetrics(raw(), true, selected)).toEqual({ distance: 71.25, coverage: 13, uncovered: null, longest: null });
    selected.metrics.shortest_covered_ratio = { status: 'missing', reason: 'not_published', sourceField: 'shortest_covered_ratio' };
    expect(walkMetrics(raw(), true, selected).coverage).toBeNull();
  });

  it.each(['partial', 'invalid', 'missing', 'unavailable'] as const)('keeps %s logical totals unknown even when entries survive', status => {
    const selected = option();
    selected.gaps.sheltered.logical.status = status;
    expect(walkMetrics(raw(), false, selected).uncovered).toBeNull();
    expect(walkMetrics(raw(), false, selected).longest).toBeNull();
  });

  it('preserves valid zero coverage and complete zero gaps', () => {
    const selected = option();
    selected.metrics.covered_ratio = valid(0);
    selected.gaps.sheltered.logical = { status: 'complete', entries: [], total_m: valid(0), longest_m: valid(0), reasons: [] };
    expect(walkMetrics(raw(), false, selected)).toMatchObject({ coverage: 0, uncovered: 0, longest: 0 });
  });

  it.each([NaN, Infinity, -1, 1.01])('does not display invalid coverage %s as a number', value => {
    const selected = option();
    selected.metrics.covered_ratio = valid(value);
    expect(walkMetrics(raw(), false, selected).coverage).toBeNull();
  });

  it.each([NaN, Infinity, -1, 0])('does not display unsupported distance %s', value => {
    const selected = option();
    selected.metrics.sheltered_m = valid(value);
    expect(walkMetrics(raw(), false, selected).distance).toBeNull();
  });

  it.each(['unrouted', 'unclassified', 'preview', 'conflict'] as const)('does not display %s option metrics as a published walk', classification => {
    const selected = option();
    selected.classification = classification;
    expect(walkMetrics(raw(), false, selected)).toEqual(unknown);
  });

  it('blocks an invalid identity even if routing is classified', () => {
    const selected = option();
    selected.status = 'identity_invalid';
    expect(walkMetrics(raw(), false, selected)).toEqual(unknown);
  });

  it('does not hide independently valid metrics when geometry or another metric is missing', () => {
    const selected = option();
    selected.status = 'geometry_unavailable';
    selected.metrics.covered_ratio = { status: 'missing', sourceField: 'covered_ratio', reason: 'metric_missing' };
    expect(walkMetrics(raw(), false, selected).distance).toBe(raw().paths!.sheltered_m);
    expect(walkMetrics(raw(), false, selected).coverage).toBeNull();
  });

  it('missing selected name never borrows the default destination', () => {
    const selected = option('mrt_lrt');
    selected.name = null;
    expect(html(raw(), selected)).toContain('Destination unavailable');
    expect(html(raw(), selected)).not.toContain(raw().best_node!.name);
  });

  it('a null raw score still renders all selected-candidate metrics and no missing-walk message', () => {
    const selected = option('mrt_lrt', 'mrt:21678');
    expect(walkMetrics(null, false, selected).distance).toBe(110);
    const rendered = html(null, selected);
    expect(rendered).toContain(selected.name!);
    expect(rendered).toContain('110 m');
    expect(rendered).not.toContain('No shelter-map walk');
    expect(rendered).not.toContain('No published walk');
  });

  it.each([NaN, Infinity, -1])('invalid logical total %s cannot appear as a number', value => {
    const selected = option();
    selected.gaps.sheltered.logical.total_m = valid(value);
    selected.gaps.sheltered.logical.longest_m = valid(value);
    expect(walkMetrics(null, false, selected).uncovered).toBeNull();
    expect(walkMetrics(null, false, selected).longest).toBeNull();
  });
});

describe('T06 raw default and range honesty', () => {
  it('real 018990 unrouted fallback has four unknown walk metrics, not empty-gap zeroes', () => {
    expect(walkMetrics(raw('018990'))).toEqual(unknown);
    expect(html(raw('018990'))).toContain('Straight-line estimate; no verified walk.');
  });

  it('real trust-rejected 079908 never claims a measured range failure', () => {
    expect(html(raw('079908'))).toContain('No published walk is available');
    expect(html(raw('079908'))).not.toContain('1.2 km');
  });

  it.each([undefined, 'unknown_routing_type'])('missing/unsupported routing type %s is not a verified walk', routingType => {
    const score = raw();
    score.paths!.routing_type = routingType;
    expect(walkMetrics(score)).toEqual(unknown);
  });

  it.each([NaN, Infinity, -1])('invalid raw gap length %s invalidates the whole total', len_m => {
    const score = raw();
    score.exposure_gaps!.push({ len_m, label: 'Bad gap' });
    expect(walkMetrics(score).uncovered).toBeNull();
    expect(walkMetrics(score).longest).toBeNull();
  });

  it('range state alone preserves a valid walk without inventing a range explanation', () => {
    const score = raw();
    score.state = 'NO_TRANSIT_IN_RANGE';
    expect(walkMetrics(score).distance).toBe(score.paths!.sheltered_m);
    expect(html(score)).not.toContain('1.2 km');
  });

  it('an explicit recorded range reason permits range copy', () => {
    const score = raw('079908');
    score.provenance = { reason: 'all_routed_transit_candidates_beyond_access_range' };
    expect(html(score)).toContain('Outside the 1.2 km scoring range.');
  });

  it('a trusted recorded routed distance beyond 1200 permits range copy, not sheltered detour alone', () => {
    const score = raw();
    score.state = 'NO_TRANSIT_IN_RANGE';
    score.paths!.sheltered_m = 1500;
    expect(html(score)).not.toContain('1.2 km');
    score.best_node!.routed_m = 1200.1;
    expect(html(score)).toContain('Outside the 1.2 km scoring range.');
  });

  it('normalized selection does not inherit the default state or range reason', () => {
    const score = raw('079908');
    score.provenance = { reason: 'all_routed_transit_candidates_beyond_access_range' };
    expect(html(score, option())).not.toContain('1.2 km');
    expect(html(score, option())).not.toContain('No published walk');
  });

  it('valid raw previews remain labelled and never become published walks', () => {
    const score = raw();
    score.state = 'NOT_YET_SCORED';
    score.paths!.routing_type = 'live_onemap_preview';
    score.provenance = { source: 'live_onemap_preview', authoritative_score: false };
    expect(walkMetrics(score).distance).toBe(score.paths!.sheltered_m);
    expect(html(score)).toContain('Preview only; not a published walk.');
    score.provenance = { source: 'live_onemap_preview', authoritative_score: true };
    expect(walkMetrics(score)).toEqual(unknown);
  });

  it('overflowing raw logical totals stay unknown without changing good distance', () => {
    const score = raw();
    score.exposure_gaps = [{ len_m: Number.MAX_VALUE, label: 'First' }, { len_m: Number.MAX_VALUE, label: 'Second' }];
    expect(walkMetrics(score)).toMatchObject({ distance: score.paths!.sheltered_m, uncovered: null, longest: null });
  });

  it('a route with an unsupported other-category connector stays unavailable', () => {
    const score = raw();
    score.paths!.routing_type = 'sheltered_with_mrt_lrt_exit_access_connector';
    expect(walkMetrics(score)).toEqual(unknown);
  });
});
