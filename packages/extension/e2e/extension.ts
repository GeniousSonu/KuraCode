import { test as base, chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../.output/chrome-mv3", import.meta.url));

// Custom fixture launching a persistent, headed context with the unpacked
// MV3 extension loaded (required for content scripts to run).
export const test = base.extend({
  browser: async ({}, use) => {
    const browser = await chromium.launchPersistentContext("", {
      channel: "chromium",
      headless: false,
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    });
    await use(browser);
    await browser.close();
  },
  // Keep the default `page` fixture working off the persistent context.
  page: async ({ browser }, use) => {
    const page = await browser.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from "@playwright/test";
