"use client";

import React, { useId, useLayoutEffect, useRef, useState } from "react";
import styles from "./failure-diagnostics-control.module.css";

export interface FailureDiagnosticsControlProps {
  value: string;
  snapshotKey: string | number;
}

type Feedback = FailureDiagnosticsControlProps & {
  status: "copying" | "copied" | "failed";
};

export function FailureDiagnosticsControl({ value, snapshotKey }: FailureDiagnosticsControlProps) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement | null>(null);
  const copyButton = useRef<HTMLButtonElement | null>(null);
  const hideFocus = useRef<{ document: Document; previous: Element | null } | null>(null);
  const active = useRef(false);
  const generation = useRef(0);
  const pending = useRef(false);
  const current = useRef({ value, snapshotKey });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // Keep focused manual controls mounted across snapshot replacement until explicit Hide.
  const [manual, setManual] = useState(false);
  // Ownership also gates this render, before the layout effect resets old feedback.
  const visible = feedback?.value === value && Object.is(feedback.snapshotKey, snapshotKey)
    ? feedback : null;

  useLayoutEffect(() => {
    active.current = true;
    current.current = { value, snapshotKey };
    generation.current++;
    pending.current = false;
    hideFocus.current = null;
    setFeedback(null);
    return () => {
      active.current = false;
      generation.current++;
      pending.current = false;
      hideFocus.current = null;
    };
  }, [value, snapshotKey]);

  useLayoutEffect(() => {
    if (manual) return;
    const request = hideFocus.current;
    hideFocus.current = null;
    const button = copyButton.current;
    if (!request || !active.current || !button?.isConnected || button.disabled ||
        button.ownerDocument !== request.document) return;
    const focused = request.document.activeElement;
    // Hide may remove the focused node. Wait for the surviving button to be enabled,
    // but do not override another control focused since the explicit Hide action.
    if (focused === request.previous || (focused === request.document.body &&
        request.previous !== null && !request.previous.isConnected)) button.focus();
  }, [manual]);

  async function copyDiagnostics() {
    if (!active.current || pending.current || current.current.value !== value ||
        !Object.is(current.current.snapshotKey, snapshotKey)) return;
    const attempt = ++generation.current;
    const isCurrent = () => active.current && generation.current === attempt &&
      current.current.value === value && Object.is(current.current.snapshotKey, snapshotKey);
    pending.current = true;
    setFeedback({ value, snapshotKey, status: "copying" });
    try {
      // The OS write cannot be cancelled. Only feedback is invalidated by a new snapshot.
      await navigator.clipboard.writeText(value);
      if (isCurrent()) {
        pending.current = false;
        setFeedback({ value, snapshotKey, status: "copied" });
      }
    } catch {
      if (isCurrent()) {
        pending.current = false;
        setManual(true);
        setFeedback({ value, snapshotKey, status: "failed" });
      }
    }
  }

  function hideDiagnostics() {
    if (!active.current || current.current.value !== value ||
        !Object.is(current.current.snapshotKey, snapshotKey)) return;
    const document = copyButton.current?.ownerDocument;
    hideFocus.current = document ? { document, previous: document.activeElement } : null;
    generation.current++;
    pending.current = false;
    setFeedback(null);
    setManual(false);
  }

  return (
    <div className={styles.control} data-failure-diagnostics-manual={manual || undefined}>
      <div className={styles.actions}>
        <button ref={copyButton} type="button" disabled={visible?.status === "copying"} onClick={copyDiagnostics}>
          Copy diagnostics
        </button>
        <span id={`${id}-status`} className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          {visible?.status === "failed" ? "Copy unavailable."
            : visible?.status === "copied" ? "Copied."
            : visible?.status === "copying" ? "Copying..." : null}
        </span>
      </div>
      {manual && (
        <div className={styles.manual}>
          <label className={styles.label} htmlFor={`${id}-value`}>Diagnostics</label>
          <textarea
            ref={field}
            className={styles.value}
            id={`${id}-value`}
            aria-describedby={`${id}-status`}
            value={value}
            readOnly
            rows={6}
            spellCheck={false}
            autoComplete="off"
          />
          <div className={styles.actions}>
            <button type="button" aria-label="Select diagnostics" onClick={() => { field.current?.focus(); field.current?.select(); }}>
              Select
            </button>
            <button type="button" aria-label="Hide diagnostics" onClick={hideDiagnostics}>Hide</button>
          </div>
        </div>
      )}
    </div>
  );
}
