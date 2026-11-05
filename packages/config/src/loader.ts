import { FullEnvSchema, PublicConfigSchema, type FullEnv, type PublicConfig } from "./schema.ts";
import { evaluateCapabilities, type CapabilityRegistry } from "./capabilities.ts";

export interface ConfigReport {
  timestamp: string;
  environment: "development" | "staging" | "production" | "test";
  publicVarsConfigured: string[];
  serverSecretsConfigured: string[];
  missingServerSecrets: string[];
  capabilities: CapabilityRegistry;
  readyForProduction: boolean;
}

/**
 * Validates public config safe for shipping in client bundles.
 */
export function validatePublicConfig(raw: Record<string, unknown> = process.env): {
  success: boolean;
  config?: PublicConfig;
  errors?: string[];
} {
  const result = PublicConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = (result.error as any).issues || (result.error as any).errors || [];
    return {
      success: false,
      errors: issues.map((e: { path: (string | number)[]; message: string }) => `${e.path.join(".")}: ${e.message}`),
    };
  }
  return { success: true, config: result.data };
}

/**
 * Generates a structured status report on all variables and capabilities.
 * NEVER echoes or exposes secret values.
 */
export function generateConfigReport(raw: Record<string, unknown> = process.env): ConfigReport {
  const nodeEnv = (raw.NODE_ENV as string) || "development";
  const environment = ["development", "staging", "production", "test"].includes(nodeEnv)
    ? (nodeEnv as ConfigReport["environment"])
    : "development";

  const parsed = FullEnvSchema.safeParse(raw);
  const data = parsed.success ? parsed.data : (raw as Partial<FullEnv>);

  const publicKeys = [
    "PUBLIC_APP_URL",
    "PUBLIC_API_URL",
    "PUBLIC_GOOGLE_CLIENT_ID",
    "PUBLIC_GITHUB_CLIENT_ID",
    "PUBLIC_GITLAB_CLIENT_ID",
    "PUBLIC_MICROSOFT_CLIENT_ID",
    "PUBLIC_SUPABASE_URL",
    "PUBLIC_SUPABASE_ANON_KEY",
    "PUBLIC_TURNSTILE_SITE_KEY",
    "PUBLIC_SENTRY_DSN",
  ];

  const serverSecretKeys = [
    "GOOGLE_CLIENT_SECRET",
    "GITHUB_CLIENT_SECRET",
    "GITLAB_CLIENT_SECRET",
    "MICROSOFT_CLIENT_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "TURNSTILE_SECRET_KEY",
    "SESSION_SECRET",
    "JWT_SECRET",
    "CHROME_REFRESH_TOKEN",
    "EDGE_API_KEY",
    "FIREFOX_API_SECRET",
  ];

  const publicVarsConfigured = publicKeys.filter((k) => !!data[k as keyof FullEnv]);
  const serverSecretsConfigured = serverSecretKeys.filter((k) => !!data[k as keyof FullEnv]);
  const missingServerSecrets = serverSecretKeys.filter((k) => !data[k as keyof FullEnv]);

  const capabilities = evaluateCapabilities(data);

  // Ready for production if cloud database and at least 1 OAuth provider are configured
  const readyForProduction =
    capabilities["db.cloud"].status === "ENABLED" &&
    (capabilities["auth.google"].status === "ENABLED" || capabilities["auth.github"].status === "ENABLED");

  return {
    timestamp: new Date().toISOString(),
    environment,
    publicVarsConfigured,
    serverSecretsConfigured,
    missingServerSecrets,
    capabilities,
    readyForProduction,
  };
}

/**
 * Returns a formatted ASCII table string of the capability registry.
 */
export function formatConfigTable(capabilities: CapabilityRegistry): string {
  const rows: string[] = [];
  rows.push("==========================================================================================================");
  rows.push("  CAPABILITY          | STATUS                   | FALLBACK STRATEGY / NOTES");
  rows.push("----------------------------------------------------------------------------------------------------------");

  for (const [name, cap] of Object.entries(capabilities)) {
    const padName = name.padEnd(20, " ");
    let statusFormatted = cap.status.padEnd(24, " ");
    if (cap.status === "ENABLED") {
      statusFormatted = `\x1b[32m${statusFormatted}\x1b[0m`;
    } else if (cap.status === "DEGRADED") {
      statusFormatted = `\x1b[33m${statusFormatted}\x1b[0m`;
    } else if (cap.status === "DISABLED_BY_OWNER") {
      statusFormatted = `\x1b[34m${statusFormatted}\x1b[0m`;
    } else {
      statusFormatted = `\x1b[31m${statusFormatted}\x1b[0m`;
    }

    const note = cap.missingVars.length > 0
      ? `Missing: ${cap.missingVars.join(", ")} → ${cap.fallbackStrategy || "Disabled"}`
      : "Active & verified";

    rows.push(`  ${padName} | ${statusFormatted} | ${note}`);
  }

  rows.push("==========================================================================================================");
  return rows.join("\n");
}
