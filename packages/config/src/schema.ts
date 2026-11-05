import { z } from "zod";

/**
 * PUBLIC configuration schema:
 * Values safe to ship in the extension and web client.
 * NOTE: Anon/publishable keys are safe ONLY because row-level security is enforced.
 */
export const PublicConfigSchema = z.object({
  PUBLIC_APP_URL: z.string().url().default("https://www.genioussonu.me/extensions/kuracode"),
  PUBLIC_API_URL: z.string().url().default("http://localhost:3000"),
  PUBLIC_CHROME_EXTENSION_ID: z.string().optional().default("kmbodbaepkmhfeohkbfbkpmnnjfkknmg"),
  PUBLIC_FIREFOX_EXTENSION_ID: z.string().optional().default("kuracode@sahinur.islam"),
  
  // Public OAuth Client IDs
  PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  PUBLIC_GITHUB_CLIENT_ID: z.string().optional(),
  PUBLIC_GITLAB_CLIENT_ID: z.string().optional(),
  PUBLIC_MICROSOFT_CLIENT_ID: z.string().optional(),

  // Public Supabase Credentials (protected by RLS)
  PUBLIC_SUPABASE_URL: z.string().url().optional(),
  PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  // Public Cloudflare Turnstile Site Key
  PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),

  // Public Sentry DSN (Web App only - NEVER extension)
  PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Feature overrides (owner can explicitly disable any capability)
  DISABLE_AUTH_GOOGLE: z.string().optional(),
  DISABLE_AUTH_GITHUB: z.string().optional(),
  DISABLE_AUTH_GITLAB: z.string().optional(),
  DISABLE_AUTH_MICROSOFT: z.string().optional(),
  DISABLE_AUTH_MAGICLINK: z.string().optional(),
  DISABLE_EMAIL_SEND: z.string().optional(),
  DISABLE_DB_CLOUD: z.string().optional(),
  DISABLE_REALTIME: z.string().optional(),
  DISABLE_STORAGE_CLOUD: z.string().optional(),
  DISABLE_RATELIMIT_REDIS: z.string().optional(),
  DISABLE_CAPTCHA: z.string().optional(),
  DISABLE_ERRORS_SENTRY: z.string().optional(),
  DISABLE_UPTIME_STATUS: z.string().optional(),
});

export type PublicConfig = z.infer<typeof PublicConfigSchema>;

/**
 * SERVER-ONLY secret schema:
 * Secrets that MUST NEVER appear in client bundles, source maps, error reports, or git.
 */
export const ServerConfigSchema = z.object({
  // Server-side OAuth Secrets
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GITLAB_CLIENT_SECRET: z.string().min(1).optional(),
  MICROSOFT_CLIENT_SECRET: z.string().min(1).optional(),

  // Supabase privileged keys (bypasses RLS)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Resend API key for transactional emails
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM_ADDRESS: z.string().email().default("notifications@kuracode.app"),

  // Upstash Serverless Redis REST credentials
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Cloudflare Turnstile secret verification key
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),

  // Session & JWT signing secrets
  SESSION_SECRET: z.string().min(16).default("dev-insecure-session-secret-change-in-prod"),
  JWT_SECRET: z.string().min(16).default("dev-insecure-jwt-secret-change-in-prod"),

  // Sentry Server DSN & Auth Token (for release upload)
  SENTRY_SERVER_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // UptimeRobot webhook or monitor heartbeat
  UPTIMEROBOT_HEARTBEAT_URL: z.string().url().optional(),
  UPTIMEROBOT_API_KEY: z.string().optional(),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * CI/CD Store Publishing Secrets:
 * Used only in GitHub Actions protected Environments (chrome-web-store, edge-addons, firefox-amo).
 */
export const CiConfigSchema = z.object({
  CHROME_EXTENSION_ID: z.string().optional(),
  CHROME_CLIENT_ID: z.string().optional(),
  CHROME_CLIENT_SECRET: z.string().optional(),
  CHROME_REFRESH_TOKEN: z.string().optional(),

  EDGE_PRODUCT_ID: z.string().optional(),
  EDGE_CLIENT_ID: z.string().optional(),
  EDGE_API_KEY: z.string().optional(),

  FIREFOX_API_KEY: z.string().optional(),
  FIREFOX_API_SECRET: z.string().optional(),
  FIREFOX_EXTENSION_ID: z.string().optional(),
});

export type CiConfig = z.infer<typeof CiConfigSchema>;

/**
 * Combined Environment Schema
 */
export const FullEnvSchema = PublicConfigSchema.merge(ServerConfigSchema).merge(CiConfigSchema);
export type FullEnv = z.infer<typeof FullEnvSchema>;

