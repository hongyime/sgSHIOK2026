// Diagnostic-only CDP lifecycle. No application changes or source payload copying.
export function createTraceCollector(limit = 120000) {
  const events = [];
  let dropped = 0, complete = false, notify;
  return {
    events,
    receive(message) {
      if (message.method === 'Tracing.dataCollected') {
        for (const event of message.params.value) {
          if (events.length < limit) events.push(event); else dropped++;
        }
      }
      if (message.method === 'Tracing.tracingComplete') { complete = true; notify?.(); }
    },
    async finish(send, timeoutMs = 15000) {
      let timer;
      // Install the event waiter BEFORE Tracing.end, including synchronous replies.
      const completion = new Promise(resolve => {
        notify = () => { clearTimeout(timer); resolve(true); };
        timer = setTimeout(() => resolve(false), timeoutMs);
        if (complete) notify();
      });
      try {
        await send('Tracing.end');
        const completed = await completion;
        return { completed, events: events.length, dropped, incompleteReason: completed ? null : 'Tracing.tracingComplete deadline exceeded' };
      } finally { clearTimeout(timer); notify = undefined; }
    },
  };
}

export function createWorkerRegistry() {
  const sessions = new Map(), history = [];
  return {
    sessions, history,
    attach(params) {
      const info = { sessionId: params.sessionId, type: params.targetInfo.type, url: params.targetInfo.url, attachedWall: Date.now(), detachedWall: null };
      sessions.set(params.sessionId, info); history.push(info);
    },
    detach(sessionId) {
      const info = sessions.get(sessionId);
      if (info) info.detachedWall = Date.now();
      sessions.delete(sessionId);
    },
    async collect(send) {
      const timings = [], diagnostics = [];
      for (const [sessionId, info] of [...sessions]) {
        if (info.type !== 'worker' || !sessions.has(sessionId)) continue;
        try {
          const result = await send('Runtime.evaluate', { expression: '({timeOrigin:performance.timeOrigin,resources:performance.getEntriesByType("resource").map(e=>e.toJSON())})', returnByValue: true }, sessionId, 2000);
          if (sessions.has(sessionId)) timings.push({ ...info, result: result.result.value });
          else diagnostics.push({ sessionId, kind: 'detached-during-collection' });
        } catch (error) {
          const detached = !sessions.has(sessionId) || /Session with given id not found|session closed|target closed/i.test(error.message);
          if (detached) this.detach(sessionId);
          diagnostics.push({ sessionId, kind: detached ? 'detached-during-collection' : 'worker-telemetry-error', message: error.message });
        }
      }
      return { timings, diagnostics };
    },
  };
}
