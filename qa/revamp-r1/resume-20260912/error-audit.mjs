import { summarizeTransport } from '../request-audit-20260910/transport.mjs';

// Only one directly connected page session is supported. Cross-session joins fail closed.
export function auditErrors(entries, errors, sessionId) {
  const foreign = entries.filter(entry => entry.sessionId !== sessionId);
  const transport = summarizeTransport(entries.filter(entry => entry.sessionId === sessionId));
  const explained = foreign.length ? [] : transport.explainedCanceledTileCommands;
  const unclassified = errors.filter(error => !explained.some(item =>
    error.sessionId === sessionId && error.commandId === item.command.id
    && error.fault === item.reply.error.message));
  return { ok: !!sessionId && transport.observedRequests > 0 && transport.observedPauses > 0
      && !foreign.length && !unclassified.length
      && !transport.commandFailures.length && !transport.pendingCommands.length
      && !transport.unfinishedPauses.length && !transport.orphanReplies.length
      && !transport.runtimeErrors.length && !transport.connectionFaults.length,
    scope: 'Runtime and Fetch command audit only; transport.ok independently records HTTP/network completeness.',
    foreign, unclassified, explained, transport };
}
