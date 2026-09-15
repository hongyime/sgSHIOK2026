import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const keep=new Set(['SystemRoot','WINDIR','SystemDrive','USERPROFILE','APPDATA','LOCALAPPDATA','ProgramData','ProgramFiles','ProgramFiles(x86)','ProgramW6432','PATH','ComSpec','PSModulePath','TEMP','TMP']);
for(const key of Object.keys(process.env))if(!keep.has(key))delete process.env[key];
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const base=resolve(root,'qa/revamp-r1/moderator-console-20260915'),out=mkdtempSync(resolve(base,'preview-'));
const r=createRequire(resolve(root,'web/package.json'));
const {createServer}=await import(pathToFileURL(r.resolve('vite')));
const server=await createServer({configFile:false,root:base,cacheDir:resolve(out,'cache'),logLevel:'error',
  plugins:[{name:'synthetic-icon',configureServer(s){s.middlewares.use((req,res,next)=>{if(req.url!=='/icon.svg')return next();res.setHeader('Content-Type','image/svg+xml');res.end(readFileSync(resolve(root,'web/app/icon.svg')));});}}],
  resolve:{alias:['react','react/jsx-runtime','react/jsx-dev-runtime','react-dom','react-dom/client'].map(name=>({find:new RegExp(`^${name}$`),replacement:r.resolve(name)}))},
  server:{host:'127.0.0.1',port:0,hmr:false,watch:null,fs:{strict:true,allow:[base,resolve(root,'web/components'),resolve(root,'web/lib'),resolve(root,'web/node_modules')],deny:['**/.env*','**/public/data/**','**/raw/**','**/processed/**']}}});
await server.listen();
const receipt={pid:process.pid,url:`http://127.0.0.1:${server.httpServer.address().port}/console.html`,scope:'Synthetic owner-console preview only; no actual account or reporting service. Use moderator@example.test / synthetic password, never real credentials.',startedAt:new Date().toISOString()};
writeFileSync(resolve(base,'preview.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,async()=>{await server.close();process.exit(0);});
