// Loaded by the isolation runner in every Node process, including Vitest workers.
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { syncBuiltinESMExports } = require('node:module');

const normalize = value => {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
};
const forbidden = JSON.parse(process.env.SHIOK_FORBIDDEN_DATA_PATHS || '[]').map(normalize);
function check(value) {
  if (value instanceof URL) value = fileURLToPath(value);
  if (Buffer.isBuffer(value)) value = value.toString();
  if (typeof value !== 'string') return;
  const resolved = normalize(value);
  if (forbidden.some(root => resolved === root || resolved.startsWith(root + path.sep))) {
    const error = new Error('Production data access denied by test isolation');
    error.code = 'SHIOK_TEST_PRODUCTION_DATA_DENIED';
    throw error;
  }
}
for (const target of [fs, fs.promises]) {
  for (const name of ['readFile', 'open', 'createReadStream', 'readdir', 'opendir', 'stat', 'lstat', 'access', 'exists', 'writeFile', 'appendFile', 'mkdir', 'rm', 'unlink', 'rename', 'copyFile']) {
    for (const method of [name, name + 'Sync']) {
      if (typeof target[method] !== 'function') continue;
      const original = target[method];
      target[method] = function (...args) {
        check(args[0]);
        if (name === 'rename' || name === 'copyFile') check(args[1]);
        return original.apply(this, args);
      };
    }
  }
}
syncBuiltinESMExports();
