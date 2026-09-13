import { describe, expect, it, vi } from 'vitest';
import {
  createPendingReportState, planReportModeration, MAX_REPORT_DUPLICATE_HOPS,
  type ReportModerationState, type ReportModerationPlanResult,
} from '../report-lifecycle';

const pending = (receipt_id = 'report-a', extra: Record<string, unknown> = {}) => ({
  receipt_id, report_type: 'mapping_error', state: 'pending', revision: 1, received_at: 1000, ...extra,
});
const command = (extra: Record<string, unknown> = {}) => ({ receipt_id: 'report-a', expected_revision: 1, action: 'accepted', reason: 'Investigate the map evidence.', ...extra });
const moderator = { moderator_id: 'moderator-local', moderated_at: 2000 };
const closed = (receipt_id: string, state: string, extra: Record<string, unknown> = {}) => ({
  ...pending(receipt_id), state, revision: 2, reason: 'Reviewed', ...moderator, ...extra,
});
function valid(result: ReportModerationPlanResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(result.error);
  return result;
}

describe('T14 proposed provider-neutral moderation, not authentication or persistence', () => {
  it.each(['mapping_error', 'shelter_request'] as const)('creates immutable pending %s metadata only', report_type => {
    const result = createPendingReportState({ receipt_id: 'report-a', report_type, received_at: 1000 });
    expect(result).toEqual({ ok: true, state: pending('report-a', { report_type }) });
    if (result.ok) expect(Object.isFrozen(result.state)).toBe(true);
  });
  it.each([
    { receipt_id: '' }, { receipt_id: 'a\nb' }, { report_type: 'other' }, { received_at: -1 },
    { received_at: Infinity }, { received_at: 1.5 }, { state: 'accepted' }, { note: 'resident note' },
  ])('rejects invalid or forged initial metadata %j', extra => {
    expect(createPendingReportState({ receipt_id: 'report-a', report_type: 'mapping_error', received_at: 1000, ...extra }).ok).toBe(false);
  });
  it.each(['accepted', 'rejected'] as const)('plans pending -> %s with paired audit and revision guard', action => {
    const source = pending(), before = structuredClone(source);
    const result = valid(planReportModeration(source, command({ action }), moderator));
    expect(result.nextState).toEqual({ ...source, state: action, revision: 2, reason: command().reason, ...moderator });
    expect(result.event).toEqual({ receipt_id: 'report-a', from_state: 'pending', to_state: action, from_revision: 1, to_revision: 2, reason: command().reason, ...moderator });
    expect(result.readSet).toEqual([{ receipt_id: 'report-a', revision: 1 }]);
    expect(source).toEqual(before);
    for (const value of [result, result.nextState, result.event, result.readSet, ...result.readSet]) expect(Object.isFrozen(value)).toBe(true);
  });
  it('rejects stale revision rather than overwriting another decision', () => {
    expect(planReportModeration(pending('report-a', { revision: 3 }), command(), moderator)).toEqual({ ok: false, error: 'revision_conflict' });
  });
  it.each(['accepted', 'rejected', 'duplicate'])('cannot reopen or edit terminal %s', state => {
    const source = closed('report-a', state, state === 'duplicate' ? { duplicate_of: 'report-b' } : {});
    expect(planReportModeration(source, command({ expected_revision: 2 }), moderator)).toEqual({ ok: false, error: 'terminal_state' });
  });
  it.each([
    { reason: '' }, { reason: '   ' }, { reason: '\ud800' }, { reason: 'x'.repeat(1001) },
    { expected_revision: 0 }, { expected_revision: 1.5 }, { action: 'pending' }, { state: 'accepted' },
    { duplicate_of: 'report-b' }, { receipt_id: 'report-other' },
  ])('rejects malformed, smuggled or mismatched moderation command %j', extra => {
    expect(planReportModeration(pending(), command(extra), moderator).ok).toBe(false);
  });
  it('preserves bounded Unicode/markup reason as private untrusted text, without interpreting it', () => {
    const reason = ' <script>not executable</script> ' + '\u{1f4cd}'.repeat(900);
    expect(valid(planReportModeration(pending(), command({ reason }), moderator)).event.reason).toBe(reason);
  });
  it.each([{}, { moderator_id: '', moderated_at: 2000 }, { ...moderator, authenticated: true }, { ...moderator, moderated_at: NaN }])('requires shaped server context but does not implement authorization %j', context => {
    expect(planReportModeration(pending(), command(), context).ok).toBe(false);
  });
  it('rejects moderation time before receipt and exhausted revision', () => {
    expect(planReportModeration(pending(), command(), { ...moderator, moderated_at: 999 })).toEqual({ ok: false, error: 'invalid_time' });
    expect(planReportModeration(pending('report-a', { revision: Number.MAX_SAFE_INTEGER }), command({ expected_revision: Number.MAX_SAFE_INTEGER }), moderator)).toEqual({ ok: false, error: 'revision_exhausted' });
  });
  it('rejects corrupt stored status and server metadata without invoking getters', () => {
    const getter = vi.fn(() => 'report-a');
    const source = { ...pending(), get receipt_id() { return getter(); } };
    expect(planReportModeration(source, command(), moderator)).toEqual({ ok: false, error: 'invalid_state' });
    expect(getter).not.toHaveBeenCalled();
    for (const state of [pending('report-a', { reason: 'forged' }), closed('report-a', 'accepted', { duplicate_of: 'report-b' }), closed('report-a', 'duplicate'), pending('report-a', { revision: NaN })]) {
      expect(planReportModeration(state, command(), moderator).ok).toBe(false);
    }
  });
  it.each(['pending', 'accepted', 'rejected'])('permits an existing same-type %s duplicate target, guarding it too', state => {
    const target = state === 'pending' ? pending('report-b') : closed('report-b', state);
    const result = valid(planReportModeration(pending(), command({ action: 'duplicate', duplicate_of: 'report-b' }), moderator, [target]));
    expect(result.nextState.duplicate_of).toBe('report-b'); expect(result.event.duplicate_of).toBe('report-b');
    expect(result.readSet).toEqual([{ receipt_id: 'report-a', revision: 1 }, { receipt_id: 'report-b', revision: target.revision }]);
  });
  it('validates full duplicate chain and includes every target revision', () => {
    const chain = [closed('report-b', 'duplicate', { duplicate_of: 'report-c' }), closed('report-c', 'accepted', { revision: 5 })];
    const result = valid(planReportModeration(pending(), command({ action: 'duplicate', duplicate_of: 'report-b' }), moderator, chain));
    expect(result.readSet).toEqual([{ receipt_id: 'report-a', revision: 1 }, { receipt_id: 'report-b', revision: 2 }, { receipt_id: 'report-c', revision: 5 }]);
    expect(result.nextState.duplicate_of).toBe('report-b');
  });
  it('accepts the exact traversal bound and rejects a longer path', () => {
    const chain = Array.from({ length: MAX_REPORT_DUPLICATE_HOPS }, (_, index) => index === MAX_REPORT_DUPLICATE_HOPS - 1
      ? pending('target-' + index) : closed('target-' + index, 'duplicate', { duplicate_of: 'target-' + (index + 1) }));
    const result = valid(planReportModeration(pending(), command({ action: 'duplicate', duplicate_of: 'target-0' }), moderator, chain));
    expect(result.readSet).toHaveLength(MAX_REPORT_DUPLICATE_HOPS + 1);
    expect(planReportModeration(pending(), command({ action: 'duplicate', duplicate_of: 'target-0' }), moderator, [...chain, pending('extra')])).toEqual({ ok: false, error: 'invalid_duplicate_chain' });
  });
  it('accepts exactly1000 Unicode code points and refuses1001', () => {
    const reason = '\u{1f4cd}'.repeat(1000);
    expect(valid(planReportModeration(pending(), command({ reason }), moderator)).event.reason).toBe(reason);
    expect(planReportModeration(pending(), command({ reason: reason + 'x' }), moderator).ok).toBe(false);
  });
  it('preserves shelter-request semantics in decisions without turning them into mapping errors', () => {
    const result = valid(planReportModeration(pending('report-a', { report_type: 'shelter_request' }), command(), moderator));
    expect(result.nextState.report_type).toBe('shelter_request');
    expect(Object.keys(result.nextState).sort()).toEqual(['moderated_at', 'moderator_id', 'reason', 'receipt_id', 'received_at', 'report_type', 'revision', 'state']);
  });
  it('rejects self links, source cycles and cycles already present in target graph', () => {
    const dup = command({ action: 'duplicate', duplicate_of: 'report-a' });
    expect(planReportModeration(pending(), dup, moderator, []).ok).toBe(false);
    for (const next of ['report-a', 'report-b']) {
      expect(planReportModeration(pending(), command({ action: 'duplicate', duplicate_of: 'report-b' }), moderator, [closed('report-b', 'duplicate', { duplicate_of: next })])).toEqual({ ok: false, error: 'duplicate_cycle' });
    }
    expect(planReportModeration(pending(), command({ action: 'duplicate', duplicate_of: 'report-b' }), moderator,
      [closed('report-b', 'duplicate', { duplicate_of: 'report-c' }), closed('report-c', 'duplicate', { duplicate_of: 'report-b' })])).toEqual({ ok: false, error: 'duplicate_cycle' });
  });
  it('rejects absent targets, incomplete/discontinuous chains and unused chain entries', () => {
    const dup = command({ action: 'duplicate', duplicate_of: 'report-b' });
    for (const chain of [[], [closed('report-b', 'duplicate', { duplicate_of: 'report-c' })], [pending('wrong')], [pending('report-b'), pending('report-c')]]) {
      expect(planReportModeration(pending(), dup, moderator, chain).ok).toBe(false);
    }
    expect(planReportModeration(pending(), command(), moderator, [pending('report-b')]).ok).toBe(false);
  });
  it('keeps report types distinct throughout a duplicate chain', () => {
    expect(planReportModeration(pending(), command({ action: 'duplicate', duplicate_of: 'report-b' }), moderator, [pending('report-b', { report_type: 'shelter_request' })])).toEqual({ ok: false, error: 'duplicate_type_mismatch' });
  });
  it('bounds target traversal, rejects sparse/getter arrays and never calls getters', () => {
    const dup = command({ action: 'duplicate', duplicate_of: 'report-b' });
    for (const chain of [Array(MAX_REPORT_DUPLICATE_HOPS + 1).fill(pending('report-b')), Array(1), {}]) expect(planReportModeration(pending(), dup, moderator, chain).ok).toBe(false);
    const getter = vi.fn(() => pending('report-b')), chain = [];
    Object.defineProperty(chain, '0', { enumerable: true, get: getter });
    expect(planReportModeration(pending(), dup, moderator, chain).ok).toBe(false); expect(getter).not.toHaveBeenCalled();
  });
  it('read-set contract lets an atomic adapter reject concurrent A->B and B->A', () => {
    const a = pending('report-a'), b = pending('report-b');
    const ab = valid(planReportModeration(a, command({ action: 'duplicate', duplicate_of: 'report-b' }), moderator, [b]));
    const ba = valid(planReportModeration(b, command({ receipt_id: 'report-b', action: 'duplicate', duplicate_of: 'report-a' }), moderator, [a]));
    const store = new Map<string, ReportModerationState>([['report-a', a as ReportModerationState], ['report-b', b as ReportModerationState]]);
    const commitFixture = (plan: typeof ab) => {
      if (!plan.readSet.every(expected => store.get(expected.receipt_id)?.revision === expected.revision)) return false;
      store.set(plan.nextState.receipt_id, plan.nextState); return true;
    };
    expect(commitFixture(ab)).toBe(true); expect(commitFixture(ba)).toBe(false);
    expect(store.get('report-b')?.state).toBe('pending');
  });
});
