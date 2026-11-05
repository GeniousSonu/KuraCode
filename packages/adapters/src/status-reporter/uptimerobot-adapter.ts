import type { IStatusReporter, SystemReadiness } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";
import { withTimeout, withRetry } from "../common/retry.ts";

export interface UptimeConfig {
  heartbeatUrl?: string;
  getCapabilities: () => Record<string, string>;
}

export class UptimeRobotReporter implements IStatusReporter {
  private startTime = Date.now();
  private config: UptimeConfig;

  constructor(config: UptimeConfig) {
    this.config = config;
  }

  public async sendHeartbeat(): Promise<boolean> {
    if (!this.config.heartbeatUrl) {
      return false;
    }

    return withRetry(async () => {
      return withTimeout(async (signal) => {
        const res = await fetch(this.config.heartbeatUrl!, {
          method: "GET",
          signal,
        });
        return res.ok;
      }, 5000);
    });
  }

  public async getSystemReadiness(): Promise<SystemReadiness> {
    return {
      liveness: true,
      readiness: true,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      capabilities: this.config.getCapabilities(),
    };
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    if (!this.config.heartbeatUrl) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: "UptimeRobot heartbeat URL missing. Local /healthz and /readyz endpoints active.",
      };
    }

    try {
      const ok = await this.sendHeartbeat();
      return {
        ok,
        status: ok ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
        message: ok ? "Heartbeat acknowledged by UptimeRobot." : "UptimeRobot heartbeat returned non-200.",
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
