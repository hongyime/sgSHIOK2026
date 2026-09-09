import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreDeclarations,firstPostalRows,resolveScoreLocator,resolveGeometryLocator } from './locators.mjs';
if(process.cwd()!=='C:\\sgSHIOK2026')throw Error('Wrong working root');
const postal='018956';
const present=(rows=[])=>({status:'present',...firstPostalRows(rows)});
const resolve=(options={})=>resolveScoreLocator(postal,{prefix:null,declarations:new Map(),files:new Map(),...options});
test('fallback declarations retain original insertion order, not alphabetical order',()=>{
  assert.deepEqual([...scoreDeclarations({Z:[postal],A:[postal,postal]}).get(postal)],['Z','A']);
});
test('first record in first matching prefix shard wins',()=>{
  const files=new Map([['Z',present([{postal},{postal}])],['A',present([{postal}])]]);
  assert.deepEqual(resolve({prefix:{'018':['Z','A']},files}),{status:'present',shard:'Z',row:0});
});
test('nonmatching prefix shard permits the next prefix shard',()=>{
  assert.deepEqual(resolve({prefix:{'018':['Z','A']},files:new Map([['Z',present([{postal:'079908'}])],['A',present([{postal}])]])}),{status:'present',shard:'A',row:0});
});
test('a missing score file stops lookup, rather than rescuing from a later shard',()=>{
  assert.deepEqual(resolve({prefix:{'018':['Z','A']},files:new Map([['Z',{status:'missing'}],['A',present([{postal}])]])}),{status:'file_missing',shard:'Z'});
});
test('fallback skips previously inspected prefix shards',()=>{
  const files=new Map([['Z',present([])],['A',present([{postal}])]]);
  assert.deepEqual(resolve({prefix:{'018':['Z']},declarations:scoreDeclarations({Z:[postal],A:[postal]}),files}),{status:'present',shard:'A',row:0});
});
test('stale first fallback declaration does not permit a second declared shard',()=>{
  assert.deepEqual(resolve({declarations:scoreDeclarations({Z:[postal],A:[postal]}),files:new Map([['Z',present([])],['A',present([{postal}])]])}),{status:'record_missing',shard:'Z'});
});
test('absent indexing stays not indexed, not proof of a missing address',()=>assert.deepEqual(resolve(),{status:'not_indexed'}));
test('uninspected score files are not called missing',()=>assert.throws(()=>resolve({prefix:{'018':['Z']}}),/Uninspected/));
test('invalid prefix paths are rejected',()=>assert.throws(()=>resolve({prefix:{'018':['../Z']}}),/Malformed/));
test('invalid address declarations are rejected',()=>assert.throws(()=>scoreDeclarations({A:['bad']}),/Malformed/));
test('first-row locator distinguishes duplicates and malformed rows',()=>{
  const result=firstPostalRows([{postal},{postal:'079908'},{postal},null,{postal:123456}]);
  assert.deepEqual([...result.first],[[postal,0],['079908',1]]);
  assert.deepEqual(result.duplicates,[{postal,first:0,later:2}]);assert.deepEqual(result.invalid,[3,4]);
});
for(const rows of [[null,{postal}],[{postal},null]])test('malformed score shard is quarantined regardless of valid-row position '+JSON.stringify(rows),()=>{
  assert.throws(()=>resolve({prefix:{'018':['Z']},files:new Map([['Z',present(rows)]])}),/Malformed score shard/);
});
test('geometry prefix record takes priority over the full index',()=>{
  const seen=[],geometry={postal,which:'prefix'};
  const result=resolveGeometryLocator(postal,{prefix:{[postal]:'z'},full:{[postal]:'a'}},shard=>{seen.push(shard);return {status:'present',value:[geometry]};});
  assert.equal(result.geometry,geometry);assert.deepEqual(seen,['z']);assert.equal(result.geometryLookup,'record_present');
});
for(const firstStatus of ['missing','empty'])test('geometry '+firstStatus+' prefix falls through to full postal index',()=>{
  const seen=[],geometry={postal};
  const result=resolveGeometryLocator(postal,{prefix:{[postal]:'z'},full:{[postal]:'a'}},shard=>{
    seen.push(shard);return shard==='z'?(firstStatus==='missing'?{status:'missing'}:{status:'present',value:[]}):{status:'present',value:[geometry]};
  });
  assert.equal(result.geometry,geometry);assert.deepEqual(seen,['z','a']);assert.equal(result.attempts.length,2);
});
test('absent geometry index does not trigger coordinate rescue',()=>{
  const result=resolveGeometryLocator(postal,{prefix:null,full:null},()=>{throw Error('Unexpected read');});
  assert.equal(result.geometryLookup,'not_indexed');assert.deepEqual(result.attempts,[]);
});
test('indexed missing files differ from indexed absent records',()=>{
  assert.equal(resolveGeometryLocator(postal,{full:{[postal]:'a'}},()=>({status:'missing'})).geometryLookup,'indexed_file_missing');
  assert.equal(resolveGeometryLocator(postal,{full:{[postal]:'a'}},()=>({status:'present',value:[{postal:'079908'}]})).geometryLookup,'indexed_record_missing');
});
test('mixed failed geometry attempts retain both concrete observations',()=>{
  const result=resolveGeometryLocator(postal,{prefix:{[postal]:'z'},full:{[postal]:'a'}},shard=>shard==='z'?{status:'missing'}:{status:'present',value:[]});
  assert.equal(result.geometryLookup,'indexed_record_missing');assert.deepEqual(result.attempts.map(a=>a.status),['file_missing','record_missing']);
});
test('geometry uses the first matching record only',()=>{
  const first={postal,version:1};assert.equal(resolveGeometryLocator(postal,{full:{[postal]:'a'}},()=>({status:'present',value:[first,{postal,version:2}]})).geometry,first);
});
test('malformed geometry indexes and payloads are rejected',()=>{
  assert.throws(()=>resolveGeometryLocator(postal,{full:{[postal]:'../a'}},()=>({status:'missing'})),/Malformed/);
  assert.throws(()=>resolveGeometryLocator(postal,{full:{[postal]:'a'}},()=>({status:'present',value:{}})),/Malformed/);
});
for(const rows of [[null,{postal}],[{postal},null]])test('malformed geometry shard is quarantined regardless of valid-row position '+JSON.stringify(rows),()=>{
  assert.throws(()=>resolveGeometryLocator(postal,{full:{[postal]:'a'}},()=>({status:'present',value:rows})),/Malformed geometry shard/);
});
