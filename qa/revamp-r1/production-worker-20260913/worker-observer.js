(() => {
  const Native = window.Worker;
  const events = [], push = Function.call.bind(Array.prototype.push);
  const now = performance.now.bind(performance);
  const add = EventTarget.prototype.addEventListener;
  window.__qaWorkerEvents = events;
  const record = value => {
    try { if (events.length < 40) push(events, { at: now(), ...value }); } catch {}
  };
  window.Worker = new Proxy(Native, {
    construct(target, args, newTarget) {
      const url = typeof args[0] === 'string' ? args[0] : null;
      record({ kind: 'construct', url, argumentType: typeof args[0] });
      let worker;
      try { worker = Reflect.construct(target, args, newTarget); }
      catch (error) {
        record({ kind: 'constructor-threw', url, thrownType: typeof error });
        throw error;
      }
      record({ kind: 'constructed', url });
      try {
        Reflect.apply(add, worker, ['error', () => record({ kind: 'error', url }), { once: true }]);
        Reflect.apply(add, worker, ['message', () => record({ kind: 'first-message', url }), { once: true }]);
      } catch { record({ kind: 'observer-listener-failed', url }); }
      return worker;
    }
  });
})();
