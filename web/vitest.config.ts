import { configDefaults, defineConfig } from "vitest/config";

// tsconfig sets `jsx: preserve` for Next.js; vitest / oxc need an explicit
// JSX transform to load .tsx sources during tests. Scoped to test runs only.
export default defineConfig({
  test: {
    // The dependency-free guard contracts run with node:test before Vitest starts.
    exclude: [...configDefaults.exclude, "scripts/__tests__/installed-dependencies.test.mjs"],
  },
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
});
