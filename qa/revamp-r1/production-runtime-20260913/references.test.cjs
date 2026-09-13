'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { allowed, references, LIMITS } = require('./references-reviewed.cjs');
const JS = '/_next/static/immutable/chunks/app.js';
const CSS = '/_next/static/immutable/chunks/app.css';
const CHUNKS = '/_next/static/immutable/chunks/';
const parse = text => references(JS, text);

test('bare extensions and arbitrary JS strings never become URLs', () => {
  const values = ['.css', '.js', '.mjs', 'webpack.js', 'README.md', 'file.png', 'text', './.css', '../.js', CHUNKS + '.css'];
  assert.deepEqual(parse('const values = ' + JSON.stringify(values)).urls, []);
  for (const value of values) assert.equal(allowed(value, JS), null, value);
  for (const value of ['.css', './.css', '../.css', CHUNKS + '.css']) {
    assert.equal(allowed(value, CSS, 'css'), null, value);
    assert.equal(allowed(value, JS, 'module'), null, value);
  }
});

test('explicit Turbopack paths retain original namespace, deduplicate and sort', () => {
  const paths = ['static/immutable/chunks/b.js', CHUNKS + 'a.css', CHUNKS + 'b.js'];
  const result = parse('const chunks = ' + JSON.stringify(paths));
  assert.deepEqual(result.urls, [CHUNKS + 'a.css', CHUNKS + 'b.js']);
  assert.equal(result.closureComplete, false);
});

test('known direct references accept all retention static asset extensions', () => {
  for (const extension of ['mjs', 'js', 'css', 'woff', 'woff2', 'ttf', 'otf', 'png', 'jpg', 'jpeg', 'svg', 'webp', 'avif', 'ico']) {
    const url = '/_next/static/media/name.' + extension;
    assert.equal(allowed(url, JS), url);
    assert.deepEqual(parse(JSON.stringify(url)).urls, [url]);
  }
});

test('real relative imports, exports, static templates and importScripts resolve against source', () => {
  const result = parse('import "./a.js"; export { x } from "../shared.mjs"; export * from "./c.js";' +
    'import(`./d.js`); self.importScripts("./worker.js", "../shared.mjs");');
  assert.deepEqual(result.urls, [CHUNKS + 'a.js', CHUNKS + 'c.js', CHUNKS + 'd.js', CHUNKS + 'worker.js', '/_next/static/immutable/shared.mjs'].sort());
  assert.deepEqual(result.unresolved, []);
});

test('unbound relative literals and bare module imports are unresolved, not fetched', () => {
  const result = parse('const x = "./a.js"; import "package.js"; import "pkg";');
  assert.deepEqual(result.urls, []);
  assert.deepEqual(result.unresolved.map(x => x.kind), ['unbound_url_literal', 'reference_not_captured', 'reference_not_captured']);
});

test('computed imports and URL fragments never fetch a partial literal', () => {
  const result = parse('import(name); import(`./${name}.js`); const a = "' + CHUNKS + 'a.js" + suffix;' +
    'const b = `/_next/static/${name}.css`; const c = "static/chunks/" + id + ".js";');
  assert.deepEqual(result.urls, []);
  assert.equal(result.unresolved.filter(x => x.kind === 'computed_import').length, 2);
  assert.equal(result.unresolved.filter(x => x.kind === 'computed_url_fragment').length, 3);
});

test('new URL resolves relative modules only with import.meta.url', () => {
  const result = parse('new Worker(new URL("../worker.mjs", import.meta.url), {type:"module"});' +
    'new URL("./wrong.js", document.baseURI); new URL(path, import.meta.url);' +
    'new URL("https://sgshiok.vercel.app/_next/static/a.js");');
  assert.deepEqual(result.urls, ['/_next/static/a.js', '/_next/static/immutable/worker.mjs']);
  assert.deepEqual(result.unresolved.map(x => x.kind), ['url_base_unresolved', 'computed_url']);
});

test('document-relative worker/fetch URLs are not guessed relative to a JS chunk', () => {
  const result = parse('new Worker("./worker.js"); fetch("./a.js"); fetch(path);' +
    'new SharedWorker(worker); navigator.serviceWorker.register("/sw.js");' +
    'script.src = prefix + suffix; link.setAttribute("href", path);');
  assert.deepEqual(result.urls, []);
  assert.equal(result.unresolved.length, 7);
});

test('object URL fields are accounted for without guessing computed values', () => {
  const result = parse('const a={src:path, "href":makeHref(), ["workerUrl"]:"/maplibre/6.1.0/worker.mjs"};');
  assert.deepEqual(result.urls, ['/maplibre/6.1.0/worker.mjs']);
  assert.deepEqual(result.unresolved.map(x => x.kind), ['computed_attribute', 'computed_attribute']);
});

test('unsupported explicit resources remain unresolved rather than silently disappearing', () => {
  const result = parse(JSON.stringify([CHUNKS + 'module.wasm', CHUNKS + 'a.js?v=1', '/maplibre/6.1.0/LICENSE.txt']));
  assert.deepEqual(result.urls, []);
  assert.equal(result.unresolved.length, 3);
});

test('static worker namespace and its module-relative imports are retained', () => {
  const source = '/maplibre/6.1.0/maplibre-gl-worker.mjs';
  assert.deepEqual(references(source, 'import "./shared.mjs"').urls, ['/maplibre/6.1.0/shared.mjs']);
  assert.deepEqual(parse('setWorkerUrl("/maplibre/6.1.0/worker.mjs")').urls, ['/maplibre/6.1.0/worker.mjs']);
});

test('URL policy refuses unsafe, external, encoded, query, fragment and non-runtime paths', () => {
  for (const value of ['//evil.test/_next/static/a.js', 'https://evil.test/_next/static/a.js',
    'https://sgshiok.vercel.app.evil.test/_next/static/a.js', 'https://sgshiok.vercel.app@evil.test/_next/static/a.js',
    '/_next/static/a.js?v=1', '/_next/static/a.svg#id', '/_next/static/a%2f.js', '/_next/static/a\\b.js',
    '/_next/static/CON.js', '/_next/static/a./b.js', '/_next/static//a.js', '/api/a.js', '/data/a.js', '/sw.js',
    '/maplibre/latest/worker.js', '/_next/static/source.js.map', '../../../../../escape.js', '/_next/static/a\u0000.js']) {
    assert.equal(allowed(value, JS, 'module'), null, value);
  }
});

test('CSS url tokens accept unquoted, quoted, mixed-case and whitespace inside parentheses', () => {
  const result = references(CSS, 'a{a:url(../media/a.woff2);b:URL("./b.svg");c:url(  "./c.png"  );d:uRl( ./d.webp )}');
  assert.deepEqual(result.urls, [CHUNKS + 'b.svg', CHUNKS + 'c.png', CHUNKS + 'd.webp', '/_next/static/immutable/media/a.woff2'].sort());
  assert.deepEqual(result.unresolved, []);
});

test('CSS bare filenames only count in actual url/import positions', () => {
  const result = references(CSS, '@import "theme.css" screen; a{background:url(picture.png);content:"fake.svg";font-family:font.woff2}');
  assert.deepEqual(result.urls, [CHUNKS + 'picture.png', CHUNKS + 'theme.css']);
});

test('CSS imports include quoted and url forms with layer/supports/media tails', () => {
  const result = references(CSS, '@import "./a.css" layer(base); @import url("../b.css") supports(display:grid) screen;' +
    '@import url(./c.css) print; @IMPORT "./d.css";');
  assert.deepEqual(result.urls, [CHUNKS + 'a.css', CHUNKS + 'c.css', CHUNKS + 'd.css', '/_next/static/immutable/b.css'].sort());
  assert.deepEqual(result.unresolved, []);
});

test('CSS strings/comments containing URL-like text are not references', () => {
  const result = references(CSS, '/* url(./fake.svg) */ a{content:"url(./fake.png)";a:url(./real.svg)}');
  assert.deepEqual(result.urls, [CHUNKS + 'real.svg']);
});

test('CSS escape decoding preserves filenames without executing content', () => {
  const result = references(CSS, String.raw`@import "\2e /theme.css"; a{a:url("../media/f\6f nt.woff2");b:url(./im\61 ge.svg)}`);
  assert.deepEqual(result.urls, [CHUNKS + 'image.svg', CHUNKS + 'theme.css', '/_next/static/immutable/media/font.woff2'].sort());
  assert.deepEqual(result.unresolved, []);
});

test('escaped CSS function names and nested URL functions are recognized', () => {
  const result = references(CSS, String.raw`a{a:u\72l("./a.svg");b:cross-fade(url(./b.png),url(./c.png),50%)}`);
  assert.deepEqual(result.urls, [CHUNKS + 'a.svg', CHUNKS + 'b.png', CHUNKS + 'c.png']);
  assert.deepEqual(result.unresolved, []);
});

test('CSS comments or extra tokens inside a URL fail closed without joining fragments', () => {
  const result = references(CSS, 'a{a:url(./a/*x*/.png);b:url("./b.png" extra);c:url(./bad\\000000.png)}');
  assert.deepEqual(result.urls, []);
  assert.equal(result.unresolved.length, 3);
});

test('data URLs are counted only, including CSS data containing semicolons and parentheses', () => {
  const result = references(CSS, 'a{a:url("data:image/svg+xml,<svg>(x)</svg>");b:url(data:image/png;base64,AAAA)}');
  assert.deepEqual(result.urls, []);
  assert.equal(result.embedded.dataUrls, 2);
  assert.equal(parse('const x = "data:text/javascript,throw 1"').embedded.dataUrls, 1);
});

test('CSS dynamic/unsupported URLs and extension-only files remain explicit unresolved facts', () => {
  const result = references(CSS, '@import var(--sheet); @import ".css";' +
    'a{a:url(var(--image));b:url(.css);c:url(https://outside.test/a.svg);d:url(./a.svg#x);' +
    'e:image-set("./image.png" 1x);f:url();g:url (./not-a-function.svg)}');
  assert.deepEqual(result.urls, []);
  for (const kind of ['css_import_unresolved', 'css_url_unresolved', 'reference_not_captured', 'css_image_set_unresolved', 'css_url_syntax']) {
    assert.ok(result.unresolved.some(x => x.kind === kind), kind);
  }
});

test('JS comments, regexes and extension comparison regression do not become fetch candidates', () => {
  const result = parse(String.raw`/* "/_next/static/fake.js" */ const x = /static\/fake.js/;` +
    'function f(name){return name.endsWith(".css") || name.endsWith(`.mjs`)}');
  assert.deepEqual(result.urls, []);
});

test('malformed JS and CSS fail instead of returning partial success', () => {
  assert.throws(() => parse('import('), SyntaxError);
  assert.throws(() => references(CSS, 'a{background:url("broken)}'));
});

test('input byte, token, nesting, AST node and output budgets fail closed', () => {
  assert.throws(() => references(JS, '"\u00e9"', { textBytes: 3 }), /REFERENCES_TEXT_LIMIT/);
  assert.throws(() => references(JS, 'let a=1;let b=2;', { tokens: 3 }), /REFERENCES_TOKEN_LIMIT/);
  assert.throws(() => references(JS, '(((1)))', { depth: 2 }), /REFERENCES_DEPTH_LIMIT/);
  assert.throws(() => references(JS, 'let a=1;', { nodes: 2 }), /REFERENCES_NODE_LIMIT/);
  assert.throws(() => references(CSS, 'a{b:url(./a.svg)}', { tokens: 2 }), /REFERENCES_TOKEN_LIMIT/);
  assert.throws(() => references(CSS, '@media a{@media b{a{b:c}}}', { depth: 2 }), /REFERENCES_DEPTH_LIMIT/);
  assert.throws(() => references(CSS, 'a{b:c}', { nodes: 2 }), /REFERENCES_NODE_LIMIT/);
  assert.throws(() => references(JS, '["static/a.js","static/b.js"]', { urls: 1 }), /REFERENCES_URL_LIMIT/);
  assert.throws(() => references(JS, 'import(a);import(b)', { unresolved: 1 }), /REFERENCES_UNRESOLVED_LIMIT/);
  assert.throws(() => references(JS, '', { textBytes: LIMITS.textBytes + 1 }), /REFERENCES_LIMIT_OPTION/);
  assert.throws(() => references(JS, '', { unknown: 1 }), /REFERENCES_LIMIT_OPTION/);
  assert.throws(() => references(JS, '', { toString: 1 }), /REFERENCES_LIMIT_OPTION/);
  assert.throws(() => references(JS, Buffer.from('')), /REFERENCES_TEXT/);
  assert.throws(() => references('https://evil.test/a.js', ''), /REFERENCES_SOURCE/);
});

test('unresolved snippets are bounded and original caller text stays unchanged', () => {
  const input = 'import(' + 'veryLongVariable'.repeat(40) + ')';
  const before = input;
  const result = parse(input);
  assert.equal(result.unresolved[0].expression.length, 180);
  assert.equal(input, before);
});

test('parsing never evaluates JavaScript, CSS, embedded scripts or requests URLs', () => {
  const previous = globalThis.fetch;
  globalThis.fetch = () => { throw Error('Network forbidden'); };
  globalThis.__referenceTestExecuted = false;
  try {
    parse('globalThis.__referenceTestExecuted=true; throw new Error("must not run");' +
      'fetch("https://outside.test/a.js"); eval("globalThis.__referenceTestExecuted=true");' +
      'new Function("globalThis.__referenceTestExecuted=true")();');
    references(CSS, 'a{x:expression(globalThis.__referenceTestExecuted=true);background:url("data:text/javascript,throw 1")}');
    assert.equal(globalThis.__referenceTestExecuted, false);
  } finally {
    globalThis.fetch = previous;
    delete globalThis.__referenceTestExecuted;
  }
});
