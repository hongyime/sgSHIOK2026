import { describe, it, expect, vi, afterEach } from 'vitest';
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
describe('geometry failure recovery', () => {
  it('M06/M07: server errors reject, retry reads the failed shard, success is cached', async () => {
    let fail = true;
    const geom = {postal:'018956',shortest:'abc',sheltered:'abc',exposure_gaps:[]};
    const requests: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      requests.push(input);
      if(input.endsWith('.gz')) return new Response('',{status:404});
      if(input.includes('postal-prefix')) return Response.json({'018956':'test-cell'});
      if(input.includes('geom/h3')) return fail ? new Response('',{status:503}) : Response.json([geom]);
      throw Error('Unexpected request');
    }));
    const {fetchGeomForPostal} = await import('../data');
    await expect(fetchGeomForPostal('018956')).rejects.toThrow('503');
    fail=false;
    expect(await fetchGeomForPostal('018956')).toEqual(geom);
    const count=requests.length;
    expect(await fetchGeomForPostal('018956')).toEqual(geom);
    expect(requests.length).toBe(count);
    expect(requests.filter(r=>r.endsWith('geom/h3/test-cell.json'))).toHaveLength(2);
  });
});
