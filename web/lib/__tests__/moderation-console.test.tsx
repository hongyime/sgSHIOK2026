import React, { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { ModeratorClient } from '../moderator-client';
import type { ModeratorContextResult, ModeratorQueueReport, ModeratorQueueResult } from '../../app/api/moderation/store';

// Execute real console handlers and dependency-bound effects, using the same
// hook-host pattern as report-composer. Native DOM/BFCache ordering is NOT proved
// here: flushSync below explicitly models committing before returning to its caller.
const host = vi.hoisted(() => {
  type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [];
  let cursor = 0, dirty = false, pending: Array<() => void> = [];
  return {
    begin() { cursor = 0; dirty = false; },
    changed: () => dirty,
    values: () => slots.map(slot => slot.value),
    commit() { const work = pending; pending = []; work.forEach(run => run()); },
    unmount() { slots.forEach(slot => slot.cleanup?.()); slots.length = 0; cursor = 0; pending = []; },
    useId: () => 'moderation-console-test',
    useRef<T>(initial: T): { current: T } {
      return (slots[cursor++] ??= { value: { current: initial } }).value as { current: T };
    },
    useState<T>(initial: T | (() => T)): [T, (next: T | ((value: T) => T)) => void] {
      const slot = slots[cursor++] ??= { value: typeof initial === 'function' ? (initial as () => T)() : initial };
      return [slot.value as T, next => {
        const value = typeof next === 'function' ? (next as (value: T) => T)(slot.value as T) : next;
        if (!Object.is(slot.value, value)) { slot.value = value; dirty = true; }
      }];
    },
    useLayoutEffect(create: () => void | (() => void), deps: readonly unknown[]) {
      const slot = slots[cursor++] ??= {};
      if (!slot.deps || deps.length !== slot.deps.length || deps.some((dep, i) => !Object.is(dep, slot.deps![i]))) {
        slot.deps = deps;
        pending.push(() => { slot.cleanup?.(); slot.cleanup = create() || undefined; });
      }
    },
  };
});
const synchronous = vi.hoisted(() => ({ flush: vi.fn<(work: () => void) => void>() }));
vi.mock('react', async original => {
  const actual = await original<typeof import('react')>();
  const hooks = { useRef: host.useRef, useState: host.useState, useLayoutEffect: host.useLayoutEffect, useId: host.useId };
  return { ...actual, ...hooks, default: { ...actual.default, ...hooks } };
});
vi.mock('react-dom', () => ({ flushSync: synchronous.flush }));
vi.mock('../../components/report-location-preview', () => ({ ReportLocationPreview: () => null }));

import { ModerationConsole } from '../../components/moderation-console';
import { ReportLocationPreview } from '../../components/report-location-preview';

type Element = ReactElement<{
  children?: ReactNode; ref?: { current: unknown }; onClick?: (event: { preventDefault: () => void }) => void;
  onSubmit?: (event: { preventDefault: () => void }) => void;
  onChange?: (event: { currentTarget: { value: string } }) => void;
  disabled?: boolean; value?: string; id?: string; type?: string; name?: string; href?: string;
  tabIndex?: number; role?: string; geometry?: unknown; 'aria-label'?: string; 'aria-pressed'?: boolean;
  'data-review-heading'?: boolean; 'data-decision-heading'?: boolean; 'data-recovery-heading'?: boolean; 'data-audit-heading'?: boolean;
}>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Element['props']>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  return React.isValidElement<Element['props']>(node) ? text(node.props.children) : '';
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(yes => { resolve = yes; });
  return { promise, resolve };
}
const NOW = Date.parse('2026-09-15T10:00:00Z');
const RETENTION = 30 * 24 * 60 * 60 * 1000;
const NOTE = 'Synthetic private resident note';
const REASON = 'Synthetic private review reason';
const EMAIL = 'owner@example.invalid';
const PASSWORD = 'Synthetic login password';
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
function row(n = 1, expiry = NOW + RETENTION - 600000): ModeratorQueueReport {
  return {
    receipt_id: uuid(n), report_type: 'mapping_error', state: 'pending', revision: 1,
    received_at: new Date(expiry - RETENTION).toISOString(), expires_at: new Date(expiry).toISOString(), moderation: null,
    content: { schema_version: 1, report_type: 'mapping_error', referenced_bundle_version: 'synthetic-bundle',
      geometry: { type: 'Point', coordinates: [103.85, 1.35] }, note: NOTE,
      context: { postal_code: '001001', destination_id: 'synthetic-stop', transit_category: 'bus' } },
  };
}
const queue = (rows: readonly ModeratorQueueReport[]): ModeratorQueueResult => ({ ok: true, queue: { reports: rows, page_limit: 25 } });
function context(source = row(), state: 'pending' | 'accepted' | 'rejected' = 'accepted'): ModeratorContextResult {
  return { ok: true, context: { observed_at: new Date(Date.now()).toISOString(), source: {
    receipt_id: source.receipt_id, report_type: source.report_type, received_at: source.received_at,
    state, revision: state === 'pending' ? 1 : 2, moderated_at: state === 'pending' ? null : new Date(Date.now()).toISOString(),
    moderator_id: state === 'pending' ? null : uuid(500), reason: state === 'pending' ? null : 'A different saved reason', duplicate_of: null,
  } } };
}
type Listener = (event: Record<string, unknown>) => void;
let windowListeners: Map<string, Set<Listener>>, documentListeners: Map<string, Set<Listener>>;
let client: Mocked<ModeratorClient>, props: ComponentProps<typeof ModerationConsole>, tree: ReactNode;
let expiry: number | null, lifetime: number;
let events: string[], focusTargets: string[];
let container: { hidden: boolean; querySelector: (selector: string) => { focus: () => void } | null };
let confirm: ReturnType<typeof vi.fn>, focus: ReturnType<typeof vi.fn>;
let forbidden: ReturnType<typeof vi.fn>, logs: ReturnType<typeof vi.spyOn>[];
const privateState = () => JSON.stringify(host.values());

function render() {
  for (let i = 0; i < 10; i++) {
    host.begin(); tree = ModerationConsole(props);
    const main = elements(tree).find(node => node.type === 'main');
    if (main?.props.ref) main.props.ref.current = container;
    const heading = elements(tree).find(node => node.type === 'h1');
    if (heading?.props.ref) heading.props.ref.current = { focus };
    host.commit();
    if (!host.changed()) return;
  }
  throw Error('Unexpected console render loop');
}
async function settle() { for (let i = 0; i < 16; i++) await Promise.resolve(); render(); }
function button(name: string): Element {
  const found = elements(tree).find(node => node.type === 'button' && text(node) === name);
  expect(found, name).toBeDefined(); return found!;
}
function click(name: string) {
  const target = button(name); expect(target.props.disabled).not.toBe(true);
  target.props.onClick!({ preventDefault: vi.fn() }); render();
}
function field(suffix: string, value: string) {
  const target = elements(tree).find(node => node.props.id?.endsWith(`-${suffix}`));
  expect(target, suffix).toBeDefined();
  target!.props.onChange!({ currentTarget: { value } }); render();
}
function submit() {
  const form = elements(tree).find(node => node.type === 'form')!;
  const event = { preventDefault: vi.fn() }; form.props.onSubmit!(event);
  expect(event.preventDefault).toHaveBeenCalledOnce(); render();
}
async function signIn() { render(); field('email', EMAIL); field('password', PASSWORD); submit(); await settle(); }
function selectFirst() {
  const target = elements(tree).find(node => node.type === 'button' && node.props['aria-pressed'] !== undefined)!;
  expect(target.props.disabled).not.toBe(true); target.props.onClick!({ preventDefault: vi.fn() }); render();
}
async function ready() { await signIn(); selectFirst(); field('reason', REASON); submit(); }
async function uncertain() {
  client.decide.mockResolvedValueOnce({ ok: false, error: 'outcome_unknown' });
  await ready(); click('Save decision'); await settle();
  expect(text(tree)).toContain('Save not confirmed.');
}
function dispatch(type: string, event: Record<string, unknown> = {}, documentEvent = false) {
  for (const listener of [...((documentEvent ? documentListeners : windowListeners).get(type) ?? [])]) listener(event);
}
function listeners(map: Map<string, Set<Listener>>) {
  return {
    addEventListener(type: string, listener: Listener) { if (!map.has(type)) map.set(type, new Set()); map.get(type)!.add(listener); },
    removeEventListener(type: string, listener: Listener) { map.get(type)?.delete(listener); },
  };
}

beforeEach(() => {
  host.unmount(); vi.useFakeTimers({ now: NOW }); expiry = null; lifetime = 3600000;
  events = []; focusTargets = []; tree = null; windowListeners = new Map(); documentListeners = new Map();
  confirm = vi.fn(() => true); focus = vi.fn(); forbidden = vi.fn(() => { throw Error('Unexpected external IO'); });
  let hidden = false;
  container = {
    get hidden() { return hidden; }, set hidden(value: boolean) { hidden = value; events.push(`hidden:${value}`); },
    querySelector(selector: string) {
      const attr = selector.slice(1, -1) as keyof Element['props'];
      return elements(tree).some(node => node.props[attr] === true)
        ? { focus: () => { focusTargets.push(selector); } } : null;
    },
  };
  client = {
    login: vi.fn(async () => { expiry = Date.now() + lifetime; return { ok: true, expiresAt: new Date(expiry).toISOString() }; }),
    clear: vi.fn(() => { expiry = null; events.push('client:clear'); }),
    expiresAt: vi.fn(() => expiry !== null && expiry > Date.now() ? expiry : null),
    logout: vi.fn(async () => { expiry = null; return { ok: true }; }),
    queue: vi.fn(async () => queue([row()])), context: vi.fn(async () => context()),
    decide: vi.fn(async command => ({ ok: true, decision: { receipt_id: command.receipt_id, state: command.action,
      revision: command.expected_revision + 1, moderated_at: new Date(Date.now()).toISOString() } })),
  };
  props = { enabled: true, client };
  vi.stubGlobal('window', { ...listeners(windowListeners), confirm });
  vi.stubGlobal('document', { ...listeners(documentListeners), visibilityState: 'visible' });
  vi.stubGlobal('fetch', forbidden);
  vi.stubGlobal('localStorage', { getItem: forbidden, setItem: forbidden, removeItem: forbidden });
  vi.stubGlobal('sessionStorage', { getItem: forbidden, setItem: forbidden, removeItem: forbidden });
  vi.stubGlobal('history', { pushState: forbidden, replaceState: forbidden });
  synchronous.flush.mockReset();
  synchronous.flush.mockImplementation(work => { events.push('flush:start'); work(); render(); events.push('flush:end'); });
  logs = ['log', 'warn', 'error', 'info', 'debug'].map(name => vi.spyOn(console, name as 'log').mockImplementation(() => {}));
});
afterEach(() => {
  host.unmount();
  expect([...windowListeners.values(), ...documentListeners.values()].every(set => set.size === 0)).toBe(true);
  expect(forbidden).not.toHaveBeenCalled(); logs.forEach(log => expect(log).not.toHaveBeenCalled());
  vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('Private owner console handlers and lifecycle', () => {
  it('defaults to unavailable without login controls or provider operations', () => {
    delete props.enabled; render();
    expect(text(tree)).toContain('Private review is not available.');
    expect(elements(tree).some(node => node.type === 'form')).toBe(false);
    expect(client.login).not.toHaveBeenCalled(); expect(client.queue).not.toHaveBeenCalled();
  });
  it('clears the password while login is pending and prevents a duplicate submission', async () => {
    const pending = deferred<Awaited<ReturnType<ModeratorClient['login']>>>(); client.login.mockReturnValueOnce(pending.promise);
    render(); field('email', EMAIL); field('password', PASSWORD); submit();
    expect(privateState()).not.toContain(PASSWORD); expect(button('Signing in...').props.disabled).toBe(true);
    submit(); expect(client.login).toHaveBeenCalledOnce();
    pending.resolve({ ok: false, error: 'unauthenticated' }); await settle();
    expect(privateState()).not.toContain(EMAIL); expect(client.queue).not.toHaveBeenCalled();
  });
  it.each(['accepted', 'rejected', 'duplicate'] as const)('requires confirmation before one %s decision write', async action => {
    await signIn(); selectFirst(); field('action', action); field('reason', REASON);
    if (action === 'duplicate') field('duplicate', uuid(2));
    submit(); expect(client.decide).not.toHaveBeenCalled();
    const save = button('Save decision').props.onClick!;
    save({ preventDefault: vi.fn() }); save({ preventDefault: vi.fn() }); render();
    expect(client.decide).toHaveBeenCalledOnce(); expect(button('Saving...').props.disabled).toBe(true);
    expect(client.decide.mock.calls[0][0]).toEqual({ receipt_id: uuid(1), expected_revision: 1, action, reason: REASON,
      ...(action === 'duplicate' ? { duplicate_of: uuid(2) } : {}) });
    expect(Object.isFrozen(client.decide.mock.calls[0][0])).toBe(true);
    await settle(); expect(text(tree)).toContain(`Report ${action}.`);
    expect(text(tree)).not.toContain(NOTE); expect(privateState()).not.toContain(REASON);
  });
  it.each(['', '\u0000', '\ud800', 'a'.repeat(1001)])('rejects invalid decision reason %# before dispatch', async reason => {
    await signIn(); selectFirst(); field('reason', reason); submit();
    expect(text(tree)).toContain('Add a valid reason'); expect(client.decide).not.toHaveBeenCalled();
  });
  it('permits editing only before dispatch and requires another review', async () => {
    await ready(); click('Edit decision'); field('reason', 'Revised reason'); submit();
    expect(client.decide).not.toHaveBeenCalled(); click('Save decision'); await settle();
    expect(client.decide.mock.calls[0][0].reason).toBe('Revised reason');
  });
  it('passes geometry only to the local preview and escapes resident text in markup', async () => {
    const report = row(); client.queue.mockResolvedValueOnce(queue([{ ...report, content: { ...report.content, note: '<script>private</script>' } }]));
    await signIn(); selectFirst();
    expect(elements(tree).find(node => node.type === ReportLocationPreview)?.props.geometry).toEqual(report.content.geometry);
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('&lt;script&gt;private&lt;/script&gt;'); expect(html).not.toContain('<script>');
    expect(elements(tree).filter(node => node.type === 'a').map(node => node.props.href)).toEqual(['/']);
  });
  it('targets the review, confirmation, recovery and saved headings rather than the root on each phase', async () => {
    await signIn(); focus.mockClear(); selectFirst();
    expect(focusTargets.at(-1)).toBe('[data-review-heading]');
    field('reason', REASON); submit(); expect(focusTargets.at(-1)).toBe('[data-decision-heading]');
    client.decide.mockResolvedValueOnce({ ok: false, error: 'outcome_unknown' }); click('Save decision'); await settle();
    expect(focusTargets.at(-1)).toBe('[data-recovery-heading]');
    click('Check saved decision'); await settle(); expect(focusTargets.at(-1)).toBe('[data-audit-heading]');
    expect(focus).not.toHaveBeenCalled();
    for (const node of elements(tree).filter(node => node.props['data-review-heading'] || node.props['data-audit-heading'])) expect(node.props.tabIndex).toBe(-1);
  });
  it('keeps an unknown write unknown after repeated pending reads, with no retry', async () => {
    await uncertain(); client.context.mockResolvedValue(context(row(), 'pending'));
    for (let i = 0; i < 2; i++) { click('Check saved decision'); await settle(); }
    expect(text(tree)).toContain('Still pending at the last check. The earlier save remains unconfirmed.');
    expect(client.decide).toHaveBeenCalledOnce(); expect(client.context).toHaveBeenCalledTimes(2);
    expect(button('Refresh').props.disabled).toBe(true); expect(elements(tree).some(node => text(node) === 'Save decision')).toBe(false);
  });
  it.each(['conflict', 'unavailable'] as const)('does not erase uncertainty after a %s reconciliation read', async error => {
    await uncertain(); client.context.mockResolvedValueOnce({ ok: false, error });
    click('Check saved decision'); await settle();
    expect(button('Check saved decision').props.disabled).not.toBe(true);
    expect(button('Refresh').props.disabled).toBe(true); expect(client.decide).toHaveBeenCalledOnce();
    expect(text(tree)).not.toContain('Saved decision found.');
  });
  it('a direct conflict offers a read, not an automatic write retry', async () => {
    client.decide.mockResolvedValueOnce({ ok: false, error: 'conflict' }); await ready(); click('Save decision'); await settle();
    expect(text(tree)).toContain('This report changed.'); expect(client.context).not.toHaveBeenCalled();
    click('Check saved decision'); await settle(); expect(client.decide).toHaveBeenCalledOnce();
  });
  it('terminal reconciliation shows the saved status/reason without attributing another decision to this attempt', async () => {
    await uncertain(); client.context.mockResolvedValueOnce(context(row(), 'rejected'));
    click('Check saved decision'); await settle();
    expect(text(tree)).toContain('Saved decision: Rejected'); expect(text(tree)).toContain('A different saved reason');
    expect(text(tree)).not.toContain(REASON); expect(text(tree)).not.toMatch(/your decision (?:was|is) saved/i);
    expect(client.context).toHaveBeenCalledWith(uuid(1)); expect(client.decide).toHaveBeenCalledOnce();
  });
  it('expiry clears all content and credentials but retains only opaque recovery metadata for re-login', async () => {
    lifetime = 1000; await uncertain(); await vi.advanceTimersByTimeAsync(1000); render();
    for (const value of [NOTE, REASON, EMAIL, PASSWORD, 'synthetic-stop']) expect(privateState()).not.toContain(value);
    expect(privateState()).toContain(uuid(1)); expect(text(tree)).not.toContain(uuid(1));
    expect(text(tree)).toContain('Your session expired.'); expect(client.clear).toHaveBeenCalled();
    lifetime = 3600000; client.context.mockResolvedValueOnce(context(row(), 'pending'));
    await signIn(); expect(client.context).toHaveBeenCalledWith(uuid(1)); expect(client.queue).toHaveBeenCalledOnce();
    expect(text(tree)).toContain('earlier save remains unconfirmed'); expect(client.decide).toHaveBeenCalledOnce();
  });
  it('captures a sending command before session expiry and ignores its late response after re-login', async () => {
    lifetime = 1000; const pending = deferred<Awaited<ReturnType<ModeratorClient['decide']>>>();
    client.decide.mockReturnValueOnce(pending.promise); await ready(); click('Save decision');
    await vi.advanceTimersByTimeAsync(1000); render();
    expect(privateState()).toContain(uuid(1)); expect(privateState()).not.toContain(REASON);
    lifetime = 3600000; client.context.mockResolvedValueOnce(context(row(), 'pending')); await signIn();
    pending.resolve({ ok: true, decision: { receipt_id: uuid(1), state: 'accepted', revision: 2, moderated_at: new Date(Date.now()).toISOString() } });
    await settle(); expect(text(tree)).toContain('earlier save remains unconfirmed'); expect(text(tree)).not.toContain('Report accepted.');
  });
  it('expires retained selected content and audit after reconciliation removed the queue row', async () => {
    const report = row(1, NOW + 1000); client.queue.mockResolvedValueOnce(queue([report]));
    await uncertain(); client.context.mockResolvedValueOnce(context(report)); click('Check saved decision'); await settle();
    expect(text(tree)).toContain(NOTE); expect(text(tree)).toContain('A different saved reason');
    await vi.advanceTimersByTimeAsync(1000); render();
    expect(text(tree)).toContain('The report expired.'); expect(text(tree)).not.toContain(NOTE);
    expect(privateState()).not.toContain('A different saved reason'); expect(expiry).toBeGreaterThan(Date.now());
  });
  it('expires a recovered audit with no selected report and no queue rows', async () => {
    const report = row(1, NOW + 2000); client.queue.mockResolvedValueOnce(queue([report])); lifetime = 1000;
    await uncertain(); await vi.advanceTimersByTimeAsync(1000); render(); lifetime = 3600000;
    client.context.mockResolvedValueOnce(context(report)); await signIn();
    expect(text(tree)).toContain('A different saved reason'); expect(text(tree)).not.toContain(NOTE);
    await vi.advanceTimersByTimeAsync(1000); render();
    expect(text(tree)).not.toContain('A different saved reason'); expect(text(tree)).toContain('The report expired.');
    expect(client.queue).toHaveBeenCalledOnce();
  });
  it('clears private UI immediately on explicit logout and reports failed remote revocation honestly', async () => {
    await uncertain(); const pending = deferred<Awaited<ReturnType<ModeratorClient['logout']>>>();
    client.logout.mockImplementationOnce(() => { expiry = null; return pending.promise; });
    click('Sign out');
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('not confirmed'));
    for (const value of [NOTE, REASON, uuid(1)]) expect(privateState()).not.toContain(value);
    expect(text(tree)).toContain('Signing out...'); expect(client.logout).toHaveBeenCalledOnce();
    pending.resolve({ ok: false, error: 'unavailable' }); await settle();
    expect(text(tree)).toContain('Signed out on this browser. Server sign-out was not confirmed.');
    await signIn(); expect(client.context).not.toHaveBeenCalled(); expect(client.queue).toHaveBeenCalledTimes(2);
  });
  it('declining logout preserves the uncertain command and makes no revocation call', async () => {
    await uncertain(); confirm.mockReturnValue(false); click('Sign out');
    expect(client.logout).not.toHaveBeenCalled(); expect(text(tree)).toContain('Save not confirmed.');
    expect(privateState()).toContain(REASON);
  });
  it('ignores an old queue response arriving after sign-out', async () => {
    const pending = deferred<ModeratorQueueResult>(); client.queue.mockReturnValueOnce(pending.promise);
    await signIn(); click('Sign out'); await settle(); pending.resolve(queue([row()])); await settle();
    expect(text(tree)).toContain('Signed out.'); expect(privateState()).not.toContain(NOTE); expect(text(tree)).not.toContain('Postal');
  });
  it('an older queue response cannot replace a newer login session', async () => {
    const pending = deferred<ModeratorQueueResult>(); client.queue.mockReturnValueOnce(pending.promise);
    await signIn(); click('Sign out'); await settle(); client.queue.mockResolvedValueOnce(queue([])); await signIn();
    pending.resolve(queue([row()])); await settle(); expect(text(tree)).toContain('No reports on this page.');
    expect(privateState()).not.toContain(NOTE);
  });
  it('models synchronous clearing before pagehide/page restoration unhides, without claiming native DOM acceptance', async () => {
    await uncertain(); events.length = 0; dispatch('pagehide');
    expect(events).toEqual(['hidden:true', 'flush:start', 'client:clear', 'flush:end']); expect(container.hidden).toBe(true);
    expect(privateState()).not.toContain(NOTE); expect(privateState()).not.toContain(uuid(1));
    events.length = 0; dispatch('pageshow', { persisted: true });
    expect(events).toEqual(['flush:start', 'client:clear', 'flush:end', 'hidden:false']); expect(container.hidden).toBe(false);
    expect(text(tree)).toContain('Sign in to continue.'); expect(synchronous.flush).toHaveBeenCalledTimes(2);
    await signIn(); expect(client.context).not.toHaveBeenCalled();
  });
  it.each(['login', 'queue', 'decision'] as const)('late %s responses cannot repopulate a page-hidden session', async phase => {
    if (phase === 'login') {
      const pending = deferred<Awaited<ReturnType<ModeratorClient['login']>>>(); client.login.mockReturnValueOnce(pending.promise);
      render(); field('email', EMAIL); field('password', PASSWORD); submit(); dispatch('pagehide');
      pending.resolve({ ok: true, expiresAt: new Date(NOW + 3600000).toISOString() });
    } else if (phase === 'queue') {
      const pending = deferred<ModeratorQueueResult>(); client.queue.mockReturnValueOnce(pending.promise); await signIn(); dispatch('pagehide'); pending.resolve(queue([row()]));
    } else {
      const pending = deferred<Awaited<ReturnType<ModeratorClient['decide']>>>(); client.decide.mockReturnValueOnce(pending.promise);
      await ready(); click('Save decision'); dispatch('pagehide');
      pending.resolve({ ok: true, decision: { receipt_id: uuid(1), state: 'accepted', revision: 2, moderated_at: new Date(NOW).toISOString() } });
    }
    await settle(); dispatch('pageshow', { persisted: true });
    expect(text(tree)).toContain('Sign in to continue.'); expect(privateState()).not.toContain(NOTE);
    expect(privateState()).not.toContain(uuid(1)); expect(text(tree)).not.toContain('Report accepted.');
  });
  it('unmount removes listeners, clears the client and ignores late reconciliation', async () => {
    await uncertain(); const pending = deferred<ModeratorContextResult>(); client.context.mockReturnValueOnce(pending.promise);
    click('Check saved decision'); host.unmount(); pending.resolve(context()); await settle();
    expect(client.clear).toHaveBeenCalled(); expect(text(tree)).not.toContain('A different saved reason');
    expect(privateState()).not.toContain(NOTE);
  });
  it('guards native departure and internal back/root navigation without issuing writes', async () => {
    await uncertain(); const before = { preventDefault: vi.fn(), returnValue: undefined as unknown };
    dispatch('beforeunload', before); expect(before.preventDefault).toHaveBeenCalledOnce(); expect(before.returnValue).toBe('');
    confirm.mockReturnValue(false); click('Back to reports');
    const root = elements(tree).find(node => node.type === 'a' && node.props.href === '/')!;
    const event = { preventDefault: vi.fn() }; root.props.onClick!(event);
    expect(event.preventDefault).toHaveBeenCalledOnce(); expect(client.queue).toHaveBeenCalledOnce();
    expect(client.decide).toHaveBeenCalledOnce(); expect(privateState()).toContain(REASON);
  });
  it('uses visibility return to clear an expired session even without firing the timer first', async () => {
    await uncertain(); vi.setSystemTime(NOW + 3600000); dispatch('visibilitychange', {}, true); render();
    expect(text(tree)).toContain('Your session expired.'); expect(privateState()).not.toContain(NOTE);
    expect(privateState()).toContain(uuid(1));
  });
  it('preserves exact pagination cursors and makes page 101 reachable', async () => {
    client.queue.mockImplementation(async request => {
      const start = request.after ? parseInt(request.after.receipt_id.slice(-12), 16) + 1 : 1;
      return queue(Array.from({ length: 25 }, (_, i) => ({ ...row(start + i), received_at: '2026-09-15T09:00:00.123456+00:00', expires_at: '2026-10-15T09:00:00.123456+00:00' })));
    });
    await signIn();
    for (let page = 1; page <= 100; page++) { expect(button('Next').props.disabled).not.toBe(true); click('Next'); await settle(); }
    expect(text(tree)).toContain('Page 101'); expect(client.queue).toHaveBeenCalledTimes(101);
    expect(client.queue.mock.calls[100][0]).toEqual({ state: 'pending', after: { received_at: '2026-09-15T09:00:00.123456+00:00', receipt_id: uuid(2500) } });
    click('Previous'); await settle(); expect(text(tree)).toContain('Page 100');
    expect(client.queue.mock.calls[101][0].after?.receipt_id).toBe(uuid(2475));
  }, 15000);
  it.each(['accept-first', 'accept-last', 'reconcile-last', 'expire-page'] as const)('keeps the fetched continuation after %s removes visible rows', async change => {
    const reports = Array.from({ length: 26 }, (_, i) => row(i + 1,
      change === 'expire-page' && i < 25 ? NOW + 100 : undefined));
    client.queue.mockImplementation(async request => {
      const start = request.after ? reports.findIndex(report => report.receipt_id === request.after!.receipt_id) + 1 : 0;
      return queue(reports.slice(start, start + 25));
    });
    await signIn();
    if (change === 'expire-page') {
      await vi.advanceTimersByTimeAsync(101); render();
      expect(text(tree)).toContain('No reports on this page.');
      expect(client.decide).not.toHaveBeenCalled();
    } else {
      const reportButtons = elements(tree).filter(node => node.type === 'button' && node.props['aria-pressed'] !== undefined);
      reportButtons[change.endsWith('last') ? 24 : 0].props.onClick!({ preventDefault: vi.fn() }); render();
      if (change === 'reconcile-last') client.decide.mockResolvedValueOnce({ ok: false, error: 'outcome_unknown' });
      field('reason', REASON); submit(); click('Save decision'); await settle();
      if (change === 'reconcile-last') {
        expect(button('Next').props.disabled).toBe(true);
        client.context.mockResolvedValueOnce(context(reports[24]));
        click('Check saved decision'); await settle();
        expect(text(tree)).toContain('Saved decision found.');
      } else expect(text(tree)).toContain('Report accepted.');
      expect(elements(tree).filter(node => node.props['aria-pressed'] !== undefined)).toHaveLength(24);
    }
    expect(button('Next').props.disabled).not.toBe(true);
    click('Next'); await settle();
    expect(client.queue).toHaveBeenLastCalledWith({ state: 'pending', after: {
      received_at: reports[24].received_at, receipt_id: reports[24].receipt_id,
    } });
    const remaining = elements(tree).filter(node => node.props['aria-pressed'] !== undefined);
    expect(remaining).toHaveLength(1);
    remaining[0].props.onClick!({ preventDefault: vi.fn() }); render();
    expect(text(tree)).toContain(uuid(26));
    expect(button('Next').props.disabled).toBe(true);
  });
  it('does not keep a stale continuation after a page request fails', async () => {
    client.queue.mockResolvedValueOnce(queue(Array.from({ length: 25 }, (_, i) => row(i + 1))));
    await signIn();
    client.queue.mockResolvedValueOnce({ ok: false, error: 'unavailable' });
    click('Next'); await settle();
    expect(button('Next').props.disabled).toBe(true);
    expect(button('Previous').props.disabled).not.toBe(true);
    click('Previous'); await settle();
    expect(client.queue).toHaveBeenLastCalledWith({ state: 'pending' });
  });
  it('cannot restore a page continuation from a response arriving after sign-out', async () => {
    const page = Array.from({ length: 25 }, (_, i) => row(i + 1));
    client.queue.mockResolvedValueOnce(queue(page));
    await signIn();
    const pending = deferred<ModeratorQueueResult>(); client.queue.mockReturnValueOnce(pending.promise);
    click('Next'); click('Sign out'); await settle();
    pending.resolve(queue(page)); await settle();
    expect(text(tree)).toContain('Signed out.');
    expect(privateState()).not.toContain(uuid(25));
    expect(elements(tree).some(node => node.type === 'button' && text(node) === 'Next')).toBe(false);
  });
});
