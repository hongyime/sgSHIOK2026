import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  decideModeratorReport, readModeratorQueue, validateModerationCommand, validateModerationQueueRequest,
  MODERATOR_STORE_TIMEOUT_MS, MAX_MODERATOR_REPLY_BYTES, type ModerationCommand, type ModerationQueueRequest,
  readModeratorContext, validateModerationContextRequest, type ModerationContextRequest,
} from '../../app/api/moderation/store';
import * as lifecycle from '../report-lifecycle';
import { validateReport } from '../reports';
import project from '../report-project.json';

// Synthetic responses follow the installed 20260915041505 RPC projections. No Auth/DB IO.
const id = (n: number) => `${n.toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`;
const actor = id(1), session = id(2), receipt = id(3), target = id(4), last = id(5);
const identity = { actor, session, tokenExpiresAt: '2026-09-15T10:30:00.000Z' };
const config = { projectUrl: project.projectUrl, secretKey: ['sb', 'secret', 'synthetic'.repeat(4)].join('_') };
const received = '2026-09-14T06:00:00.123456+00:00';
const expires = '2026-10-14T06:00:00.123456+00:00';
const observed = '2026-09-15T10:00:00.123456+00:00';
const moderated = '2026-09-15T10:00:00.123457+00:00';
const content = {
  schema_version: 1, report_type: 'mapping_error', referenced_bundle_version: 'synthetic_bundle',
  geometry: { type: 'Point', coordinates: [103.8, 1.3] },
  context: { postal_code: '123456', destination_id: 'test_stop', transit_category: 'bus', published_route_id: 'test_route' },
  note: 'Synthetic mapping report',
};
const command: ModerationCommand = { receipt_id: receipt, expected_revision: 1, action: 'accepted', reason: 'Reviewed privately' };
const audit = (changes = {}) => ({ moderated_at: '2026-09-15T09:00:00.654321+00:00', moderator_id: actor,
  reason: 'Earlier private review', duplicate_of: null, ...changes });
const row = (changes = {}) => ({ receipt_id: receipt, report_type: 'mapping_error', state: 'pending', revision: 1,
  received_at: received, expires_at: expires, content: structuredClone(content), moderation: null, ...changes });
const sqlState = (changes = {}) => ({ receipt_id: receipt, report_type: 'mapping_error', state: 'pending', revision: 1,
  received_at: received, moderated_at: null, moderator_id: null, reason: null, duplicate_of: null, ...changes });
const context = (changes = {}) => ({ source: sqlState(), target_chain: [], observed_at: observed, ...changes });
const decision = (changes = {}) => ({ receipt_id: receipt, state: 'accepted', revision: 2, moderated_at: moderated, ...changes });
const queue = (reports: unknown[] = [row()], changes = {}) => ({ reports, page_limit: 25, ...changes });
const signal = () => new AbortController().signal;
const reply = (body: unknown) => vi.fn().mockResolvedValue(Response.json(body));
const wireError = (status: number, message: string, changes = {}) => Response.json({ code: `PT${status}`, message,
  details: null, hint: null, ...changes }, { status });
const runQueue = (transport: typeof fetch, request: unknown = { state: 'pending' }, caller = signal()) =>
  readModeratorQueue(config, identity, request as ModerationQueueRequest, caller, transport);
const runDecision = (transport: typeof fetch, input: unknown = command, caller = signal(), dispatch?: () => void) =>
  decideModeratorReport(config, identity, input as ModerationCommand, caller, transport, dispatch);
const runContext = (transport: typeof fetch, input: unknown = { receipt_id: receipt }, caller = signal()) =>
  readModeratorContext(config, identity, input as ModerationContextRequest, caller, transport);
const decisionTransport = (body = decision(), initial = context()) => vi.fn()
  .mockResolvedValueOnce(Response.json(initial)).mockResolvedValueOnce(Response.json(body));
const requestBody = (transport: ReturnType<typeof vi.fn>, index = 0) => JSON.parse(transport.mock.calls[index][1].body);
const fail = (error = 'unavailable') => ({ ok: false, error });

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-15T10:00:01.000Z')); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Moderation store early validators', () => {
  it.each(['pending', 'accepted', 'rejected', 'duplicate'])('accepts queue state %s', state => {
    expect(validateModerationQueueRequest({ state })).toBe(true);
  });
  it('accepts an exact microsecond cursor and equivalent offset representation', () => {
    for (const time of [received, '2026-09-14T14:00:00.123456+08:00', '2026-09-14T06:00:00Z']) {
      expect(validateModerationQueueRequest({ state: 'pending', after: { received_at: time, receipt_id: receipt } })).toBe(true);
    }
  });
  it.each([null, [], {}, { state: 'all' }, { state: 'pending', limit: 100 }, { state: 'pending', after: null },
    { state: 'pending', after: undefined }, { state: 'pending', after: {} },
    { state: 'pending', after: { received_at: received, receipt_id: receipt, offset: 0 } },
    { state: 'pending', after: { received_at: received, receipt_id: 'invalid' } },
  ])('rejects invalid queue request %#', value => expect(validateModerationQueueRequest(value)).toBe(false));
  it.each(['2026-02-30T00:00:00Z', '2026-09-14T24:00:00Z', '2026-09-14T06:00:60Z', '0000-01-01T00:00:00Z',
    '1969-12-31T00:00:00Z', '2026-09-14 06:00:00Z', '2026-09-14T06:00:00', '2026-09-14T06:00:00.1234567Z',
    '2026-09-14T06:00:00+15:00', '2026-09-14T06:00:00+14:01', '2026-09-14T06:00:00+01:60',
    '2026-09-14T06:00:00Z\n', 'infinity', '2026-09-14', 123, null,
  ])('rejects noncanonical or invalid cursor time %#', time => {
    expect(validateModerationQueueRequest({ state: 'pending', after: { received_at: time, receipt_id: receipt } })).toBe(false);
  });
  it.each(['accepted', 'rejected', 'duplicate'])('accepts decision %s with only applicable fields', action => {
    expect(validateModerationCommand({ ...command, action, ...(action === 'duplicate' ? { duplicate_of: target } : {}) })).toBe(true);
  });
  it('counts reason code points without trimming or normalizing them', () => {
    expect(validateModerationCommand({ ...command, reason: '  \nReason\n  ' })).toBe(true);
    expect(validateModerationCommand({ ...command, reason: '\u{1f600}'.repeat(1000) })).toBe(true);
    expect(validateModerationCommand({ ...command, reason: '\u{1f600}'.repeat(1001) })).toBe(false);
    expect(validateModerationCommand({ ...command, expected_revision: Number.MAX_SAFE_INTEGER - 1 })).toBe(true);
  });
  it.each([null, [], {}, { ...command, extra: true }, { ...command, receipt_id: 'invalid' },
    { ...command, expected_revision: 0 }, { ...command, expected_revision: '1' }, { ...command, expected_revision: 1.5 },
    { ...command, expected_revision: Number.MAX_SAFE_INTEGER }, { ...command, action: 'pending' },
    { ...command, reason: '' }, { ...command, reason: ' \t\u00a0\ufeff' }, { ...command, reason: 'x'.repeat(1001) },
    { ...command, reason: '\ud800' }, { ...command, reason: 'x\0y' },
    { ...command, action: 'duplicate' }, { ...command, action: 'duplicate', duplicate_of: receipt },
    { ...command, action: 'duplicate', duplicate_of: 'bad' }, { ...command, duplicate_of: null },
    { ...command, duplicate_of: undefined },
  ])('rejects invalid command %#', value => expect(validateModerationCommand(value)).toBe(false));
  it('does not invoke accessors or accept inherited/symbol/nonenumerable fields', () => {
    const getter = vi.fn(() => 'pending');
    expect(validateModerationQueueRequest(Object.defineProperty({}, 'state', { enumerable: true, get: getter }))).toBe(false);
    expect(validateModerationCommand(Object.defineProperty({ ...command }, 'reason', { enumerable: true, get: getter }))).toBe(false);
    expect(getter).not.toHaveBeenCalled();
    expect(validateModerationQueueRequest(Object.create({ state: 'pending' }))).toBe(false);
    expect(validateModerationCommand({ ...command, [Symbol('secret')]: true })).toBe(false);
    expect(validateModerationCommand(Object.defineProperty({ ...command }, 'reason', { value: 'x', enumerable: false }))).toBe(false);
    expect(validateModerationCommand(new Proxy({}, { ownKeys() { throw Error('private'); } }))).toBe(false);
  });
  it('rejects both invalid operations without IO or dispatch', async () => {
    const transport = vi.fn(), dispatch = vi.fn();
    expect(await runQueue(transport, {})).toEqual(fail('invalid_request'));
    expect(await runDecision(transport, {}, signal(), dispatch)).toEqual(fail('invalid_request'));
    expect(transport).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('Pinned private moderation boundary', () => {
  it.each([{ ...config, projectUrl: 'https://other.supabase.co' }, { ...config, projectUrl: `${project.projectUrl}/` },
    { ...config, projectUrl: 'http://localhost' }, { ...config, secretKey: 'sbp_synthetic' },
    { ...config, secretKey: 'sb_publishable_synthetic' }, { ...config, secretKey: 'sb_secret_short' },
    { ...config, secretKey: `${config.secretKey}\n` }, { ...config, secretKey: `sb_secret_${'x'.repeat(257)}` },
  ])('rejects bad target/key %# before transport', async invalid => {
    const transport = vi.fn();
    expect(await readModeratorQueue(invalid, identity, { state: 'pending' }, signal(), transport)).toEqual(fail());
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([{ ...identity, actor: 'bad' }, { ...identity, session: 'bad' }, { ...identity, tokenExpiresAt: observed },
    { ...identity, tokenExpiresAt: '2026-09-15T11:01:00Z' }, { ...identity, tokenExpiresAt: 'infinity' },
    { ...identity, user_metadata: { moderator: true } },
  ])('rejects invalid/expired identity %# without substituting user metadata', async invalid => {
    const transport = vi.fn();
    expect(await readModeratorQueue(config, invalid, { state: 'pending' }, signal(), transport)).toEqual(fail('forbidden'));
    expect(transport).not.toHaveBeenCalled();
  });
  it('refuses browser execution even with apparently valid runtime config', async () => {
    vi.stubGlobal('window', {});
    const transport = vi.fn();
    expect(await runQueue(transport)).toEqual(fail()); expect(transport).not.toHaveBeenCalled();
  });
  it('posts only to pinned service RPC using minimal verified identity and no bearer token', async () => {
    const transport = reply(queue());
    expect(await runQueue(transport)).toEqual({ ok: true, queue: queue() });
    expect(transport).toHaveBeenCalledExactlyOnceWith(`${project.projectUrl}/rest/v1/rpc/shiok_moderator_queue_v1`, expect.objectContaining({
      method: 'POST', cache: 'no-store', redirect: 'error', headers: {
        apikey: config.secretKey, 'Content-Type': 'application/json', Accept: 'application/json',
      },
    }));
    expect(requestBody(transport)).toEqual({ p_actor: actor, p_session: session, p_token_expires_at: identity.tokenExpiresAt,
      p_state: 'pending', p_after_received_at: null, p_after_receipt_id: null });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('Receipt-specific authenticated reconciliation read', () => {
  it('accepts exactly one receipt ID', () => {
    expect(validateModerationContextRequest({ receipt_id: receipt })).toBe(true);
    for (const input of [null, {}, [], { receipt_id: 'bad' }, { receipt_id: receipt, duplicate_of: target },
      { receipt_id: receipt, token: 'secret' }, Object.create({ receipt_id: receipt })]) {
      expect(validateModerationContextRequest(input)).toBe(false);
    }
    const getter = vi.fn(() => receipt);
    expect(validateModerationContextRequest(Object.defineProperty({}, 'receipt_id', { enumerable: true, get: getter }))).toBe(false);
    expect(getter).not.toHaveBeenCalled();
  });
  it('rejects bad context requests before IO', async () => {
    const transport = vi.fn();
    expect(await runContext(transport, {})).toEqual(fail('invalid_request')); expect(transport).not.toHaveBeenCalled();
  });
  it('projects only source and exact DB observation time, omitting empty chain', async () => {
    const transport = reply(context());
    expect(await runContext(transport)).toEqual({ ok: true, context: { source: sqlState(), observed_at: observed } });
    expect(requestBody(transport)).toEqual({ p_actor: actor, p_session: session, p_token_expires_at: identity.tokenExpiresAt,
      p_receipt: receipt, p_duplicate: null });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toBe(`${project.projectUrl}/rest/v1/rpc/shiok_moderator_context_v1`);
  });
  it.each(['accepted', 'rejected', 'duplicate'])('rereads a terminal %s source without fetching an old target', async state => {
    const source = sqlState({ state, revision: 2, ...audit({ duplicate_of: state === 'duplicate' ? target : null }) });
    const transport = reply(context({ source }));
    expect(await runContext(transport)).toEqual({ ok: true, context: { source, observed_at: observed } });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([{}, context({ target_chain: [sqlState({ receipt_id: target })] }), context({ target_chain: null }),
    context({ source: sqlState({ receipt_id: target }) }), context({ source: sqlState({ content: 'private' }) }),
    context({ source: sqlState({ reason: undefined }) }), context({ observed_at: 'infinity' }),
    context({ source: sqlState({ received_at: moderated }) }), context({ observed_at: expires }),
    { ...context(), private: 'provider text' },
  ])('rejects malformed or unrequested context %#', async body => expect(await runContext(reply(body))).toEqual(fail()));
  it.each([[403, 'moderator_unavailable', 'forbidden'], [503, 'moderator_unavailable', 'unavailable'],
    [409, 'revision_conflict', 'conflict'], [400, 'invalid_context', 'invalid_request']] as const)('maps only explicit context PT%s', async (status, message, error) => {
    expect(await runContext(vi.fn().mockResolvedValue(wireError(status, message)))).toEqual(fail(error));
  });
  it('bounds reconciliation transport without retrying or claiming mutation uncertainty', async () => {
    const transport = vi.fn().mockImplementation(() => new Promise(() => {}));
    const pending = runContext(transport);
    await vi.advanceTimersByTimeAsync(MODERATOR_STORE_TIMEOUT_MS);
    expect(await pending).toEqual(fail()); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('bounds reconciliation body and observes pre-cancellation', async () => {
    const cancel = vi.fn();
    const pending = runContext(vi.fn().mockResolvedValue(new Response(new ReadableStream({ start() {}, cancel }))));
    await vi.advanceTimersByTimeAsync(MODERATOR_STORE_TIMEOUT_MS);
    expect(await pending).toEqual(fail()); expect(cancel).toHaveBeenCalled();
    const controller = new AbortController(); controller.abort(); const transport = vi.fn();
    expect(await runContext(transport, undefined, controller.signal)).toEqual(fail()); expect(transport).not.toHaveBeenCalled();
  });
});

describe('Exact bounded queue projection', () => {
  it('accepts empty queue and the exact 25-row cap', async () => {
    expect(await runQueue(reply(queue([])))).toEqual({ ok: true, queue: queue([]) });
    const rows = Array.from({ length: 25 }, (_, index) => row({ receipt_id: id(index + 10) }));
    expect(await runQueue(reply(queue(rows)))).toEqual({ ok: true, queue: queue(rows) });
  });
  it('preserves six-digit SQL timestamps, including the outgoing next-page cursor', async () => {
    const after = { received_at: '2026-09-14T06:00:00.123455+00:00', receipt_id: id(99) };
    const transport = reply(queue());
    expect(await runQueue(transport, { state: 'pending', after })).toEqual({ ok: true, queue: queue() });
    expect(requestBody(transport).p_after_received_at).toBe(after.received_at);
    expect(await runQueue(reply(queue([row({ receipt_id: target })])), { state: 'pending', after: { received_at: received, receipt_id: receipt } }))
      .toEqual({ ok: true, queue: queue([row({ receipt_id: target })]) });
  });
  it('orders by exact instants rather than truncated milliseconds or timestamp spelling', async () => {
    const earlier = row({ received_at: '2026-09-14T14:00:00.123455+08:00', expires_at: '2026-10-14T14:00:00.123455+08:00', receipt_id: target });
    expect((await runQueue(reply(queue([earlier, row()])))).ok).toBe(true);
    expect(await runQueue(reply(queue([row(), earlier])))).toEqual(fail());
    const same = row({ received_at: '2026-09-14T14:00:00.123456+08:00', expires_at: '2026-10-14T14:00:00.123456+08:00', receipt_id: id(1) });
    expect(await runQueue(reply(queue([row(), same])))).toEqual(fail());
  });
  it.each(['accepted', 'rejected', 'duplicate'])('projects a consistent %s moderation record', async state => {
    const report = row({ state, revision: 2, moderation: audit({ duplicate_of: state === 'duplicate' ? target : null }) });
    expect(await runQueue(reply(queue([report])), { state })).toEqual({ ok: true, queue: queue([report]) });
  });
  it('keeps a retained duplicate readable without requiring its old target in the queue', async () => {
    const report = row({ state: 'duplicate', revision: 2, moderation: audit({ duplicate_of: target }) });
    expect((await runQueue(reply(queue([report])), { state: 'duplicate' })).ok).toBe(true);
  });
  it.each([null, [], {}, queue([], { page_limit: 100 }), queue([], { extra: 'secret' }), queue([], { reports: {} }),
    queue(Array.from({ length: 26 }, (_, index) => row({ receipt_id: id(index + 10) }))),
    queue([row(), row()]), queue([row({ receipt_id: target }), row()]),
  ])('rejects invalid queue envelope/order/cap %#', async body => expect(await runQueue(reply(body))).toEqual(fail()));
  it.each([
    { request_id: 'private' }, { retry_proof_sha256: 'private' }, { abuse_bucket: 'private' }, { receipt_id: 'invalid' },
    { state: 'accepted' }, { revision: 0 }, { revision: '1' }, { received_at: '2026-02-30T00:00:00Z' },
    { expires_at: '2026-10-14T06:00:00.123455+00:00' }, { expires_at: '2026-10-15T06:00:00.123456+00:00' },
    { content: { ...content, client_request_id: '00000000-0000-7000-8000-000000000000' } },
    { content: { ...content, secret: 'private' } }, { content: { ...content, report_type: 'shelter_request' } },
    { content: { ...content, geometry: { type: 'Point', coordinates: [1, 2] } } },
    { content: { ...content, geometry: { type: 'LineString', coordinates: [[103.8, 1.3], [104, 1.3]] } } },
    { content: { ...content, context: { ...content.context, email: 'private@example.test' } } },
    { content: { ...content, note: 'x'.repeat(1001) } }, { content: { ...content, note: 'x\0y' } },
    { content: { ...content, referenced_bundle_version: '../private' } }, { moderation: {} }, { moderation: audit() },
  ])('rejects malicious/noncanonical queue record %# without leaking any provider field', async changes => {
    expect(await runQueue(reply(queue([row(changes)])))).toEqual(fail());
  });
  it('rejects records that expire at local observation without extending retention', async () => {
    vi.setSystemTime(new Date('2026-10-14T06:00:00.124Z'));
    const freshIdentity = { ...identity, tokenExpiresAt: '2026-10-14T06:30:00Z' };
    expect(await readModeratorQueue(config, freshIdentity, { state: 'pending' }, signal(), reply(queue()))).toEqual(fail());
  });
  it.each([
    { revision: 1, moderation: audit() }, { moderation: null }, { moderation: audit({ moderator_id: 'bad' }) },
    { moderation: audit({ reason: ' ' }) }, { moderation: audit({ duplicate_of: target }) },
    { moderation: audit({ moderated_at: '2026-09-14T06:00:00.123455+00:00' }) },
    { moderation: audit({ moderated_at: expires }) }, { moderation: audit({ request_id: 'private' }) },
  ])('rejects inconsistent accepted audit %#', async changes => {
    expect(await runQueue(reply(queue([row({ state: 'accepted', revision: 2, ...changes })])), { state: 'accepted' })).toEqual(fail());
  });
  it('rejects missing/self duplicate references and records not after the cursor', async () => {
    for (const duplicate_of of [null, receipt]) {
      expect(await runQueue(reply(queue([row({ state: 'duplicate', revision: 2, moderation: audit({ duplicate_of }) })])), { state: 'duplicate' })).toEqual(fail());
    }
    expect(await runQueue(reply(queue()), { state: 'pending', after: { received_at: received, receipt_id: receipt } })).toEqual(fail());
  });
});

describe('Context normalization and atomic decision proposal', () => {
  it('normalizes pending NULL fields and microseconds only for lifecycle planning', async () => {
    const planner = vi.spyOn(lifecycle, 'planReportModeration');
    const transport = vi.fn(); const trace: string[] = [];
    transport.mockImplementationOnce(async () => { trace.push('context'); return Response.json(context()); })
      .mockImplementationOnce(async () => { trace.push('decide'); return Response.json(decision()); });
    expect(await runDecision(transport, command, signal(), () => trace.push('dispatch'))).toEqual({ ok: true, decision: decision() });
    expect(trace).toEqual(['context', 'dispatch', 'decide']);
    expect(planner).toHaveBeenCalledExactlyOnceWith({ receipt_id: receipt, report_type: 'mapping_error', state: 'pending', revision: 1,
      received_at: Date.parse(received) }, command, { moderator_id: actor, moderated_at: Date.parse(observed) }, []);
    expect(requestBody(transport)).toEqual({ p_actor: actor, p_session: session, p_token_expires_at: identity.tokenExpiresAt,
      p_receipt: receipt, p_duplicate: null });
    expect(requestBody(transport, 1)).toEqual({ p_actor: actor, p_session: session, p_token_expires_at: identity.tokenExpiresAt,
      p_receipt: receipt, p_revision: 1, p_action: 'accepted', p_reason: command.reason, p_duplicate: null,
      p_read_set: [{ receipt_id: receipt, revision: 1 }] });
    expect(transport.mock.calls[1][0]).toBe(`${project.projectUrl}/rest/v1/rpc/shiok_moderator_decide_v1`);
  });
  it('plans through a complete duplicate chain and sends all ordered revision guards', async () => {
    const planner = vi.spyOn(lifecycle, 'planReportModeration');
    const chain = [sqlState({ receipt_id: target, state: 'duplicate', revision: 7, ...audit({ duplicate_of: last }) }),
      sqlState({ receipt_id: last, state: 'rejected', revision: 4, ...audit() })];
    const transport = decisionTransport(decision({ state: 'duplicate' }), context({ target_chain: chain }));
    const input = { ...command, action: 'duplicate', duplicate_of: target };
    expect(await runDecision(transport, input)).toEqual({ ok: true, decision: decision({ state: 'duplicate' }) });
    expect(requestBody(transport, 1).p_read_set).toEqual([
      { receipt_id: receipt, revision: 1 }, { receipt_id: target, revision: 7 }, { receipt_id: last, revision: 4 },
    ]);
    expect(requestBody(transport, 1).p_duplicate).toBe(target);
    const normalized = planner.mock.calls[0][3] as lifecycle.ReportModerationState[];
    expect(normalized[0].received_at).toBe(Date.parse(received));
    expect(normalized[0].moderated_at).toBe(Date.parse(audit().moderated_at));
    expect(normalized[0].duplicate_of).toBe(last);
    expect(normalized[1]).not.toHaveProperty('duplicate_of');
  });
  it('includes a source plus the full permitted 32-target chain', async () => {
    const chain = Array.from({ length: 32 }, (_, index) => sqlState({ receipt_id: id(index + 10),
      ...(index < 31 ? { state: 'duplicate', revision: 2, ...audit({ duplicate_of: id(index + 11) }) } : {}) }));
    const transport = decisionTransport(decision({ state: 'duplicate' }), context({ target_chain: chain }));
    expect((await runDecision(transport, { ...command, action: 'duplicate', duplicate_of: id(10) })).ok).toBe(true);
    expect(requestBody(transport, 1).p_read_set).toEqual([{ receipt_id: receipt, revision: 1 },
      ...chain.map(report => ({ receipt_id: report.receipt_id, revision: report.revision }))]);
  });
  it('uses the command expected revision, never silently substitutes the refreshed source revision', async () => {
    const transport = decisionTransport(decision(), context({ source: sqlState({ revision: 2 }) }));
    const dispatch = vi.fn();
    expect(await runDecision(transport, command, signal(), dispatch)).toEqual(fail('conflict'));
    expect(transport).toHaveBeenCalledTimes(1); expect(dispatch).not.toHaveBeenCalled();
  });
  it.each(['accepted', 'rejected', 'duplicate'])('does not reopen a terminal %s source', async state => {
    const transport = decisionTransport(decision(), context({ source: sqlState({ state, revision: 2,
      ...audit({ duplicate_of: state === 'duplicate' ? target : null }) }) }));
    expect(await runDecision(transport, { ...command, expected_revision: 2 })).toEqual(fail('conflict'));
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([
    null, {}, { ...context(), private: 'secret' }, context({ observed_at: 'invalid' }), context({ target_chain: {} }),
    context({ target_chain: Array.from({ length: 33 }, () => sqlState({ receipt_id: target })) }),
    context({ source: sqlState({ receipt_id: target }) }), context({ source: sqlState({ retry_proof: 'private' }) }),
    context({ source: sqlState({ moderated_at: observed }) }), context({ source: sqlState({ reason: undefined }) }),
    context({ source: sqlState({ received_at: '2026-09-15T10:00:00.123457+00:00' }) }),
    context({ observed_at: expires }), context({ source: sqlState({ revision: Number.MAX_SAFE_INTEGER + 1 }) }),
    context({ target_chain: [sqlState({ receipt_id: target, state: 'accepted', revision: 2, ...audit({ moderated_at: moderated }) })] }),
  ])('fails closed on malformed context %# before dispatch', async body => {
    const dispatch = vi.fn(), transport = reply(body);
    expect(await runDecision(transport, command, signal(), dispatch)).toEqual(fail());
    expect(dispatch).not.toHaveBeenCalled(); expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([
    [], [sqlState({ receipt_id: last })],
    [sqlState({ receipt_id: target, report_type: 'shelter_request' })],
    [sqlState({ receipt_id: target, state: 'duplicate', revision: 2, ...audit({ duplicate_of: receipt }) })],
    [sqlState({ receipt_id: target, state: 'duplicate', revision: 2, ...audit({ duplicate_of: last }) })],
    [sqlState({ receipt_id: target }), sqlState({ receipt_id: last })],
  ].map(chain => ({ chain })))('rejects incomplete, mismatched or cyclic duplicate readset %#', async ({ chain }) => {
    const transport = reply(context({ target_chain: chain })), dispatch = vi.fn();
    expect(await runDecision(transport, { ...command, action: 'duplicate', duplicate_of: target }, signal(), dispatch)).toEqual(fail('conflict'));
    expect(dispatch).not.toHaveBeenCalled(); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('rejects unsolicited target chains for non-duplicate decisions', async () => {
    const transport = reply(context({ target_chain: [sqlState({ receipt_id: target })] }));
    expect(await runDecision(transport)).toEqual(fail('conflict')); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('snapshots caller command/config/identity across asynchronous context lookup', async () => {
    const input = { ...command }, cfg = { ...config }, auth = { ...identity };
    const transport = vi.fn().mockImplementationOnce(async () => {
      input.action = 'rejected'; input.reason = 'changed'; input.expected_revision = 9;
      cfg.secretKey = 'changed'; cfg.projectUrl = 'https://other.supabase.co'; auth.actor = target;
      return Response.json(context());
    }).mockResolvedValueOnce(Response.json(decision()));
    expect(await decideModeratorReport(cfg, auth, input, signal(), transport)).toEqual({ ok: true, decision: decision() });
    expect(requestBody(transport, 1).p_actor).toBe(actor);
    expect(requestBody(transport, 1).p_reason).toBe(command.reason);
    expect(transport.mock.calls[1][1].headers.apikey).toBe(config.secretKey);
  });
  it.each([
    null, {}, [], decision({ extra: 'private' }), decision({ receipt_id: target }), decision({ state: 'rejected' }),
    decision({ revision: 3 }), decision({ revision: '2' }), decision({ moderated_at: 'infinity' }),
    decision({ moderated_at: '2026-09-15T10:00:00.123455+00:00' }), decision({ moderated_at: expires }),
  ])('marks malformed or mismatched successful decision %# outcome unknown', async body => {
    const transport = decisionTransport(body as ReturnType<typeof decision>), dispatch = vi.fn();
    expect(await runDecision(transport, command, signal(), dispatch)).toEqual(fail('outcome_unknown'));
    expect(dispatch).toHaveBeenCalledTimes(1); expect(transport).toHaveBeenCalledTimes(2);
  });
});

describe('Only installed PostgREST rejection shapes are conclusive', () => {
  it.each([[403, 'moderator_unavailable', 'forbidden'], [503, 'moderator_unavailable', 'unavailable'],
    [400, 'invalid_queue', 'invalid_request']] as const)('maps queue PT%s %s', async (status, message, error) => {
    const transport = vi.fn().mockResolvedValue(wireError(status, message));
    expect(await runQueue(transport)).toEqual(fail(error)); expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each(['revision_conflict', 'invalid_duplicate_chain', 'duplicate_target_missing', 'duplicate_type_mismatch'])('maps context %s without dispatch', async message => {
    const transport = vi.fn().mockResolvedValue(wireError(409, message)), dispatch = vi.fn();
    expect(await runDecision(transport, command, signal(), dispatch)).toEqual(fail('conflict'));
    expect(dispatch).not.toHaveBeenCalled(); expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([[400, 'invalid_decision', 'invalid_request'], [403, 'moderator_unavailable', 'forbidden'],
    [503, 'moderator_unavailable', 'unavailable'], [409, 'revision_conflict', 'conflict'],
    [409, 'invalid_duplicate_chain', 'conflict'], [409, 'duplicate_target_missing', 'conflict'],
    [409, 'duplicate_type_mismatch', 'conflict']] as const)('maps explicit decision PT%s %s without retry', async (status, message, error) => {
    const transport = vi.fn().mockResolvedValueOnce(Response.json(context())).mockResolvedValueOnce(wireError(status, message));
    expect(await runDecision(transport)).toEqual(fail(error)); expect(transport).toHaveBeenCalledTimes(2);
  });
  it.each([
    [403, 'moderator_unavailable', { code: '42501' }], [503, 'moderator_unavailable', { details: 'private' }],
    [409, 'revision_conflict', { hint: 'private' }], [409, 'revision_conflict', { extra: 'private' }],
    [403, 'unrecognized private text', {}], [400, 'invalid_queue', {}], [503, 'moderator_unavailable', { code: 'PT409' }],
  ] as const)('does not trust unknown/mismatched decision rejection %#', async (status, message, changes) => {
    const transport = vi.fn().mockResolvedValueOnce(Response.json(context())).mockResolvedValueOnce(wireError(status, message, changes));
    expect(await runDecision(transport)).toEqual(fail('outcome_unknown'));
  });
  it.each([200, 302, 400, 401, 403, 409, 429, 500, 503])('never echoes unknown provider output at HTTP %s', async status => {
    const transport = () => new Response('private provider text', { status });
    expect(await runQueue(vi.fn().mockImplementation(transport))).toEqual(fail());
    expect(await runDecision(vi.fn().mockImplementation(transport))).toEqual(fail());
    expect(await runDecision(vi.fn().mockResolvedValueOnce(Response.json(context())).mockImplementationOnce(transport))).toEqual(fail('outcome_unknown'));
  });
  it('keeps the database unsupported-transaction rejection unavailable, never successful', async () => {
    const transport = vi.fn().mockResolvedValue(wireError(503, 'moderator_unavailable'));
    expect(await runDecision(transport)).toEqual(fail()); expect(transport).toHaveBeenCalledTimes(1);
  });
});

describe('Bounded response decoding', () => {
  it('rejects a zero-progress stream rather than starving its timeout with empty chunks', async () => {
    const read = vi.fn().mockResolvedValue({ done: false, value: new Uint8Array(0) });
    const cancel = vi.fn().mockResolvedValue(undefined), releaseLock = vi.fn();
    const response = { status: 200, redirected: false, url: '', body: { getReader: () => ({ read, cancel, releaseLock }) } } as unknown as Response;
    expect(await runQueue(vi.fn().mockResolvedValue(response))).toEqual(fail());
    expect(read).toHaveBeenCalledTimes(1); expect(cancel).toHaveBeenCalledTimes(1);
  });
  it('accepts a legal 25-report decided page exceeding the old 256 KiB bound', async () => {
    const largeContent = { ...content, referenced_bundle_version: 'b'.repeat(128),
      geometry: { type: 'LineString', coordinates: Array.from({ length: 32 }, (_, index) =>
        [103.80000000000001 + index * 0.0000000000001, 1.300000000000001 + index * 0.0000000000001]) },
      context: { ...content.context, destination_id: 'd'.repeat(128), published_route_id: 'r'.repeat(128) },
      note: '\u0001'.repeat(1000) };
    const report = { ...largeContent, client_request_id: '00000000-0000-7000-8000-000000000000' };
    expect(validateReport(report).ok).toBe(true);
    expect(Buffer.byteLength(JSON.stringify(report))).toBe(7939);
    const rows = Array.from({ length: 25 }, (_, index) => row({ receipt_id: id(index + 10), state: 'accepted', revision: 2,
      content: largeContent, moderation: audit({ reason: '\u0001'.repeat(1000) }) }));
    const bytes = Buffer.byteLength(JSON.stringify(queue(rows)));
    expect(bytes).toBeGreaterThan(256 * 1024);
    expect(bytes).toBeLessThanOrEqual(384 * 1024);
    expect(await runQueue(reply(queue(rows)), { state: 'accepted' })).toEqual({ ok: true, queue: queue(rows) });
  });
  it('accepts exactly 384 KiB but cancels an oversized stream', async () => {
    const text = JSON.stringify(queue([]));
    const body = text + ' '.repeat(MAX_MODERATOR_REPLY_BYTES - new TextEncoder().encode(text).length);
    expect(await runQueue(vi.fn().mockResolvedValue(new Response(body)))).toEqual({ ok: true, queue: queue([]) });
    const cancel = vi.fn();
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_MODERATOR_REPLY_BYTES + 1)); }, cancel });
    expect(await runQueue(vi.fn().mockResolvedValue(new Response(stream)))).toEqual(fail()); expect(cancel).toHaveBeenCalledTimes(1);
  });
  it.each([new Uint8Array([255]), new Uint8Array([239, 187, 191, 123, 125]), '{',
    '{"reports":[],"page_limit":100,"page_limit":25}', '{"reports":[],"page_limit":25,"page_\\u006cimit":25}',
    JSON.stringify(queue()).replace('"Synthetic mapping report"', '{"note":"x","note":"y"}'),
  ])('rejects invalid UTF8, JSON or duplicate fields %#', async body => {
    expect(await runQueue(vi.fn().mockResolvedValue(new Response(body)))).toEqual(fail());
  });
  it('does not mistake escaped quotes or colons inside notes for duplicate members', async () => {
    const report = row({ content: { ...content, note: 'Text: "quoted": {"nested-looking": "only text"}' } });
    expect(await runQueue(reply(queue([report])))).toEqual({ ok: true, queue: queue([report]) });
  });
  it('rejects redirected or wrong-target replies even from an injected transport', async () => {
    for (const props of [{ redirected: true }, { url: 'https://other.supabase.co/private' }]) {
      const response = Response.json(queue());
      for (const [name, value] of Object.entries(props)) Object.defineProperty(response, name, { value });
      expect(await runQueue(vi.fn().mockResolvedValue(response))).toEqual(fail());
    }
  });
  it('does not trust response.json or response.text to bypass the byte limit', async () => {
    const response = new Response('x'.repeat(MAX_MODERATOR_REPLY_BYTES + 1));
    const json = vi.spyOn(response, 'json').mockResolvedValue(queue());
    const text = vi.spyOn(response, 'text').mockResolvedValue(JSON.stringify(queue()));
    expect(await runQueue(vi.fn().mockResolvedValue(response))).toEqual(fail());
    expect(json).not.toHaveBeenCalled(); expect(text).not.toHaveBeenCalled();
  });
});

describe('Cancellation, hostile IO, dispatch uncertainty and no retries', () => {
  it('does no IO when already aborted', async () => {
    const controller = new AbortController(); controller.abort(); const transport = vi.fn(), dispatch = vi.fn();
    expect(await runQueue(transport, undefined, controller.signal)).toEqual(fail());
    expect(await runDecision(transport, command, controller.signal, dispatch)).toEqual(fail());
    expect(transport).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });
  it.each(['queue', 'context', 'decide'])('bounds hostile %s transport at eight seconds', async stage => {
    const transport = vi.fn().mockImplementation(() => new Promise(() => {})), dispatch = vi.fn();
    if (stage === 'decide') transport.mockResolvedValueOnce(Response.json(context()));
    const pending = stage === 'queue' ? runQueue(transport) : runDecision(transport, command, signal(), dispatch);
    await vi.advanceTimersByTimeAsync(MODERATOR_STORE_TIMEOUT_MS - 1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual(fail(stage === 'decide' ? 'outcome_unknown' : 'unavailable'));
    expect(transport).toHaveBeenCalledTimes(stage === 'decide' ? 2 : 1);
    expect(dispatch).toHaveBeenCalledTimes(stage === 'decide' ? 1 : 0);
    expect(transport.mock.calls[0][1].signal.aborted).toBe(true); expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['queue', 'context', 'decide'])('bounds hostile %s body and nonsettling cancellation', async stage => {
    const cancel = vi.fn(() => new Promise<void>(() => {})), releaseLock = vi.fn();
    const response = { status: 200, redirected: false, url: '', body: { getReader: () => ({
      read: () => new Promise(() => {}), cancel, releaseLock,
    }) } } as unknown as Response;
    const transport = vi.fn().mockResolvedValue(response);
    if (stage === 'decide') transport.mockResolvedValueOnce(Response.json(context()));
    const pending = stage === 'queue' ? runQueue(transport) : runDecision(transport);
    await vi.advanceTimersByTimeAsync(MODERATOR_STORE_TIMEOUT_MS);
    expect(await pending).toEqual(fail(stage === 'decide' ? 'outcome_unknown' : 'unavailable'));
    expect(cancel).toHaveBeenCalledTimes(1); expect(releaseLock).toHaveBeenCalledTimes(1);
  });
  it.each(['queue', 'context', 'decide'])('distinguishes caller cancellation during %s', async stage => {
    const controller = new AbortController(), dispatch = vi.fn();
    const transport = vi.fn().mockImplementation(() => new Promise(() => {}));
    if (stage === 'decide') transport.mockResolvedValueOnce(Response.json(context()));
    const pending = stage === 'queue' ? runQueue(transport, undefined, controller.signal)
      : runDecision(transport, command, controller.signal, dispatch);
    await vi.advanceTimersByTimeAsync(0); controller.abort();
    expect(await pending).toEqual(fail(stage === 'decide' ? 'outcome_unknown' : 'unavailable'));
    expect(dispatch).toHaveBeenCalledTimes(stage === 'decide' ? 1 : 0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('uses one total operation deadline, not eight seconds per RPC', async () => {
    let resolve!: (response: Response) => void;
    const transport = vi.fn().mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; }))
      .mockImplementationOnce(() => new Promise(() => {}));
    const dispatch = vi.fn(), pending = runDecision(transport, command, signal(), dispatch);
    await vi.advanceTimersByTimeAsync(7000); resolve(Response.json(context()));
    await vi.advanceTimersByTimeAsync(999); expect(dispatch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); expect(await pending).toEqual(fail('outcome_unknown'));
    expect(transport).toHaveBeenCalledTimes(2);
  });
  it('cancels late context replies and never starts a mutation after timeout', async () => {
    let resolve!: (response: Response) => void;
    const transport = vi.fn().mockImplementation(() => new Promise<Response>(done => { resolve = done; }));
    const dispatch = vi.fn(), pending = runDecision(transport, command, signal(), dispatch);
    await vi.advanceTimersByTimeAsync(MODERATOR_STORE_TIMEOUT_MS); expect(await pending).toEqual(fail());
    const response = Response.json(context()); const cancel = vi.spyOn(response.body!, 'cancel');
    resolve(response); await vi.advanceTimersByTimeAsync(0);
    expect(cancel).toHaveBeenCalledTimes(1); expect(dispatch).not.toHaveBeenCalled(); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('never revises an unknown outcome when a successful decision arrives late', async () => {
    let resolve!: (response: Response) => void;
    const transport = vi.fn().mockResolvedValueOnce(Response.json(context()))
      .mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; }));
    const pending = runDecision(transport);
    await vi.advanceTimersByTimeAsync(MODERATOR_STORE_TIMEOUT_MS); expect(await pending).toEqual(fail('outcome_unknown'));
    const response = Response.json(decision()); const cancel = vi.spyOn(response.body!, 'cancel');
    resolve(response); await vi.advanceTimersByTimeAsync(0);
    expect(await pending).toEqual(fail('outcome_unknown')); expect(cancel).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(2);
  });
  it('cancels stalled standard body streams', async () => {
    const cancel = vi.fn();
    const pending = runQueue(vi.fn().mockResolvedValue(new Response(new ReadableStream({ start() {}, cancel }))));
    await vi.advanceTimersByTimeAsync(MODERATOR_STORE_TIMEOUT_MS); expect(await pending).toEqual(fail()); expect(cancel).toHaveBeenCalled();
  });
  it.each([false, true])('handles synchronous transport exceptions, mutation=%s', async mutation => {
    const transport = vi.fn().mockImplementation(() => { throw Error('private key and request'); });
    if (mutation) transport.mockResolvedValueOnce(Response.json(context()));
    expect(await runDecision(transport)).toEqual(fail(mutation ? 'outcome_unknown' : 'unavailable'));
    expect(transport).toHaveBeenCalledTimes(mutation ? 2 : 1);
  });
  it('marks uncertainty conservatively if the dispatch observer throws', async () => {
    const transport = decisionTransport(), dispatch = vi.fn(() => { throw Error('observer'); });
    expect(await runDecision(transport, command, signal(), dispatch)).toEqual(fail('outcome_unknown'));
    expect(dispatch).toHaveBeenCalledTimes(1); expect(transport).toHaveBeenCalledTimes(1);
  });
});
