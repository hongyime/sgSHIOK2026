import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, lstatSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const dir = resolve(root, 'qa/revamp-r1/production-worker-20260913');
const sha = body => createHash('sha256').update(body).digest('hex');
const info = path => {
  const body = readFileSync(path);
  return { path: relative(root, path).replaceAll('\\', '/'), bytes: body.length, sha256: sha(body) };
};
const source = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/native-zoom-20260913/build-1/build.json')));
const sourceMismatches = source.sources.filter(s => sha(readFileSync(resolve(root, s.path))) !== s.sha256);
assert.deepEqual(sourceMismatches, []);
const evidence = resolve(root, 'qa/verification/REVAMP-R1-core-walk.md');
const body = readFileSync(evidence), prefixSha256 = sha(body.subarray(0,396996));
assert.equal(prefixSha256, 'caa0988bdd12db7a40f1363ad5a1d2cf7d2e906bb0e693cc01dd59e2f06b871d');
assert.ok(body.length > 396996);
const artifacts = [];
function visit(path) {
  for (const entry of readdirSync(path)) {
    if (entry === 'artifact-index.json' || entry === 'staging-verification.json') continue;
    const child = resolve(path, entry), stat = lstatSync(child);
    assert.equal(stat.isSymbolicLink(), false);
    if (stat.isDirectory()) visit(child);
    else { assert.equal(stat.isFile(), true); artifacts.push(info(child)); }
  }
}
visit(dir);
const report = {
  root, hostname: process.env.COMPUTERNAME,
  build: { id: source.buildId, sourceCount: source.sources.length, sourceMismatches, freshFullWebTestRun: false },
  evidence: { ...info(evidence), prefixBytes:396996, prefixSha256, appendBytes:body.length-396996, prefixPreserved:true },
  documents: ['.agents/STATE.md', 'PRODUCT-PLAN.md', 'decisions.md', 'postplan.html'].map(p=>info(resolve(root,p))),
  artifacts: artifacts.sort((a,b)=>a.path.localeCompare(b.path)),
  excludes: ['this artifact-index.json', 'later staging-verification.json'],
  artifactCount: artifacts.length,
  artifactBytes: artifacts.reduce((sum,a)=>sum+a.bytes,0),
  noProtectedDataWrite: true, noDeployment: true,
  caveat: 'Index records bytes, not a test or uninstrumented production acceptance.'
};
writeFileSync(resolve(dir, 'artifact-index.json'), JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({build:report.build,evidence:report.evidence,artifactCount:report.artifactCount,artifactBytes:report.artifactBytes},null,2));
