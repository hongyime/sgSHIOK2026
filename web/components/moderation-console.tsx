"use client";

import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createModeratorClient, validateModeratorDecision, type ModeratorClient } from '../lib/moderator-client';
import type { ModerationCommand, ModerationQueueRequest, ModeratorContextSource, ModeratorQueueReport } from '../app/api/moderation/store';
import { ReportLocationPreview } from './report-location-preview';
import styles from './moderation-console.module.css';

type Filter = ModerationQueueRequest['state'];
type Cursor = ModerationQueueRequest['after'];
type Phase = 'edit' | 'confirm' | 'sending' | 'uncertain' | 'conflict' | 'saved';
interface Screen {
  signedIn: boolean; loggingIn: boolean; loading: boolean; message: string;
  email: string; password: string; filter: Filter; rows: readonly ModeratorQueueReport[];
  cursors: Cursor[]; selected: ModeratorQueueReport | null; phase: Phase;
  action: ModerationCommand['action']; reason: string; duplicate: string;
  command: ModerationCommand | null; saved: ModeratorContextSource | null;
}
interface Recovery { receipt_id: string; expected_revision: number }
const empty = (): Screen => ({ signedIn: false, loggingIn: false, loading: false, message: '', email: '', password: '',
  filter: 'pending', rows: [], cursors: [undefined], selected: null, phase: 'edit', action: 'accepted', reason: '', duplicate: '', command: null, saved: null });
const typeLabel = (type: string) => type === 'mapping_error' ? 'Mapping error' : 'Shelter request';
const stateLabel = (state: string) => ({ pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected', duplicate: 'Duplicate' }[state] ?? 'Unavailable');
function timeLabel(value: string) { return new Date(value).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Singapore' }); }
function dirty(view: Screen) { return !!view.reason || !!view.duplicate || ['confirm', 'sending', 'uncertain', 'conflict'].includes(view.phase); }
function errorMessage(error: string): string {
  if (error === 'limited') return 'Too many requests. Try again later.';
  if (error === 'unauthenticated' || error === 'forbidden') return 'Sign in again to continue.';
  if (error === 'invalid_request') return 'Check the fields and try again.';
  return 'Private review is temporarily unavailable.';
}

export function ModerationConsole({ enabled = false, client: provided }: { enabled?: boolean; client?: ModeratorClient }) {
  const [client] = useState(() => provided ?? createModeratorClient());
  const [view, setView] = useState<Screen>(empty);
  const current = useRef(view), active = useRef(false), generation = useRef(0), recovery = useRef<Recovery | null>(null);
  const container = useRef<HTMLElement | null>(null), heading = useRef<HTMLHeadingElement | null>(null);
  const id = useId();
  function update(next: Screen) { current.current = next; setView(next); }
  function clear(message: string, keepRecovery = false) {
    if (keepRecovery && current.current.command && ['sending', 'uncertain'].includes(current.current.phase)) {
      recovery.current = { receipt_id: current.current.command.receipt_id, expected_revision: current.current.command.expected_revision };
    } else if (!keepRecovery) recovery.current = null;
    generation.current++; client.clear(); update({ ...empty(), message });
  }
  useLayoutEffect(() => {
    active.current = true;
    return () => { active.current = false; generation.current++; recovery.current = null; client.clear(); };
  }, [client]);
  useLayoutEffect(() => {
    const before = (event: BeforeUnloadEvent) => { if (dirty(current.current)) { event.preventDefault(); event.returnValue = ''; } };
    const hide = () => { if (container.current) container.current.hidden = true; flushSync(() => clear('Sign in to continue.')); };
    // A restored document must commit the signed-out DOM before it becomes visible.
    const show = (event: PageTransitionEvent) => { if (event.persisted) flushSync(() => clear('Sign in to continue.')); if (container.current) container.current.hidden = false; };
    const visible = () => { if (document.visibilityState === 'visible' && current.current.signedIn && (client.expiresAt() ?? 0) <= Date.now()) clear('Your session expired. Sign in again.', true); };
    window.addEventListener('beforeunload', before); window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', show); document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener('beforeunload', before); window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', show); document.removeEventListener('visibilitychange', visible); };
  }, [client]);
  useLayoutEffect(() => {
    if (!view.signedIn) return;
    const expiration = Math.min(client.expiresAt() ?? 0, ...view.rows.map(row => Date.parse(row.expires_at)),
      view.selected ? Date.parse(view.selected.expires_at) : Infinity,
      view.saved ? Date.parse(view.saved.received_at) + 30 * 24 * 60 * 60 * 1000 : Infinity);
    const timer = setTimeout(() => {
      if ((client.expiresAt() ?? 0) <= Date.now()) { clear('Your session expired. Sign in again.', true); return; }
      const now = Date.now(), latest = current.current;
      const rows = latest.rows.filter(row => Date.parse(row.expires_at) > now);
      if ((latest.selected && Date.parse(latest.selected.expires_at) <= now) ||
          (latest.saved && Date.parse(latest.saved.received_at) + 30 * 24 * 60 * 60 * 1000 <= now)) {
        if (latest.command && ['sending', 'uncertain'].includes(latest.phase)) recovery.current = { receipt_id: latest.command.receipt_id, expected_revision: latest.command.expected_revision };
        generation.current++; update({ ...latest, rows, selected: null, saved: null, command: null, reason: '', duplicate: '', phase: recovery.current ? 'uncertain' : 'edit', loading: false, message: recovery.current ? 'The report expired. An earlier unconfirmed save cannot be verified here.' : 'The report expired.' });
      } else update({ ...latest, rows });
    }, Math.max(0, expiration - Date.now()));
    return () => clearTimeout(timer);
  }, [view.signedIn, view.rows, view.selected, view.saved, client]);
  useLayoutEffect(() => {
    const selector = view.phase === 'saved' ? '[data-audit-heading]' : ['uncertain', 'conflict'].includes(view.phase)
      ? '[data-recovery-heading]' : ['confirm', 'sending'].includes(view.phase) ? '[data-decision-heading]'
        : view.selected ? '[data-review-heading]' : null;
    const target = selector ? container.current?.querySelector<HTMLElement>(selector) : null;
    (target ?? heading.current)?.focus();
  }, [view.signedIn, view.selected?.receipt_id, view.phase]);

  function allowLeave() {
    return !dirty(current.current) || window.confirm(current.current.phase === 'uncertain' || current.current.phase === 'sending'
      ? 'The saved decision is not confirmed. Leave this review without confirmation?' : 'Discard this unfinished review?');
  }
  async function load(filter: Filter, cursors: Cursor[] = [undefined]) {
    if (!active.current || !current.current.signedIn) return;
    const epoch = ++generation.current;
    update({ ...current.current, filter, cursors, loading: true, rows: [], selected: null, saved: null, command: null,
      reason: '', duplicate: '', phase: 'edit', message: '' });
    const result = await client.queue({ state: filter, ...(cursors.at(-1) ? { after: cursors.at(-1)! } : {}) });
    if (!active.current || generation.current !== epoch) return;
    if (!result.ok) {
      if (!client.expiresAt()) { clear(errorMessage(result.error), true); return; }
      update({ ...current.current, loading: false, message: errorMessage(result.error) }); return;
    }
    update({ ...current.current, loading: false, rows: result.queue.reports });
  }
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || !active.current || current.current.loggingIn) return;
    const { email, password } = current.current; const epoch = ++generation.current;
    update({ ...current.current, loggingIn: true, password: '', message: '' });
    const result = await client.login(email, password);
    if (!active.current || generation.current !== epoch) return;
    if (!result.ok) { update({ ...empty(), message: errorMessage(result.error) }); return; }
    update({ ...empty(), signedIn: true, phase: recovery.current ? 'uncertain' : 'edit' });
    if (recovery.current) await reconcile(); else await load('pending');
  }
  async function signOut() {
    if (!allowLeave()) return;
    const epoch = ++generation.current; recovery.current = null;
    update({ ...empty(), message: 'Signing out...' });
    const result = await client.logout();
    if (!active.current || generation.current !== epoch) return;
    update({ ...empty(), message: result.ok ? 'Signed out.' : 'Signed out on this browser. Server sign-out was not confirmed.' });
  }
  function select(row: ModeratorQueueReport) {
    if (current.current.loading || !allowLeave()) return;
    recovery.current = null;
    update({ ...current.current, selected: row, phase: 'edit', reason: '', duplicate: '', action: 'accepted', command: null, saved: null, message: '' });
  }
  function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const latest = current.current;
    if (!latest.signedIn || !latest.selected || latest.selected.state !== 'pending' || latest.phase !== 'edit') return;
    const command: ModerationCommand = { receipt_id: latest.selected.receipt_id, expected_revision: latest.selected.revision,
      action: latest.action, reason: latest.reason, ...(latest.action === 'duplicate' ? { duplicate_of: latest.duplicate } : {}) };
    if (!validateModeratorDecision(command)) { update({ ...latest, message: 'Add a valid reason of up to 1,000 characters and, for duplicates, a different report receipt.' }); return; }
    update({ ...latest, phase: 'confirm', command: Object.freeze(command), message: '' });
  }
  async function save() {
    const latest = current.current;
    if (!active.current || !latest.signedIn || latest.phase !== 'confirm' || !latest.command) return;
    const command = latest.command; const epoch = generation.current;
    update({ ...latest, phase: 'sending', message: '' });
    const result = await client.decide(command);
    if (!active.current || generation.current !== epoch) return;
    if (!result.ok) {
      if (!client.expiresAt()) { clear('Your session ended. Sign in again to check the saved decision.', result.error === 'outcome_unknown'); return; }
      const phase = result.error === 'outcome_unknown' ? 'uncertain' : result.error === 'conflict' ? 'conflict' : 'confirm';
      update({ ...current.current, phase, message: phase === 'uncertain' ? 'Save not confirmed. Check the saved decision before continuing.'
        : phase === 'conflict' ? 'This report changed. Check its saved decision.' : errorMessage(result.error) }); return;
    }
    recovery.current = null;
    update({ ...current.current, selected: null, rows: current.current.rows.filter(row => row.receipt_id !== command.receipt_id),
      phase: 'edit', command: null, reason: '', duplicate: '', saved: null, message: `Report ${stateLabel(result.decision.state).toLowerCase()}.` });
  }
  async function reconcile() {
    const latest = current.current;
    const receipt = recovery.current?.receipt_id ?? latest.command?.receipt_id;
    if (!active.current || !latest.signedIn || latest.loading || !receipt) return;
    const epoch = generation.current; update({ ...latest, loading: true, message: 'Checking saved decision...' });
    const result = await client.context(receipt);
    if (!active.current || generation.current !== epoch) return;
    if (!result.ok) {
      if (!client.expiresAt()) { clear('Sign in again to check the saved decision.', true); return; }
      update({ ...current.current, loading: false, message: result.error === 'conflict'
        ? 'Report unavailable. The earlier save remains unconfirmed.' : errorMessage(result.error) }); return;
    }
    if (result.context.source.state === 'pending') {
      update({ ...current.current, loading: false, phase: 'uncertain', message: 'Still pending at the last check. The earlier save remains unconfirmed.' }); return;
    }
    recovery.current = null;
    update({ ...current.current, loading: false, phase: 'saved', command: null, reason: '', duplicate: '', saved: result.context.source,
      rows: current.current.rows.filter(row => row.receipt_id !== receipt), message: 'Saved decision found.' });
  }
  function back() {
    if (!allowLeave()) return; recovery.current = null;
    update({ ...current.current, selected: null, saved: null, command: null, reason: '', duplicate: '', phase: 'edit', message: '' });
    void load(current.current.filter);
  }
  const selected = view.selected;
  const locked = ['confirm', 'sending', 'uncertain', 'conflict'].includes(view.phase) || !!recovery.current;
  const busy = view.loading || view.phase === 'sending';
  const audit = view.saved ?? (selected?.moderation ? { ...selected, ...selected.moderation } : null);
  return <main ref={container} className={styles.page}>
    <header className={styles.header}><a href="/" onClick={event => { if (!allowLeave()) event.preventDefault(); }} className={styles.brand}><img src="/icon.svg" width={28} height={28} alt="" />SHIOK</a>
      <span>Private review</span>{view.signedIn && <button type="button" onClick={() => { void signOut(); }}>Sign out</button>}</header>
    <div className={styles.title}><h1 ref={heading} tabIndex={-1}>Resident reports</h1>{view.signedIn && <span className={styles.muted}>Singapore time</span>}</div>
    {view.message && <p role="status" className={styles.notice}>{view.message}</p>}
    {!enabled ? <p>Private review is not available.</p> : !view.signedIn ? <form method="post" action="/api/moderation/login" onSubmit={event => { void signIn(event); }} className={styles.login}>
      <label htmlFor={`${id}-email`}>Email</label><input id={`${id}-email`} type="email" name="email" autoComplete="username" required maxLength={254} value={view.email} disabled={view.loggingIn}
        onChange={event => update({ ...current.current, email: event.currentTarget.value })} />
      <label htmlFor={`${id}-password`}>Password</label><input id={`${id}-password`} type="password" name="password" autoComplete="current-password" required maxLength={1024} value={view.password} disabled={view.loggingIn}
        onChange={event => update({ ...current.current, password: event.currentTarget.value })} />
      <button type="submit" className={styles.primary} disabled={view.loggingIn}>{view.loggingIn ? 'Signing in...' : 'Sign in'}</button>
    </form> : <>
      <div className={styles.tools}><label htmlFor={`${id}-status`}>Status</label><select id={`${id}-status`} value={view.filter} disabled={busy || locked}
        onChange={event => { if (allowLeave()) void load(event.currentTarget.value as Filter); }}>
        {(['pending', 'accepted', 'rejected', 'duplicate'] as const).map(state => <option value={state} key={state}>{stateLabel(state)}</option>)}</select>
        <button type="button" disabled={busy || locked} onClick={() => { if (allowLeave()) void load(view.filter); }}>Refresh</button>
      </div>
      <div className={`${styles.workspace} ${selected || view.saved || recovery.current ? styles.detailOpen : ''}`}>
        <section className={styles.list} aria-label="Report queue" aria-busy={view.loading}>
          {!view.rows.length && <p className={styles.muted}>{view.loading ? 'Loading reports...' : 'No reports on this page.'}</p>}
          {view.rows.map(row => <button type="button" className={styles.row} key={row.receipt_id} disabled={busy || locked}
            aria-pressed={selected?.receipt_id === row.receipt_id} onClick={() => select(row)}>
            <strong>{typeLabel(row.report_type)}</strong><span>{row.content.context?.postal_code ? `Postal ${row.content.context.postal_code}` : row.content.geometry.type === 'Point' ? 'Reported point' : 'Reported section'}</span>
            <small>{timeLabel(row.received_at)}</small><code>{row.receipt_id.slice(0, 8)}</code>
          </button>)}
          <nav className={styles.paging} aria-label="Queue pages"><button type="button" disabled={busy || locked || view.cursors.length === 1}
            onClick={() => { if (allowLeave()) void load(view.filter, view.cursors.slice(0, -1)); }}>Previous</button>
            <span>Page {view.cursors.length}</span><button type="button" disabled={busy || locked || view.rows.length !== 25}
              onClick={() => { if (!allowLeave()) return; const row = view.rows.at(-1)!; void load(view.filter, [...view.cursors, { received_at: row.received_at, receipt_id: row.receipt_id }]); }}>Next</button></nav>
        </section>
        <section className={styles.detail} aria-label="Report review">
          {(selected || view.saved || recovery.current) && <button type="button" onClick={back} disabled={busy}>Back to reports</button>}
          {selected && <>
            <div className={styles.detailTitle}><h2 data-review-heading tabIndex={-1}>{typeLabel(selected.report_type)}</h2><span>{stateLabel(view.saved?.state ?? selected.state)}</span></div>
            <p className={styles.receipt}>Receipt <code>{selected.receipt_id}</code></p>
            <ReportLocationPreview geometry={selected.content.geometry} />
            <dl className={styles.facts}><div><dt>Received</dt><dd>{timeLabel(selected.received_at)}</dd></div><div><dt>Expires</dt><dd>{timeLabel(selected.expires_at)}</dd></div>
              {selected.content.context?.postal_code && <div><dt>Postal code</dt><dd>{selected.content.context.postal_code}</dd></div>}
              {selected.content.context?.destination_id && <div><dt>Transit reference</dt><dd>{selected.content.context.destination_id}</dd></div>}
              <div><dt>Map version</dt><dd>{selected.content.referenced_bundle_version}</dd></div></dl>
            <h3>Resident note</h3><p className={styles.text}>{selected.content.note || 'No note provided.'}</p>
          </>}
          {audit && <div className={styles.audit}><h3 data-audit-heading tabIndex={-1}>Saved decision: {stateLabel(audit.state)}</h3><p className={styles.text}>{audit.reason}</p>
            {audit.duplicate_of && <p className={styles.receipt}>Duplicate of <code>{audit.duplicate_of}</code></p>}
            {audit.moderated_at && <p className={styles.muted}>{timeLabel(audit.moderated_at)}</p>}</div>}
          {view.phase === 'uncertain' || view.phase === 'conflict' || recovery.current ? <div className={styles.recovery}><h3 data-recovery-heading tabIndex={-1}>Check the saved decision</h3>
            <button type="button" disabled={busy} onClick={() => { void reconcile(); }}>{view.loading ? 'Checking...' : 'Check saved decision'}</button></div>
          : selected?.state === 'pending' && view.phase !== 'saved' && <>
            {view.phase === 'edit' ? <form onSubmit={review} className={styles.decision}>
              <label htmlFor={`${id}-action`}>Decision</label><select id={`${id}-action`} value={view.action} onChange={event => update({ ...current.current, action: event.currentTarget.value as ModerationCommand['action'], duplicate: '' })}>
                <option value="accepted">Accept</option><option value="rejected">Reject</option><option value="duplicate">Mark duplicate</option></select>
              {view.action === 'duplicate' && <><label htmlFor={`${id}-duplicate`}>Original report receipt</label><input id={`${id}-duplicate`} autoComplete="off" maxLength={36} value={view.duplicate} onChange={event => update({ ...current.current, duplicate: event.currentTarget.value })} /></>}
              <label htmlFor={`${id}-reason`}>Review reason</label><textarea id={`${id}-reason`} rows={4} maxLength={2000} value={view.reason} required onChange={event => update({ ...current.current, reason: event.currentTarget.value })} />
              <button type="submit">Review decision</button>
            </form> : <div className={styles.confirm}><h3 data-decision-heading tabIndex={-1}>{stateLabel(view.command?.action ?? '')} this report?</h3><p className={styles.text}>{view.command?.reason}</p>
              {view.command?.duplicate_of && <p className={styles.receipt}>Duplicate of <code>{view.command.duplicate_of}</code></p>}
              <div className={styles.actions}><button type="button" disabled={busy} onClick={() => update({ ...current.current, phase: 'edit', command: null, message: '' })}>Edit decision</button>
                <button type="button" className={styles.primary} disabled={busy} onClick={() => { void save(); }}>{view.phase === 'sending' ? 'Saving...' : 'Save decision'}</button></div></div>}
          </>}
          {!selected && !view.saved && !recovery.current && <p className={styles.muted}>Select a report.</p>}
        </section>
      </div>
    </>}
  </main>;
}
