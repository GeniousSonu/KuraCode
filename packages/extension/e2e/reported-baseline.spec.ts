import { expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { test } from "./extension";

const reportedDir = path.resolve(
  process.cwd(),
  "..",
  "..",
  "docs",
  "agent",
  "evidence",
  "design",
  "reported"
);

const urlOf = (id: string, p: string) => `chrome-extension://${id}/${p}`;

test("reproduce reported baseline popup with D1, D3, D4 defects and save screenshot", async ({
  page,
  browser,
}) => {
  fs.mkdirSync(reportedDir, { recursive: true });

  const worker = browser.serviceWorkers()[0];
  expect(worker).toBeTruthy();
  const id = new URL(worker.url()).host;

  // Set viewport to 380x600 as specified
  await page.setViewportSize({ width: 380, height: 600 });

  const baselineItems = [
    {
      id: "snip-reported-1",
      title: "", // No user title
      code: "Created by Facebook, Zstandard is designed to scale dynamically from fast real-time streaming to deep archival storage (offering 22 compression levels).",
      raw: "Created by Facebook, Zstandard is designed to scale dynamically from fast real-time streaming to deep archival storage (offering 22 compression levels).",
      language: "sql", // What the old cleaner misdetected it as
      tags: [],
      workspaceId: null,
      context: {
        sourceUrl: "https://www.google.com/search?q=zstandard",
        pageTitle: "Google Search",
        domain: "google.com",
        capturedAt: Date.now() - 60000,
      },
      createdAt: Date.now() - 60000,
      updatedAt: Date.now() - 60000,
    },
    {
      id: "snip-reported-2",
      title: "Feature", // One word title matching content
      code: "Feature",
      raw: "Feature",
      language: "text",
      tags: [],
      workspaceId: null,
      context: {
        sourceUrl: "https://www.google.com",
        pageTitle: "Google",
        domain: "google.com",
        capturedAt: Date.now() - 120000,
      },
      createdAt: Date.now() - 120000,
      updatedAt: Date.now() - 120000,
    },
  ];

  await page.goto(urlOf(id, "popup.html"));
  await page.waitForLoadState("domcontentloaded");

  await page.evaluate(async (snips) => {
    await chrome.storage.local.set({ "kuracode.snippets.v1": snips });
  }, baselineItems);

  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);

  // Capture reported before screenshot at 380x600
  const screenshotPath = path.join(reportedDir, "popup-before.png");
  await page.screenshot({ path: screenshotPath });
  console.info("Saved baseline reported screenshot to:", screenshotPath);
});
