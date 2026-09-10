import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const [label,mode='contracts']=process.argv.slice(2);
if(!/^[a-z0-9-]+$/.test(label??'')||!['contracts','actual','integrity','types','qa-build','release'].includes(mode))throw Error('Invalid scope');
const out=resolve(root,'qa/revamp-r1/dependency-alignment-20260910',label);if(existsSync(out))throw Error('Preserve receipt');mkdirSync(out,{recursive:true});
const hash=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
const paths=['web/package.json','web/package-lock.json','web/vitest.config.ts','web/scripts/test-web.mjs','web/scripts/__tests__/installed-dependencies.test.mjs','web/scripts/check-installed-dependencies.mjs','web/scripts/build-next-release.mjs','qa/revamp-r1/cached-release-20260908/build-snapshot.mjs'].filter(p=>existsSync(resolve(root,p)));
const anchors=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/cross-feature-motion-20260910/full-1/checks.json'))).anchorsAfter;
const before=anchors.map(p=>({...p,actual:hash(p.path)}));if(before.some(p=>p.actual!==p.expected))throw Error('Protected hash mismatch');
const sources=paths.map(path=>({path,sha256:hash(path)}));
const executable=mode==='integrity'?resolve(root,'.venv/Scripts/python.exe'):process.execPath;
const buildName='dependency-guard-refusal-'+label;
const forbiddenBuildOutputs=mode==='qa-build'?['tmp/cached-release-'+buildName,'qa/revamp-r1/cached-release-20260908/'+buildName]:[];
if(forbiddenBuildOutputs.some(p=>existsSync(resolve(root,p))))throw Error('Fresh refusal probe required');
const args=mode==='contracts'?['--test',resolve(root,'web/scripts/__tests__/installed-dependencies.test.mjs')]
  :mode==='actual'?[resolve(root,'web/scripts/test-web.mjs')]
  :mode==='types'?[resolve(root,'web/node_modules/typescript/bin/tsc'),'--project',resolve(root,'web/tsconfig.json'),'--noEmit','--incremental','false']
  :mode==='qa-build'?[resolve(root,'qa/revamp-r1/cached-release-20260908/build-snapshot.mjs'),buildName]
  :mode==='release'?[resolve(root,'web/scripts/build-next-release.mjs'),'build']
  :['-B',resolve(root,'scripts/check_repo_integrity.py')];
const result=spawnSync(executable,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:8*1024*1024});
const after=anchors.map(p=>({...p,actual:hash(p.path)}));
const report={root,hostname:process.env.COMPUTERNAME,base:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),mode,executable,args,exitCode:result.status,error:result.error?.message,stdout:result.stdout,stderr:result.stderr,sources,anchorsBefore:before,anchorsAfter:after,unchanged:JSON.stringify(before)===JSON.stringify(after),forbiddenBuildOutputs:forbiddenBuildOutputs.map(path=>({path,exists:existsSync(resolve(root,path))}))};
writeFileSync(resolve(out,'command.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));process.exitCode=result.status??1;
