import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const checksPath = 'qa/revamp-r1/published-options-20260909/comparison-state-full-1/checks.json';
const checks = JSON.parse(readFileSync(resolve(root, checksPath), 'utf8'));
if (!checks.ok || !/Tests\s+1154 passed/.test(checks.commands[0].stdout)) throw Error('Unexpected final validation');
const match = checks.commands[0].stdout.match(/"snapshot":\s*"([^"]+)"/);
if (!match) throw Error('Missing isolated snapshot receipt');
const snapshot = JSON.parse('"' + match[1] + '"');
if (!snapshot.startsWith(resolve(root, 'tmp') + '\\')) throw Error('Unexpected snapshot root');
const sources = execFileSync('git', ['diff', '--cached', '--name-only', '--', 'web/'], { cwd: root, encoding: 'utf8' }).trim().split('\n').map(path => {
  const bytes = readFileSync(resolve(root, path));
  return { path, bytes: bytes.length, sha256: sha(bytes), matchesTestedSnapshot: sha(bytes) === sha(readFileSync(resolve(snapshot, path))) };
});
if (sources.length !== 2 || sources.some(source => !source.matchesTestedSnapshot)) throw Error('Unexpected/untested source');
const anchors = checks.inputs.map(input => {
  const bytes = readFileSync(resolve(root, input.path)), hash = sha(bytes);
  if (hash !== input.expected || bytes.length !== input.bytes) throw Error('STOP_INPUT_MISMATCH ' + input.path + ' ' + hash);
  return { path: input.path, bytes: bytes.length, sha256: hash, match: true };
});
const summary = {
  task: 'T09', date: new Date().toISOString(), root, hostname: process.env.COMPUTERNAME,
  base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  status: 'complete_state_storage_and_delivery_guard_contract_not_ui', sources, anchors,
  validation: { checksPath, snapshot, tests: { previous: 1109, added: 45, total: 1154, files: 48, arithmetic: '1109 + 45 = 1154; 47 + 1 = 48' },
    commands: checks.commands.map(({ command, args, exitCode, elapsedSeconds }) => ({ command, args, exitCode, elapsedSeconds })),
    focusedRed: 'qa/revamp-r1/comparison-state-20260909/b-focused-1788909455648/receipt.json',
    focusedGreen: 'qa/revamp-r1/comparison-state-20260909/b-focused-1788909633842/receipt.json',
    review: 'Parent implementation; Raman45 independent tests; Parfit state/storage review; Anscombe delivery-guard review. Review is distinct from parent integrated execution.' },
  catalogue: { 'C02/C05/C06': 'Bounded immutable transitions; strict versioned persistence and restored/empty/invalid/unavailable outcomes. No storage writes on read or unrelated-key access.',
    C09: 'Delivery-predicate tests supply fresh caller-owned tokens for remove/re-add, category ABA, retry, closure and bundle changes. Actual loader callback/token lifetime integration remains T10.' },
  findings: [
    'State stores only version1, up to3 unique six-digit postal strings, one shared category and active membership. Leading zeros survive; unknown versions/fields, duplicates and oversized or malformed payloads fail closed.',
    'Add activates, removal preserves order with deterministic adjacent activation, and invalid/duplicate/fourth changes are rejected without mutating state.',
    'Injected storage access catches denied getters, operation failures and quota errors. Reads never write or repair; writes touch only the owned key. Failure leaves in-memory state usable.',
    'Two red regressions were corrected: sparse arrays formerly serialized holes as null, and a truthy runtime open string passed the delivery gate. Dense validation and literal true now reject both.',
    '1154/48 isolated tests, TypeScript, repository integrity and11 source anchors pass. Both new source/test files match the tested snapshot.'
  ],
  disagreements: [
    'A token-matching predicate is not an implemented request lifecycle. T10 must synchronously invalidate/renew tokens and read current context at delivery before any UI race-safety claim.',
    'A comparison row may finish while inactive; moving the map additionally requires active-column ownership. Applying active-only delivery to every callback would wrongly discard other columns.',
    'This pure module is not wired into the app yet. No new UI, browser persistence, share flow or release acceptance is claimed.'
  ],
  limitations: ['No runtime/UI imports changed. No new build/browser run was needed for this unmounted pure module; existing local preview remains T08 build5qkRQo8F7DVo53iS0ul33.',
    'T10 must restore before persisting, start no closed-view requests, invalidate tokens synchronously on every specified lifecycle change, and resolve ADR-16 pinned map evidence.',
    'No pipeline, installation, deployment, protected input/output mutation or X operation.'],
  pipelineRuns: 0, pipelineCost: 0, installations: 0, deploymentCommands: 0,
};
const output = resolve(root, 'qa/revamp-r1/comparison-state-20260909/summary.json');
writeFileSync(output, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, sources: sources.length, anchors: anchors.length, tests: summary.validation.tests, sha256: sha(readFileSync(output)) }, null, 2));
