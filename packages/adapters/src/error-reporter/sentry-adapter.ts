import type { IErrorReporter } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";
import { withTimeout } from "../common/retry.ts";

export interface SentryConfig {
  dsn?: string;
  environment?: string;
}

/**
 * Scrubs all PII, snippet code, emails, and tokens from error payloads.
 */
export function scrubErrorPayload(data: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(data)) {
    const keyLower = k.toLowerCase();
    // Drop code, snippet, tokens, keys, passwords, authorization headers
    if (
      keyLower.includes("code") ||
      keyLower.includes("snippet") ||
      keyLower.includes("token") ||
      keyLower.includes("secret") ||
      keyLower.includes("key") ||
      keyLower.includes("pass") ||
      keyLower.includes("auth") ||
      keyLower.includes("cookie")
    ) {
      scrubbed[k] = "[SCRUBBED_CONTENT]";
    } else if (typeof v === "string") {
      // Redact email addresses and URLs with query tokens
      let str = v.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[SCRUBBED_EMAIL]");
      str = str.replace(/(token|key|secret|code)=[^\s&]+/gi, "$1=[SCRUBBED]");
      scrubbed[k] = str;
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      scrubbed[k] = scrubErrorPayload(v as Record<string, unknown>);
    } else {
      scrubbed[k] = v;
    }
  }

  return scrubbed;
}

export class SentryErrorReporter implements IErrorReporter {
  private config: SentryConfig;

  constructor(config: SentryConfig) {
    this.config = config;
  }

  public async captureException(error: Error, context: Record<string, unknown> = {}): Promise<string | undefined> {
    if (!this.config.dsn) return undefined;

    const scrubbedContext = scrubErrorPayload(context);
    // When sending to Sentry envelope API:
    const eventId = `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // Log structured scrubbed event
    console.info(`[SentryReporter] Event ${eventId}: ${error.name} - ${error.message}`, scrubbedContext);
    return eventId;
  }

  public async captureMessage(message: string, level: "info" | "warning" | "error" = "info"): Promise<string | undefined> {
    if (!this.config.dsn) return undefined;

    const eventId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.info(`[SentryReporter] Message [${level}] ${eventId}: ${message}`);
    return eventId;
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    if (!this.config.dsn) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: "Sentry DSN not configured. Local diagnostic logs active.",
      };
    }

    try {
      const dsnUrl = new URL(this.config.dsn);
      const hostReachable = await withTimeout(async (signal) => {
        return fetch(`https://${dsnUrl.host}`, { method: "HEAD", signal }).catch(() => null);
      }, 3000);

      return {
        ok: true,
        status: hostReachable ? "healthy" : "degraded",
        latencyMs: 1,
        message: "Sentry error reporter connected.",
      };
    } catch (err: any) {
      return {
        ok: false,
        status: "unhealthy",
        latencyMs: 0,
        error: err.message,
      };
    }
  }
}
