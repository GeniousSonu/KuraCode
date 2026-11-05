import type { IStatusReporter, SystemReadiness } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

export class MockStatusReporter implements IStatusReporter {
  private startTime = Date.now();
  private heartbeatsSent = 0;
  private capabilities: Record<string, string>;

  constructor(capabilities: Record<string, string> = {}) {
    this.capabilities = capabilities;
  }

  public async sendHeartbeat(): Promise<boolean> {
    this.heartbeatsSent++;
    return true;
  }

  public async getSystemReadiness(): Promise<SystemReadiness> {
    return {
      liveness: true,
      readiness: true,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      capabilities: this.capabilities,
    };
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: `MockStatusReporter active (${this.heartbeatsSent} heartbeats recorded).`,
    };
  }
}
