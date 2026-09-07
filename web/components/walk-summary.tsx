import React from 'react';
import type { ScoreRecord } from '../lib/types';
import styles from '../app/page.module.css';

export function walkMetrics(score: ScoreRecord | null, shortest = false) {
  const paths = score?.paths;
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  const distance = shortest ? paths?.shortest_m : paths?.sheltered_m;
  const ratio = shortest ? paths?.shortest_covered_ratio : paths?.covered_ratio;
  // Published exposure gaps describe the sheltered route. Do not attach them to a different walk.
  const gaps = shortest ? null : score?.exposure_gaps;
  return {
    distance: finite(distance) ? distance : null,
    coverage: finite(ratio) ? Math.round(ratio * 100) : null,
    uncovered: gaps ? gaps.reduce((sum, gap) => sum + gap.len_m, 0) : null,
    longest: gaps ? Math.max(0, ...gaps.map(gap => gap.len_m)) : null,
  };
}

export function WalkSummary({ postal, score, shortest = false }: { postal: string; score: ScoreRecord | null; shortest?: boolean }) {
  const m = walkMetrics(score, shortest);
  const metres = (n: number | null) => n === null ? 'Unavailable' : `${Math.round(n)} m`;
  return <section className={styles.walkSummary} aria-label="Walk summary" data-postal={postal}>
    <h2>Postal {postal}</h2>
    <p className={styles.walkDestination}>Walk to <strong>{score?.best_node?.name || 'Destination unavailable'}</strong></p>
    <div className={styles.walkMetrics}>
      {[['Walk distance',metres(m.distance)],['Covered',m.coverage === null ? 'Unavailable' : `${m.coverage}%`],['Uncovered',metres(m.uncovered)],['Longest gap',metres(m.longest)]].map(([label,value]) =>
        <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
    </div>
    {!score && <p>No shelter-map walk is published for this postal yet.</p>}
    {score && !score.paths && <p>No connected walk is published for this destination.</p>}
    {score?.state === 'NO_TRANSIT_IN_RANGE' && <p>Outside the 1.2 km scoring range.</p>}
    {score?.paths?.routing_type === 'direct_bus_fallback_unrouted' && <p>Straight-line estimate; no verified walk.</p>}
  </section>;
}
