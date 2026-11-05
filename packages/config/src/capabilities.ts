import type { FullEnv } from "./schema.ts";

export type CapabilityName =
  | "auth.google"
  | "auth.github"
  | "auth.gitlab"
  | "auth.microsoft"
  | "auth.magiclink"
  | "email.send"
  | "db.cloud"
  | "realtime"
  | "storage.cloud"
  | "ratelimit.redis"
  | "captcha"
  | "errors.sentry"
  | "uptime.status"
  | "store.chrome"
  | "store.edge"
  | "store.firefox";

export type CapabilityStatus =
  | "ENABLED"
  | "DISABLED_MISSING_CONFIG"
  | "DISABLED_BY_OWNER"
  | "DEGRADED";

export interface CapabilityInfo {
  name: CapabilityName;
  status: CapabilityStatus;
  description: string;
  requiredVars: string[];
  missingVars: string[];
  fallbackStrategy?: string;
  guideLink: string;
}

export type CapabilityRegistry = Record<CapabilityName, CapabilityInfo>;

/**
 * Evaluates the full environment against the 16 defined service capabilities.
 */
export function evaluateCapabilities(env: Partial<FullEnv> = process.env as any): CapabilityRegistry {
  const isOwnerDisabled = (key: string) => {
    const val = env[key as keyof FullEnv];
    return val === "true" || val === "1";
  };

  const check = (
    name: CapabilityName,
    description: string,
    disableFlag: string | null,
    required: string[],
    fallback?: string,
    guide = `docs/setup/${name.replace(".", "-")}.md`
  ): CapabilityInfo => {
    if (disableFlag && isOwnerDisabled(disableFlag)) {
      return {
        name,
        status: "DISABLED_BY_OWNER",
        description,
        requiredVars: required,
        missingVars: [],
        fallbackStrategy: fallback,
        guideLink: guide,
      };
    }

    const missing = required.filter((v) => !env[v as keyof FullEnv] || env[v as keyof FullEnv]?.trim() === "");

    if (missing.length === 0) {
      return {
        name,
        status: "ENABLED",
        description,
        requiredVars: required,
        missingVars: [],
        fallbackStrategy: fallback,
        guideLink: guide,
      };
    }

    // If missing but has a functional fallback, it's DEGRADED; otherwise DISABLED_MISSING_CONFIG
    const status: CapabilityStatus = fallback ? "DEGRADED" : "DISABLED_MISSING_CONFIG";
    return {
      name,
      status,
      description,
      requiredVars: required,
      missingVars: missing,
      fallbackStrategy: fallback,
      guideLink: guide,
    };
  };

  return {
    "auth.google": check(
      "auth.google",
      "One-click sign-in with Google OAuth 2.0 / OIDC",
      "DISABLE_AUTH_GOOGLE",
      ["PUBLIC_GOOGLE_CLIENT_ID"],
      undefined,
      "docs/setup/02-google-cloud.md"
    ),
    "auth.github": check(
      "auth.github",
      "One-click sign-in with GitHub OAuth App",
      "DISABLE_AUTH_GITHUB",
      ["PUBLIC_GITHUB_CLIENT_ID"],
      undefined,
      "docs/setup/01-github.md"
    ),
    "auth.gitlab": check(
      "auth.gitlab",
      "Sign-in with GitLab OAuth App",
      "DISABLE_AUTH_GITLAB",
      ["PUBLIC_GITLAB_CLIENT_ID"],
      undefined,
      "docs/setup/09-gitlab-microsoft.md"
    ),
    "auth.microsoft": check(
      "auth.microsoft",
      "Sign-in with Microsoft Azure Entra OAuth",
      "DISABLE_AUTH_MICROSOFT",
      ["PUBLIC_MICROSOFT_CLIENT_ID"],
      undefined,
      "docs/setup/09-gitlab-microsoft.md"
    ),
    "auth.magiclink": check(
      "auth.magiclink",
      "Passwordless email magic link sign-in",
      "DISABLE_AUTH_MAGICLINK",
      ["RESEND_API_KEY"],
      "Disabled; users sign in via OAuth or use local-only offline mode",
      "docs/setup/05-resend.md"
    ),
    "email.send": check(
      "email.send",
      "Transactional emails (invites, alerts, magic links) via Resend",
      "DISABLE_EMAIL_SEND",
      ["RESEND_API_KEY"],
      "Workspace invite by link only; local mail catcher in development",
      "docs/setup/05-resend.md"
    ),
    "db.cloud": check(
      "db.cloud",
      "Cloud PostgreSQL storage with Row-Level Security via Supabase",
      "DISABLE_DB_CLOUD",
      ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"],
      "Local-only storage via browser storage/IndexedDB with manual JSON export",
      "docs/setup/04-supabase.md"
    ),
    "realtime": check(
      "realtime",
      "Real-time WebSocket synchronization across devices & collaborators",
      "DISABLE_REALTIME",
      ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"],
      "Offline mutation queue with local polling and manual refresh",
      "docs/setup/04-supabase.md"
    ),
    "storage.cloud": check(
      "storage.cloud",
      "Cloud asset storage for avatars and attachment blobs",
      "DISABLE_STORAGE_CLOUD",
      ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"],
      "Inline SVG & local data URIs",
      "docs/setup/04-supabase.md"
    ),
    "ratelimit.redis": check(
      "ratelimit.redis",
      "Distributed atomic rate limiting and short-code cache via Upstash Redis",
      "DISABLE_RATELIMIT_REDIS",
      ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      "In-memory sliding window or Postgres-based counter table",
      "docs/setup/07-upstash-redis.md"
    ),
    "captcha": check(
      "captcha",
      "Bot protection on anonymous code claiming via Cloudflare Turnstile",
      "DISABLE_CAPTCHA",
      ["PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
      "Strict IP/device rate limiting and exponential brute-force lockout",
      "docs/setup/03-cloudflare.md"
    ),
    "errors.sentry": check(
      "errors.sentry",
      "Application error monitoring for Web App and Edge API via Sentry",
      "DISABLE_ERRORS_SENTRY",
      ["PUBLIC_SENTRY_DSN"],
      "Local structured console logging and diagnostic bundle export",
      "docs/setup/06-sentry.md"
    ),
    "uptime.status": check(
      "uptime.status",
      "External uptime monitoring and public status page via UptimeRobot",
      "DISABLE_UPTIME_STATUS",
      ["UPTIMEROBOT_HEARTBEAT_URL"],
      "Built-in /healthz and /readyz liveness/readiness probes",
      "docs/setup/08-uptimerobot.md"
    ),
    "store.chrome": check(
      "store.chrome",
      "Automated publication to Chrome Web Store via Chrome Web Store API",
      null,
      ["CHROME_EXTENSION_ID", "CHROME_CLIENT_ID", "CHROME_CLIENT_SECRET", "CHROME_REFRESH_TOKEN"],
      "Manual upload of kuracode-chrome-<version>.zip in developer dashboard",
      "docs/setup/10-stores.md"
    ),
    "store.edge": check(
      "store.edge",
      "Automated publication to Microsoft Edge Add-ons via Partner Center API",
      null,
      ["EDGE_PRODUCT_ID", "EDGE_CLIENT_ID", "EDGE_API_KEY"],
      "Manual upload of kuracode-edge-<version>.zip in Partner Center",
      "docs/setup/10-stores.md"
    ),
    "store.firefox": check(
      "store.firefox",
      "Automated publication to Mozilla Add-ons (AMO) via addons.mozilla.org API",
      null,
      ["FIREFOX_API_KEY", "FIREFOX_API_SECRET", "FIREFOX_EXTENSION_ID"],
      "Manual upload of kuracode-firefox-<version>.zip on AMO dashboard",
      "docs/setup/10-stores.md"
    ),
  };
}
