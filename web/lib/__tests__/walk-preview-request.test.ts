import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestWalkPreview } from '../walk-preview-request';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe('bounded explicit walk previews',()=>{
  it('passes successful route data through without changing it',async()=>{
    const data={ok:true,route_geometry:'saved-transport-fixture'};
    const fetcher=vi.fn().mockResolvedValue(Response.json(data));vi.stubGlobal('fetch',fetcher);
    await expect(requestWalkPreview('/api/onemap-route?test=1')).resolves.toEqual(data);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([401,403,404,429,503])('fails HTTP %i without pretending an error JSON is a route',async status=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({ok:true,route_geometry:'wrong'},{status})));
    await expect(requestWalkPreview('/api/onemap-route')).rejects.toMatchObject({status});
  });
  it('times out even if transport ignores abort; a retry is a fresh request',async()=>{
    vi.useFakeTimers();const fetcher=vi.fn().mockImplementation(()=>new Promise(()=>{}));vi.stubGlobal('fetch',fetcher);
    const failed=expect(requestWalkPreview('/api/onemap-route',100)).rejects.toMatchObject({name:'TimeoutError'});
    await vi.advanceTimersByTimeAsync(100);await failed;
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    fetcher.mockResolvedValue(Response.json({ok:true,route_geometry:'retry'}));
    await expect(requestWalkPreview('/api/onemap-route',100)).resolves.toMatchObject({ok:true});
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('bounds a hanging response body as well as the connection',async()=>{
    vi.useFakeTimers();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:()=>new Promise(()=>{})}));
    const failed=expect(requestWalkPreview('/api/onemap-route',100)).rejects.toMatchObject({name:'TimeoutError'});
    await vi.advanceTimersByTimeAsync(100);await failed;
  });
  it('clears the deadline after failure, without automatic retries',async()=>{
    vi.useFakeTimers();const fetcher=vi.fn().mockRejectedValue(new Error('offline'));vi.stubGlobal('fetch',fetcher);
    await expect(requestWalkPreview('/api/onemap-route',100)).rejects.toThrow('offline');
    await vi.advanceTimersByTimeAsync(1000);expect(fetcher).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
  });
  it.each([401,503])('cancels the unused HTTP %i response body',async status=>{
    const cancel=vi.fn();
    const response=new Response(new ReadableStream({cancel}),{status});
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response));
    await expect(requestWalkPreview('/api/onemap-route')).rejects.toMatchObject({status});
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(response.bodyUsed).toBe(true);
  });
  it('keeps the original HTTP failure when body cancellation rejects',async()=>{
    const cancel=vi.fn().mockRejectedValue(new Error('stream already closed'));
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:503,body:{cancel}}));
    await expect(requestWalkPreview('/api/onemap-route')).rejects.toMatchObject({status:503,message:'Walking preview unavailable'});
    expect(cancel).toHaveBeenCalledTimes(1);
    await Promise.resolve();
  });
  it('does not delay a failed preview for a stuck cancellation promise',async()=>{
    vi.useFakeTimers();const cancel=vi.fn().mockImplementation(()=>new Promise(()=>{}));
    const fetcher=vi.fn().mockResolvedValue({ok:false,status:401,body:{cancel}});vi.stubGlobal('fetch',fetcher);
    await expect(requestWalkPreview('/api/onemap-route',100)).rejects.toMatchObject({status:401});
    expect(cancel).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not cancel a successful response before consuming its route',async()=>{
    const data={ok:true,route_geometry:'unchanged',total_distance_m:81,total_time_s:63};
    const response=Response.json(data);const cancel=vi.spyOn(response.body!,'cancel');
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response));
    await expect(requestWalkPreview('/api/onemap-route')).resolves.toEqual(data);
    expect(cancel).not.toHaveBeenCalled();
  });
  it('preserves the HTTP status when an error response has no body',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:404})));
    await expect(requestWalkPreview('/api/onemap-route')).rejects.toMatchObject({status:404});
  });
});
