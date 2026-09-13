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
});
