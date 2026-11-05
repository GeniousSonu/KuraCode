import type { IMailer, EmailPayload } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";
import { CircuitBreaker } from "../common/circuit-breaker.ts";
import { withRetry, withTimeout } from "../common/retry.ts";

export interface ResendConfig {
  apiKey?: string;
  defaultFrom?: string;
}

export class ResendMailerAdapter implements IMailer {
  private breaker = new CircuitBreaker();
  private config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
  }

  public async sendEmail(payload: EmailPayload): Promise<{ id: string; success: boolean }> {
    if (!this.config.apiKey) {
      throw new Error("Resend API key is not configured.");
    }

    return this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: payload.from || this.config.defaultFrom || "notifications@kuracode.app",
              to: Array.isArray(payload.to) ? payload.to : [payload.to],
              subject: payload.subject,
              html: payload.html,
              text: payload.text,
            }),
            signal,
          });

          if (!res.ok) {
            const err = await res.text();
            throw new Error(`Resend email delivery failed with status ${res.status}: ${err}`);
          }

          const data = (await res.json()) as any;
          return { id: data.id, success: true };
        });
      });
    });
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    if (!this.config.apiKey) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: "Resend API key missing. Invites will fall back to direct join link display.",
      };
    }

    try {
      const res = await withTimeout(async (signal) => {
        return fetch("https://api.resend.com/api-keys", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          signal,
        });
      }, 3000);

      return {
        ok: res.ok,
        status: res.ok ? "healthy" : "unhealthy",
        latencyMs: Date.now() - start,
        message: res.ok ? "Resend API is connected." : `Resend returned HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: "unhealthy",
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }
}
