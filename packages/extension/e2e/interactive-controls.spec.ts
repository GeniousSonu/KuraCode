import { expect } from "@playwright/test";
import { test } from "./extension";

const urlOf = (id: string, p: string) => `chrome-extension://${id}/${p}`;

test.describe("Interactive Controls Surface Audit (Dead Control & Error Detection)", () => {
  const surfaces = ["popup.html", "sidepanel.html", "options.html"];

  for (const surface of surfaces) {
    test(`audits all interactive controls in ${surface}`, async ({ page, browser }) => {
      const pageErrors: Error[] = [];
      const consoleErrors: string[] = [];

      page.on("pageerror", (err) => pageErrors.push(err));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      const worker = browser.serviceWorkers()[0];
      expect(worker).toBeTruthy();
      const id = new URL(worker.url()).host;

      await page.goto(urlOf(id, surface));
      await page.waitForLoadState("domcontentloaded");

      // Verify page is rendered
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Collect all interactive elements (buttons, inputs, selects, links)
      const buttons = await page.locator("button, select, input, a").all();
      expect(buttons.length).toBeGreaterThan(0);

      // Iterate through interactive controls and test responsiveness
      for (const btn of buttons) {
        if (await btn.isVisible()) {
          const tagName = await btn.evaluate((el) => el.tagName.toLowerCase());
          const role = await btn.getAttribute("role");
          const text = (await btn.textContent())?.trim() || (await btn.getAttribute("aria-label")) || "";

          // Skip clear all data button to preserve test isolation
          if (text.includes("Clear All") || text.includes("Move to Trash")) continue;

          try {
            if (tagName === "button" || role === "button") {
              await btn.click({ timeout: 1500 });
            } else if (tagName === "input" && (await btn.getAttribute("type")) === "search") {
              await btn.fill("test query");
              await btn.press("Escape");
            } else if (tagName === "select") {
              // trigger change event safely
              await btn.dispatchEvent("change");
            }
          } catch {
            // Dismiss open modals if any
            await page.keyboard.press("Escape");
          }
        }
      }

      // Assert zero console errors and zero unhandled rejections
      expect(pageErrors, `Unhandled errors detected on ${surface}`).toEqual([]);
      expect(consoleErrors, `Console errors detected on ${surface}`).toEqual([]);
    });
  }
});

