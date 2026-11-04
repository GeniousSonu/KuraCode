import { expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { test } from "./extension";

const outDir = path.resolve(
  process.cwd(),
  "..",
  "..",
  "docs",
  "agent",
  "evidence",
  "brand",
);

const urlOf = (id: string, p: string) => `chrome-extension://${id}/${p}`;

test("brand: extension icons load with 200 and surfaces screenshot", async ({
  page,
  browser,
}) => {
  fs.mkdirSync(outDir, { recursive: true });

  const worker = browser.serviceWorkers()[0];
  expect(worker).toBeTruthy();
  const id = new URL(worker.url()).host;
  expect(id).toBeTruthy();

  const manifest = await worker.evaluate(() => chrome.runtime.getManifest());
  const refs = [
    ...Object.values(manifest.icons as Record<string, string>),
    ...Object.values(
      (manifest.action?.default_icon ?? {}) as Record<string, string>,
    ),
  ];
  expect(refs.length).toBeGreaterThan(0);

  // Popup in light (also the origin for icon fetches).
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(urlOf(id, "popup.html"));
  await page.waitForLoadState("domcontentloaded");

  // Every icon reference must return 200 (no 404s in the console). Fetch
  // inside the extension page so the chrome-extension:// origin is allowed.
  const statuses = await page.evaluate(
    async (urls: string[]) => {
      const out: Record<string, number> = {};
      for (const u of urls) {
        try {
          const r = await fetch(u);
          out[u] = r.status;
        } catch {
          out[u] = 0;
        }
      }
      return out;
    },
    refs.map((r) => urlOf(id, r)),
  );
  for (const [u, s] of Object.entries(statuses)) {
    expect(s, `icon ${u} should be 200`).toBe(200);
  }

  await page.screenshot({ path: path.join(outDir, "popup-light.png") });

  // Dark popup.
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "popup-dark.png") });

  // Side panel.
  await page.goto(urlOf(id, "sidepanel.html"));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "sidepanel-light.png") });

  // Inline Save button on a demo page (content script injects in shadow DOM).
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("http://localhost:8931/simple.html");
  await page.waitForSelector("pre[data-kuracode-ui]", { timeout: 5000 });
  await page.screenshot({ path: path.join(outDir, "inline-button-light.png") });
});
