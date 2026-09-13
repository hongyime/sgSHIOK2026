export function createCommandChannel({ write, remaining, context, now, maxCommands = 4000 }) {
  const pending = new Map();
  const entries = [];
  let sequence = 0;
  let closed = false;
  let limitHit = false;
  function send(method, params = {}, sessionId = '', timeoutMs = 10000) {
    if (closed) return Promise.reject(new Error('CDP closed'));
    const budget = Math.min(timeoutMs, remaining());
    if (budget <= 0) return Promise.reject(new Error('Browser work deadline'));
    if (entries.length >= maxCommands) {
      limitHit = true;
      return Promise.reject(new Error('CDP command limit'));
    }
    const { phase, operation, contextId } = context();
    const entry = { id: ++sequence, method, sessionId, phase, operation, contextId, startedMs: now(), budgetMs: budget, outcome: 'pending' };
    entries.push(entry);
    return new Promise((resolve, reject) => {
      const finish = (outcome, result, error) => {
        clearTimeout(timer);
        pending.delete(entry.id);
        Object.assign(entry, { outcome, finishedMs: now(), elapsedMs: now() - entry.startedMs });
        if (error) {
          error.commandId = entry.id;
          reject(error);
        } else resolve(result);
      };
      const timer = setTimeout(() => finish('timeout', undefined, new Error(method + ' timeout (command ' + entry.id + ')')), budget);
      pending.set(entry.id, finish);
      try { write(JSON.stringify({ id: entry.id, method, params, ...(sessionId ? { sessionId } : {}) })); }
      catch (error) { finish('write-error', undefined, error); }
    });
  }
  function receive(message) {
    if (!Number.isInteger(message.id)) return false;
    const finish = pending.get(message.id);
    if (finish) {
      if (message.error) finish('protocol-error', undefined, new Error(message.error.message ?? 'CDP protocol error'));
      else finish('response', message.result);
    } else {
      const entry = entries.find(item => item.id === message.id);
      if (entry) { entry.lateReplies = (entry.lateReplies ?? 0) + 1; entry.lastLateReplyMs = now(); }
    }
    return true;
  }
  function close() {
    closed = true;
    for (const finish of [...pending.values()]) finish('closed', undefined, new Error('CDP closed'));
  }
  return { send, receive, close, snapshot: () => ({ entries: entries.map(item => ({ ...item })), pending: pending.size, closed, limitHit }) };
}
