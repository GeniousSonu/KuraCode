#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  OAuthAdapter,
  SupabaseDatabaseAdapter,
  ResendMailerAdapter,
  UpstashRedisAdapter,
  TurnstileCaptchaAdapter,
  SentryErrorReporter,
  UptimeRobotReporter,
  ChromeStorePublisher,
  EdgeStorePublisher,
  FirefoxAmoPublisher,
  type HealthCheckResult,
} from "@kuracode/adapters";

// Safely load .env.local without echoing secrets
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const serviceArg = (process.argv[2] || "").toLowerCase().trim();

if (!serviceArg || serviceArg === "--help" || serviceArg === "-h") {
  console.info(`
Usage: pnpm setup:test <service>

Available services:
  github        Google Cloud / GitHub OAuth App
  google        Google Cloud Console OAuth
  cloudflare    Cloudflare Turnstile & Pages
  supabase      Supabase PostgreSQL & Realtime
  resend        Resend Transactional Email
  sentry        Sentry Error Tracking
  upstash       Upstash Redis
  uptimerobot   UptimeRobot Heartbeat
  gitlab        GitLab OAuth
  microsoft     Microsoft Azure Entra
  chrome        Chrome Web Store API
  edge          Edge Partner Center API
  firefox       Mozilla AMO API
  all           Test all services sequentially
`);
  process.exit(0);
}

async function testService(service: string): Promise<HealthCheckResult> {
  switch (service) {
    case "github": {
      const adapter = new OAuthAdapter({
        provider: "github",
        clientId: process.env.PUBLIC_GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        authorizationEndpoint: "https://github.com/login/oauth/authorize",
        tokenEndpoint: "https://github.com/login/oauth/access_token",
        userinfoEndpoint: "https://api.github.com/user",
        scopes: ["read:user", "user:email"],
      });
      return adapter.checkHealth();
    }
    case "google": {
      const adapter = new OAuthAdapter({
        provider: "google",
        clientId: process.env.PUBLIC_GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
        userinfoEndpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
        scopes: ["openid", "email", "profile"],
      });
      return adapter.checkHealth();
    }
    case "cloudflare": {
      const adapter = new TurnstileCaptchaAdapter({
        secretKey: process.env.TURNSTILE_SECRET_KEY,
      });
      return adapter.checkHealth();
    }
    case "supabase": {
      const adapter = new SupabaseDatabaseAdapter({
        supabaseUrl: process.env.PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.PUBLIC_SUPABASE_ANON_KEY,
      });
      return adapter.checkHealth();
    }
    case "resend": {
      const adapter = new ResendMailerAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFrom: process.env.EMAIL_FROM_ADDRESS,
      });
      return adapter.checkHealth();
    }
    case "sentry": {
      const adapter = new SentryErrorReporter({
        dsn: process.env.PUBLIC_SENTRY_DSN || process.env.SENTRY_SERVER_DSN,
      });
      return adapter.checkHealth();
    }
    case "upstash": {
      const adapter = new UpstashRedisAdapter({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return adapter.checkHealth();
    }
    case "uptimerobot": {
      const adapter = new UptimeRobotReporter({
        heartbeatUrl: process.env.UPTIMEROBOT_HEARTBEAT_URL,
        getCapabilities: () => ({}),
      });
      return adapter.checkHealth();
    }
    case "gitlab": {
      const adapter = new OAuthAdapter({
        provider: "gitlab",
        clientId: process.env.PUBLIC_GITLAB_CLIENT_ID,
        authorizationEndpoint: "https://gitlab.com/oauth/authorize",
        tokenEndpoint: "https://gitlab.com/oauth/token",
        userinfoEndpoint: "https://gitlab.com/api/v4/user",
        scopes: ["read_user", "openid"],
      });
      return adapter.checkHealth();
    }
    case "microsoft": {
      const adapter = new OAuthAdapter({
        provider: "microsoft",
        clientId: process.env.PUBLIC_MICROSOFT_CLIENT_ID,
        authorizationEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        userinfoEndpoint: "https://graph.microsoft.com/v1.0/me",
        scopes: ["User.Read", "openid"],
      });
      return adapter.checkHealth();
    }
    case "chrome": {
      const publisher = new ChromeStorePublisher({
        extensionId: process.env.CHROME_EXTENSION_ID,
        clientId: process.env.CHROME_CLIENT_ID,
        clientSecret: process.env.CHROME_CLIENT_SECRET,
        refreshToken: process.env.CHROME_REFRESH_TOKEN,
      });
      return publisher.checkHealth();
    }
    case "edge": {
      const publisher = new EdgeStorePublisher({
        productId: process.env.EDGE_PRODUCT_ID,
        clientId: process.env.EDGE_CLIENT_ID,
        apiKey: process.env.EDGE_API_KEY,
      });
      return publisher.checkHealth();
    }
    case "firefox": {
      const publisher = new FirefoxAmoPublisher({
        apiKey: process.env.FIREFOX_API_KEY,
        apiSecret: process.env.FIREFOX_API_SECRET,
        extensionId: process.env.FIREFOX_EXTENSION_ID,
      });
      return publisher.checkHealth();
    }
    default:
      throw new Error(`Unknown service: '${service}'. Run with --help to list services.`);
  }
}

async function run() {
  const servicesToTest = serviceArg === "all"
    ? ["github", "google", "cloudflare", "supabase", "resend", "sentry", "upstash", "uptimerobot", "gitlab", "microsoft", "chrome", "edge", "firefox"]
    : [serviceArg];

  console.info(`\nTesting service connectivity & credentials for: ${servicesToTest.join(", ")}...\n`);

  for (const s of servicesToTest) {
    try {
      const result = await testService(s);
      if (result.status === "healthy") {
        console.info(`  \x1b[32m✔ [ENABLED]\x1b[0m ${s.toUpperCase()}: ${result.message || "Healthy"} (${result.latencyMs}ms)`);
      } else if (result.status === "unconfigured") {
        console.info(`  \x1b[33m⚠ [MISSING_CONFIG]\x1b[0m ${s.toUpperCase()}: ${result.message}`);
        console.info(`    → Follow guide: docs/setup/${s === "github" ? "01-github.md" : s === "google" ? "02-google-cloud.md" : s === "cloudflare" ? "03-cloudflare.md" : s === "supabase" ? "04-supabase.md" : s === "resend" ? "05-resend.md" : s === "sentry" ? "06-sentry.md" : s === "upstash" ? "07-upstash-redis.md" : s === "uptimerobot" ? "08-uptimerobot.md" : "SETUP.md"}`);
      } else if (result.status === "degraded") {
        console.info(`  \x1b[33m⚡ [DEGRADED]\x1b[0m ${s.toUpperCase()}: ${result.message}`);
      } else {
        console.info(`  \x1b[31m✗ [UNHEALTHY]\x1b[0m ${s.toUpperCase()}: ${result.error || "Connection failed"}`);
      }
    } catch (err: any) {
      console.info(`  \x1b[31m✗ [ERROR]\x1b[0m ${s.toUpperCase()}: ${err.message}`);
    }
  }
  console.info("");
}

run();

