import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests live in ./test. Exclude the Playwright e2e specs.
    include: ["test/**/*.test.ts"],
  },
});
