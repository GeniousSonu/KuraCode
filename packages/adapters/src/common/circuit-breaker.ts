export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private nextAttempt = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = { failureThreshold: 5, resetTimeoutMs: 15000 }) {
    this.config = config;
  }

  public getState(): "CLOSED" | "OPEN" | "HALF_OPEN" {
    if (this.state === "OPEN" && Date.now() >= this.nextAttempt) {
      this.state = "HALF_OPEN";
    }
    return this.state;
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.getState() === "OPEN") {
      throw new Error(`CircuitBreaker is OPEN. Operation aborted to protect external service.`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.config.resetTimeoutMs;
    }
  }

  public reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.nextAttempt = 0;
  }
}
