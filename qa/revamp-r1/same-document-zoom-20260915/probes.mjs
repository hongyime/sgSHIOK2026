// Serialized into the inspected page. These probes observe state; none scales DOM or changes camera.
export function installProbe() {
  window.__qaSameDocumentZoom = { documentToken: crypto.randomUUID(), focusTarget: null, focusToken: null };
}

export function markFocus() {
  const state = window.__qaSameDocumentZoom;
  state.focusTarget = document.activeElement;
  state.focusToken = crypto.randomUUID();
  return { token:state.focusToken,tag:document.activeElement.tagName };
}

export function focusFacts() {
  const e=document.activeElement,r=e?.getBoundingClientRect(),s=e?getComputedStyle(e):null;
  let clip={left:0,top:0,right:innerWidth,bottom:innerHeight};
  for(let a=e?.parentElement;a;a=a.parentElement) {
    const style=getComputedStyle(a),b=a.getBoundingClientRect();
    if(style.overflowX!=='visible') { clip.left=Math.max(clip.left,b.left+a.clientLeft);clip.right=Math.min(clip.right,b.left+a.clientLeft+a.clientWidth); }
    if(style.overflowY!=='visible') { clip.top=Math.max(clip.top,b.top+a.clientTop);clip.bottom=Math.min(clip.bottom,b.top+a.clientTop+a.clientHeight); }
  }
  const fits=!!r&&r.width>0&&r.height>0&&r.left>=clip.left-.5&&r.right<=clip.right+.5&&r.top>=clip.top-.5&&r.bottom<=clip.bottom+.5;
  const x=r?(e.tagName==='CANVAS'?r.right-4:r.x+r.width/2):0,y=r?r.y+r.height/2:0;
  return {tag:e?.tagName,id:e?.id,text:e?.textContent?.trim(),label:e?.getAttribute('aria-label'),clip,
    box:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,visible:fits&&e.contains(document.elementFromPoint(x,y))&&s.visibility==='visible'&&s.opacity!=='0',
    focusVisible:e?.matches(':focus-visible'),outline:s?.outlineStyle,outlineWidth:s?.outlineWidth};
}

export function facts() {
  const map=window.__shiokRouteMap,debug=window.__shiokRouteDebug,probe=window.__qaSameDocumentZoom;
  const active=debug?.mode==='shortest'?'shortest':'shiokest';
  let features=[];try {features=map?.queryRenderedFeatures({layers:[active+'-route-line']})??[];} catch {}
  const summary=document.querySelector('[aria-label="Walk summary"]');
  const controls=document.querySelector('[aria-label="Transit stop or exit type"]');
  return {timeOrigin:performance.timeOrigin,documentToken:probe?.documentToken,url:location.href,
    focusToken:probe?.focusToken,focusSame:!!probe?.focusTarget&&document.activeElement===probe.focusTarget,
    routeKey:debug?.routeKey,mode:debug?.mode,geometry:JSON.stringify(map?.getStyle().sources[active+'-route']?.data?.features?.map(f=>f.geometry)),
    count:features.filter(f=>f.properties?.render_key===debug?.routeKey).length,
    keys:[...new Set(features.map(f=>f.properties?.render_key))],status:document.querySelector('main')?.dataset.mapStatus,
    basemap:!!map?.getSource('onemap')&&map.isSourceLoaded('onemap'),tiles:map?.areTilesLoaded(),moving:map?.isMoving(),
    postal:summary?.getAttribute('data-postal'),destination:summary?.querySelector('strong')?.textContent,
    pressed:[...(controls?.querySelectorAll('[aria-pressed="true"]')??[])].map(e=>e.textContent.trim()).join('|'),
    dpr:devicePixelRatio,scale:visualViewport.scale,inner:[innerWidth,innerHeight],outer:[outerWidth,outerHeight],
    cssZoom:getComputedStyle(document.documentElement).zoom,bodyZoom:getComputedStyle(document.body).zoom,
    overflow:document.documentElement.scrollWidth>innerWidth,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
}

export function metricFacts() {
  const summary=document.querySelector('[aria-label="Walk summary"]');
  function painted(e) {
    const range=document.createRange();range.selectNodeContents(e);
    const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
    let clip={left:0,top:0,right:innerWidth,bottom:innerHeight};
    for(let a=e.parentElement;a;a=a.parentElement) {
      const s=getComputedStyle(a),r=a.getBoundingClientRect();
      if(s.overflowX!=='visible'){clip.left=Math.max(clip.left,r.left+a.clientLeft);clip.right=Math.min(clip.right,r.left+a.clientLeft+a.clientWidth);}
      if(s.overflowY!=='visible'){clip.top=Math.max(clip.top,r.top+a.clientTop);clip.bottom=Math.min(clip.bottom,r.top+a.clientTop+a.clientHeight);}
    }
    return {rects:rects.map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),clip,
      visible:rects.length>0&&rects.every(r=>r.left>=clip.left-.5&&r.right<=clip.right+.5&&r.top>=clip.top-.5&&r.bottom<=clip.bottom+.5&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))};
  }
  return [...(summary?.querySelectorAll('[class*="walkMetrics"] > div')??[])].map(e=> {
    const span=e.querySelector('span'),strong=e.querySelector('strong'),labelPaint=painted(span),valuePaint=painted(strong);
    return {label:span.textContent,value:strong.textContent,labelPaint,valuePaint,visible:labelPaint.visible&&valuePaint.visible};
  });
}

export function wheelPoint() {
  const panel=document.querySelector('aside'),r=panel.getBoundingClientRect();
  return {x:r.right-20,y:Math.max(r.top+10,Math.min(r.bottom-10,innerHeight/2))};
}

export function camera() {
  const m=window.__shiokRouteMap,c=m.getCenter();
  return {lng:c.lng,lat:c.lat,zoom:m.getZoom(),moving:m.isMoving(),url:location.href,routeKey:window.__shiokRouteDebug.routeKey};
}
