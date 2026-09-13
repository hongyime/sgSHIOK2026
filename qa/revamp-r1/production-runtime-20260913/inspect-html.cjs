const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const label=process.argv[2];assert.match(label,/^capture-\d+$/);
const out=path.join(root,'qa/revamp-r1/production-runtime-20260913',label),raw=fs.readFileSync(path.join(out,'index.html'));
const response=JSON.parse(fs.readFileSync(path.join(out,'response.json')));assert.equal(response.ok,true);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),response.sha256);
const parser=`import json,sys
from html.parser import HTMLParser
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.active=False; self.parts=[]; self.scripts=[]; self.references=[]
    def handle_starttag(self,tag,attrs):
        values=dict(attrs)
        if tag=='script': self.active=True; self.parts=[]
        key='src' if tag in ('script','img') else 'href' if tag=='link' else None
        if key and values.get(key): self.references.append({'tag':tag,'rel':values.get('rel'),'as':values.get('as'),'url':values[key]})
    def handle_data(self,data):
        if self.active: self.parts.append(data)
    def handle_endtag(self,tag):
        if tag=='script' and self.active: self.scripts.append(''.join(self.parts)); self.active=False
p=Page();p.feed(sys.stdin.read());print(json.dumps({'scripts':p.scripts,'references':p.references}))
`;
const parsed=cp.spawnSync('python',['-B','-X','utf8','-c',parser],{cwd:root,input:raw,encoding:'utf8',windowsHide:true,timeout:10000});
assert.equal(parsed.status,0,parsed.stderr);
const page=JSON.parse(parsed.stdout),acorn=require(path.join(root,'web/node_modules/next/dist/compiled/acorn/acorn.js')),flights=[];
function visit(node){if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&node.callee.type==='MemberExpression'&&node.callee.property.name==='push'&&node.callee.object.type==='MemberExpression'
    &&node.callee.object.object.name==='self'&&node.callee.object.property.name==='__next_f'){
    const array=node.arguments[0];if(array?.type==='ArrayExpression'&&array.elements[0]?.value===1&&typeof array.elements[1]?.value==='string')flights.push(array.elements[1].value);
  }
  for(const v of Object.values(node)){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
}
for(const script of page.scripts)if(script.trim())visit(acorn.parse(script,{ecmaVersion:'latest',sourceType:'script'}));
const lines=flights.join('').split('\n'),roots=lines.filter(s=>s.startsWith('0:')).map(s=>JSON.parse(s.slice(2)));
assert.equal(roots.length,1);assert.match(roots[0].b,/^[A-Za-z0-9_-]{1,128}$/);
const modules=lines.filter(s=>/^[0-9a-f]+:I/.test(s)).map(s=>JSON.parse(s.slice(s.indexOf(':')+2)));
const chunks=new Set();function strings(value){if(typeof value==='string'&&/^static\/.*\.(js|css|woff2?)$/.test(value))chunks.add('/_next/'+value);else if(Array.isArray(value))value.forEach(strings);else if(value&&typeof value==='object')Object.values(value).forEach(strings);}
modules.forEach(strings);strings(roots[0]);
const result={htmlSha256:response.sha256,buildId:roots[0].b,parser:'stdlib HTMLParser + Acorn literal AST + JSON Flight rows, no script execution',
  htmlReferences:page.references,flightModuleChunks:[...chunks].sort(),servedAgeSeconds:Number(response.headers.age),
  limitation:'Observed cached public HTML identity, not the newest deployment, source commit, complete client asset closure or recoverable server build.'};
fs.writeFileSync(path.join(out,'html-inspection.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));
