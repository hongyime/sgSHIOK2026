import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const dir=resolve(root,'qa/revamp-r1/frontend-retention-20260910'),out=resolve(dir,'audit.json');
if(existsSync(out))throw Error('Preserve audit');
const sha=b=>createHash('sha256').update(b).digest('hex');
const sources=['.agents/STATE.md','PRODUCT-PLAN.md','README.md','decisions.md','pipeline/publish.py','scripts/frontend_archive.py','scripts/release_staging.py','tests/test_frontend_retention.py','tests/test_publish.py','tests/test_release_staging.py','web/app/global-error.tsx','web/lib/__tests__/frontend-retention.test.ts','web/lib/__tests__/global-error.test.tsx','web/next.config.js','web/scripts/build-next-release.mjs','web/scripts/frontend-retention.mjs'];
const evidence='qa/verification/REVAMP-R1-core-walk.md',base='ad3e99a885e592baa805d45c3f954651d339e39c';
const git=args=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:8*1024*1024});
const diff=git(['diff','--no-color',base,'--',...sources]);
writeFileSync(resolve(dir,'implementation.diff'),diff,{flag:'wx'});
const prefix=git(['show',base+':'+evidence]),now=readFileSync(resolve(root,evidence));
const prefixUnchanged=now.subarray(0,prefix.length).equals(prefix);
if(!prefixUnchanged)throw Error('Prior evidence changed');
const build=JSON.parse(readFileSync(resolve(dir,'build-2/build.json')));
const stable=build.sources.every(s=>sha(readFileSync(resolve(root,s.path)))===s.sha256);
if(!stable)throw Error('Web changed after tests/build');
const protectedDiff=git(['diff',base,'--','pipeline/config/weights.yaml','raw','processed','web/public/data','checksums.json','qa/releases','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*']);
if(protectedDiff.length)throw Error('Protected tracked file changed');
const paths=[];
function files(directory){for(const d of readdirSync(directory,{withFileTypes:true})){const path=resolve(directory,d.name);if(d.isSymbolicLink())throw Error('Unexpected QA link');if(d.isDirectory())files(path);else paths.push(path);}}
files(dir);
const commands=[];
for(const args of [['diff','--check'],['check-ignore','-v',evidence],['status','--short','--untracked-files=no']]){
  const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:60000});
  commands.push({args,exitCode:r.status,stdout:r.stdout,stderr:r.stderr});
}
const report={root,hostname:process.env.COMPUTERNAME,base,prefix:{bytes:prefix.length,sha256:sha(prefix),unchanged:prefixUnchanged},
  implementationDiff:{path:'qa/revamp-r1/frontend-retention-20260910/implementation.diff',sha256:sha(diff),lines:diff.toString().split('\n').length-1},
  webSources:build.sources.length,webSourcesMatchBuild:stable,protectedTrackedDiffEmpty:true,commands,
  scopedSourcePaths:[...sources,evidence],qaFiles:paths.map(p=>({path:p.slice(root.length+1).replaceAll('\\','/'),bytes:readFileSync(p).length,sha256:sha(readFileSync(p))}))};
report.ok=commands.every(c=>c.exitCode===(c.args[0]==='check-ignore'?1:0));
writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({ok:report.ok,prefix:report.prefix,implementationDiff:report.implementationDiff,qaFiles:paths.length,webSources:report.webSources},null,2));
process.exitCode=report.ok?0:1;
