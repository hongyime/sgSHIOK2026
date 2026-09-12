import { summarizeTransport } from '../request-audit-20260910/transport.mjs';
import { workerEntryHandoffs } from '../lifecycle-probe-20260910/analyze.mjs';

export function analyze(report) {
  const page = summarizeTransport(report.entries.filter(e => e.sessionId === report.mainSession));
  const workers = workerEntryHandoffs(report.entries);
  const unexplainedErrors = report.errors.filter(error => !page.explainedCanceledTileCommands.some(item =>
    error.cdp?.sessionId === report.mainSession && error.cdp.id === item.command.id
    && error.interception === item.reply.error?.message));
  const remainingPageRequests = page.pendingNetworkRequests.filter(request => !workers.confirmed.some(worker =>
    worker.request.sessionId === request.sessionId && worker.request.params.requestId === request.params.requestId));
  return { workerLifecycleConfirmed: workers.confirmed.length === 1 && workers.unresolved.length === 0,
    workers, page, unexplainedErrors, remainingPageRequests,
    scope: 'Worker lifecycle and recorded error attribution only. Original browser exit and raw transport failures are unchanged.' };
}
