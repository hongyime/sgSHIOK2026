const postalCode=value=>typeof value==='string'&&/^\d{6}$/.test(value);
const shardName=value=>typeof value==='string'&&/^[A-Za-z0-9_-]+$/.test(value);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

// Insertion order is the browser's fallback order. Sorting it changes winners.
export function scoreDeclarations(index){
  if(!object(index))throw Error('Malformed score index');
  const declarations=new Map();
  for(const [shard,postals]of Object.entries(index)){
    if(!shardName(shard)||!Array.isArray(postals)||postals.some(p=>!postalCode(p)))throw Error('Malformed score declaration '+shard);
    for(const postal of new Set(postals)){
      const list=declarations.get(postal)??[];list.push(shard);declarations.set(postal,list);
    }
  }
  return declarations;
}

export function firstPostalRows(records){
  if(!Array.isArray(records))throw Error('Score shard is not an array');
  const first=new Map(),duplicates=[],invalid=[];
  records.forEach((record,ordinal)=>{
    if(!object(record)||!postalCode(record.postal)){invalid.push(ordinal);return;}
    if(first.has(record.postal))duplicates.push({postal:record.postal,first:first.get(record.postal),later:ordinal});
    else first.set(record.postal,ordinal);
  });
  return {first,duplicates,invalid};
}

export function resolveScoreLocator(postal,{prefix,declarations,files}){
  if(!postalCode(postal))throw Error('Invalid postal');
  const primary=prefix?.[postal.slice(0,3)]??[];
  if(!Array.isArray(primary)||primary.some(s=>!shardName(s)))throw Error('Malformed score prefix');
  const tried=new Set();
  const inspect=shard=>{
    const file=files.get(shard);
    if(!file)throw Error('Uninspected score shard '+shard);
    if(file.status==='missing')return {status:'file_missing',shard};
    if(file.status!=='present'||!(file.first instanceof Map))throw Error('Malformed score locator '+shard);
    if(file.invalid?.length)throw Error('Malformed score shard '+shard+': invalid rows '+file.invalid.join(','));
    const row=file.first.get(postal);
    return row===undefined?{status:'record_missing',shard}:{status:'present',shard,row};
  };
  for(const shard of primary){
    tried.add(shard);const result=inspect(shard);
    if(result.status!=='record_missing')return result;
  }
  for(const shard of declarations.get(postal)??[])if(!tried.has(shard))return inspect(shard);
  return {status:'not_indexed'};
}

// A postal-only search has no coordinate rescue. Keep each failed lookup visible.
export function resolveGeometryLocator(postal,{prefix,full},readRows){
  if(!postalCode(postal))throw Error('Invalid postal');
  const attempts=[];
  for(const [index,shard]of [['prefix',prefix?.[postal]],['full',full?.[postal]]]){
    if(shard===undefined||shard===null)continue;
    if(!shardName(shard))throw Error('Malformed geometry index for '+postal);
    const file=readRows(shard);
    if(file.status==='missing'){attempts.push({index,shard,status:'file_missing'});continue;}
    if(file.status!=='present'||!Array.isArray(file.value))throw Error('Malformed geometry shard '+shard);
    if(file.value.some(row=>!object(row)||!postalCode(row.postal)))throw Error('Malformed geometry shard '+shard+': invalid postal row');
    const ordinal=file.value.findIndex(row=>object(row)&&row.postal===postal);
    if(ordinal<0){attempts.push({index,shard,status:'record_missing'});continue;}
    attempts.push({index,shard,status:'present',row:ordinal});
    return {geometryLookup:'record_present',geometry:file.value[ordinal],attempts};
  }
  return {geometryLookup:attempts.length===0?'not_indexed':attempts.some(a=>a.status==='record_missing')?'indexed_record_missing':'indexed_file_missing',geometry:null,attempts};
}
