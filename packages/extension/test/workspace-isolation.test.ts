import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  canPerformAction,
  WorkspaceManager,
} from "../src/shared/workspaces";
import { makeSnippet, listSnippets, saveSnippet } from "../src/shared/storage";

describe("Workspace Data Isolation & Multi-Tenancy (BUG-3, WS-1..WS-3, INV-1..INV-3)", () => {
  let mockStore: Record<string, unknown> = {};

  beforeEach(() => {
    mockStore = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: mockStore[key] })),
          set: vi.fn(async (items: Record<string, unknown>) => {
            Object.assign(mockStore, items);
          }),
        },
      },
    };
  });

  it("maintains absolute data separation between Personal Space, Workspace A, and Workspace B", async () => {
    // 1. Personal Space Snippet
    const personal = makeSnippet({
      title: "My Personal Env Config",
      code: "export const API_KEY = 'secret';",
      raw: "export const API_KEY = 'secret';",
      language: "typescript",
      workspaceId: null,
      context: { sourceUrl: "", pageTitle: "", domain: "personal", capturedAt: Date.now() },
    });
    await saveSnippet(personal);

    // 2. Workspace Alpha Snippet
    const alphaSnippet = makeSnippet({
      title: "Alpha Shared Microservice",
      code: "export function handleAlpha() { return 'alpha'; }",
      raw: "export function handleAlpha() { return 'alpha'; }",
      language: "typescript",
      workspaceId: "ws_alpha_111",
      context: { sourceUrl: "", pageTitle: "", domain: "alpha.internal", capturedAt: Date.now() },
    });
    await saveSnippet(alphaSnippet);

    // 3. Workspace Beta Snippet
    const betaSnippet = makeSnippet({
      title: "Beta Payment Gateway Integration",
      code: "export function chargeCustomer() { return true; }",
      raw: "export function chargeCustomer() { return true; }",
      language: "typescript",
      workspaceId: "ws_beta_222",
      context: { sourceUrl: "", pageTitle: "", domain: "beta.internal", capturedAt: Date.now() },
    });
    await saveSnippet(betaSnippet);

    // Query Personal Space
    const personalList = await listSnippets(null);
    expect(personalList.map((s) => s.id)).toEqual([personal.id]);
    expect(personalList.some((s) => s.title.includes("Alpha"))).toBe(false);
    expect(personalList.some((s) => s.title.includes("Beta"))).toBe(false);

    // Query Workspace Alpha
    const alphaList = await listSnippets("ws_alpha_111");
    expect(alphaList.map((s) => s.id)).toEqual([alphaSnippet.id]);
    expect(alphaList.some((s) => s.title.includes("Personal"))).toBe(false);
    expect(alphaList.some((s) => s.title.includes("Beta"))).toBe(false);

    // Query Workspace Beta
    const betaList = await listSnippets("ws_beta_222");
    expect(betaList.map((s) => s.id)).toEqual([betaSnippet.id]);
    expect(betaList.some((s) => s.title.includes("Personal"))).toBe(false);
    expect(betaList.some((s) => s.title.includes("Alpha"))).toBe(false);
  });

  it("handles rapid asynchronous workspace switching without race conditions or stale leakage", async () => {
    const snipA = makeSnippet({
      title: "Workspace A Code",
      code: "const a = 1;",
      raw: "const a = 1;",
      language: "typescript",
      workspaceId: "ws_A",
      context: { sourceUrl: "", pageTitle: "", domain: "", capturedAt: Date.now() },
    });
    const snipB = makeSnippet({
      title: "Workspace B Code",
      code: "const b = 2;",
      raw: "const b = 2;",
      language: "typescript",
      workspaceId: "ws_B",
      context: { sourceUrl: "", pageTitle: "", domain: "", capturedAt: Date.now() },
    });
    await saveSnippet(snipA);
    await saveSnippet(snipB);

    let querySeq = 0;
    async function simulateSwitch(wsId: string, delayMs: number) {
      const myToken = ++querySeq;
      await new Promise((r) => setTimeout(r, delayMs));
      const res = await listSnippets(wsId);
      // If superseded by a newer switch, ignore result
      if (myToken !== querySeq) return null;
      return res;
    }

    // Switch to A with high latency (50ms), but switch to B immediately after with low latency (5ms)
    const promiseA = simulateSwitch("ws_A", 50);
    const promiseB = simulateSwitch("ws_B", 5);

    const [resA, resB] = await Promise.all([promiseA, promiseB]);

    // resA should be canceled (null), resB should contain only Workspace B code
    expect(resA).toBeNull();
    expect(resB).not.toBeNull();
    expect(resB?.[0].title).toBe("Workspace B Code");
  });

  it("enforces RBAC permissions across Owner, Admin, Editor, and Viewer roles", () => {
    // Owner
    expect(canPerformAction("owner", "view")).toBe(true);
    expect(canPerformAction("owner", "edit")).toBe(true);
    expect(canPerformAction("owner", "delete")).toBe(true);
    expect(canPerformAction("owner", "invite")).toBe(true);
    expect(canPerformAction("owner", "transfer_ownership")).toBe(true);

    // Admin
    expect(canPerformAction("admin", "view")).toBe(true);
    expect(canPerformAction("admin", "edit")).toBe(true);
    expect(canPerformAction("admin", "delete")).toBe(true);
    expect(canPerformAction("admin", "invite")).toBe(true);
    expect(canPerformAction("admin", "transfer_ownership")).toBe(false);

    // Editor
    expect(canPerformAction("editor", "view")).toBe(true);
    expect(canPerformAction("editor", "edit")).toBe(true);
    expect(canPerformAction("editor", "delete")).toBe(false);
    expect(canPerformAction("editor", "invite")).toBe(false);

    // Viewer
    expect(canPerformAction("viewer", "view")).toBe(true);
    expect(canPerformAction("viewer", "edit")).toBe(false);
    expect(canPerformAction("viewer", "delete")).toBe(false);
    expect(canPerformAction("viewer", "invite")).toBe(false);
  });

  it("manages invite codes lifecycle, previewing, claiming, and rate limiting", () => {
    const mgr = new WorkspaceManager();
    const ws = mgr.createWorkspace("Frontend Guild", {
      id: "usr-admin",
      email: "admin@guild.com",
      name: "Admin User",
    });

    const invite = mgr.createInvite(ws.id, {
      email: "admin@guild.com",
      name: "Admin User",
    }, "editor", { code: "KURA-7788", expiresInHours: 24, maxUses: 2 });

    expect(invite.code).toBe("KURA-7788");

    // Preview invite
    const preview = mgr.previewCode("KURA-7788");
    expect(preview.kind).toBe("workspace_invite");
    expect(preview.title).toContain("Frontend Guild");
    expect(preview.role).toBe("editor");

    // Accept invite
    const joined = mgr.acceptInvite("KURA-7788", {
      id: "usr-dev2",
      email: "dev2@guild.com",
      name: "Bob Dev",
    });
    expect(joined.id).toBe(ws.id);
    expect(joined.members.some((m) => m.email === "dev2@guild.com" && m.role === "editor")).toBe(true);

    // Test quick share 4-digit code preview
    const quickPreview = mgr.previewCode("4821");
    expect(quickPreview.kind).toBe("quick_share");
    expect(quickPreview.targetId).toBe("4821");

    // Test invalid code rate-limiting lockout
    for (let i = 0; i < 4; i++) {
      expect(() => mgr.previewCode("bad-code-" + i)).toThrow(/Invalid or unrecognized/);
    }
    // 5th attempt triggers lockout
    expect(() => mgr.previewCode("bad-code-5")).toThrow();
    // Subsequent attempt during lockout period fails with rate limit message
    expect(() => mgr.previewCode("bad-code-6")).toThrow(/Too many incorrect attempts/);
  });
});

