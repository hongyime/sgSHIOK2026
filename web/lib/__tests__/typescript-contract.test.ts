import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("typescript contracts", () => {
  it("type-checks rank payload projections", () => {
    const webRoot = join(__dirname, "../..");
    const tscBin = join(webRoot, "node_modules", "typescript", "bin", "tsc");

    expect(() =>
      execFileSync(process.execPath, [tscBin, "--noEmit", "--pretty", "false"], {
        cwd: webRoot,
        stdio: "pipe",
      })
    ).not.toThrow();
  }, 30000);
});
