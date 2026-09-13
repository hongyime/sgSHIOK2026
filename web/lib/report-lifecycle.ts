import type { Report } from './reports';

// Proposed local contracts only: no authorization, persistence or public-data mutation.
export const MAX_REPORT_DUPLICATE_HOPS = 32;
export const MAX_MODERATION_REASON_CHARACTERS = 1000;
type ReportType = Report['report_type'];
type ModeratedState = 'accepted' | 'rejected' | 'duplicate';

export interface ReportModerationState {
  readonly receipt_id: string;
  readonly report_type: ReportType;
  readonly state: 'pending' | ModeratedState;
  readonly revision: number;
  readonly received_at: number;
  readonly moderated_at?: number;
  readonly moderator_id?: string;
  readonly reason?: string;
  readonly duplicate_of?: string;
}

export interface ReportModerationEvent {
  readonly receipt_id: string;
  readonly from_state: 'pending';
  readonly to_state: ModeratedState;
  readonly from_revision: number;
  readonly to_revision: number;
  readonly moderator_id: string;
  readonly moderated_at: number;
  readonly reason: string;
  readonly duplicate_of?: string;
}

export interface ReportRevisionGuard {
  readonly receipt_id: string;
  readonly revision: number;
}

export type ReportLifecycleError =
  | 'invalid_state' | 'invalid_command' | 'invalid_moderator_context'
  | 'revision_conflict' | 'terminal_state' | 'invalid_time' | 'revision_exhausted'
  | 'invalid_duplicate_chain' | 'duplicate_target_missing' | 'duplicate_cycle'
  | 'duplicate_type_mismatch';
type Failure = { readonly ok: false; readonly error: ReportLifecycleError };
export type ReportModerationPlanResult = Failure | {
  readonly ok: true;
  readonly nextState: ReportModerationState;
  readonly event: ReportModerationEvent;
  readonly readSet: readonly ReportRevisionGuard[];
};

const INITIAL = ['receipt_id', 'report_type', 'received_at'];
const COMMON = [...INITIAL, 'state', 'revision'];
const DECIDED = [...COMMON, 'moderated_at', 'moderator_id', 'reason'];
const COMMAND = ['receipt_id', 'expected_revision', 'action', 'reason'];
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const failure = (error: ReportLifecycleError): Failure => Object.freeze({ ok: false, error });
const integer = (value: unknown, min: number): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= min;
const identifier = (value: unknown): value is string => typeof value === 'string' && value.length <= 128 && IDENTIFIER.test(value) && !/[\r\n]/.test(value);
const reportType = (value: unknown): value is ReportType => value === 'mapping_error' || value === 'shelter_request';
const action = (value: unknown): value is ModeratedState => value === 'accepted' || value === 'rejected' || value === 'duplicate';

function object(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length === fields.length && keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    return typeof key === 'string' && fields.includes(key) && descriptor.enumerable && 'value' in descriptor;
  });
}

function reason(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > MAX_MODERATION_REASON_CHARACTERS * 2 || !value.trim()) return false;
  let count = 0;
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (++count > MAX_MODERATION_REASON_CHARACTERS || (code >= 0xd800 && code <= 0xdfff)) return false;
  }
  return true;
}

function boundedChain(value: unknown): value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > MAX_REPORT_DUPLICATE_HOPS
    || Reflect.ownKeys(value).length !== value.length + 1) return false;
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    if (!descriptor?.enumerable || !('value' in descriptor)) return false;
  }
  return true;
}

function state(value: unknown): ReportModerationState | null {
  // Inspect descriptors before reading values, including the discriminant.
  const shapes = [COMMON, DECIDED, [...DECIDED, 'duplicate_of']];
  if (!shapes.some(fields => object(value, fields))) return null;
  const raw = value as Record<string, unknown>;
  if (!identifier(raw.receipt_id) || !reportType(raw.report_type) || !integer(raw.revision, 1) || !integer(raw.received_at, 0)) return null;
  if (raw.state === 'pending') {
    if (!object(raw, COMMON)) return null;
  } else {
    if (!action(raw.state) || !object(raw, raw.state === 'duplicate' ? [...DECIDED, 'duplicate_of'] : DECIDED)
      || raw.revision < 2 || !identifier(raw.moderator_id) || !integer(raw.moderated_at, raw.received_at)
      || !reason(raw.reason) || (raw.state === 'duplicate' && !identifier(raw.duplicate_of))) return null;
  }
  return Object.freeze({ ...raw }) as unknown as ReportModerationState;
}

/** Initial metadata comes from the future server, not directly from a resident request. */
export function createPendingReportState(value: unknown): Failure | { readonly ok: true; readonly state: ReportModerationState } {
  try {
    if (!object(value, INITIAL) || !identifier(value.receipt_id) || !reportType(value.report_type) || !integer(value.received_at, 0)) return failure('invalid_state');
    return Object.freeze({ ok: true, state: Object.freeze({ receipt_id: value.receipt_id, report_type: value.report_type, received_at: value.received_at, revision: 1, state: 'pending' }) });
  } catch { return failure('invalid_state'); }
}

/**
 * Produces a private transaction proposal, not an authorization decision or durable receipt.
 * The adapter must authenticate the actor, serialize validation of ALL readSet revisions
 * with the state/audit write, and never reuse receipt identities or reset their revisions.
 * Source-only CAS or snapshot reads alone do not prevent concurrent duplicate cycles.
 */
export function planReportModeration(current: unknown, command: unknown, moderator: unknown, targetChain: unknown = []): ReportModerationPlanResult {
  try {
    const source = state(current);
    if (!source) return failure('invalid_state');
    if ((!object(command, COMMAND) && !object(command, [...COMMAND, 'duplicate_of']))
      || !identifier(command.receipt_id) || command.receipt_id !== source.receipt_id
      || !integer(command.expected_revision, 1) || !action(command.action) || !reason(command.reason)
      || !object(command, command.action === 'duplicate' ? [...COMMAND, 'duplicate_of'] : COMMAND)
      || (command.action === 'duplicate' && !identifier(command.duplicate_of))) return failure('invalid_command');
    if (!object(moderator, ['moderator_id', 'moderated_at']) || !identifier(moderator.moderator_id)
      || !integer(moderator.moderated_at, 0)) return failure('invalid_moderator_context');
    if (command.expected_revision !== source.revision) return failure('revision_conflict');
    if (source.state !== 'pending') return failure('terminal_state');
    if (moderator.moderated_at < source.received_at) return failure('invalid_time');
    if (source.revision === Number.MAX_SAFE_INTEGER) return failure('revision_exhausted');
    if (!boundedChain(targetChain)) return failure('invalid_duplicate_chain');
    const readSet: ReportRevisionGuard[] = [Object.freeze({ receipt_id: source.receipt_id, revision: source.revision })];
    const duplicateOf = command.action === 'duplicate' ? command.duplicate_of as string : undefined;
    if (duplicateOf === undefined) {
      if (targetChain.length) return failure('invalid_duplicate_chain');
    } else {
      const seen = new Set([source.receipt_id]);
      let expected: string | undefined = duplicateOf;
      for (const raw of targetChain) {
        if (expected === undefined) return failure('invalid_duplicate_chain');
        if (seen.has(expected)) return failure('duplicate_cycle');
        const target = state(raw);
        if (!target || target.receipt_id !== expected) return failure('invalid_duplicate_chain');
        if (target.report_type !== source.report_type) return failure('duplicate_type_mismatch');
        seen.add(target.receipt_id);
        readSet.push(Object.freeze({ receipt_id: target.receipt_id, revision: target.revision }));
        expected = target.state === 'duplicate' ? target.duplicate_of : undefined;
      }
      if (expected !== undefined) return failure(seen.has(expected) ? 'duplicate_cycle' : 'duplicate_target_missing');
    }
    const decision = { moderator_id: moderator.moderator_id, moderated_at: moderator.moderated_at, reason: command.reason, ...(duplicateOf === undefined ? {} : { duplicate_of: duplicateOf }) };
    const nextState: ReportModerationState = Object.freeze({ ...source, ...decision, state: command.action, revision: source.revision + 1 });
    const event: ReportModerationEvent = Object.freeze({ receipt_id: source.receipt_id, from_state: 'pending', to_state: command.action, from_revision: source.revision, to_revision: nextState.revision, ...decision });
    return Object.freeze({ ok: true, nextState, event, readSet: Object.freeze(readSet) });
  } catch { return failure('invalid_command'); }
}
