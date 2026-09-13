import assert from 'node:assert/strict';
import { test } from 'node:test';
import { transientNavigationContext,preservesSelectionUrl,reloadedDocument } from './navigation-proof.mjs';
const url='http://127.0.0.1:1234/?debugMap=1&postal=018956#keep';
test('only navigation context destruction is retryable',()=>{
  assert.equal(transientNavigationContext(Error('Execution context was destroyed.')),true);
  assert.equal(transientNavigationContext(Error('Cannot find context with specified id')),true);
  for(const message of ['Runtime.enable timeout','CDP closed','Browser work deadline'])assert.equal(transientNavigationContext(Error(message)),false);
});
test('preserve original query/hash and permit only absent canonical bus default',()=>{
  assert.equal(preservesSelectionUrl(url,url),true);
  assert.equal(preservesSelectionUrl(url,url.replace('#keep','&transit=bus#keep')),true);
  for(const after of [url.replace('018956','123456'),url.replace('debugMap=1&',''),url.replace('#keep',''),url.replace('#keep','&other=x#keep'),url.replace('#keep','&transit=mrt#keep'),url.replace('1234','5678')])assert.equal(preservesSelectionUrl(url,after),false,after);
  assert.equal(preservesSelectionUrl(url.replace('#keep','&transit=mrt#keep'),url.replace('#keep','&transit=bus#keep')),false);
});
const base={sessionId:'page',phase:'reload'};
function fixture(){return[
  {...base,method:'Page.frameNavigated',params:{frame:{id:'top',loaderId:'new',url:url.split('#')[0]}}},
  {...base,method:'Network.requestWillBeSent',params:{type:'Document',requestId:'document',loaderId:'new',frameId:'top',request:{url:url.split('#')[0]}}},
  {...base,method:'Network.responseReceived',params:{type:'Document',requestId:'document',loaderId:'new',response:{url:url.split('#')[0],fromServiceWorker:true}}},
];}
test('bind a worker-served document to top frame, loader and exact requested URL',()=>assert.equal(reloadedDocument(fixture(),{sessionId:'page',frameId:'top',url})?.params.requestId,'document'));
test('reject a different frame, loader, session, URL or missing request',()=>{
  for(const change of [f=>f[0].params.frame.parentId='parent',f=>f[2].params.loaderId='old',f=>f[2].sessionId='worker',f=>f[2].params.response.url='http://other/',f=>f.splice(1,1)]){const f=fixture();change(f);assert.equal(reloadedDocument(f,{sessionId:'page',frameId:'top',url}),null);}
});
test('reject ambiguous matching document responses',()=>{
  const f=fixture();f.push(structuredClone(f[2]));assert.equal(reloadedDocument(f,{sessionId:'page',frameId:'top',url}),null);
});
