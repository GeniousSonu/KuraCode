import type { HealthCheckResult } from "../common/types.ts";

export interface SystemReadiness {
  liveness: boolean;
  readiness: boolean;
  timestamp: string;
  uptimeSeconds: number;
  capabilities: Record<string, string>;
}

export interface IStatusReporter {
  sendHeartbeat(): Promise<boolean>;
  getSystemReadiness(): Promise<SystemReadiness>;
  checkHealth(): Promise<HealthCheckResult>;
}
