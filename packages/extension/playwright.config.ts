import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL(".output/chrome-mv3", import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  webServer: {
    command: "node e2e/server.mjs",
    url: "http://localhost:8931/simple.html",
    reuseExistingServer: false,
  },
  use: {
    trace: "on-first-retry",
    // Extensions require a persistent, headed context (extensions are not
    // supported in headless Chromium).
    headless: false,
    launchOptions: {
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
