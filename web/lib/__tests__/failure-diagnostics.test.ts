import { afterEach, describe, expect, it, vi } from 'vitest';
import { serializeFailureDiagnostics } from '../failure-diagnostics';
import bundle from '../../data-bundle.json';

const base = '/data/' + bundle.bundle + '/';
afterEach(() => vi.unstubAllEnvs());
const read = (issue: Record<string, unknown>, dataBase = base) => JSON.parse(serializeFailureDiagnostics({
  area: 'map', status: 'error', mapIssue: issue,
}, dataBase));

describe('T03 allowlisted failure diagnostics', () => {
  it('copies only enumerated safe fields, never location, URL, exception or ownership data', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_BUILD_ID', '');
    const secret = 'not-for-copy-postal-123456-https://private.example/?token=secret';
    const issue = { stage: 'map-startup', reason: 'error', elapsedMs: 123.6,
      message: secret, stack: secret, postal: secret, ownership: { secret }, route: [secret] };
    Object.defineProperty(issue, 'url', { get() { throw Error('Must not inspect an unrelated field'); } });
    const result = read(issue);
    expect(result).toEqual({
      schema: 'shiok-diagnostics-v1', app_build_id: null, artifact_bundle_id: bundle.bundle,
      artifact_identity_source: 'pinned-config', area: 'map', status: 'error',
      stage: 'map-startup', reason: 'error', artifact_role: null, http_status: null,
      elapsed_ms: 124, elapsed_basis: 'map-attempt',
    });
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it('does not identify a custom data source as the pinned bundle', () => {
    const result = read({ stage: 'basemap-tiles', reason: 'error' }, 'https://private.example/data/?token=secret');
    expect(result.artifact_bundle_id).toBeNull();
    expect(result.artifact_identity_source).toBe('unavailable');
    expect(JSON.stringify(result)).not.toContain('private.example');
  });

  it.each(['', 'https://private.example/', 'secret?token=abc', 'x'.repeat(65)])('does not invent a build identity from invalid config %s', build => {
    vi.stubEnv('NEXT_PUBLIC_APP_BUILD_ID', build);
    expect(read({}).app_build_id).toBeNull();
  });
  it('reports an explicitly configured public compile-time build identifier', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_BUILD_ID', 'release_74a7901');
    expect(read({}).app_build_id).toBe('release_74a7901');
  });
  it.each([NaN, Infinity, -1, Number.MAX_SAFE_INTEGER + 1])('rejects invalid elapsed time %s', elapsedMs => {
    const result = read({ stage: 'component-download', reason: 'timeout', elapsedMs });
    expect(result.elapsed_ms).toBeNull();
    expect(result.elapsed_basis).toBe('unknown');
  });
  it.each([
    ['component-download', 'timeout', 'component-attempt'],
    ['route-render', 'timeout', 'route-probe'],
    ['library-download', 'rejected', 'map-attempt'],
  ])('names the actual timing basis for %s/%s', (stage, reason, basis) => {
    expect(read({ stage, reason, elapsedMs: 0 }).elapsed_basis).toBe(basis);
  });
  it('rejects unknown stage/reason instead of copying them', () => {
    const result = read({ stage: 'private-url', reason: 'private-postal' });
    expect(result.stage).toBe('unknown');
    expect(result.reason).toBe('unknown');
  });
  it('does not invent a timing basis for a known stage with an unknown reason', () => {
    expect(read({ stage: 'route-render', reason: 'unrecognized', elapsedMs: 10 }))
      .toMatchObject({ reason: 'unknown', elapsed_ms: 10, elapsed_basis: 'unknown' });
  });
  it('includes typed artifact information but not the underlying exception', () => {
    const value = JSON.parse(serializeFailureDiagnostics({ area: 'geometry-data', status: 'error',
      artifactFailure: { stage: 'artifact-fetch', reason: 'http', artifactRole: 'geometry-shard', httpStatus: 503, elapsedMs: 80.2 },
    }, base));
    expect(value).toMatchObject({ area: 'geometry-data', stage: 'artifact-fetch', reason: 'http', artifact_role: 'geometry-shard',
      http_status: 503, elapsed_ms: 80, elapsed_basis: 'artifact-operation' });
  });
  it('uses unknown for untyped errors rather than guessing a network or worker cause', () => {
    const value = JSON.parse(serializeFailureDiagnostics({ area: 'score-data', status: 'error' }, base));
    expect(value).toMatchObject({ stage: 'unknown', reason: 'unknown', artifact_role: null, http_status: null, elapsed_ms: null });
  });
});
