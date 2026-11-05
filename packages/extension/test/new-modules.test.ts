import { describe, expect, it } from "vitest";
import { generateReadableTitle } from "../src/shared/auto-title";
import { formatLocaleDateTime, formatRelativeTime, getTimelineBucket } from "../src/shared/date-formatter";
import { generateTextFragmentUrl } from "../src/shared/text-fragment";
import { scanForSecrets, containsSecrets, calculateShannonEntropy } from "../src/shared/secret-scanner";
import { generateQuickCode, timingSafeEqual, verifyQuickCode, type QuickSharePayload } from "../src/shared/quick-code";
import { HybridLogicalClock } from "../src/shared/hlc";
import { SyncEngine } from "../src/shared/sync-engine";
import { generatePKCE, validateOAuthCallback } from "../src/shared/auth";
import { ClipboardHubManager } from "../src/shared/clipboard-hub";
import { canPerformAction, WorkplaceManager } from "../src/shared/workplaces";
import { makeSnippet } from "../src/shared/storage";

describe("KuraCode Core Architecture & Domain Modules", () => {
  describe("Semantic Auto-Title Generator (UX-2)", () => {
    it("generates readable title for React hooks without raw code", () => {
      const code = "useEffect(() => { subscribe(); }, []);";
      const result = generateReadableTitle(code, "typescript");
      expect(result.title).toBe("React useEffect hook");
      expect(result.title).not.toContain("subscribe()");
    });

    it("generates readable title for SQL recursive CTE", () => {
      const code = "WITH RECURSIVE subordinates AS ( SELECT id FROM emp ) SELECT * FROM subordinates;";
      const result = generateReadableTitle(code, "sql");
      expect(result.title).toBe("Recursive CTE query (subordinates)");
    });

    it("generates readable title for functions", () => {
      const code = "function calculateTotal(items: Item[]) { return items.reduce(...); }";
      const result = generateReadableTitle(code, "typescript");
      expect(result.title).toBe("Typescript calculateTotal() function");
    });

    it("honors heading context over heuristics", () => {
      const code = "const x = 42;";
      const result = generateReadableTitle(code, "javascript", "### Configuration Settings");
      expect(result.title).toBe("Configuration Settings");
      expect(result.isAuto).toBe(false);
    });
  });

  describe("Date Formatter & Timeline Grouping (META-3)", () => {
    it("formats locale timestamps with full and relative representations", () => {
      const now = Date.now();
      const res = formatLocaleDateTime(now, "en-US");
      expect(res.formatted.length).toBeGreaterThan(0);
      expect(res.full.length).toBeGreaterThan(0);
      expect(res.relative).toBe("just now");
    });

    it("formats relative timestamps accurately", () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 30 * 1000)).toBe("just now");
      expect(formatRelativeTime(now - 15 * 60 * 1000)).toBe("15m ago");
      expect(formatRelativeTime(now - 4 * 3600 * 1000)).toBe("4h ago");
      expect(formatRelativeTime(now - 25 * 3600 * 1000)).toBe("yesterday");
    });

    it("assigns correct timeline buckets", () => {
      const now = Date.now();
      expect(getTimelineBucket(now)).toBe("Today");
      expect(getTimelineBucket(now - 24 * 3600 * 1000)).toBe("Yesterday");
      expect(getTimelineBucket(now - 10 * 24 * 3600 * 1000)).toBe("Earlier");
    });
  });

  describe("Text Fragment Generator (META-2)", () => {
    it("generates valid Scroll to Text Fragment URLs", () => {
      const url = "https://react.dev/reference/react/useEffect";
      const code = "useEffect(() => {\n  const sub = api.subscribe();\n  return () => sub.unsubscribe();\n}, []);";
      const fragUrl = generateTextFragmentUrl(url, code);
      expect(fragUrl).toContain("#:~:text=");
      expect(fragUrl.startsWith("https://react.dev/reference/react/useEffect#:~:text=")).toBe(true);
    });
  });

  describe("Secret Scanner (CLIP-4, PRIV-3, CODE-5)", () => {
    it("detects AWS Access Keys", () => {
      const text = "const awsKey = 'AKIAIOSFODNN7EXAMPLE';";
      const findings = scanForSecrets(text);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].type).toBe("AWS_ACCESS_KEY");
      expect(findings[0].match).toContain("••••"); // masked for safety
    });

    it("detects GitHub PATs", () => {
      const text = "GITHUB_TOKEN=ghp_ABC123456789012345678901234567890123";
      expect(containsSecrets(text)).toBe(true);
      const findings = scanForSecrets(text);
      expect(findings.some((f) => f.type === "GITHUB_TOKEN")).toBe(true);
    });

    it("detects database connection passwords", () => {
      const text = "postgres://admin:superSecretP@ss123@db.internal:5432/production";
      const findings = scanForSecrets(text);
      expect(findings.some((f) => f.type === "CONNECTION_PASSWORD")).toBe(true);
    });

    it("calculates Shannon entropy", () => {
      const lowEntropy = "aaaaaaaaaaaa";
      const highEntropy = "xK9#m$L2!zQ8@vP1";
      expect(calculateShannonEntropy(highEntropy)).toBeGreaterThan(calculateShannonEntropy(lowEntropy));
    });
  });

  describe("Quick-Share Codes (CODE-1..CODE-6)", () => {
    it("generates 4-digit random codes under normal load", () => {
      const code = generateQuickCode(50);
      expect(code.length).toBe(4);
      expect(/^\d{4}$/.test(code)).toBe(true);
    });

    it("automatically widens to 6-digit codes when active pool > 5000", () => {
      const code = generateQuickCode(5001);
      expect(code.length).toBe(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
    });

    it("performs constant-time string comparison", () => {
      expect(timingSafeEqual("1234", "1234")).toBe(true);
      expect(timingSafeEqual("1234", "1235")).toBe(false);
      expect(timingSafeEqual("1234", "123")).toBe(false);
    });

    it("validates code and enforces single-claim limit", () => {
      const map = new Map<string, QuickSharePayload>();
      const payload: QuickSharePayload = {
        code: "4821",
        targetId: "snip-1",
        type: "snippet",
        authorName: "Alice",
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
        maxClaims: 1,
        claimCount: 0,
        stripSourceUrl: false,
        content: { title: "Test", code: "const x = 1;", language: "typescript" },
      };
      map.set("4821", payload);

      const res1 = verifyQuickCode("4821", map, "client-a");
      expect(res1.valid).toBe(true);
      expect(res1.payload?.content.title).toBe("Test");

      // Second claim should fail with CLAIM_LIMIT_REACHED
      const res2 = verifyQuickCode("4821", map, "client-b");
      expect(res2.valid).toBe(false);
      expect(res2.error).toBe("CLAIM_LIMIT_REACHED");
    });

    it("locks out clients after 5 failed attempts", () => {
      const map = new Map<string, QuickSharePayload>();
      const client = "attacker-ip";

      for (let i = 0; i < 5; i++) {
        verifyQuickCode("9999", map, client);
      }

      const lockedRes = verifyQuickCode("9999", map, client);
      expect(lockedRes.valid).toBe(false);
      expect(lockedRes.error).toBe("RATE_LIMITED");
    });
  });

  describe("Hybrid Logical Clock (HLC) (SYNC-3)", () => {
    it("preserves monotonicity even with backwards physical clock", () => {
      const hlc = new HybridLogicalClock("node-1");
      const t1 = hlc.now(1000);
      const t2 = hlc.now(900); // physical clock jumps backward
      expect(HybridLogicalClock.compare(t2, t1)).toBeGreaterThan(0);
      expect(t2.millis).toBe(1000);
      expect(t2.counter).toBe(1);
    });

    it("causally updates upon receiving remote message", () => {
      const hlcA = new HybridLogicalClock("node-a");
      const hlcB = new HybridLogicalClock("node-b");

      const tsA = hlcA.now(1500);
      const tsB = hlcB.update(tsA, 1200);

      expect(HybridLogicalClock.compare(tsB, tsA)).toBeGreaterThan(0);
      expect(tsB.millis).toBe(1500);
    });
  });

  describe("Sync Engine (SYNC-1..SYNC-5)", () => {
    it("queues local mutations to durable outbox", () => {
      const engine = new SyncEngine("device-work");
      const snippet = makeSnippet({
        title: "Test",
        code: "test()",
        raw: "test()",
        language: "javascript",
        context: { sourceUrl: "", pageTitle: "", domain: "", capturedAt: Date.now() },
      });

      const mutation = engine.queueUpsert(snippet);
      expect(engine.getStatus().pendingOutboxCount).toBe(1);
      expect(mutation.data.id).toBe(snippet.id);

      engine.acknowledgeMutation(mutation.id);
      expect(engine.getStatus().pendingOutboxCount).toBe(0);
      expect(engine.getStatus().state).toBe("synced");
    });

    it("performs field-level merge without silent data loss", () => {
      const engine = new SyncEngine("device-work");
      const local = makeSnippet({
        title: "Local Title",
        code: "const x = 1;",
        raw: "const x = 1;",
        language: "typescript",
        tags: ["local"],
        context: { sourceUrl: "https://local.dev", pageTitle: "", domain: "local.dev", capturedAt: 1000 },
      });
      const remote = makeSnippet({
        title: "Remote Title",
        code: "const x = 2;",
        raw: "const x = 2;",
        language: "typescript",
        tags: ["remote"],
        context: { sourceUrl: "https://remote.dev", pageTitle: "", domain: "remote.dev", capturedAt: 1000 },
      });

      const remoteTs = { millis: 2000, counter: 0, nodeId: "device-home" };
      const merged = engine.mergeSnippet(local, remote, remoteTs);

      expect(merged.tags).toContain("local");
      expect(merged.tags).toContain("remote");
      expect(merged.title).toBe("Remote Title");
    });
  });

  describe("OAuth PKCE & Identity (AUTH-1..AUTH-5)", () => {
    it("generates valid PKCE S256 parameters", async () => {
      const pkce = await generatePKCE();
      expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(pkce.codeChallenge.length).toBeGreaterThan(0);
      expect(pkce.state.length).toBeGreaterThan(0);
      expect(pkce.nonce.length).toBeGreaterThan(0);
    });

    it("validates OAuth callback state matching", () => {
      const validUrl = "https://app.kuracode.dev/auth/callback?code=valid_code_123&state=state_secret_abc";
      const valid = validateOAuthCallback(validUrl, "state_secret_abc");
      expect(valid.code).toBe("valid_code_123");

      const tamperedUrl = "https://app.kuracode.dev/auth/callback?code=valid_code_123&state=wrong_state";
      const invalid = validateOAuthCallback(tamperedUrl, "state_secret_abc");
      expect(invalid.error).toContain("OAuth state mismatch");
    });
  });

  describe("Clipboard Hub (CLIP-1..CLIP-6)", () => {
    it("starts with sync strictly disabled by default", () => {
      const hub = new ClipboardHubManager();
      expect(hub.getPreferences().syncEnabled).toBe(false);
    });

    it("adds clipboard items and flags detected secrets", () => {
      const hub = new ClipboardHubManager();
      const item1 = hub.addItem("clean text content for testing");
      expect(item1.hasSecret).toBe(false);

      const item2 = hub.addItem("const token = 'ghp_123456789012345678901234567890123456';");
      expect(item2.hasSecret).toBe(true);
      expect(item2.secretTypes).toContain("GITHUB_TOKEN");
    });

    it("preserves pinned items during retention pruning", () => {
      const hub = new ClipboardHubManager();
      const item = hub.addItem("important secret snippet");
      hub.togglePin(item.id);

      // Advance time past expiry
      const future = Date.now() + 100 * 24 * 3600 * 1000;
      const pruned = hub.pruneExpired(future);
      expect(pruned).toBe(0); // pinned item not pruned
      expect(hub.listItems().length).toBe(1);
    });

    it("converts clipboard item to permanent snippet", () => {
      const hub = new ClipboardHubManager();
      const item = hub.addItem("function test() { return true; }", { domain: "github.com" });
      const snippet = hub.convertToSnippet(item.id, "typescript");

      expect(snippet).not.toBeNull();
      expect(snippet?.language).toBe("typescript");
      expect(snippet?.code).toBe("function test() { return true; }");
    });
  });

  describe("Workplaces & RBAC (WS-1..WS-3)", () => {
    it("enforces strict role-based permission matrix", () => {
      expect(canPerformAction("owner", "delete")).toBe(true);
      expect(canPerformAction("owner", "transfer_ownership")).toBe(true);

      expect(canPerformAction("admin", "delete")).toBe(true);
      expect(canPerformAction("admin", "transfer_ownership")).toBe(false);

      expect(canPerformAction("editor", "edit")).toBe(true);
      expect(canPerformAction("editor", "delete")).toBe(false);

      expect(canPerformAction("viewer", "view")).toBe(true);
      expect(canPerformAction("viewer", "edit")).toBe(false);
    });

    it("maintains separate workplace instances", () => {
      const mgr = new WorkplaceManager();
      expect(mgr.getActiveWorkplaceId()).toBeNull(); // Personal space

      const ws = mgr.createWorkplace("Core Engineering", {
        id: "usr-1",
        email: "alice@company.com",
        name: "Alice",
      });
      expect(ws.name).toBe("Core Engineering");
      expect(ws.members[0].role).toBe("owner");

      mgr.setActiveWorkplaceId(ws.id);
      expect(mgr.getActiveWorkplaceId()).toBe(ws.id);
    });
  });
});
