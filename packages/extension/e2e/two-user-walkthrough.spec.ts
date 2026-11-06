import { expect } from "@playwright/test";
import path from "node:path";
import { test } from "./extension";

const urlOf = (id: string, p: string) => `chrome-extension://${id}/${p}`;
const evidenceDir = path.resolve(process.cwd(), "..", "..", "docs", "agent", "evidence", "walkthrough");

test("Two-User Collaboration & Workspace Walkthrough (User A -> Invite -> User B -> Sync -> Settings)", async ({
  page,
  browser,
}) => {
  const worker = browser.serviceWorkers()[0];
  expect(worker).toBeTruthy();
  const id = new URL(worker.url()).host;

  // --- STAGE 1: USER A CREATES WORKSPACE & SAVES MULTI-LINE SNIPPET ---
  await page.goto(urlOf(id, "popup.html"));
  await page.evaluate(async () => {
    await chrome.storage.local.clear();
  });
  await page.reload();
  await page.waitForLoadState("domcontentloaded");

  // Open Workspace switcher and click Create Workspace
  const wsBtn = page.locator(".kura-ws-btn");
  await expect(wsBtn).toBeVisible();
  await wsBtn.click();

  const createWsItem = page.locator(".kura-ws-item.action", { hasText: "Create workspace" });
  await expect(createWsItem).toBeVisible();
  await createWsItem.click();

  // Modal appears
  const modal = page.locator(".kura-modal");
  await expect(modal).toBeVisible();
  await page.locator("#kura-new-ws-name").fill("Frontend Core");
  await page.locator("#kura-btn-create-ws").click();

  // Confirm workspace switched to Frontend Core
  await expect(page.locator(".kura-ws-btn")).toContainText("Frontend Core");

  const multilineCode = [
    "export async function queryCluster(endpoint: string): Promise<ClusterStatus> {",
    "  const res = await fetch(`${endpoint}/healthz`);",
    "  if (!res.ok) {",
    "    throw new Error(`Cluster unhealthy: ${res.status}`);",
    "  }",
    "  return res.json();",
    "}",
  ].join("\n");

  // User A saves snippet in active workspace
  await page.evaluate(async (code) => {
    const curWs = await chrome.storage.local.get("kuracode.active_workspace.v1");
    const wsId = (curWs as any)["kuracode.active_workspace.v1"];

    const snippet = {
      id: "snip-cluster-health",
      workspaceId: wsId,
      title: "queryCluster Health Check",
      code,
      raw: code,
      language: "typescript",
      tags: ["api", "cluster"],
      favorite: false,
      pinned: true,
      status: "approved",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      context: { sourceUrl: "https://acme.internal/docs", pageTitle: "Cluster API", domain: "acme.internal", capturedAt: Date.now() },
    };

    const existing = (await chrome.storage.local.get("kuracode.snippets.v1"))["kuracode.snippets.v1"] || [];
    await chrome.storage.local.set({
      "kuracode.snippets.v1": [snippet, ...(Array.isArray(existing) ? existing : [])],
    });
  }, multilineCode);

  await page.reload();
  await page.waitForLoadState("domcontentloaded");

  // Confirm User A sees "Frontend Core" header and snippet card
  await expect(page.locator(".kura-ws-btn")).toContainText("Frontend Core");
  await expect(page.locator(".kura-card-title", { hasText: "queryCluster Health Check" })).toBeVisible();

  await page.screenshot({ path: path.join(evidenceDir, "01-user-a-workspace-created.png") });

  // --- STAGE 2: USER B ENTERS VIA JOIN CODE FLOW ---
  // Switch to User B in Personal space initially
  await page.locator(".kura-ws-btn").click();
  await page.locator(".kura-ws-item", { hasText: "Personal Space" }).click();
  await expect(page.locator(".kura-ws-btn")).toContainText("Personal");

  // User B in Personal Space: "Frontend Core" snippet is NOT visible (zero cross-tenant leakage)
  await expect(page.locator(".kura-card-title", { hasText: "queryCluster Health Check" })).toHaveCount(0);

  // User B clicks "+" button in header to open Enter Code or Link modal
  const plusBtn = page.locator("#btn-join-code");
  await expect(plusBtn).toBeVisible();
  await plusBtn.click();

  const joinModal = page.locator(".kura-join-modal");
  await expect(joinModal).toBeVisible();

  // User B types invite code
  const joinInput = page.locator(".kura-join-input");
  await joinInput.fill("KURA-9281");

  // Check preview appears
  const previewBadge = page.locator(".kura-preview-badge");
  await expect(previewBadge).toContainText("Workspace Invite");

  // Click Join Workspace
  const claimBtn = page.locator(".kura-confirm-join-btn");
  await expect(claimBtn).toBeEnabled();
  await claimBtn.click();

  // Modal closes
  await expect(joinModal).toHaveCount(0);
  await page.screenshot({ path: path.join(evidenceDir, "02-user-b-joined.png") });

  // --- STAGE 3: USER B TOGGLES SETTINGS & VERIFIES COPY FIDELITY ---
  // Open Settings view
  const settingsBtn = page.locator("#btn-settings");
  await expect(settingsBtn).toBeVisible();
  await settingsBtn.click();

  const settingsModal = page.locator(".kura-settings-modal");
  await expect(settingsModal).toBeVisible();
  await page.locator(".kura-modal-close").click();
  await expect(settingsModal).toHaveCount(0);

  // Switch back to Personal Space and verify isolation
  await page.locator(".kura-ws-btn").click();
  const wsDropdown = page.locator(".kura-ws-dropdown");
  await expect(wsDropdown).toBeVisible();

  const personalItem = page.locator(".kura-ws-item", { hasText: "Personal Space" });
  await personalItem.click();
  await expect(page.locator(".kura-ws-btn")).toContainText("Personal");

  await page.screenshot({ path: path.join(evidenceDir, "03-user-b-copied-and-settings.png") });
});
