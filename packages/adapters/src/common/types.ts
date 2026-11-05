export interface HealthCheckResult {
  ok: boolean;
  status: "healthy" | "degraded" | "unhealthy" | "unconfigured";
  latencyMs: number;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface AdapterOptions {
  timeoutMs?: number;
  maxRetries?: number;
  circuitBreakerThreshold?: number;
}

