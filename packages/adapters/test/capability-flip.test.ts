import { describe, it, expect } from "vitest";
import { evaluateCapabilities } from "@kuracode/config";

describe("Dynamic Capability Switcher & Graceful Fallback", () => {
  it("starts in Zero-Account mode with zero external services enabled", () => {
    const caps = evaluateCapabilities({});
    expect(caps["auth.google"].status).toBe("DISABLED_MISSING_CONFIG");
    expect(caps["auth.github"].status).toBe("DISABLED_MISSING_CONFIG");
    expect(caps["auth.gitlab"].status).toBe("DISABLED_MISSING_CONFIG");
    expect(caps["auth.microsoft"].status).toBe("DISABLED_MISSING_CONFIG");
    expect(caps["db.cloud"].status).toBe("DEGRADED");
    expect(caps["email.send"].status).toBe("DEGRADED");
    expect(caps["ratelimit.redis"].status).toBe("DEGRADED");
    expect(caps["captcha"].status).toBe("DEGRADED");
    expect(caps["errors.sentry"].status).toBe("DEGRADED");
    expect(caps["uptime.status"].status).toBe("DEGRADED");
  });

  it("dynamically flips 'auth.github' to ENABLED when GitHub Client ID is provided, and drops back when removed", () => {
    // 1. Add GitHub key
    const withGithub = evaluateCapabilities({
      PUBLIC_GITHUB_CLIENT_ID: "gh_client_id_valid",
    });
    expect(withGithub["auth.github"].status).toBe("ENABLED");
    expect(withGithub["auth.google"].status).toBe("DISABLED_MISSING_CONFIG");

    // 2. Remove key -> drops cleanly back to DISABLED_MISSING_CONFIG without code changes
    const withoutGithub = evaluateCapabilities({});
    expect(withoutGithub["auth.github"].status).toBe("DISABLED_MISSING_CONFIG");
  });

  it("dynamically flips 'db.cloud' and 'realtime' to ENABLED when Supabase is connected", () => {
    const withSupabase = evaluateCapabilities({
      PUBLIC_SUPABASE_URL: "https://kuracode.supabase.co",
      PUBLIC_SUPABASE_ANON_KEY: "anon_jwt_token_valid",
    });
    expect(withSupabase["db.cloud"].status).toBe("ENABLED");
    expect(withSupabase["realtime"].status).toBe("ENABLED");
    expect(withSupabase["storage.cloud"].status).toBe("ENABLED");

    // When removed, falls back to DEGRADED (local offline storage)
    const withoutSupabase = evaluateCapabilities({});
    expect(withoutSupabase["db.cloud"].status).toBe("DEGRADED");
    expect(withoutSupabase["realtime"].status).toBe("DEGRADED");
  });

  it("dynamically flips 'email.send' to ENABLED when Resend API key is supplied", () => {
    const withResend = evaluateCapabilities({
      RESEND_API_KEY: "re_mock_valid_key",
    });
    expect(withResend["email.send"].status).toBe("ENABLED");
    expect(withResend["auth.magiclink"].status).toBe("ENABLED");

    // When removed, falls back to DEGRADED (link-only invite)
    const withoutResend = evaluateCapabilities({});
    expect(withoutResend["email.send"].status).toBe("DEGRADED");
    expect(withoutResend["auth.magiclink"].status).toBe("DEGRADED");
  });

  it("dynamically flips 'ratelimit.redis' to ENABLED when Upstash Redis is supplied", () => {
    const withUpstash = evaluateCapabilities({
      UPSTASH_REDIS_REST_URL: "https://redis.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "upstash_token_valid",
    });
    expect(withUpstash["ratelimit.redis"].status).toBe("ENABLED");

    // When removed, falls back to DEGRADED (in-memory sliding window)
    const withoutUpstash = evaluateCapabilities({});
    expect(withoutUpstash["ratelimit.redis"].status).toBe("DEGRADED");
  });

  it("dynamically flips 'captcha' to ENABLED when Turnstile site key and secret are supplied", () => {
    const withTurnstile = evaluateCapabilities({
      PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAA...",
      TURNSTILE_SECRET_KEY: "0x4AAAAAA...",
    });
    expect(withTurnstile["captcha"].status).toBe("ENABLED");

    // When removed, falls back to DEGRADED (IP rate limiting)
    const withoutTurnstile = evaluateCapabilities({});
    expect(withoutTurnstile["captcha"].status).toBe("DEGRADED");
  });

  it("dynamically flips 'errors.sentry' to ENABLED when Sentry DSN is supplied", () => {
    const withSentry = evaluateCapabilities({
      PUBLIC_SENTRY_DSN: "https://abc@o123.ingest.sentry.io/456",
    });
    expect(withSentry["errors.sentry"].status).toBe("ENABLED");

    // When removed, falls back to DEGRADED (local logging)
    const withoutSentry = evaluateCapabilities({});
    expect(withoutSentry["errors.sentry"].status).toBe("DEGRADED");
  });

  it("dynamically flips 'uptime.status' to ENABLED when UptimeRobot heartbeat is supplied", () => {
    const withUptime = evaluateCapabilities({
      UPTIMEROBOT_HEARTBEAT_URL: "https://heartbeat.uptimerobot.com/abc-123",
    });
    expect(withUptime["uptime.status"].status).toBe("ENABLED");

    // When removed, falls back to DEGRADED (internal /healthz)
    const withoutUptime = evaluateCapabilities({});
    expect(withoutUptime["uptime.status"].status).toBe("DEGRADED");
  });
});

