import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { verifyFrontendRetention } from '../../scripts/frontend-retention.mjs';
import { buildFrontendRelease } from '../../scripts/build-next-release.mjs';

const hash = (bytes: string) => createHash('sha256').update(bytes).digest('hex');
const nextConfig = createRequire(import.meta.url)('../../next.config.js');
const put = (root: string, path: string, bytes: string) => {
  mkdirSync(dirname(join(root,path)),{recursive:true}); writeFileSync(join(root,path),bytes);
};
function fixture() {
  const parent = resolve(process.cwd(),'../tmp'); mkdirSync(parent,{recursive:true});
  const root = mkdtempSync(join(parent,'frontend-retention-'));
  const files = [['_next/static/chunks/old.js','old code'],['maplibre/6.1.0/worker.js','old worker']].map(([path, bytes]) => {
    put(root,'public/_retained/'+path,bytes); return {path,bytes:Buffer.byteLength(bytes),sha256:hash(bytes)};
  });
  const policy = {schemaVersion:1,buildIds:['build-a'],totalBytes:files.reduce((sum,f)=>sum+f.bytes,0),files};
  put(root,'frontend-retention.json',JSON.stringify(policy));
  return {root,policy};
}
function build(root: string) {
  put(root,'.next/BUILD_ID','build-b'); put(root,'.next/static/chunks/new.js','new code'); return {status:0};
}

describe('retained frontend release contract', () => {
  it('retains actual ESM runtime filenames and the accompanying license', () => {
    const {root,policy} = fixture();
    for (const path of ['_next/static/media/maplibre-gl.hash.mjs','maplibre/6.1.0/maplibre-gl-worker.mjs','maplibre/6.1.0/LICENSE.txt']) {
      const bytes = 'fixture';
      put(root,'public/_retained/'+path,bytes);
      policy.files.push({path,bytes:bytes.length,sha256:hash(bytes)});
      policy.totalBytes += bytes.length;
    }
    put(root,'frontend-retention.json',JSON.stringify(policy));
    expect(buildFrontendRelease(root,()=>build(root)).retention.files).toBe(5);
  });

  it('resolves missing old URLs only after the current filesystem', async () => {
    const rules = await nextConfig.rewrites();
    expect(rules.fallback).toEqual([
      {source:'/_next/static/:path*',destination:'/_retained/_next/static/:path*'},
      {source:'/maplibre/:version/:path*',destination:'/_retained/maplibre/:version/:path*'},
    ]);
    expect(rules.beforeFiles.some((r: {source:string})=>r.source.startsWith('/_next') || r.source.startsWith('/maplibre'))).toBe(false);
    expect(rules.fallback.every((r: {destination:string})=>r.destination.startsWith('/_retained/'))).toBe(true);
  });

  it('keeps the retained static namespace immutable and noindex', async () => {
    const headers = (await nextConfig.headers()).find((r: {source:string})=>r.source==='/_retained/:path*').headers;
    expect(headers).toContainEqual({key:'Cache-Control',value:'public, max-age=31536000, immutable'});
    expect(headers).toContainEqual({key:'X-Content-Type-Options',value:'nosniff'});
    expect(headers).toContainEqual({key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'});
  });

  it('checks archives before building and compares new output afterwards', () => {
    const {root} = fixture(), run = vi.fn(()=>build(root));
    const before = readFileSync(join(root,'frontend-retention.json'));
    expect(buildFrontendRelease(root,run)).toMatchObject({built:true,retention:{buildId:'build-b',files:2,bytes:18}});
    expect(run).toHaveBeenCalledOnce();
    expect(readFileSync(join(root,'frontend-retention.json'))).toEqual(before);
  });

  it('does not build if a retained file changes', () => {
    const {root} = fixture(), run = vi.fn(); put(root,'public/_retained/_next/static/chunks/old.js','wrong');
    expect(()=>buildFrontendRelease(root,run)).toThrow('RETENTION_ASSET_CHANGED'); expect(run).not.toHaveBeenCalled();
  });

  it('does not pretend a failed compiler completed a release', () => {
    const {root} = fixture(); expect(()=>buildFrontendRelease(root,()=>({status:1}))).toThrow('DIRECT_NEXT_BUILD_FAILED');
  });

  it('blocks current generated chunks with a conflicting old URL', () => {
    const {root} = fixture();
    expect(()=>buildFrontendRelease(root,()=>{build(root);put(root,'.next/static/chunks/old.js','different');return {status:0};})).toThrow('RETENTION_ASSET_CONFLICT');
  });

  it('allows identical shared chunks', () => {
    const {root} = fixture();
    expect(buildFrontendRelease(root,()=>{build(root);put(root,'.next/static/chunks/old.js','old code');return {status:0};}).built).toBe(true);
  });

  it('blocks a changed same-version worker', () => {
    const {root} = fixture(); build(root); put(root,'public/maplibre/6.1.0/worker.js','changed');
    expect(()=>verifyFrontendRetention(root,{requireBuild:true})).toThrow('RETENTION_ASSET_CONFLICT');
  });

  it('keeps a previous worker even when the new build has another version', () => {
    const {root} = fixture(); build(root); put(root,'public/maplibre/6.4.1/worker.js','future worker fixture');
    expect(verifyFrontendRetention(root,{requireBuild:true}).files).toBe(2);
  });

  it('rejects case aliases in the current public worker tree', () => {
    const {root} = fixture(); build(root); put(root,'public/maplibre/6.1.0/WORKER.js','old worker');
    expect(()=>verifyFrontendRetention(root,{requireBuild:true})).toThrow('RETENTION_ASSET_CONFLICT');
  });

  it('requires a completed build identity', () => {
    const {root} = fixture(); expect(()=>verifyFrontendRetention(root,{requireBuild:true})).toThrow();
  });

  it('rejects new unlisted assets', () => {
    const {root} = fixture(); put(root,'public/_retained/extra.js','unlisted');
    expect(()=>verifyFrontendRetention(root)).toThrow('RETENTION_INVENTORY_MISMATCH');
  });

  it('rejects linked directories', () => {
    const {root} = fixture(), target = join(root,'other');mkdirSync(target);
    symlinkSync(target,join(root,'public/_retained/link'),'junction');
    expect(()=>verifyFrontendRetention(root)).toThrow('RETENTION_LINKED_PATH');
  });

  it('rejects metadata rewritten during the build', () => {
    const {root,policy} = fixture();
    expect(()=>buildFrontendRelease(root,()=>{build(root);put(root,'frontend-retention.json',JSON.stringify({...policy,buildIds:['changed']}));return {status:0};})).toThrow('RETENTION_MANIFEST_CHANGED_DURING_BUILD');
  });

  it.each(['../private.js','_next/static/private.html','_next/static/source.js.map','api/private.js','maplibre/latest/worker.js','_next/static/a%2fb.js'])('rejects unsafe runtime path %s', path => {
    const {root,policy} = fixture();policy.files[0].path=path;put(root,'frontend-retention.json',JSON.stringify(policy));
    expect(()=>verifyFrontendRetention(root)).toThrow(/RETENTION_UNSAFE_/);
  });

  it('rejects duplicate case-folded URLs', () => {
    const {root,policy} = fixture();policy.files.push({...policy.files[0],path:policy.files[0].path.replace('old.js','OLD.js')});policy.totalBytes+=policy.files[0].bytes;
    put(root,'frontend-retention.json',JSON.stringify(policy));expect(()=>verifyFrontendRetention(root)).toThrow('RETENTION_ASSET_CONFLICT');
  });

  it('rejects excessive generations or false totals', () => {
    const {root,policy} = fixture();policy.buildIds.push('b','c');put(root,'frontend-retention.json',JSON.stringify(policy));
    expect(()=>verifyFrontendRetention(root)).toThrow('RETENTION_MANIFEST_INVALID');
    policy.buildIds=['a'];policy.totalBytes++;put(root,'frontend-retention.json',JSON.stringify(policy));
    expect(()=>verifyFrontendRetention(root)).toThrow('RETENTION_MANIFEST_INVALID');
  });
});
