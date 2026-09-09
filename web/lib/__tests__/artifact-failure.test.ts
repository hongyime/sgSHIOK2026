import { describe, expect, it } from "vitest";
import { getArtifactFailure, recordArtifactFailure, type ArtifactFailure } from "../artifact-failure";

const metadata: ArtifactFailure = {
  stage: "artifact-fetch", reason: "http", artifactRole: "score-shard", httpStatus: 503, elapsedMs: 12.5,
};

describe("safe artifact failure metadata", () => {
  it("preserves frozen error identity without serializing paths, messages, causes or attached fields", () => {
    const error = Object.freeze(Object.assign(new Error("private postal and URL"), { path: "/private", cause: "secret" }));
    const keys = Reflect.ownKeys(error);
    recordArtifactFailure(error, { ...metadata, privateUrl: "/private" } as ArtifactFailure);
    expect(getArtifactFailure(error)).toEqual(metadata);
    expect(Reflect.ownKeys(error)).toEqual(keys);
    expect(JSON.stringify(getArtifactFailure(error))).not.toMatch(/private|postal|URL|secret/);
  });

  it("does not invoke unknown error getters or trust metadata attached by a caller", () => {
    const error = new Proxy({ artifactFailure: metadata }, { get: () => { throw new Error("must not inspect"); } });
    expect(getArtifactFailure(error)).toBeNull();
    recordArtifactFailure(error, metadata);
    expect(getArtifactFailure(error)).toEqual(metadata);
  });

  it.each([null, undefined, "private message", 0, Symbol("private")])("ignores primitive errors: %s", (error) => {
    recordArtifactFailure(error, metadata);
    expect(getArtifactFailure(error)).toBeNull();
  });

  it("returns copies and takes a snapshot so callers cannot mutate retained diagnostics", () => {
    const error = new Error();
    const input = { ...metadata };
    recordArtifactFailure(error, input);
    input.artifactRole = "manifest";
    const output = getArtifactFailure(error)!;
    output.httpStatus = 401;
    expect(getArtifactFailure(error)).toEqual(metadata);
  });

  it.each(["stage", "reason"] as const)("rejects non-allowlisted %s values", (field) => {
    const error = new Error();
    recordArtifactFailure(error, { ...metadata, [field]: "private-message" } as ArtifactFailure);
    expect(getArtifactFailure(error)).toBeNull();
  });

  it("reduces unrecognized roles to unknown", () => {
    const error = new Error();
    recordArtifactFailure(error, { ...metadata, artifactRole: "/private/path" } as ArtifactFailure);
    expect(getArtifactFailure(error)).toEqual({ ...metadata, artifactRole: "unknown" });
  });

  it.each([NaN, Infinity, -1, "123456"])("drops invalid elapsed values: %s", (elapsedMs) => {
    const error = new Error();
    recordArtifactFailure(error, { ...metadata, elapsedMs } as ArtifactFailure);
    expect(getArtifactFailure(error)?.elapsedMs).toBeNull();
  });

  it.each([0, 600, 503.5, NaN, "503"])("drops invalid status values: %s", (httpStatus) => {
    const error = new Error();
    recordArtifactFailure(error, { ...metadata, httpStatus } as ArtifactFailure);
    expect(getArtifactFailure(error)?.httpStatus).toBeNull();
  });
});
