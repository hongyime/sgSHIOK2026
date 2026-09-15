import test from 'node:test';
import assert from 'node:assert/strict';
import { displayImages, displayImageUrl } from './display-images.mjs';
const url = 'https://www.onemap.gov.sg/maps/tiles/Grey_HD/19/413393/260272.png';
const png = Buffer.from('89504e470d0a1a0a0102', 'hex');
const response = (bytes = png, status = 200, type = 'image/undefined') => new Response(bytes, { status, headers: { 'content-type': type, 'access-control-allow-origin':'*' } });
test('exact tile/logo allowlist excludes APIs, credentials, query, fragments and other hosts', () => {
  assert.ok(displayImageUrl(url));
  assert.ok(displayImageUrl('https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png'));
  for (const value of [url+'?token=x', url+'#x', url.replace('www.', 'user@www.'), url.replace('www.', 'evil.'),
    'https://www.onemap.gov.sg/api/public/routings/route', 'http://www.onemap.gov.sg/maps/tiles/Grey_HD/1/1/1.png']) assert.equal(displayImageUrl(value), false);
});
test('same URL is fetched once and recorded with exact bytes; credentials omitted and redirects rejected', async () => {
  let calls = 0, saved;
  const reader = displayImages({end: Date.now()+10000, save: (name, bytes) => { saved = {name, bytes}; },
    fetchImage: async (_, options) => { calls++; assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error'); return response(); }});
  const [a,b] = await Promise.all([reader.get(url),reader.get(url)]);
  assert.deepEqual(a, png); assert.equal(a,b); assert.equal(calls,1);
  assert.deepEqual(saved.bytes,png); assert.equal(reader.receipts.length,1); assert.equal(reader.stats().totalBytes,png.length);
});
test('request cap rejects before fetch and failed URL is not retried', async () => {
  let calls=0;
  const reader=displayImages({end:Date.now()+10000,maxImages:1,save:()=>{},fetchImage:async()=>{calls++;return response(png,503);}});
  await assert.rejects(reader.get(url)); await assert.rejects(reader.get(url));
  assert.throws(()=>reader.get(url.replace('413393','413394')),/request budget/); assert.equal(calls,1);
});
test('byte cap rejects before saving', async()=>{
  const reader=displayImages({end:Date.now()+10000,maxBytes:1,save:()=>assert.fail('saved'),fetchImage:async()=>response()});
  await assert.rejects(reader.get(url),/byte budget/);
});
test('invalid content type and PNG signature fail closed', async()=>{
  for(const value of [response(png,200,'text/html'),response(Buffer.from('not a png'))]) {
    const reader=displayImages({end:Date.now()+10000,save:()=>assert.fail('saved'),fetchImage:async()=>value});
    await assert.rejects(reader.get(url)); assert.equal(reader.receipts.length,0);
  }
});
test('expired deadline performs no request',async()=>{
  const reader=displayImages({end:Date.now()-1,save:()=>{},fetchImage:()=>assert.fail('fetched')});
  await assert.rejects(reader.get(url),/deadline/);
});
test('missing public CORS header is not silently repaired',async()=>{
  const reader=displayImages({end:Date.now()+10000,save:()=>assert.fail('saved'),fetchImage:async()=>new Response(png,{headers:{'content-type':'image/png'}})});
  await assert.rejects(reader.get(url),/CORS response/);
});
test('concurrency limited to six, queued work still completes',async()=>{
  let active=0,peak=0;
  const reader=displayImages({end:Date.now()+10000,save:()=>{},fetchImage:async()=>{
    active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,10));active--;return response();
  }});
  await Promise.all(Array.from({length:14},(_,i)=>reader.get(url.replace('413393',String(413393+i)))));
  assert.equal(peak,6); assert.equal(reader.stats().captured,14);
});
test('exhausted byte budget aborts active requests and prevents queued fetches',async()=>{
  const signals=[];
  const reader=displayImages({end:Date.now()+10000,maxBytes:1,save:()=>assert.fail('saved'),fetchImage:async(_,options)=>{
    signals.push(options.signal);await new Promise(resolve=>setTimeout(resolve,5));return response();
  }});
  await Promise.allSettled(Array.from({length:14},(_,i)=>reader.get(url.replace('413393',String(413393+i)))));
  assert.equal(signals.length,6);assert.ok(signals.every(signal=>signal.aborted));assert.equal(reader.stats().captured,0);
  assert.throws(()=>reader.get(url.replace('413393','99999')),/budget exhausted/);
});
