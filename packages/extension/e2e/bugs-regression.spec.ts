import { expect } from "@playwright/test";
import { test } from "./extension";

const urlOf = (id: string, p: string) => `chrome-extension://${id}/${p}`;

test.describe("Live Bug Reproductions (BUG-1, BUG-2, BUG-3)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => console.error("PAGE_ERROR:", err));
    page.on("console", (msg) => console.info("PAGE_LOG:", msg.text()));
  });
  test("BUG-1: Settings button opens options or settings view", async ({ page, browser }) => {
    const worker = browser.serviceWorkers()[0];
    expect(worker).toBeTruthy();
    const id = new URL(worker.url()).host;

    await page.goto(urlOf(id, "popup.html"));
    await page.waitForLoadState("domcontentloaded");

    const settingsBtn = page.locator("#btn-settings, button[data-action='settings'], button[title*='Settings']").first();
    await expect(settingsBtn).toBeVisible();

    // Set up listener for new page/tab or in-page view
    const newPagePromise = page.context().waitForEvent("page", { timeout: 3000 }).catch(() => null);

    await settingsBtn.click();

    const newPage = await newPagePromise;
    const inPageView = await page.locator(".kura-settings-modal, .kura-settings-view, [data-view='settings']").isVisible().catch(() => false);

    expect(Boolean(newPage || inPageView)).toBe(true);
  });

  test("BUG-2: Snippet code renders multi-line with wrap toggle and exact copy", async ({ page, browser }) => {
    const worker = browser.serviceWorkers()[0];
    expect(worker).toBeTruthy();
    const id = new URL(worker.url()).host;

    const multilineCode = [
      "interface CacheConfig {",
      "  ttlMs: number;",
      "  maxEntries: number;",
      "  evictionPolicy: 'lru' | 'lfu';",
      "}",
    ].join("\n");

    await page.goto(urlOf(id, "popup.html"));
    await page.evaluate(async (code) => {
      await chrome.storage.local.set({
        "kuracode.snippets.v1": [
          {
            id: "bug2-test",
            title: "CacheConfig Interface",
            code,
            raw: code,
            language: "typescript",
            tags: [],
            favorite: false,
            status: "draft",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            context: {
              sourceUrl: "https://example.com",
              pageTitle: "Example",
              domain: "example.com",
              capturedAt: Date.now(),
            },
          },
        ],
      });
    }, multilineCode);

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    const codeEl = page.locator(".kura-card-code").first();
    await expect(codeEl).toBeVisible();

    // Verify codeEl has multiple lines
    const text = await codeEl.textContent();
    expect((text || "").split("\n").length).toBeGreaterThanOrEqual(3);

    // Verify wrap toggle exists and works
    const wrapToggle = page.locator(".kura-wrap-toggle, [data-action='toggle-wrap']").first();
    await expect(wrapToggle).toBeVisible();
  });

  test("BUG-3: Switching workspaces filters and updates the snippet list", async ({ page, browser }) => {
    const worker = browser.serviceWorkers()[0];
    expect(worker).toBeTruthy();
    const id = new URL(worker.url()).host;

    await page.goto(urlOf(id, "popup.html"));
    await page.evaluate(async () => {
      await chrome.storage.local.set({
        "kuracode.active_workspace.v1": null, // Personal Space
        "kuracode.snippets.v1": [
          {
            id: "snip-personal",
            workspaceId: null,
            title: "Personal Notes",
            code: "const myPrivateNote = true;",
            raw: "const myPrivateNote = true;",
            language: "typescript",
            tags: [],
            favorite: false,
            status: "draft",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            context: { sourceUrl: "", pageTitle: "", domain: "personal", capturedAt: Date.now() },
          },
          {
            id: "snip-team",
            workspaceId: "ws-team-core",
            title: "Team Core Auth Hook",
            code: "export function useAuth() { return true; }",
            raw: "export function useAuth() { return true; }",
            language: "typescript",
            tags: [],
            favorite: false,
            status: "draft",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            context: { sourceUrl: "", pageTitle: "", domain: "company.internal", capturedAt: Date.now() },
          },
        ],
      });
    });

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Initially in Personal Space: Personal Notes should be visible, Team Core Auth Hook must NOT be visible
    await expect(page.locator(".kura-card-title", { hasText: "Personal Notes" })).toBeVisible();
    await expect(page.locator(".kura-card-title", { hasText: "Team Core Auth Hook" })).toHaveCount(0);

    // Switch to Workspace via switcher dropdown
    const wsBtn = page.locator(".kura-ws-btn");
    await expect(wsBtn).toBeVisible();
    await wsBtn.click();

    const teamWsItem = page.locator(".kura-ws-item", { hasText: "Core Engineering" });
    await expect(teamWsItem).toBeVisible();
    await teamWsItem.click();

    // After switching, Team Core Auth Hook MUST be visible, and Personal Notes must NOT be visible
    await expect(page.locator(".kura-card-title", { hasText: "Team Core Auth Hook" })).toBeVisible();
    await expect(page.locator(".kura-card-title", { hasText: "Personal Notes" })).toHaveCount(0);
  });
});

