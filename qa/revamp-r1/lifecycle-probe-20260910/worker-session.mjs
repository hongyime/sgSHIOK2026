/** Worker targets expose Network/Runtime here, not the page Fetch interception domain. */
export async function observeWorker(send, sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) throw Error('Worker session required');
  await send('Network.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Runtime.runIfWaitingForDebugger', {}, sessionId);
}
