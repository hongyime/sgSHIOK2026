"use client";

import React from "react";
import {
  MAX_PUBLISHED_TRANSIT_CHOICES,
  type PublishedTransitChoices,
} from "../lib/published-transit-choices";
import type { MetricCapability } from "../lib/published-transit-options";
import styles from "./transit-stop-picker.module.css";

export interface TransitStopPickerProps {
  selection: PublishedTransitChoices;
  onSelect: (key: string | null) => void;
}

function walkDistance(metric: MetricCapability): string {
  return metric.status === "valid"
    ? `${Math.round(metric.value)} m walk`
    : "Walk distance unavailable";
}

function coverage(metric: MetricCapability): string {
  return metric.status === "valid"
    ? `${Math.round(metric.value * 100)}% covered`
    : "Coverage unavailable";
}

export function TransitStopPicker({ selection, onSelect }: TransitStopPickerProps) {
  const choices = selection.choices.slice(0, MAX_PUBLISHED_TRANSIT_CHOICES);
  const showReset = selection.selectedKey !== null && selection.selectedKey !== selection.defaultKey;
  if (choices.length === 0 || (choices.length === 1 && selection.selectedKey === selection.defaultKey)) return null;

  return (
    <details className={styles.picker}>
      <summary className={styles.summary}>
        Other walks <span className={styles.count}>({choices.length})</span>
      </summary>
      <div className={styles.choices} role="group" aria-label="Published walks">
        {choices.map(({ option, roles }) => {
          const labels = [
            ...(roles.includes("shortest") ? ["Shortest shown"] : []),
            ...(roles.includes("most_covered") ? ["Most covered"] : []),
          ];
          return (
            <button
              key={option.key}
              type="button"
              className={styles.choice}
              aria-pressed={option.key === selection.selectedKey}
              onClick={() => onSelect(option.key)}
            >
              <span className={styles.destination}>
                {option.name || (option.category === "bus" ? "Bus stop" : "MRT/LRT exit")}
              </span>
              <span className={styles.metrics}>
                <span>{walkDistance(option.metrics.sheltered_m)}</span>
                <span>{coverage(option.metrics.covered_ratio)}</span>
              </span>
              {labels.length > 0 && (
                <span className={styles.roles}>{labels.join(" / ")}</span>
              )}
            </button>
          );
        })}
      </div>
      {showReset && (
        <button
          type="button"
          className={styles.reset}
          aria-label="Use published default"
          title="Use published default"
          onClick={() => onSelect(null)}
        >
          Use published default
        </button>
      )}
    </details>
  );
}
