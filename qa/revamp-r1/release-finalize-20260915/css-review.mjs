import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const relative='web/components/route-evidence-map.module.css';
const before=execFileSync('git',['show','80ca2c7:'+relative],{cwd:root,env:{...process.env,TEMP:resolve(root,'tmp'),TMP:resolve(root,'tmp')},windowsHide:true,timeout:15000});
const after=readFileSync(resolve(root,relative));
const normalize=bytes=>bytes.toString('utf8').replace(/^\.mapCanvas(?=\s*:global\()/gm,'').replace(/^ +(?=:global\()/gm,'');
assert.equal(normalize(before),normalize(after),'Unexpected non-scope change');
const count=(before.toString().match(/^:global/gm)||[]).length;
assert.equal(count,29);assert.equal((after.toString().match(/^:global/gm)||[]).length,0);
const require=createRequire(resolve(root,'web/package.json')),postcss=require('postcss'),pure=require('next/dist/compiled/postcss-modules-local-by-default');
const modules=[];
for(const directory of ['web/app','web/components'])for(const name of readdirSync(resolve(root,directory),{recursive:true})){
  if(!name.endsWith('.module.css'))continue;
  const path=resolve(root,directory,name);
  await postcss([pure({mode:'pure'})]).process(readFileSync(path,'utf8'),{from:path});modules.push(path.slice(root.length+1));
}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={root,host:process.env.COMPUTERNAME,beforeSha256:hash(before),afterSha256:hash(after),
  scopedSelectors:count,allOtherTextEqual:true,pureModules:modules,
  qualification:'Compiler-plugin and source proof, not new browser layout acceptance. Container self selector is compound; vendor descendants are scoped to the existing mapCanvas.',passed:true};
writeFileSync(resolve(root,'qa/revamp-r1/release-finalize-20260915/css-review.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report,null,2));
