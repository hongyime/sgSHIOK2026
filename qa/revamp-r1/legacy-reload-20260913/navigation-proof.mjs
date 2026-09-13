export function transientNavigationContext(error) {
  return /Execution context was destroyed|Cannot find context with specified id/.test(error?.message??'');
}
export function preservesSelectionUrl(before,after) {
  const a=new URL(before),b=new URL(after);
  if(a.origin!==b.origin||a.pathname!==b.pathname||a.hash!==b.hash)return false;
  for(const key of new Set(a.searchParams.keys()))if(JSON.stringify(a.searchParams.getAll(key))!==JSON.stringify(b.searchParams.getAll(key)))return false;
  for(const key of new Set(b.searchParams.keys()))if(!a.searchParams.has(key)&&(key!=='transit'||JSON.stringify(b.searchParams.getAll(key))!=='["bus"]'))return false;
  return true;
}
export function reloadedDocument(events,{sessionId,frameId,url}) {
  const expected=new URL(url);expected.hash='';
  const frames=events.filter(e=>e.sessionId===sessionId&&e.phase==='reload'&&e.method==='Page.frameNavigated'&&!e.params.frame.parentId&&e.params.frame.id===frameId&&e.params.frame.url===expected.href);
  if(frames.length!==1)return null;
  const loaderId=frames[0].params.frame.loaderId;
  const responses=events.filter(e=>e.sessionId===sessionId&&e.phase==='reload'&&e.method==='Network.responseReceived'&&e.params.type==='Document'&&e.params.loaderId===loaderId&&e.params.response.url===expected.href);
  if(responses.length!==1)return null;
  const request=events.find(e=>e.sessionId===sessionId&&e.phase==='reload'&&e.method==='Network.requestWillBeSent'&&e.params.type==='Document'&&e.params.requestId===responses[0].params.requestId&&e.params.loaderId===loaderId&&e.params.frameId===frameId&&e.params.request.url===expected.href);
  return request?responses[0]:null;
}
