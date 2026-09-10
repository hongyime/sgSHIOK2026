import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const label = process.argv[2];
if (!/^[a-z0-9-]+$/.test(label || '')) throw Error('Fresh label required');
const out = resolve(root, 'qa/revamp-r1/frontend-retention-20260910', label);
const snapshot = resolve(root, 'tmp/frontend-retention-' + label);
const archive = resolve(root, 'tmp/frontend-retention-archive-' + label);
if ([out, snapshot, archive].some(existsSync)) throw Error('Preserve previous artifacts');
mkdirSync(out, {recursive:true}); mkdirSync(snapshot);
const sha = b => createHash('sha256').update(b).digest('hex');
const report = {root, hostname:process.env.COMPUTERNAME, out, snapshot, archive,
  startedAt:new Date().toISOString(), protectedDataAbsent:true, dependencyInstall:false,
  deploymentIdentityVerified:false, sources:[], derivatives:[]};
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), {flag:'wx'});
let stdout = '', stderr = '';
function terminal(code, error) {
  report.exitCode = code; report.error = error; report.finishedAt = new Date().toISOString();
  report.sourceStable = report.sources.every(s => sha(readFileSync(resolve(root,s.path))) === s.sha256);
  const id = resolve(snapshot,'web/.next/BUILD_ID');
  if (existsSync(id)) report.buildId = readFileSync(id,'utf8').trim();
  writeFileSync(resolve(out,'build.stdout.log'),stdout,{flag:'wx'});
  writeFileSync(resolve(out,'build.stderr.log'),stderr,{flag:'wx'});
  writeFileSync(resolve(out,'build.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,snapshot,exitCode:code,buildId:report.buildId,sourceStable:report.sourceStable}));
  process.exitCode = code === 0 && report.sourceStable ? 0 : 1;
}
try {
  const args = ['-B','-m','scripts.frontend_archive','--build-web-root',resolve(root,'web'),
    '--output',archive,'--expected-build-id','e8Hlhkml4c3i_uMGJdd3P','--maplibre-version','6.1.0'];
  report.captureCommand = args;
  const raw = execFileSync(resolve(root,'.venv/Scripts/python.exe'),args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:120000});
  writeFileSync(resolve(out,'capture.stdout.json'),raw,{flag:'wx'});
  report.capture = JSON.parse(raw);
  if (!report.capture.ok) throw Error('Archive capture failed');
  const manifestBytes = readFileSync(resolve(archive,'frontend-assets.json'));
  if (sha(manifestBytes) !== report.capture.manifestSha256) throw Error('Archive manifest changed');
  const manifest = JSON.parse(manifestBytes);
  const files = execFileSync('git',['ls-files','-z','--','web'],{cwd:root,encoding:'utf8'})
    .split('\0').filter(p=>p && !p.startsWith('web/public/data/'));
  for (const path of files) {
    const source = resolve(root,path), target = resolve(snapshot,path);
    mkdirSync(dirname(target),{recursive:true}); copyFileSync(source,target);
    report.sources.push({path,sha256:sha(readFileSync(source))});
  }
  const web = resolve(snapshot,'web');
  if (existsSync(resolve(web,'public/data'))) throw Error('Protected data copied');
  for (const entry of manifest.files) {
    const source = resolve(archive,'assets',entry.path), target = resolve(web,'public/_retained',entry.path);
    const bytes = readFileSync(source);
    if (bytes.length !== entry.bytes || sha(bytes) !== entry.sha256) throw Error('Archive asset changed');
    mkdirSync(dirname(target),{recursive:true}); writeFileSync(target,bytes,{flag:'wx'});
  }
  const retention = {schemaVersion:1,buildIds:[manifest.buildId],totalBytes:manifest.files.reduce((n,f)=>n+f.bytes,0),files:manifest.files};
  writeFileSync(resolve(web,'frontend-retention.json'),JSON.stringify(retention,null,2)+'\n',{flag:'wx'});
  symlinkSync(resolve(root,'web/node_modules'),resolve(web,'node_modules'),'junction');
  copyFileSync(resolve(web,'next.config.js'),resolve(web,'next.qa-base.cjs'));
  const config = `const config=require('./next.qa-base.cjs');\nmodule.exports={...config,turbopack:{...config.turbopack,root:${JSON.stringify(root)}}};\n`;
  writeFileSync(resolve(web,'next.config.js'),config);
  const fault = '"use client";\nimport {useEffect} from "react";\nexport default function Fault(){useEffect(()=>{throw new Error("QA fixture: global boundary")},[]);return <p>QA fixture pending</p>;}\n';
  mkdirSync(resolve(web,'app/qa-global-fault'),{recursive:true});
  writeFileSync(resolve(web,'app/qa-global-fault/page.tsx'),fault,{flag:'wx'});
  report.derivatives = [{path:'web/next.config.js',content:config,sha256:sha(config)},
    {path:'web/app/qa-global-fault/page.tsx',content:fault,sha256:sha(fault)}];
  report.retention = retention;
  const temp = resolve(snapshot,'compiler-tmp'); mkdirSync(temp);
  report.buildCommand = [resolve(web,'scripts/build-next-release.mjs'),'build'];
  const child = spawn(process.execPath,report.buildCommand,{cwd:web,windowsHide:true,
    env:{...process.env,TEMP:temp,TMP:temp,NEXT_TELEMETRY_DISABLED:'1',NODE_OPTIONS:'--max-old-space-size=2048'}});
  report.childPid=child.pid;
  child.stdout.on('data',b=>{stdout+=b;process.stdout.write(b);});
  child.stderr.on('data',b=>{stderr+=b;process.stderr.write(b);});
  let failure;
  child.on('error',e=>{failure=e.message;});
  child.on('close',code=>terminal(code,failure));
} catch(e) { terminal(1,e.stack); }
