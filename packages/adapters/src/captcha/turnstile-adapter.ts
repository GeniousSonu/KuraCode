import type { ICaptchaVerifier, CaptchaVerificationResult } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";
import { CircuitBreaker } from "../common/circuit-breaker.ts";
import { withRetry, withTimeout } from "../common/retry.ts";

export interface TurnstileConfig {
  secretKey?: string;
}

export class TurnstileCaptchaAdapter implements ICaptchaVerifier {
  private breaker = new CircuitBreaker();
  private config: TurnstileConfig;

  constructor(config: TurnstileConfig) {
    this.config = config;
  }

  public async verifyToken(token: string, remoteIp?: string): Promise<CaptchaVerificationResult> {
    if (!this.config.secretKey) {
      throw new Error("Turnstile secret key is not configured.");
    }

    return this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const body: Record<string, string> = {
            secret: this.config.secretKey || "",
            response: token,
          };
          if (remoteIp) body.remoteip = remoteIp;

          const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(body).toString(),
            signal,
          });

          if (!res.ok) {
            throw new Error(`Turnstile siteverify failed with status ${res.status}`);
          }

          const data = (await res.json()) as any;
          return {
            success: Boolean(data.success),
            hostname: data.hostname,
            challengeTs: data.challenge_ts,
            errorCodes: data["error-codes"],
          };
        });
      });
    });
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    if (!this.config.secretKey) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: "Cloudflare Turnstile secret is missing. Falling back to IP-based rate limiting.",
      };
    }

    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: "Turnstile verifier ready.",
    };
  }
}
