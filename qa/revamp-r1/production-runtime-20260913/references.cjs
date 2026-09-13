const {createRequire}=require('node:module'),path=require('node:path');
const root='C:\\sgSHIOK2026',req=createRequire(path.join(root,'web/package.json'));
const acorn=req('./node_modules/next/dist/compiled/acorn/acorn.js'),postcss=req('postcss');
const tokenize=req('postcss/lib/tokenize');
const origin='https://sgshiok.vercel.app';
function allowed(reference,source){
  if(typeof reference!=='string'||reference.length>512||/[\\\s\u0000-\u001f]/.test(reference))return null;
  if(reference.startsWith('static/'))reference='/_next/'+reference;
  let url;try{url=new URL(reference,origin+source)}catch{return null}
  if(url.origin!==origin||url.search||url.hash)return null;
  if(!/^\/(?:_next\/static\/[A-Za-z0-9_./-]+\.(?:mjs|js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|avif|ico)|maplibre\/\d+\.\d+\.\d+\/[A-Za-z0-9_./-]+\.(?:mjs|js))$/.test(url.pathname))return null;
  return url.pathname;
}
function references(source,text){
  const urls=new Set(),unresolved=[],embedded={dataUrls:0},record=value=>{if(value?.startsWith('data:')){embedded.dataUrls++;return;}const url=allowed(value,source);if(url)urls.add(url);};
  if(/\.(?:mjs|js)$/.test(source)){
    const queue=[acorn.parse(text,{ecmaVersion:'latest',sourceType:'module'})];
    while(queue.length){const n=queue.pop();
      if(n.type==='Literal'&&typeof n.value==='string'&&/\.(?:mjs|js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|avif|ico)$/.test(n.value))record(n.value);
      if(n.type==='TemplateLiteral'&&!n.expressions.length)record(n.quasis[0].value.cooked);
      if(n.type==='ImportExpression'&&n.source.type!=='Literal')unresolved.push({kind:'computed_import',offset:n.start,expression:text.slice(n.start,Math.min(n.end,n.start+180))});
      for(const v of Object.values(n)){if(Array.isArray(v))queue.push(...v.filter(x=>x&&typeof x==='object'));else if(v&&typeof v==='object')queue.push(v);}
    }
  }else if(source.endsWith('.css')){
    postcss.parse(text);const tokens=[],parser=tokenize(new postcss.Input(text));while(!parser.endOfFile()){const t=parser.nextToken();if(!['space','comment'].includes(t[0]))tokens.push(t);}
    for(let i=0;i<tokens.length;i++){
      const t=tokens[i];if(t[0]==='word'&&t[1].toLowerCase()==='url'){
        const next=tokens[i+1];let value;
        if(next?.[0]==='brackets')value=next[1].slice(1,-1).trim();
        else if(next?.[0]==='('&&tokens[i+2]?.[0]==='string'&&tokens[i+3]?.[0]===')')value=tokens[i+2][1].slice(1,-1);
        if(value===undefined)unresolved.push({kind:'css_url_syntax',offset:t[2]});else if(value.startsWith('data:'))embedded.dataUrls++;else if(allowed(value,source))record(value);else unresolved.push({kind:'css_url_not_captured',offset:t[2],value});
      }else if(t[0]==='at-word'&&t[1].toLowerCase()==='@import'&&tokens[i+1]?.[0]==='string')record(tokens[i+1][1].slice(1,-1));
    }
  }
  return {urls:[...urls].sort(),unresolved,embedded};
}
module.exports={allowed,references};
