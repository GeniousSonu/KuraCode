/**
 * Browser E2E (Release Guide L5) driving the shared scenario library.
 *
 * Loads the real built extension in a persistent Chromium context and runs
 * the browser-agnostic S-series scenarios from tests/scenarios/steps.ts.
 * The same steps later run against Firefox via the same driver interface.
 */
import { test as base } from "./extension";
import { createDriver } from "../tests/scenarios/driver";
import {
  s1HotkeyCapture,
  s3InlineSave,
  s4ClipboardPasteSave,
  s6CopyExact,
  s11StrictCspShadowDom,
} from "../tests/scenarios/steps";

const test = base.extend({
  driver: async ({ browser }, use) => {
    await use(createDriver(browser));
  },
});

test.describe("core scenarios (S-series)", () => {
  test("S1: hotkey/context-menu capture on Stack Overflow fixture", async ({
    driver,
  }) => {
    await s1HotkeyCapture(driver);
  });

  test("S3: inline Save strips gutters, layout stable", async ({ driver }) => {
    await s3InlineSave(driver);
  });

  test("S4: clipboard paste-save from popup", async ({ driver }) => {
    await s4ClipboardPasteSave(driver);
  });

  test("S6: copy from library matches saved code exactly", async ({
    driver,
  }) => {
    await s6CopyExact(driver);
  });

  test("S11: strict CSP + shadow DOM degrade gracefully", async ({ driver }) => {
    await s11StrictCspShadowDom(driver);
  });
});
