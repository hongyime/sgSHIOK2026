"use client";

import React, { useLayoutEffect, useRef } from "react";
import type { ComparisonEntry } from "../lib/comparison-controller";
import type { ComparisonRow } from "../lib/comparison";
import { MAX_COMPARISON_POSTALS, type ComparisonState } from "../lib/comparison-state";
import type { PublishedTransitCategory } from "../lib/published-transit-options";
import type { WalkMetrics } from "../lib/walk-metrics";
import styles from "./home-comparison.module.css";

export interface HomeComparisonProps {
  state: ComparisonState;
  entries: Readonly<Record<string, ComparisonEntry>>;
  storageUnavailable: boolean;
  onCategory: (category: PublishedTransitCategory) => void;
  onActivate: (postal: string) => void;
  onRemove: (postal: string) => void;
  onRetry: (postal: string) => void;
  onClear: () => void;
  onAdd: () => void;
  onClose: () => void;
}

const metricRows: ReadonlyArray<{ key: keyof WalkMetrics; label: string }> = [
  { key: "distance", label: "Walk distance" },
  { key: "coverage", label: "Covered" },
  { key: "uncovered", label: "Uncovered" },
  { key: "longest", label: "Longest gap" },
];

function entryStatus(entry: ComparisonEntry | undefined, row: ComparisonRow | null): string | null {
  if (!entry || entry.status === "loading") return "Loading walk...";
  if (entry.status === "error") return "Could not load this walk.";
  if (!row) return "Walk evidence unavailable.";
  if (row.availability === "unavailable") {
    if (row.reason === "evidence_conflict") return "Walk evidence conflicts.";
    if (row.reason === "default_unrouted") return "Straight-line estimate; no verified walk.";
    if (row.reason === "preview_only") return "Only a preview is available.";
    if (row.reason === "metrics_unavailable") return "Walk measurements unavailable.";
    return "No published walk for this category.";
  }
  const messages: string[] = [];
  if (entry.geometryStatus === "loading") messages.push("Map loading.");
  else if (entry.geometryStatus === "error") messages.push("Map unavailable.");
  else if (row.evidence.geometryStatus !== "complete") {
    messages.push(row.evidence.geometryStatus === "partial" ? "Only part of the walk can be shown." : "Route drawing unavailable.");
  }
  if (Object.values(row.metrics).some(value => value === null)) messages.push("Some measurements unavailable.");
  if (row.notice) messages.push(row.notice);
  return messages.length ? messages.join(" ") : null;
}

function measurement(row: ComparisonRow | null, key: keyof WalkMetrics, loading: boolean): string {
  if (loading) return "Loading...";
  const value = row?.availability === "unavailable" ? null : row?.metrics[key];
  if (value == null || !Number.isFinite(value)) return "Unavailable";
  return key === "coverage" ? `${value}%` : `${Math.round(value)} m`;
}

export function HomeComparison({
  state, entries, storageUnavailable, onCategory, onActivate, onRemove, onRetry, onClear, onAdd, onClose,
}: HomeComparisonProps) {
  const postals = state.postals.slice(0, MAX_COMPARISON_POSTALS);
  const panel = useRef<HTMLElement | null>(null);
  const pendingFocus = useRef<{ button: HTMLButtonElement; postal: string | null; index: number } | null>(null);
  const postalKey = postals.join("|");

  function rememberFocus(button: HTMLButtonElement, postal: string | null, index: number) {
    pendingFocus.current = button.ownerDocument.activeElement === button ? { button, postal, index } : null;
  }

  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    if (pending.postal === null ? postals.length !== 0 : postals.includes(pending.postal)) return;
    const document = pending.button.ownerDocument;
    const active = document.activeElement;
    // Removal can leave focus on the document body; respect any deliberate new target.
    if (active && active !== pending.button && active !== document.body && active !== document.documentElement) return;
    const nextPostal = postals[Math.min(pending.index, postals.length - 1)];
    const next = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>("[data-comparison-remove]") ?? [])
      .find(button => button.dataset.comparisonRemove === nextPostal);
    (next ?? panel.current?.querySelector<HTMLButtonElement>("[data-comparison-close]"))?.focus();
  }, [postalKey]);

  const columns = postals.map(postal => {
    const entry = entries[postal]?.postal === postal ? entries[postal] : undefined;
    const row = entry?.status === "ready" && entry.row?.postal === postal && entry.row.category === state.category
      ? entry.row : null;
    const canShowMap = !!row && row.availability !== "unavailable" && entry?.geometryStatus === "ready"
      && !!entry.option && ["complete", "partial"].includes(entry.option.geometry.sheltered.status);
    return { postal, entry, row, canShowMap };
  });
  const mappedPostal = columns.find(column => column.postal === state.activePostal && column.canShowMap)?.postal;

  return (
    <section
      ref={panel}
      className={styles.panel}
      role="region"
      aria-label="Home comparison"
      tabIndex={-1}
      data-comparison-panel
      data-map-overlay="bottom"
      onKeyDown={event => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onClose();
      }}
    >
      <header className={styles.header}>
        <h2>Compare homes</h2>
        {mappedPostal && <span className={styles.mapContext} role="status">Map: {mappedPostal}</span>}
        <button type="button" className={styles.iconButton} data-comparison-close
          aria-label="Close comparison" title="Close comparison" onClick={onClose}>
          <span aria-hidden="true">&times;</span>
        </button>
      </header>
      <div className={styles.toolbar}>
        <div className={styles.categories} role="group" aria-label="Comparison transit category">
          <button type="button" aria-pressed={state.category === "mrt_lrt"} onClick={() => onCategory("mrt_lrt")}>MRT/LRT</button>
          <button type="button" aria-pressed={state.category === "bus"} onClick={() => onCategory("bus")}>Bus</button>
        </div>
        <div className={styles.commands}>
          <button type="button" className={styles.command} onClick={onAdd}
            aria-label="Add another postal" title="Add another postal"
            disabled={postals.length === MAX_COMPARISON_POSTALS}>Add postal</button>
          <button type="button" className={styles.command} disabled={postals.length === 0} onClick={event => {
            rememberFocus(event.currentTarget, null, 0);
            onClear();
          }}>Clear list</button>
        </div>
      </div>
      {storageUnavailable && <p className={styles.storageNote} role="status">Saved for this visit only.</p>}
      {columns.length === 0 ? (
        <p className={styles.empty}>No homes added.</p>
      ) : (
        <div className={styles.tableViewport} role="region" aria-label="Compared walks" tabIndex={0}>
          <table className={styles.table} style={{ minWidth: `${112 + columns.length * 176}px` }}>
            <caption className={styles.caption}>Published default sheltered walks</caption>
            <colgroup><col className={styles.labelColumn} />{postals.map(postal => <col key={postal} />)}</colgroup>
            <thead>
              <tr>
                <th scope="col">Postal code</th>
                {columns.map(({ postal, canShowMap }, index) => (
                  <th key={postal} scope="col" data-active={postal === state.activePostal || undefined}>
                    <div className={styles.postalHeading}>
                      <button type="button" className={styles.mapButton} aria-label={`Show postal ${postal} on map`}
                        title={`Show postal ${postal} on map`} aria-pressed={postal === state.activePostal}
                        disabled={!canShowMap} onClick={() => onActivate(postal)}>
                        <span>{postal}</span>
                      </button>
                      <button type="button" className={styles.iconButton} aria-label={`Remove postal ${postal}`}
                        data-comparison-remove={postal} title={`Remove postal ${postal}`} onClick={event => {
                          rememberFocus(event.currentTarget, postal, index);
                          onRemove(postal);
                        }}>
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Destination</th>
                {columns.map(({ postal, entry, row }) => (
                  <td key={postal} data-active={postal === state.activePostal || undefined}>
                    <span className={styles.destination}>{!entry || entry.status === "loading" ? "Loading..." : row?.destination || "Unavailable"}</span>
                    <p className={styles.entryStatus} role="status">{entryStatus(entry, row)}</p>
                    {(entry?.status === "error" || entry?.geometryStatus === "error") && (
                      <button type="button" className={styles.command} aria-label={`Retry postal ${postal}`}
                        onClick={() => onRetry(postal)}>{entry.status === "error" ? "Retry" : "Retry map"}</button>
                    )}
                  </td>
                ))}
              </tr>
              {metricRows.map(({ key, label }) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  {columns.map(({ postal, entry, row }) => (
                    <td key={postal} className={styles.metric} data-active={postal === state.activePostal || undefined}>
                      {measurement(row, key, !entry || entry.status === "loading")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
