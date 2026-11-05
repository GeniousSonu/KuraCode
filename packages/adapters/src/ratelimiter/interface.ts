import type { HealthCheckResult } from "../common/types.ts";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

export interface IRateLimiter {
  limit(identifier: string, maxRequests: number, windowSeconds: number): Promise<RateLimitResult>;
  setKey(key: string, value: string, ttlSeconds: number): Promise<void>;
  getKey(key: string): Promise<string | null>;
  deleteKey(key: string): Promise<boolean>;
  checkHealth(): Promise<HealthCheckResult>;
}
