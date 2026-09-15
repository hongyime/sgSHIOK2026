"use client";

import React, { useId, useLayoutEffect, useRef, useState } from "react";
import {
  MAX_REPORT_NOTE_CHARACTERS, REPORT_SCHEMA_VERSION, validateReport,
  type Report, type ReportContext, type ReportGeometry, type ReportValidationError,
} from "../lib/reports";
import {
  prepareReportSubmission, submitReport, type ReportSubmissionEnvelope,
  type ReportSubmissionError, type ReportSubmissionResult,
} from "../lib/report-submission";
import styles from "./report-composer.module.css";

export interface ReportComposerProps {
  geometry: ReportGeometry | null;
  context?: ReportContext;
  bundleVersion: string;
  enabled?: boolean;
  onClose: () => void;
  // The parent must guard navigation/unmounts, not remount on selection changes while true.
  onUnsavedChange: (unsaved: boolean) => void;
  onPhaseChange?: (phase: ReportComposerPhase) => void;
}

type ReportType = Report["report_type"];
type PreparedState = { envelope: ReportSubmissionEnvelope };
type ComposerState =
  | { phase: "draft"; reportType: ReportType | ""; note: string; error?: string }
  | ({ phase: "review" | "sending" | "uncertain" } & PreparedState)
  | ({ phase: "rejected"; error: ReportSubmissionError } & PreparedState)
  | ({ phase: "received"; result: Extract<ReportSubmissionResult, { ok: true }> } & PreparedState)
  | { phase: "closed" };

export type ReportComposerPhase = ComposerState["phase"];

const VALIDATION_ID = "00000000-0000-7000-8000-000000000000";
const LABELS: Record<ReportType, string> = { mapping_error: "Mapping error", shelter_request: "Shelter request" };

function selection({ geometry, context, bundleVersion }: ReportComposerProps) {
  return validateReport({
    schema_version: REPORT_SCHEMA_VERSION, client_request_id: VALIDATION_ID,
    report_type: "mapping_error", geometry, referenced_bundle_version: bundleVersion,
    ...(context !== undefined ? { context } : {}),
  });
}

function validationMessage(error: ReportValidationError | "crypto_unavailable"): string {
  if (error === "invalid_geometry") return "Choose a valid point or a section up to 1.2 km with at most 32 points.";
  if (error === "invalid_note") return "Use up to 1,000 characters without unsupported text characters.";
  if (error === "body_too_large") return "This report is too large. Shorten the note or choose a smaller section.";
  if (error === "crypto_unavailable") return "A secure report could not be prepared. Nothing was sent.";
  return "The selected location or map version is unavailable. Close this draft and select a location again.";
}

function rejectionMessage(error: ReportSubmissionError): string {
  if (error === "limited") return "The reporting limit has been reached. Retry this same report later.";
  if (error === "unavailable") return "Reporting is temporarily unavailable. Retry this same report later.";
  if (error === "expired") return "This report has expired. Its receipt can no longer be recovered here.";
  if (error === "conflict") return "This report could not be verified. Do not create a duplicate to retry it.";
  return "The report was not accepted. Your original report is unchanged.";
}

function unsaved(state: ComposerState): boolean {
  if (state.phase === "closed" || state.phase === "received") return false;
  if (state.phase === "draft") return !!state.reportType || !!state.note;
  return true;
}

function positionText(point: readonly [number, number]): string {
  return `${point[1]}, ${point[0]}`;
}

/** One in-memory composition per mount. Selection props never retarget an existing report. */
export function ReportComposer(props: ReportComposerProps) {
  const { enabled = false, onClose, onUnsavedChange, onPhaseChange } = props;
  const id = useId();
  const [frozen] = useState(() => selection(props));
  const [state, setState] = useState<ComposerState>({ phase: "draft", reportType: "", note: "" });
  const [closing, setClosing] = useState(false);
  const current = useRef(state);
  const closeRequested = useRef(false);
  const active = useRef(false);
  const available = useRef(enabled);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const lastView = useRef("draft:false");

  useLayoutEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useLayoutEffect(() => { available.current = enabled; }, [enabled]);
  useLayoutEffect(() => { onUnsavedChange(unsaved(state)); }, [state, onUnsavedChange]);
  useLayoutEffect(() => { onPhaseChange?.(state.phase); }, [state.phase, onPhaseChange]);
  useLayoutEffect(() => {
    const view = `${state.phase}:${closing}`;
    if (lastView.current !== view) heading.current?.focus();
    lastView.current = view;
  }, [state.phase, closing]);

  function transition(next: ComposerState) {
    current.current = next;
    setState(next);
  }

  function finishClose() {
    if (current.current.phase === "closed") return;
    transition({ phase: "closed" });
    closeRequested.current = false;
    setClosing(false);
    // onClose may synchronously unmount us before the layout notification can run.
    onUnsavedChange(false);
    onClose();
  }

  function requestClose() {
    if (current.current.phase === "closed") return;
    if (!unsaved(current.current)) { finishClose(); return; }
    closeRequested.current = true;
    setClosing(true);
  }

  function editDraft(reportType: ReportType | "", note: string) {
    if (current.current.phase !== "draft" || closeRequested.current) return;
    // Native maxlength bounds typing; also reject oversized synthetic/pasted change events.
    if (note.length > MAX_REPORT_NOTE_CHARACTERS * 2) {
      transition({ ...current.current, error: "That edit is too long and was not applied. Use up to 1,000 characters." });
      return;
    }
    transition({ phase: "draft", reportType, note });
  }

  function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = current.current;
    if (draft.phase !== "draft" || closeRequested.current || !frozen.ok) return;
    if (!draft.reportType) { transition({ ...draft, error: "Choose a report type." }); return; }
    const { client_request_id: _validationId, ...location } = frozen.report;
    const prepared = prepareReportSubmission({
      ...location, report_type: draft.reportType, ...(draft.note ? { note: draft.note } : {}),
    });
    if (!prepared.ok) { transition({ ...draft, error: validationMessage(prepared.error) }); return; }
    transition({ phase: "review", envelope: prepared.envelope });
  }

  async function send() {
    const ready = current.current;
    if (!active.current || !available.current || closeRequested.current
      || !(ready.phase === "review" || ready.phase === "uncertain" || ready.phase === "rejected")) return;
    if (ready.phase === "rejected" && !["limited", "unavailable", "request_timeout"].includes(ready.error)) return;
    const pending: ComposerState = { phase: "sending", envelope: ready.envelope };
    transition(pending);
    let result: ReportSubmissionResult;
    try { result = await submitReport(ready.envelope); }
    catch { result = { ok: false, error: "outcome_unknown" }; }
    if (!active.current || current.current !== pending) return;
    closeRequested.current = false;
    setClosing(false);
    transition(result.ok ? { phase: "received", envelope: ready.envelope, result }
      : result.error === "outcome_unknown" ? { phase: "uncertain", envelope: ready.envelope }
        : { phase: "rejected", envelope: ready.envelope, error: result.error });
  }

  if (state.phase === "closed") return null;
  const now = selection(props);
  const selectionChanged = frozen.ok ? !now.ok || now.canonicalContent !== frozen.canonicalContent
    : now.ok || now.error !== frozen.error;
  const location = frozen.ok ? frozen.report : null;
  const points = location ? location.geometry.type === "Point" ? [location.geometry.coordinates] : location.geometry.coordinates : [];
  const report = "envelope" in state ? state.envelope.report : null;
  const unknownSave = state.phase === "sending" || state.phase === "uncertain";
  const retryAllowed = state.phase === "uncertain" || state.phase === "rejected"
    && ["limited", "unavailable", "request_timeout"].includes(state.error);
  const title = closing ? "Leave this report?"
    : state.phase === "draft" ? "Draft report" : state.phase === "review" ? "Review report"
      : state.phase === "sending" ? "Sending report" : state.phase === "uncertain" ? "Save not confirmed"
        : state.phase === "received" ? "Report received" : "Report not accepted";

  return (
    <section className={styles.composer} aria-labelledby={`${id}-title`}>
      <header className={styles.header}>
        <h2 id={`${id}-title`} ref={heading} tabIndex={-1}>{title}</h2>
        <button type="button" className={styles.close} aria-label="Close report" title="Close report" onClick={requestClose}>
          <span aria-hidden="true">&times;</span>
        </button>
      </header>
      {closing ? (
        <div className={styles.warning}>
          <p role="alert">{unknownSave
            ? "This report may already have been saved. Closing does not cancel or delete it. You will lose the ability to retry this report or recover its receipt. Do not create another report for the same issue."
            : state.phase === "draft" || state.phase === "review"
              ? "Discard this draft? It has not been sent."
              : "Close this report? You will lose this report's retry details. Closing does not delete any saved report."}</p>
          <div className={styles.actions}>
            <button type="button" onClick={() => { closeRequested.current = false; setClosing(false); }}>Keep report open</button>
            <button type="button" onClick={() => { if (closeRequested.current) finishClose(); }}>
              {unknownSave ? "Close without receipt" : state.phase === "draft" || state.phase === "review" ? "Discard draft" : "Close report and lose retry details"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {selectionChanged && <p className={styles.warning} role="status">Map selection changed. This report still refers to the original location below.</p>}
          {location && <div className={styles.location}>
            <strong>{location.geometry.type === "Point" ? "Selected point" : "Selected section"}</strong>
            {location.context?.postal_code && <p>Postal {location.context.postal_code}</p>}
            <details>
              <summary>Location details</summary>
              <p>{positionText(points[0])}{points.length > 1 ? ` to ${positionText(points[points.length - 1])}` : ""}</p>
              <dl className={styles.details}>
                <dt>Map version</dt><dd>{location.referenced_bundle_version}</dd>
                {location.context?.transit_category && <><dt>Transit</dt><dd>{location.context.transit_category === "bus" ? "Bus stop" : "MRT/LRT exit"}</dd></>}
                {location.context?.destination_id && <><dt>Destination ID</dt><dd>{location.context.destination_id}</dd></>}
                {location.context?.published_route_id && <><dt>Route ID</dt><dd>{location.context.published_route_id}</dd></>}
              </dl>
              {points.length > 1 && <ol>{points.map((point, index) => <li key={index}>{positionText(point)}</li>)}</ol>}
            </details>
          </div>}
          {!frozen.ok && <p role="alert" className={styles.warning}>{validationMessage(frozen.error)}</p>}
          <p className={styles.privacy} id={`${id}-privacy`}>Private to SHIOK. Reports expire after 30 days. No account needed. Do not include names, contact details or photos.</p>
          {!enabled && state.phase !== "received" && <p role="status" id={`${id}-unavailable`}>Sending is unavailable. Reporting is not enabled.</p>}
          {state.phase === "draft" ? (
            <form onSubmit={review} aria-describedby={`${id}-privacy`}>
              <fieldset className={styles.types}>
                <legend>What would you like to report?</legend>
                {(["mapping_error", "shelter_request"] as const).map(type => (
                  <label key={type}>
                    <input type="radio" name={`${id}-type`} value={type} checked={state.reportType === type}
                      onChange={() => editDraft(type, current.current.phase === "draft" ? current.current.note : "")} />
                    {LABELS[type]}
                  </label>
                ))}
              </fieldset>
              <label className={styles.label} htmlFor={`${id}-note`}>Note (optional)</label>
              <textarea id={`${id}-note`} value={state.note} rows={3} maxLength={MAX_REPORT_NOTE_CHARACTERS * 2}
                autoComplete="off" spellCheck={false} aria-describedby={`${id}-count ${id}-privacy${state.error ? ` ${id}-error` : ""}`}
                aria-invalid={!!state.error || Array.from(state.note).length > MAX_REPORT_NOTE_CHARACTERS}
                onChange={event => editDraft(current.current.phase === "draft" ? current.current.reportType : "", event.currentTarget.value)} />
              <p id={`${id}-count`} className={styles.count}>{Array.from(state.note).length} / {MAX_REPORT_NOTE_CHARACTERS} characters</p>
              {state.error && <p id={`${id}-error`} role="alert">{state.error}</p>}
              <div className={styles.actions}><button type="submit" disabled={!location}>Review report</button></div>
            </form>
          ) : (
            <>
              {report && <div className={styles.review}>
                <h3>{LABELS[report.report_type]}</h3>
                <p className={styles.note}>{report.note || "No note added."}</p>
              </div>}
              <p role="status" aria-live="polite" className={styles.status}>
                {state.phase === "review" ? "Not sent yet. Check the location and note before sending."
                  : state.phase === "sending" ? "Sending. A receipt has not been confirmed yet."
                    : state.phase === "uncertain" ? "We could not confirm whether your report was saved. Retry this same report to check; do not submit a new copy."
                      : state.phase === "rejected" ? rejectionMessage(state.error)
                        : "Received by SHIOK. This receipt does not mean the map has been changed or shelter will be built."}
              </p>
              {state.phase === "received" && <dl className={styles.details}>
                <dt>Receipt</dt><dd>{state.result.receipt.receipt_id}</dd>
                <dt>Received at</dt><dd><time dateTime={state.result.receipt.received_at}>{state.result.receipt.received_at}</time></dd>
              </dl>}
              <div className={styles.actions}>
                {state.phase === "review" && <>
                  <button type="button" onClick={() => {
                    const reviewed = current.current;
                    if (reviewed.phase !== "review" || closeRequested.current) return;
                    transition({ phase: "draft", reportType: reviewed.envelope.report.report_type, note: reviewed.envelope.report.note ?? "" });
                  }}>Edit draft</button>
                  <button type="button" className={styles.primary} disabled={!enabled} aria-describedby={!enabled ? `${id}-unavailable` : undefined} onClick={send}>Send report</button>
                </>}
                {state.phase === "sending" && <button type="button" disabled>Sending</button>}
                {retryAllowed && <button type="button" className={styles.primary} disabled={!enabled} aria-describedby={!enabled ? `${id}-unavailable` : undefined} onClick={send}>Retry same report</button>}
                {state.phase === "received" && <button type="button" onClick={finishClose}>Done</button>}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
