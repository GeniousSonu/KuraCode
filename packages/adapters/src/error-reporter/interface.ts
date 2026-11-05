import type { HealthCheckResult } from "../common/types.ts";

export interface IErrorReporter {
  captureException(error: Error, context?: Record<string, unknown>): Promise<string | undefined>;
  captureMessage(message: string, level?: "info" | "warning" | "error"): Promise<string | undefined>;
  checkHealth(): Promise<HealthCheckResult>;
}
