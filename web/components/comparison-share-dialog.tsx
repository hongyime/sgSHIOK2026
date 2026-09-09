"use client";

import React, { useId, useLayoutEffect, useRef, useState } from "react";
import styles from "./comparison-share-dialog.module.css";

export interface ComparisonShareDialogProps {
  open: boolean;
  link: string | null;
  onClose: () => void;
}

type CopyStatus = "idle" | "copying" | "copied" | "failed";

export function ComparisonShareDialog({ open, link, onClose }: ComparisonShareDialogProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const active = useRef(false);
  const generation = useRef(0);
  const currentLink = useRef(link);
  const [status, setStatus] = useState<CopyStatus>("idle");

  useLayoutEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const document = element.ownerDocument;
    const previous = document.activeElement as HTMLElement | null;
    active.current = true;
    if (!element.open) element.showModal();
    return () => {
      active.current = false;
      generation.current++;
      const focused = document.activeElement as HTMLElement | null;
      const outside = focused && !element.contains(focused) && focused !== document.body && focused !== document.documentElement
        ? focused : null;
      if (element.open) element.close();
      // Native close normally restores the opener. Preserve a deliberate newer focus target.
      const target = outside ?? previous;
      if (target?.isConnected && typeof target.focus === "function" && !target.matches(":disabled") && document.activeElement !== target) target.focus();
    };
  }, [open]);

  useLayoutEffect(() => {
    currentLink.current = link;
    generation.current++;
    setStatus("idle");
  }, [open, link]);

  function requestClose() {
    active.current = false;
    generation.current++;
    setStatus("idle");
    onClose();
  }

  async function copyLink() {
    if (!open || !active.current || !link || currentLink.current !== link) return;
    const attempt = ++generation.current;
    const isCurrent = () => active.current && generation.current === attempt && currentLink.current === link;
    setStatus("copying");
    try {
      await navigator.clipboard.writeText(link);
      if (isCurrent()) setStatus("copied");
    } catch {
      if (isCurrent()) setStatus("failed");
    }
  }

  function containTab(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape") { event.stopPropagation(); return; }
    if (event.key !== "Tab" || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || !open || !active.current) return;
    const element = event.currentTarget;
    if (!element.open) return;
    const document = element.ownerDocument;
    // This dialog owns buttons and a readonly input; determine its current Tab boundaries.
    const controls = Array.from(element.querySelectorAll<HTMLElement>("button, input")).filter(control => {
      if (control.tabIndex < 0 || control.matches(":disabled") || control.closest("[hidden], [inert]") || !control.getClientRects().length) return false;
      const visibility = document.defaultView?.getComputedStyle(control).visibility;
      return visibility !== "hidden" && visibility !== "collapse";
    });
    const first = controls[0];
    const last = controls[controls.length - 1];
    const focused = document.activeElement;
    if (!controls.length || !controls.includes(focused as HTMLElement) || focused === (event.shiftKey ? first : last)) {
      event.preventDefault();
      event.stopPropagation();
      ((event.shiftKey ? last : first) ?? element).focus();
    }
  }

  return (
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-disclosure`}
      onKeyDown={containTab}
      onCancel={event => { event.preventDefault(); event.stopPropagation(); requestClose(); }}>
      <header className={styles.header}>
        <h2 id={`${id}-title`}>Share comparison</h2>
        <button type="button" className={styles.close} aria-label="Close share dialog" title="Close share dialog"
          autoFocus onClick={requestClose}><span aria-hidden="true">&times;</span></button>
      </header>
      <p id={`${id}-disclosure`}>This link includes the selected postal codes.</p>
      <label className={styles.label} htmlFor={`${id}-link`}>Comparison link</label>
      <input ref={input} id={`${id}-link`} className={styles.link} type="text" value={link ?? ""}
        readOnly spellCheck={false} autoComplete="off" />
      <p className={styles.status} role="status">
        {!link ? "Share link unavailable." : status === "failed" ? "Copy failed. Select the link to copy it."
          : status === "copied" ? "Copied." : status === "copying" ? "Copying..." : null}
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.copy} disabled={!link || status === "copying"} onClick={copyLink}>Copy link</button>
        {link && status === "failed" && <button type="button" onClick={() => { input.current?.focus(); input.current?.select(); }}>Select link</button>}
      </div>
    </dialog>
  );
}
