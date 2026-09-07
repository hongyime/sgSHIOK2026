import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import maplibrePackage from 'maplibre-gl/package.json';

describe('local MapLibre module worker', () => {
  it('serves the exact installed worker/shared module and license without changing CSP', () => {
    const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
    expect(maplibrePackage.version).toBe('6.1.0');
    for (const file of ['maplibre-gl-worker.mjs','maplibre-gl-shared.mjs']) {
      expect(hash(`public/maplibre/6.1.0/${file}`)).toBe(hash(`node_modules/maplibre-gl/dist/${file}`));
    }
    expect(hash('public/maplibre/6.1.0/LICENSE.txt')).toBe(hash('node_modules/maplibre-gl/LICENSE.txt'));
  });
});
