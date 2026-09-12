import React from 'react';
import type { ScoreRecord } from '../lib/types';
import type { PublishedTransitOption } from '../lib/published-transit-options';
import { availabilityNotice, walkMetrics } from '../lib/walk-metrics';
import styles from '../app/page.module.css';

export { walkMetrics } from '../lib/walk-metrics';

export function WalkSummary({ postal, score, shortest = false, option }: {
  postal: string; score: ScoreRecord | null; shortest?: boolean; option?: PublishedTransitOption | null;
}) {
  const m = walkMetrics(score, shortest, option);
  const name = option !== undefined ? option?.name : score?.best_node?.name;
  const category = option !== undefined ? option?.category : score?.best_node?.type;
  const destinationType = category === 'bus' || category === 'bus_stop' ? 'bus stop'
    : category === 'mrt_lrt' || category === 'mrt_lrt_exit' ? 'MRT/LRT exit' : null;
  const notice = availabilityNotice(score, option);
  const metres = (n: number | null) => n === null ? 'Unavailable' : `${Math.round(n)} m`;
  return <section className={styles.walkSummary} aria-label="Walk summary" data-postal={postal}>
    <h2>Postal {postal}</h2>
    <p className={styles.walkDestination}>Walk to{destinationType ? ` ${destinationType}` : ''} <strong>{name || 'Destination unavailable'}</strong></p>
    <div className={styles.walkMetrics}>
      {[['Walk distance',metres(m.distance)],['Covered',m.coverage === null ? 'Unavailable' : `${m.coverage}%`],['Uncovered',metres(m.uncovered)],['Longest gap',metres(m.longest)]].map(([label,value]) =>
        <div key={label}><strong data-unavailable={value === 'Unavailable' || undefined}>{value}</strong><span>{label}</span></div>)}
    </div>
    {notice && <p>{notice}</p>}
  </section>;
}
