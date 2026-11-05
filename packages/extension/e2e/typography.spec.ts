import { expect } from "@playwright/test";
import path from "node:path";
import { test } from "./extension";

const urlOf = (id: string, p: string) => `chrome-extension://${id}/${p}`;
const fontsEvidenceDir = path.resolve(
  process.cwd(),
  "..",
  "..",
  "docs",
  "agent",
  "evidence",
  "design",
  "fonts"
);

test.describe("Typography & Zero-External-Network Audit", () => {
  const surfaces = ["popup.html", "sidepanel.html", "options.html"];

  for (const surface of surfaces) {
    test(`verifies bundled fonts and zero external font requests on ${surface}`, async ({
      page,
      browser,
    }) => {
      const externalRequests: string[] = [];

      // Intercept all network requests
      page.on("request", (req) => {
        const url = req.url();
        if (url.startsWith("http://") || url.startsWith("https://")) {
          externalRequests.push(url);
        }
      });

      const worker = browser.serviceWorkers()[0];
      expect(worker).toBeTruthy();
      const id = new URL(worker.url()).host;

      await page.goto(urlOf(id, surface));
      await page.waitForLoadState("networkidle");

      // Zero external requests (no Google Fonts, no remote CDNs)
      expect(externalRequests).toEqual([]);

      // Wait for fonts to finish loading
      await page.evaluate(() => document.fonts.ready);

      // Verify font checks via FontFaceSet API
      const fontCheck = await page.evaluate(() => {
        return {
          interReady: document.fonts.check("13px Inter"),
          jetbrainsReady: document.fonts.check('11px "JetBrains Mono"'),
          bodyFont: window.getComputedStyle(document.body).fontFamily,
        };
      });

      expect(fontCheck.bodyFont.toLowerCase()).toContain("inter");

      // Verify code element font if present
      const codeElement = page.locator(".kura-card-code").first();
      if ((await codeElement.count()) > 0) {
        const codeFont = await codeElement.evaluate((el) => window.getComputedStyle(el).fontFamily);
        expect(codeFont.toLowerCase()).toContain("jetbrains mono");
      }

      // Capture screenshot for visual evidence
      await page.screenshot({
        path: path.join(fontsEvidenceDir, `${surface.replace(".html", "")}-typography.png`),
      });
    });
  }
});

