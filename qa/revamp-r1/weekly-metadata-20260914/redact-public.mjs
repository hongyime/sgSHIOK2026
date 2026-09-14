import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026', dir=resolve(root,'qa/revamp-r1/weekly-metadata-20260914');
assert.equal(process.cwd(),root);
const names=['remote-1789352278511.json','remote-1789352386269.json','remote-1789352852768.json','summary.json'];
for(const name of names){
 const bytes=readFileSync(resolve(dir,name)), data=JSON.parse(bytes);
 const entries=data.results??data.commands;
 let omissions=0;
 for(const entry of entries){
  if(!entry.command.some(arg=>arg.includes('/issues/34/comments?')))continue;
  const values=JSON.parse(entry.stdout);
  assert.ok(Array.isArray(values));
  const source=values.filter(c=>c.body.startsWith('<!-- sgshiok-source-notice:'));
  const omitted=values.length-source.length;
  entry.stdout=JSON.stringify(source)+'\n';
  entry.stdoutRedaction={omittedNonSourceComments:omitted,reason:'Unrelated welcome-bot comment contains a personal handle; not maintenance evidence.'};
  omissions+=omitted;
 }
 assert.equal(omissions,1);
 data.publication={redacted:true,originalLocalFile:name,originalSha256:createHash('sha256').update(bytes).digest('hex'),omittedNonSourceComments:omissions,originalPreservedLocally:true};
 const output=resolve(dir,name.replace('.json','.public.json'));
 writeFileSync(output,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({output,omittedNonSourceComments:omissions,originalPreserved:true}));
}
