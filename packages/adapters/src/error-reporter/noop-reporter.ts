import type { IErrorReporter } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

export class NoopErrorReporter implements IErrorReporter {
  public async captureException(_error: Error, _context?: Record<string, unknown>): Promise<string | undefined> {
    return undefined;
  }

  public async captureMessage(_message: string, _level?: "info" | "warning" | "error"): Promise<string | undefined> {
    return undefined;
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: "NoopErrorReporter active (zero-account / offline mode).",
    };
  }
}
