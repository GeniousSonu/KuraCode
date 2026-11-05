import type { HealthCheckResult } from "../common/types.ts";

export interface PublishResult {
  success: boolean;
  target: "chrome" | "edge" | "firefox";
  status: string;
  operationId?: string;
  dryRun: boolean;
}

export interface IStorePublisher {
  readonly target: "chrome" | "edge" | "firefox";
  publish(zipPath: string, dryRun?: boolean): Promise<PublishResult>;
  checkHealth(): Promise<HealthCheckResult>;
}
