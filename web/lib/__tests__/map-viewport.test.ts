import { describe, it, expect, vi, afterEach } from 'vitest';
import { overlayPadding, usableMapBox, watchSelectedRoute } from '../map-viewport';

describe('top-left search and result stack', () => {
  it('fits the route below a mobile stack, not above an imaginary bottom sheet', () => {
    const padding = overlayPadding(390, 667, [{left:10,top:10,right:310,bottom:300,edge:'top-left'}]);
    expect(padding).toEqual({top:312,right:12,bottom:12,left:12});
    expect(usableMapBox(390,667,padding)).toEqual([[12,312],[378,655]]);
  });
  it('fits to the right of the desktop stack and accounts for its expanded height on mobile', () => {
    expect(overlayPadding(1440,950,[{left:12,top:12,right:312,bottom:560,edge:'top-left'}]).left).toBe(324);
    expect(overlayPadding(390,667,[{left:10,top:10,right:310,bottom:440,edge:'top-left'}]).top).toBe(452);
  });
});

afterEach(() => vi.useRealTimers());
describe('measured viewport and selection lifecycle', () => {
  it('M03/M15: uses mobile sheet bounds and preserves an unobscured rectangle at 320px', () => {
    const p = overlayPadding(320, 667, [
      { left: 12, top: 54, right: 308, bottom: 96, edge: 'top' },
      { left: 8, top: 457, right: 312, bottom: 630, edge: 'panel' },
    ]);
    expect(p).toEqual({ top: 108, left: 12, right: 12, bottom: 222 });
    expect(usableMapBox(320,667,p)).toEqual([[12,108],[308,445]]);
    expect(overlayPadding(320,667,[{left:8,top:260,right:312,bottom:630,edge:'panel'}]).bottom).toBe(419);
  });
  it('M15: desktop reserves the measured left panel', () => {
    expect(overlayPadding(1440,950,[{left:16,top:92,right:286,bottom:600,edge:'panel'}]).left).toBe(298);
  });
  it('M05/M11: rejects old rendered features and cleans up after current success', () => {
    vi.useFakeTimers();
    const handlers = new Set<() => void>();
    let key = 'A';
    const map = {
      on: (_: string, fn: () => void) => handlers.add(fn),
      off: (_: string, fn: () => void) => handlers.delete(fn),
      isMoving: () => false,
      queryRenderedFeatures: vi.fn(() => [{ properties: { render_key: key } }]),
    };
    const readyA = vi.fn(), readyB = vi.fn(), timeout = vi.fn();
    const options = { layers:['shiokest-route-line'],box:[[12,12],[300,400]] as [[number,number],[number,number]],timeout };
    const cancelA = watchSelectedRoute(map,{...options,key:'A',ready:readyA});
    const oldCallback = [...handlers][0];
    cancelA();
    watchSelectedRoute(map,{...options,key:'B',ready:readyB});
    oldCallback();
    for (let i=0;i<10;i++) [...handlers].forEach(fn => fn());
    expect(handlers.size).toBe(1);
    expect(readyA).not.toHaveBeenCalled(); expect(readyB).not.toHaveBeenCalled();
    key='B'; [...handlers].forEach(fn => fn());
    expect(readyB).toHaveBeenCalledTimes(1); expect(handlers.size).toBe(0);
    vi.runAllTimers(); expect(timeout).not.toHaveBeenCalled();
  });
  it('M06/M10: times out once; cancelled gesture probe never reports failure', () => {
    vi.useFakeTimers();
    const handlers=new Set<() => void>();
    const map={on:(_:string,fn:()=>void)=>handlers.add(fn),off:(_:string,fn:()=>void)=>handlers.delete(fn),isMoving:()=>false,queryRenderedFeatures:()=>[]};
    const timeout=vi.fn(); const options={key:'B',layers:[],box:[[0,0],[20,20]] as [[number,number],[number,number]],ready:vi.fn(),timeout};
    watchSelectedRoute(map,options); vi.runAllTimers(); expect(timeout).toHaveBeenCalledTimes(1); expect(handlers.size).toBe(0);
    const cancel=watchSelectedRoute(map,options); cancel(); vi.runAllTimers(); expect(timeout).toHaveBeenCalledTimes(1);
  });
});
