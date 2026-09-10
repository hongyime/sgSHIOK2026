import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { reportInstalledDependencies } from "./check-installed-dependencies.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (!reportInstalledDependencies(root).ok) process.exit(1);

const contracts = spawnSync(process.execPath, ["--test", resolve(root, "scripts/__tests__/installed-dependencies.test.mjs")], {
  cwd: root, stdio: "inherit", windowsHide: true,
});
if (contracts.error) console.error(contracts.error);
if (contracts.status !== 0) process.exit(contracts.status ?? 1);

const vitestBin = resolve(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vitest.cmd" : "vitest"
);
const rawArgs = process.argv.slice(2);
const isParallel = rawArgs.includes("--parallel");
const passthroughArgs = rawArgs.filter(
  (arg) => arg !== "--parallel" && arg !== "--runInBand"
);
const workerArgs = isParallel ? [] : ["--maxWorkers", "1", "--no-file-parallelism"];

const result = spawnSync(vitestBin, ["run", "--globals", ...workerArgs, ...passthroughArgs], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
