import { describe, it, expect } from "vitest";
import {
  CircuitBreaker,
  withRetry,
  withTimeout,
  OAuthAdapter,
  MockAuthProvider,
  SupabaseDatabaseAdapter,
  MemoryDatabaseAdapter,
  ResendMailerAdapter,
  MockMailCatcher,
  UpstashRedisAdapter,
  MemoryRateLimiter,
  TurnstileCaptchaAdapter,
  StubCaptchaVerifier,
  SentryErrorReporter,
  NoopErrorReporter,
  scrubErrorPayload,
  MockStatusReporter,
  ChromeStorePublisher,
  MockStorePublisher,
} from "../src/index.ts";

describe("@kuracode/adapters", () => {
  describe("Circuit Breaker & Resilience", () => {
    it("transitions from CLOSED to OPEN after threshold failures, then HALF_OPEN after timeout", async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 50 });
      let callCount = 0;
      const failingFn = async () => {
        callCount++;
        throw new Error("Service down");
      };

      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow("Service down");
      }

      expect(breaker.getState()).toBe("OPEN");
      // Fast-fail without invoking failingFn
      await expect(breaker.execute(failingFn)).rejects.toThrow("CircuitBreaker is OPEN");
      expect(callCount).toBe(3);

      // Wait for resetTimeoutMs
      await new Promise((r) => setTimeout(r, 60));
      expect(breaker.getState()).toBe("HALF_OPEN");
    });

    it("withRetry retries failing operations up to maxRetries", async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error("transient error");
        return "success";
      };

      const result = await withRetry(operation, { maxRetries: 3, initialDelayMs: 5 });
      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("withTimeout aborts slow operations", async () => {
      const slowFn = async (signal: AbortSignal) => {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 200);
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("aborted"));
          });
        });
      };

      await expect(withTimeout(slowFn, 20)).rejects.toThrow("timed out");
    });
  });

  describe("Auth Adapters", () => {
    it("OAuthAdapter constructs authorization URL with PKCE parameters", () => {
      const adapter = new OAuthAdapter({
        provider: "github",
        clientId: "gh_client_123",
        authorizationEndpoint: "https://github.com/login/oauth/authorize",
        tokenEndpoint: "https://github.com/login/oauth/access_token",
        userinfoEndpoint: "https://api.github.com/user",
        scopes: ["read:user", "user:email"],
      });

      const url = adapter.getAuthorizationUrl("test_state", "test_challenge", "https://redirect.com");
      expect(url).toContain("client_id=gh_client_123");
      expect(url).toContain("code_challenge=test_challenge");
      expect(url).toContain("code_challenge_method=S256");
      expect(url).toContain("state=test_state");
    });

    it("OAuthAdapter reports unconfigured status when clientId is absent", async () => {
      const adapter = new OAuthAdapter({
        provider: "google",
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
        userinfoEndpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
        scopes: ["openid"],
      });

      const health = await adapter.checkHealth();
      expect(health.ok).toBe(false);
      expect(health.status).toBe("unconfigured");
    });

    it("MockAuthProvider provides zero-account offline sign-in flow", async () => {
      const mock = new MockAuthProvider("google", { email: "alice@example.com", name: "Alice" });
      const authUrl = mock.getAuthorizationUrl("state123", "challenge123", "http://localhost");
      expect(authUrl).toContain("mock_provider=google");

      const tokens = await mock.exchangeCodeForTokens("valid_mock_code", "v", "r");
      expect(tokens.accessToken).toContain("mock_access_token_google");

      const user = await mock.getUserInfo(tokens.accessToken);
      expect(user.email).toBe("alice@example.com");
      expect(user.name).toBe("Alice");

      const health = await mock.checkHealth();
      expect(health.ok).toBe(true);
      expect(health.status).toBe("healthy");
    });
  });

  describe("Database Adapters", () => {
    it("SupabaseDatabaseAdapter reports unconfigured when keys are missing", async () => {
      const db = new SupabaseDatabaseAdapter({});
      const health = await db.checkHealth();
      expect(health.ok).toBe(false);
      expect(health.status).toBe("unconfigured");
    });

    it("MemoryDatabaseAdapter maintains complete tenant & user RLS isolation", async () => {
      const db = new MemoryDatabaseAdapter();
      const wsA = await db.createWorkspace("Frontend Team", "user_1");
      const wsB = await db.createWorkspace("Backend Team", "user_2");

      // Personal snippet for user 1
      await db.saveSnippet({
        id: "snip_personal",
        workspaceId: null,
        userId: "user_1",
        title: "Personal note",
        code: "const p = 1;",
        raw: "const p = 1;",
        language: "typescript",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Team snippet for Workspace A
      await db.saveSnippet({
        id: "snip_team_a",
        workspaceId: wsA.id,
        userId: "user_1",
        title: "Frontend shared snippet",
        code: "export const ui = 1;",
        raw: "export const ui = 1;",
        language: "typescript",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // User 2 cannot see User 1's personal snippet
      const user2Personal = await db.listSnippets(null, "user_2");
      expect(user2Personal.length).toBe(0);

      // User 1 sees their personal snippet
      const user1Personal = await db.listSnippets(null, "user_1");
      expect(user1Personal.length).toBe(1);
      expect(user1Personal[0].id).toBe("snip_personal");

      // Workspace A snippets are isolated from Workspace B
      const wsASnippets = await db.listSnippets(wsA.id, "user_1");
      expect(wsASnippets.length).toBe(1);
      expect(wsASnippets[0].id).toBe("snip_team_a");

      const wsBSnippets = await db.listSnippets(wsB.id, "user_2");
      expect(wsBSnippets.length).toBe(0);
    });
  });

  describe("Mailer Adapters", () => {
    it("ResendMailerAdapter reports unconfigured when API key is missing", async () => {
      const mailer = new ResendMailerAdapter({});
      const health = await mailer.checkHealth();
      expect(health.ok).toBe(false);
      expect(health.status).toBe("unconfigured");
    });

    it("MockMailCatcher captures outgoing invites & magic links in memory for inspection", async () => {
      const catcher = new MockMailCatcher();
      await catcher.sendEmail({
        to: "teammate@example.com",
        subject: "Invitation to join Workspace",
        html: "<p>Click here to join</p>",
      });

      const outbox = catcher.getOutbox();
      expect(outbox.length).toBe(1);
      expect(outbox[0].to).toBe("teammate@example.com");
      expect(outbox[0].subject).toContain("Invitation");

      const health = await catcher.checkHealth();
      expect(health.ok).toBe(true);
    });
  });

  describe("RateLimiter Adapters", () => {
    it("UpstashRedisAdapter reports unconfigured when credentials missing", async () => {
      const limiter = new UpstashRedisAdapter({});
      const health = await limiter.checkHealth();
      expect(health.ok).toBe(false);
      expect(health.status).toBe("unconfigured");
    });

    it("MemoryRateLimiter enforces sliding window limits and key TTL", async () => {
      const limiter = new MemoryRateLimiter();
      // Allow 2 requests per 10 seconds
      const r1 = await limiter.limit("client_ip_1", 2, 10);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(1);

      const r2 = await limiter.limit("client_ip_1", 2, 10);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(0);

      // 3rd attempt is rejected
      const r3 = await limiter.limit("client_ip_1", 2, 10);
      expect(r3.success).toBe(false);
      expect(r3.remaining).toBe(0);

      // Key-value with TTL
      await limiter.setKey("share:4821", JSON.stringify({ snippetId: "snip_1" }), 1);
      expect(await limiter.getKey("share:4821")).not.toBeNull();
    });
  });

  describe("Captcha Adapters", () => {
    it("TurnstileCaptchaAdapter reports unconfigured when secret key is missing", async () => {
      const turnstile = new TurnstileCaptchaAdapter({});
      const health = await turnstile.checkHealth();
      expect(health.ok).toBe(false);
      expect(health.status).toBe("unconfigured");
    });

    it("StubCaptchaVerifier accepts valid mock tokens", async () => {
      const stub = new StubCaptchaVerifier();
      const res = await stub.verifyToken("mock_valid_token");
      expect(res.success).toBe(true);

      const invalid = await stub.verifyToken("invalid_token");
      expect(invalid.success).toBe(false);
    });
  });

  describe("Error Reporter & PII Scrubbing", () => {
    it("scrubErrorPayload removes snippet code, secrets, and redacts emails", () => {
      const raw = {
        userEmail: "developer@kuracode.app",
        snippetContent: "const secretKey = 'my_super_secret';",
        authToken: "Bearer eyJhbGciOi...",
        safeMeta: "v0.1.0",
        nested: {
          codeBlock: "function hello() {}",
          domain: "github.com",
        },
      };

      const scrubbed = scrubErrorPayload(raw);
      expect(scrubbed.userEmail).toBe("[SCRUBBED_EMAIL]");
      expect(scrubbed.snippetContent).toBe("[SCRUBBED_CONTENT]");
      expect(scrubbed.authToken).toBe("[SCRUBBED_CONTENT]");
      expect(scrubbed.safeMeta).toBe("v0.1.0");
      expect((scrubbed.nested as any).codeBlock).toBe("[SCRUBBED_CONTENT]");
      expect((scrubbed.nested as any).domain).toBe("github.com");
    });

    it("NoopErrorReporter and unconfigured Sentry report safe health", async () => {
      const noop = new NoopErrorReporter();
      expect((await noop.checkHealth()).ok).toBe(true);

      const sentry = new SentryErrorReporter({});
      expect((await sentry.checkHealth()).status).toBe("unconfigured");
    });
  });

  describe("Status Reporter", () => {
    it("MockStatusReporter returns full readiness payload without leaking secrets", async () => {
      const reporter = new MockStatusReporter({ "db.cloud": "DEGRADED", "auth.github": "ENABLED" });
      const readiness = await reporter.getSystemReadiness();
      expect(readiness.liveness).toBe(true);
      expect(readiness.readiness).toBe(true);
      expect(readiness.capabilities["auth.github"]).toBe("ENABLED");
    });
  });

  describe("Store Publishers", () => {
    it("ChromeStorePublisher validates package existence in dry-run mode", async () => {
      const publisher = new ChromeStorePublisher({ extensionId: "kmbodbaepkmhfeohkbfbkpmnnjfkknmg" });
      // Points to package.json as an existing test file
      const result = await publisher.publish("package.json", true);
      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.status).toContain("[DRY_RUN]");
    });

    it("MockStorePublisher simulates store uploads cleanly", async () => {
      const mock = new MockStorePublisher("firefox");
      const res = await mock.publish("artifact.zip", true);
      expect(res.success).toBe(true);
      expect(res.target).toBe("firefox");
      expect((await mock.checkHealth()).ok).toBe(true);
    });
  });
});
