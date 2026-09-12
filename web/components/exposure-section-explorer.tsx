"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import type { PublishedExposureSections } from "../lib/published-exposure-sections";
import styles from "./exposure-section-explorer.module.css";

export interface ExposureSectionExplorerProps {
  model: PublishedExposureSections;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  mode: "shiokest" | "shortest" | "both";
  onFocusedRemoval?: () => void;
}

const INITIAL_SECTION_COUNT = 3;

function sectionLength(lengthM: number): string {
  return lengthM > 0 && lengthM < 1 ? "<1 m" : `${Math.round(lengthM)} m`;
}

function Explorer({ model, selectedKey, onSelect, mode, onFocusedRemoval }: ExposureSectionExplorerProps) {
  const [showAll, setShowAll] = useState(false);
  const rootRef = useRef<HTMLDetailsElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const owner = useRef<ExposureSectionExplorerProps | null>(null);
  const focusedRemoval = useRef(onFocusedRemoval);

  // An old disclosure must never clear or select a newer walk after it unmounts.
  useLayoutEffect(() => {
    owner.current = { model, selectedKey, onSelect, mode };
    return () => { owner.current = null; };
  }, [model, selectedKey, onSelect, mode]);

  useLayoutEffect(() => {
    focusedRemoval.current = onFocusedRemoval;
  }, [onFocusedRemoval]);

  // Check focus before React removes the outgoing disclosure, not on prop updates.
  useLayoutEffect(() => () => {
    const root = rootRef.current;
    if (root?.contains(root.ownerDocument.activeElement)) focusedRemoval.current?.();
  }, []);

  const sections = [...model.sections].sort((a, b) => b.lengthM - a.lengthM ||
    (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const visibleSections = showAll ? sections : sections.slice(0, INITIAL_SECTION_COUNT);
  const selected = sections.some(section => section.key === selectedKey);

  function select(key: string | null) {
    const current = owner.current;
    if (!current || (key !== null && !current.model.sections.some(section => section.key === key))) return;
    current.onSelect(key);
  }

  return (
    <details
      ref={rootRef}
      className={styles.explorer}
      onToggle={event => {
        if (!owner.current || event.target !== event.currentTarget) return;
        if (event.currentTarget.open) {
          wasOpen.current = true;
        } else if (wasOpen.current) {
          wasOpen.current = false;
          setShowAll(false);
          select(null);
          summaryRef.current?.focus({ preventScroll: true });
        }
      }}
    >
      <summary ref={summaryRef} className={styles.summary}>
        Uncovered sections <span className={styles.count}>({sections.length})</span>
      </summary>
      {(mode === "both" || model.status === "partial") && (
        <p className={styles.context}>
          {mode === "both"
            ? model.status === "partial" ? "Sheltered walk; partial mapping." : "Sheltered walk"
            : "Partial mapping."}
        </p>
      )}
      <div className={styles.sections} role="group" aria-label="Mapped exposed sections">
        {visibleSections.map((section, index) => (
          <button
            key={section.key}
            type="button"
            className={styles.section}
            aria-pressed={section.key === selectedKey}
            onClick={() => select(section.key)}
          >
            <span>Section {index + 1}</span>
            <span className={styles.length}>{sectionLength(section.lengthM)}</span>
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        {sections.length > INITIAL_SECTION_COUNT && (
          <button
            type="button"
            className={styles.action}
            aria-expanded={showAll}
            onClick={() => {
              if (owner.current) setShowAll(previous => !previous);
            }}
          >
            {showAll ? "Show fewer" : "Show more"}
          </button>
        )}
        {selected && (
          <button type="button" className={styles.action} onClick={() => {
            if (!owner.current) return;
            select(null);
            summaryRef.current?.focus({ preventScroll: true });
          }}>
            Back to walk
          </button>
        )}
      </div>
    </details>
  );
}

export function ExposureSectionExplorer(props: ExposureSectionExplorerProps) {
  if (props.mode === "shortest" || props.model.status === "empty" || props.model.status === "unavailable" || !props.model.sections.length) {
    return null;
  }
  return <Explorer key={props.model.contextKey} {...props} />;
}
