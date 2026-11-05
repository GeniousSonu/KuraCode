import type { IRateLimiter, RateLimitResult } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";
import { CircuitBreaker } from "../common/circuit-breaker.ts";
import { withRetry, withTimeout } from "../common/retry.ts";

export interface UpstashConfig {
  url?: string;
  token?: string;
}

export class UpstashRedisAdapter implements IRateLimiter {
  private breaker = new CircuitBreaker();
  private config: UpstashConfig;

  constructor(config: UpstashConfig) {
    this.config = config;
  }

  private async executeCommand<T = any>(command: (string | number)[]): Promise<T> {
    if (!this.config.url || !this.config.token) {
      throw new Error("Upstash Redis is not configured.");
    }

    return this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const res = await fetch(`${this.config.url}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.config.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(command),
            signal,
          });

          if (!res.ok) {
            throw new Error(`Upstash command failed with status ${res.status}`);
          }

          const data = (await res.json()) as any;
          if (data.error) {
            throw new Error(`Upstash error: ${data.error}`);
          }
          return data.result as T;
        });
      });
    });
  }

  public async limit(identifier: string, maxRequests: number, windowSeconds: number): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const count = await this.executeCommand<number>(["INCR", key]);
    if (count === 1) {
      await this.executeCommand(["EXPIRE", key, windowSeconds]);
    }

    const ttl = await this.executeCommand<number>(["TTL", key]);
    const remaining = Math.max(0, maxRequests - count);

    return {
      success: count <= maxRequests,
      remaining,
      resetMs: (ttl > 0 ? ttl : windowSeconds) * 1000,
    };
  }

  public async setKey(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.executeCommand(["SET", key, value, "EX", ttlSeconds]);
  }

  public async getKey(key: string): Promise<string | null> {
    return this.executeCommand<string | null>(["GET", key]);
  }

  public async deleteKey(key: string): Promise<boolean> {
    const res = await this.executeCommand<number>(["DEL", key]);
    return res > 0;
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    if (!this.config.url || !this.config.token) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: "Upstash Redis credentials missing. Falling back to local in-memory / Postgres rate limiter.",
      };
    }

    try {
      const pong = await this.executeCommand<string>(["PING"]);
      return {
        ok: pong === "PONG",
        status: pong === "PONG" ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
        message: "Upstash Redis ping successful.",
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
