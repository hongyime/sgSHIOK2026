import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const out=resolve(root,'qa/revamp-r1/cross-feature-motion-20260910/remote-advance.json');
if(existsSync(out))throw Error('Preserve receipt');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});
const read=path=>JSON.parse(readFileSync(resolve(root,path)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const commits=['05effeebb718c1649751b2c4c0aecdcb681b20b2','85d4c9eda0db10442aa2e29a22cb1bb098963ac3'].map(sha=>({sha,stdout:git(['show','--format=fuller','--name-status','--no-renames',sha])}));
const full=read('qa/revamp-r1/cross-feature-motion-20260910/full-1/checks.json');
const changedSinceValidation=full.sourcesAfter.filter(p=>p.sha256!==sha(readFileSync(resolve(root,p.path))));
if(changedSinceValidation.some(p=>!['web/package.json','web/package-lock.json'].includes(p.path)))throw Error('Unexpected source changed during merge');
const packages=['maplibre-gl','next','vitest','@vitest/mocker','sharp'];
const lock=read('web/package-lock.json'),installed=packages.map(name=>{
  const path='web/node_modules/'+name+'/package.json';
  return {name,locked:lock.packages['node_modules/'+name]?.version,installed:existsSync(resolve(root,path))?read(path).version:null};
});
const component=readFileSync(resolve(root,'web/components/route-evidence-map.tsx'),'utf8');
const workerReference=component.split(/\r?\n/).map((text,i)=>({line:i+1,text})).filter(l=>l.text.includes('setWorkerUrl('));
const integrity=spawnSync(resolve(root,'.venv/Scripts/python.exe'),['-B',resolve(root,'scripts/check_repo_integrity.py')],{cwd:root,encoding:'utf8',windowsHide:true,timeout:30000});
const report={root,headBeforeMergeCommit:git(['rev-parse','HEAD']).trim(),remoteHead:git(['rev-parse','origin/main']).trim(),mergeHead:git(['rev-parse','MERGE_HEAD']).trim(),commits,
  changedSinceValidation:changedSinceValidation.map(p=>p.path),installed,workerReference,
  workerTest:readFileSync(resolve(root,'web/lib/__tests__/map-worker.test.ts'),'utf8'),
  integrity:{exitCode:integrity.status,stdout:integrity.stdout,stderr:integrity.stderr},
  findings:['The final fetch detected two remote commits while the local tree had been validated at its pinned base; first push was rejected non-fast-forward. Both bot commits modify only web/package.json and web/package-lock.json.',
    'Normal no-rewrite merge preserves the remote commits and the local fix commit. No dependency installation, worker replacement or deployment is performed.',
    'MapLibre is now locked6.4.1 but installed package and static worker are6.1.0. Next is locked16.3.3 but installed16.3.0. The old full test/build receipts cannot certify this merged dependency state.',
    'map-worker.test.ts intentionally asserts installed6.1.0 and exact vendored bytes. A clean new dependency install will require coordinated worker, cache-policy, tests and build validation, not just a package bump.'],
  disagreements:['Do not treat bot auto-merge as owner approval to install/deploy or as proof that the matching worker was updated. T29 remains a release blocker; the current preview is the earlier tested build, not this new dependency state.']};
writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));
if(integrity.status!==0)process.exitCode=1;
