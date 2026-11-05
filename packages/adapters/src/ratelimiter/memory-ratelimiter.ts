import type { IRateLimiter, RateLimitResult } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

interface CacheItem {
  value: string;
  expiresAt: number;
}

export class MemoryRateLimiter implements IRateLimiter {
  private requestBuckets: Map<string, number[]> = new Map();
  private store: Map<string, CacheItem> = new Map();

  public async limit(identifier: string, maxRequests: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    const timestamps = (this.requestBuckets.get(identifier) || []).filter((t) => t > windowStart);

    if (timestamps.length < maxRequests) {
      timestamps.push(now);
      this.requestBuckets.set(identifier, timestamps);
      return {
        success: true,
        remaining: maxRequests - timestamps.length,
        resetMs: windowMs,
      };
    }

    const oldest = timestamps[0];
    const resetMs = Math.max(0, oldest + windowMs - now);

    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  public async setKey(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public async getKey(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  public async deleteKey(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: "MemoryRateLimiter (local fallback) active.",
    };
  }

  public clear() {
    this.requestBuckets.clear();
    this.store.clear();
  }
}
