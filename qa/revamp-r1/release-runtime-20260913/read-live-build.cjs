const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const out=path.join(root,'qa/revamp-r1/release-runtime-20260913');
const html=JSON.parse(fs.readFileSync(path.join(out,'live-html.json'))).response.text;
const parser=`import json, sys
from html.parser import HTMLParser
class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.chunks = []
        self.scripts = []
    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.active = True
            self.chunks = []
    def handle_data(self, data):
        if self.active:
            self.chunks.append(data)
    def handle_endtag(self, tag):
        if tag == 'script' and self.active:
            self.scripts.append(''.join(self.chunks))
            self.active = False
p = Scripts()
p.feed(sys.stdin.read())
print(json.dumps(p.scripts))
`;
const result=spawnSync('python',['-B','-X','utf8','-c',parser],{cwd:root,input:html,encoding:'utf8',windowsHide:true,timeout:10000});
assert.equal(result.status,0,result.stderr);
const acorn=require(path.join(root,'web/node_modules/next/dist/compiled/acorn/acorn.js'));
const flights=[];
function visit(n){
  if(!n||typeof n!=='object')return;
  if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.property.name==='push'
    &&n.callee.object.type==='MemberExpression'&&n.callee.object.object.name==='self'
    &&n.callee.object.property.name==='__next_f'){
    const a=n.arguments[0];
    if(a?.type==='ArrayExpression'&&a.elements[0]?.value===1&&typeof a.elements[1]?.value==='string')flights.push(a.elements[1].value);
  }
  for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
}
const scripts=JSON.parse(result.stdout);
for(const script of scripts)if(script.trim())visit(acorn.parse(script,{ecmaVersion:'latest',sourceType:'script'}));
const roots=flights.flatMap(f=>f.split('\n')).filter(line=>line.startsWith('0:')).map(line=>JSON.parse(line.slice(2)));
assert.equal(roots.length,1);
assert.match(roots[0].b,/^[A-Za-z0-9_-]{1,128}$/);
const proof={htmlSha256:createHash('sha256').update(html).digest('hex'),parser:'stdlib HTMLParser, Acorn literal AST and JSON Flight root; no script execution',
  scripts:scripts.length,flightPayloads:flights.length,rootPayloads:roots.length,field:'b',buildId:roots[0].b,
  limitation:'This pins the observed HTML build field, not all deployed files or its source commit.'};
fs.writeFileSync(path.join(out,'build-id-proof.json'),JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(proof));
