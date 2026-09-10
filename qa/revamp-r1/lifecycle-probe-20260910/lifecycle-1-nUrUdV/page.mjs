const responses = new Map();
window.fixture = {
  async retain(path) {
    const response = await fetch(path);
    responses.set(path, response);
    return { path, status: response.status, bodyUsed: response.bodyUsed, locked: response.body?.locked };
  },
  async consume(path, action) {
    const response = responses.get(path);
    if (!response) throw Error('Unknown fixture response');
    if (action === 'cancel') await response.body.cancel();
    else if (action === 'drain') return { path, action, bytes: (await response.text()).length, bodyUsed: response.bodyUsed };
    else throw Error('Unknown body action');
    return { path, action, bodyUsed: response.bodyUsed };
  },
  async worker() {
    return new Promise((done, reject) => {
      const worker = new Worker('/worker.mjs', { type: 'module' });
      window.fixtureWorker = worker;
      worker.onmessage = event => done(event.data);
      worker.onerror = event => reject(Error(event.message));
    });
  },
};
