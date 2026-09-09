import bundle from '../data-bundle.json';
import type { ArtifactFailure } from './artifact-failure';

export interface FailureDiagnosticInput {
  area: 'map' | 'manifest-data' | 'score-data' | 'geometry-data' | 'selection-data';
  status: 'partial' | 'error';
  mapIssue?: { stage?: string; reason?: string; elapsedMs?: number } | null;
  artifactFailure?: ArtifactFailure | null;
}

const mapStages = new Set(['component-download', 'library-download', 'glyph-setup', 'map-construction', 'map-startup', 'basemap-tiles', 'route-render']);
const mapReasons = new Set(['timeout', 'rejected', 'error']);
const artifactStages = new Set(['artifact-fetch', 'artifact-decode']);
const artifactReasons = new Set(['http', 'network', 'unsupported', 'error']);
const artifactRoles = new Set(['manifest', 'score-index', 'score-shard', 'geometry-index', 'geometry-shard', 'transit']);

function duration(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  const rounded = Math.round(value);
  return Number.isSafeInteger(rounded) ? rounded : null;
}

/** Deliberately enumerate fields; never spread an exception or selection into this payload. */
export function serializeFailureDiagnostics(input: FailureDiagnosticInput, dataBase: string): string {
  const map = input.area === 'map' ? input.mapIssue : null;
  const artifact = input.area === 'map' ? null : input.artifactFailure;
  const stage = map
    ? mapStages.has(map.stage ?? '') ? map.stage : 'unknown'
    : artifact && artifactStages.has(artifact.stage) ? artifact.stage : 'unknown';
  const reason = map
    ? mapReasons.has(map.reason ?? '') ? map.reason : 'unknown'
    : artifact && artifactReasons.has(artifact.reason) ? artifact.reason : 'unknown';
  const elapsed = duration(map?.elapsedMs ?? artifact?.elapsedMs);
  const http = artifact?.httpStatus;
  const pinned = dataBase === '/data/' + bundle.bundle + '/';
  const configuredBuild = process.env.NEXT_PUBLIC_APP_BUILD_ID;
  const build = configuredBuild && /^[A-Za-z0-9_-]{7,64}$/.test(configuredBuild) ? configuredBuild : null;
  return JSON.stringify({
    schema: 'shiok-diagnostics-v1',
    app_build_id: build,
    artifact_bundle_id: pinned ? bundle.bundle : null,
    artifact_identity_source: pinned ? 'pinned-config' : 'unavailable',
    area: ['map', 'manifest-data', 'score-data', 'geometry-data', 'selection-data'].includes(input.area) ? input.area : 'selection-data',
    status: input.status === 'partial' ? 'partial' : 'error',
    stage, reason,
    artifact_role: artifact && artifactRoles.has(artifact.artifactRole) ? artifact.artifactRole : null,
    http_status: typeof http === 'number' && Number.isInteger(http) && http >= 100 && http <= 599 ? http : null,
    elapsed_ms: elapsed,
    elapsed_basis: elapsed === null || stage === 'unknown' || reason === 'unknown' ? 'unknown' : artifact ? 'artifact-operation'
      : stage === 'component-download' ? 'component-attempt'
      : stage === 'route-render' && reason === 'timeout' ? 'route-probe' : 'map-attempt',
  }, null, 2);
}
