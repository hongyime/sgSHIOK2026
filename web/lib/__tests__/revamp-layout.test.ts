import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { walkMetrics, WalkSummary } from '../../components/walk-summary';
import type { ScoreRecord } from '../types';

const record = { postal: '018956', paths: { shortest_m: 80.7, sheltered_m: 80.7, covered_ratio: 0.5539 }, exposure_gaps: [{len_m:20.1},{len_m:16.3}] } as ScoreRecord;
describe('Round 1 executed summary behaviour', () => {
  it('W01/W13: preserves published precision until display rounding', () => {
    const before = JSON.stringify(record);
    expect(walkMetrics(record).distance).toBe(80.7);
    expect(walkMetrics(record).coverage).toBe(55);
    expect(walkMetrics(record).uncovered).toBeCloseTo(36.4);
    expect(walkMetrics(record).longest).toBe(20.1);
    expect(JSON.stringify(record)).toBe(before);
  });
  it('W02: absent evidence remains unavailable rather than zero', () => {
    expect(walkMetrics(null)).toEqual({distance:null,coverage:null,uncovered:null,longest:null});
    expect(walkMetrics({...record,exposure_gaps:null}).longest).toBeNull();
    expect(walkMetrics({...record,exposure_gaps:[]}).longest).toBe(0);
  });
  it('W10: never attaches sheltered gaps to a different shortest walk', () => {
    expect(walkMetrics(record,true).uncovered).toBeNull();
    expect(walkMetrics(record,true).longest).toBeNull();
  });
  it('renders all four metrics and explicit missing values', () => {
    const html=renderToStaticMarkup(React.createElement(WalkSummary,{postal:record.postal,score:record}));
    for(const label of ['Walk distance','Covered','Uncovered','Longest gap']) expect(html).toContain(label);
    expect(html).toContain('81 m');
    expect(renderToStaticMarkup(React.createElement(WalkSummary,{postal:record.postal,score:null}))).toContain('Unavailable');
  });
});
