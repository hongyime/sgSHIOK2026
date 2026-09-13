const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const out = path.join(root, 'qa/revamp-r1/release-runtime-20260913');
const acorn = require(path.join(root, 'web/node_modules/next/dist/compiled/acorn/acorn.js'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const parse = source => acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
function visit(node, fn) {
  if (!node || typeof node !== 'object') return;
  if (node.type) fn(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(n => visit(n, fn));
    else if (value && typeof value === 'object') visit(value, fn);
  }
}
const live = JSON.parse(fs.readFileSync(path.join(out, 'response-metadata.json'))).inputs.map(input => {
  assert.equal(input.status, 200);
  const saved = fs.readFileSync(path.join(root, input.path), 'utf8');
  const text = saved.slice(0, input.decodedCharacters);
  assert.ok(saved.slice(input.decodedCharacters) === '\n' || saved.slice(input.decodedCharacters) === '');
  return { ...input, text, bytes: Buffer.byteLength(text), sha256: sha(text) };
});
function inspect(name, source) {
  const ast = parse(source), classes = [], versions = new Set(), attributionControls = [];
  visit(ast, n => {
    if (n.type === 'Literal' && typeof n.value === 'string' && /^6\.\d+\.\d+$/.test(n.value)) versions.add(n.value);
    if (n.type === 'Property' && n.key.name === 'attributionControl') attributionControls.push(source.slice(n.value.start, n.value.end));
    if (['ClassExpression', 'ClassDeclaration'].includes(n.type) && n.body.body.some(m => m.key?.name === 'sanitize')) {
      assert.ok(n.id && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(n.id.name));
      const required = ['sanitize', 'isPossiblyDangerous', 'clean', 'removeAttributes'];
      const methods = n.body.body.filter(m => required.includes(m.key?.name));
      assert.equal(methods.length, required.length);
      assert.ok(methods.every(m => m.static && m.type === 'MethodDefinition'));
      const code = `class ${n.id.name} {\n${methods.map(m => source.slice(m.start, m.end)).join('\n')}\n}`;
      const remove = methods.find(m => m.key.name === 'removeAttributes');
      classes.push({ offset: n.start, className: n.id.name, code, sha256: sha(code),
        removalSource: source.slice(remove.start, remove.end) });
    }
  });
  return { name, sourceBytes: Buffer.byteLength(source), sourceSha256: sha(source),
    versions: [...versions], attributionControls, sanitizers: classes };
}
const manifestPath = 'tmp/completion-20260913-build-2/web/frontend-retention.json';
const manifestRaw = fs.readFileSync(path.join(root, manifestPath));
const manifest = JSON.parse(manifestRaw);
assert.equal(manifest.totalBytes, 5786770);
let total = 0;
for (const entry of manifest.files) {
  const bytes = fs.readFileSync(path.join(root, 'tmp/completion-20260913-build-2/web/public/_retained', entry.path));
  assert.equal(bytes.length, entry.bytes, entry.path); assert.equal(sha(bytes), entry.sha256, entry.path);
  total += bytes.length;
}
assert.equal(total, manifest.totalBytes);
const retainedEntries = manifest.files.filter(f => /maplibre-gl\.[^.]+\.mjs$/.test(f.path));
assert.equal(retainedEntries.length, 1);
const retained = fs.readFileSync(path.join(root, 'tmp/completion-20260913-build-2/web/public/_retained', retainedEntries[0].path), 'utf8');
const current = fs.readFileSync(path.join(root, 'web/node_modules/maplibre-gl/dist/maplibre-gl.mjs'), 'utf8');
const samples = [inspect('live-map', live.find(x => x.path.endsWith('/live-map.js')).text),
  inspect('live-vendor', live.find(x => x.path.endsWith('/live-vendor-wrapper.js')).text),
  inspect('retained-local-vendor', retained), inspect('current-installed-vendor', current)];
for (const s of samples.filter(s => s.name !== 'live-map')) assert.equal(s.sanitizers.length, 1, s.name);
const html = JSON.parse(fs.readFileSync(path.join(out, 'live-html.json'))).response.text;
const report = { root, hostname: process.env.COMPUTERNAME, createdAt: new Date().toISOString(),
  advisory: 'https://github.com/maplibre/maplibre-gl-js/security/advisories/GHSA-jrc7-96c5-q579',
  liveInputs: live.map(({text, ...input}) => input),
  liveBuildIdObserved: html.includes('UzVn3WiWA2GW7dtvN27rN') ? 'UzVn3WiWA2GW7dtvN27rN' : null,
  retainedManifest: { path: manifestPath, sha256: sha(manifestRaw), buildIds: manifest.buildIds, files: manifest.files.length, bytes: total },
  currentPackageVersion: JSON.parse(fs.readFileSync(path.join(root, 'web/node_modules/maplibre-gl/package.json'))).version,
  samples, limitations: ['Decoded frontend text hashes, not compressed wire hashes.',
    'Static inspection and extracted sanitizer are not whole-application exploitability or deployment approval.',
    'Local archived build is not the live production build. No payload or vendor file modified.'] };
fs.writeFileSync(path.join(out, 'runtime-analysis.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({liveBuild:report.liveBuildIdObserved, retainedBuilds:manifest.buildIds,
  files:manifest.files.length, bytes:total, samples:samples.map(s=>({name:s.name,versions:s.versions,attributionControls:s.attributionControls,sanitizers:s.sanitizers.length}))}, null, 2));
