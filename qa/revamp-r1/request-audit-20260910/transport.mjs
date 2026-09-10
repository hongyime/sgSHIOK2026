export function isOneMapTile(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://www.onemap.gov.sg' && !url.username && !url.password
      && !url.search && !url.hash && /^\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(url.pathname);
  } catch { return false; }
}

/** One owned CDP page session. Retain raw events; explain only unambiguous tile cancellations. */
export function summarizeTransport(entries) {
  const events = name => entries.filter(e => e.kind === 'event' && e.method === name);
  const requests = events('Network.requestWillBeSent');
  const pauses = events('Fetch.requestPaused');
  const failed = events('Network.loadingFailed');
  const finished = events('Network.loadingFinished');
  const responses = events('Network.responseReceived');
  const commands = entries.filter(e => e.kind === 'send' && /^Fetch\.(continueRequest|failRequest|fulfillRequest)$/.test(e.method));
  const replies = entries.filter(e => e.kind === 'reply');
  const one = values => values.length === 1 ? values[0] : null;
  function canceledTile(networkId) {
    if (!networkId) return null;
    const request = one(requests.filter(e => e.params.requestId === networkId));
    const pause = one(pauses.filter(e => e.params.networkId === networkId));
    const failure = one(failed.filter(e => e.params.requestId === networkId));
    if (!request || !pause || !failure) return null;
    const a = request.params.request, b = pause.params.request, f = failure.params;
    if (!isOneMapTile(a.url) || a.url !== b.url || a.method !== b.method || a.method !== 'GET'
      || request.params.redirectResponse || pause.params.redirectedRequestId
      || pause.params.responseStatusCode !== undefined || pause.params.responseErrorReason !== undefined
      || f.canceled !== true || f.errorText !== 'net::ERR_ABORTED' || f.blockedReason || f.corsErrorStatus
      || finished.some(e => e.params.requestId === networkId)
      || responses.some(e => e.params.requestId === networkId && (e.params.response.status === 0 || e.params.response.status >= 400))) return null;
    return { networkId, fetchId: pause.params.requestId, url: a.url, failure: f };
  }
  const explainedCanceledTileCommands = [], commandFailures = [], pendingCommands = [];
  for (const command of commands) {
    const reply = one(replies.filter(e => e.id === command.id));
    const sameId = commands.filter(e => e.id === command.id);
    const owners = commands.filter(e => e.params.requestId === command.params.requestId);
    const pause = one(pauses.filter(e => e.params.requestId === command.params.requestId));
    if (!reply) { pendingCommands.push(command); continue; }
    if (sameId.length !== 1 || owners.length !== 1 || !pause) {
      commandFailures.push({ command, reply, reason: 'ambiguous_or_missing_request_owner' }); continue;
    }
    if (!reply.error) continue;
    const cancellation = canceledTile(pause.params.networkId);
    if (command.method === 'Fetch.continueRequest' && reply.error.kind === 'cdp'
      && reply.error.code === -32602 && reply.error.message === 'Invalid InterceptionId.' && cancellation) {
      explainedCanceledTileCommands.push({ command, reply, cancellation });
    } else commandFailures.push({ command, reply, reason: 'unexplained_command_failure' });
  }
  const canceledTileRequests = [], networkFailures = [];
  for (const event of failed) {
    const cancellation = canceledTile(event.params.requestId);
    if (cancellation) canceledTileRequests.push(cancellation);
    else networkFailures.push(event);
  }
  const httpFailures = responses.filter(e => e.params.response.status === 0 || e.params.response.status >= 400);
  const unfinishedPauses = pauses.filter(pause => !commands.some(command => command.params.requestId === pause.params.requestId));
  const orphanReplies = replies.filter(reply => reply.fetchCommand && !commands.some(command => command.id === reply.id));
  const runtimeErrors = events('Runtime.exceptionThrown');
  const connectionFaults = entries.filter(e => e.kind === 'connectionFault');
  const pendingNetworkRequests = requests.filter(request => ![...failed, ...finished].some(e => e.params.requestId === request.params.requestId));
  return {
    ok: requests.length > 0 && pauses.length > 0 && [commandFailures, pendingCommands, networkFailures,
      httpFailures, unfinishedPauses, orphanReplies, runtimeErrors, connectionFaults, pendingNetworkRequests].every(items => !items.length),
    observedRequests: requests.length, observedPauses: pauses.length, fetchCommands: commands.length,
    explainedCanceledTileCommands, canceledTileRequests, commandFailures, pendingCommands, networkFailures,
    httpFailures, unfinishedPauses, orphanReplies, runtimeErrors, connectionFaults, pendingNetworkRequests,
  };
}
