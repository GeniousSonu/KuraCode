import type { IStorePublisher, PublishResult } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

export class MockStorePublisher implements IStorePublisher {
  public readonly target: "chrome" | "edge" | "firefox";

  constructor(target: "chrome" | "edge" | "firefox") {
    this.target = target;
  }

  public async publish(zipPath: string, dryRun = true): Promise<PublishResult> {
    return {
      success: true,
      target: this.target,
      status: `[MOCK_${this.target.toUpperCase()}] Package ${zipPath} simulated published (dryRun=${dryRun}).`,
      operationId: `mock_op_${Date.now()}`,
      dryRun,
    };
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: `MockStorePublisher (${this.target}) active for CI and dry-runs.`,
    };
  }
}
