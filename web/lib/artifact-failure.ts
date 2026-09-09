export interface ArtifactFailure {
  stage: "artifact-fetch" | "artifact-decode";
  reason: "http" | "network" | "unsupported" | "error";
  artifactRole: "manifest" | "score-index" | "score-shard" | "geometry-index" | "geometry-shard" | "transit" | "unknown";
  httpStatus: number | null;
  elapsedMs: number | null;
}

const failures = new WeakMap<object, ArtifactFailure>();
const stages = new Set(["artifact-fetch", "artifact-decode"]);
const reasons = new Set(["http", "network", "unsupported", "error"]);
const roles = new Set(["manifest", "score-index", "score-shard", "geometry-index", "geometry-shard", "transit", "unknown"]);

function isObject(value: unknown): value is object {
  return value !== null && (typeof value === "object" || typeof value === "function");
}

/** Attach only bounded metadata; never inspect or copy an error's own properties. */
export function recordArtifactFailure(error: unknown, failure: ArtifactFailure): void {
  if (!isObject(error) || !stages.has(failure.stage) || !reasons.has(failure.reason)) return;
  failures.set(error, {
    stage: failure.stage,
    reason: failure.reason,
    artifactRole: roles.has(failure.artifactRole) ? failure.artifactRole : "unknown",
    httpStatus: typeof failure.httpStatus === "number" && Number.isInteger(failure.httpStatus)
      && failure.httpStatus >= 100 && failure.httpStatus <= 599 ? failure.httpStatus : null,
    elapsedMs: typeof failure.elapsedMs === "number" && Number.isFinite(failure.elapsedMs)
      && failure.elapsedMs >= 0 ? failure.elapsedMs : null,
  });
}

export function getArtifactFailure(error: unknown): ArtifactFailure | null {
  if (!isObject(error)) return null;
  const failure = failures.get(error);
  return failure ? { ...failure } : null;
}
