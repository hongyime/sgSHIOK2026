import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const out=resolve(root,'qa/revamp-r1/frontend-retention-20260910/http.json');
if(existsSync(out))throw Error('Preserve prior HTTP receipt');
const build=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/frontend-retention-20260910/build-2/build.json')));
const sha=b=>createHash('sha256').update(b).digest('hex');
const results=[];
for(const [path,pin] of [
  ['/_next/static/chunks/0j6tjjnrv2h3w.js','4a1b7cf727bfc2157e11185a0fe88af518733a56f34601833c75fccad34df11b'],
  ['/_next/static/qa-missing.js',null],
  ['/_retained/_next/static/qa-missing.js',null],
  ['/maplibre/0.0.0/qa-missing.mjs',null],
]) {
  const r=await fetch('http://127.0.0.1:4345'+path,{signal:AbortSignal.timeout(30000)}),bytes=Buffer.from(await r.arrayBuffer());
  const headers=Object.fromEntries(r.headers),hash=sha(bytes);
  const ok=pin?r.status===200&&hash===pin:r.status===404&&!/immutable|max-age=31536000/.test(headers['cache-control']||'');
  results.push({path,status:r.status,headers,bytes:bytes.length,sha256:hash,expectedSha256:pin,ok});
}
const report={root,hostname:process.env.COMPUTERNAME,buildId:build.buildId,results,ok:results.every(r=>r.ok)};
writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report,null,2));process.exitCode=report.ok?0:1;
