export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
}

export async function withTimeout<T>(
  promiseFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 5000
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await promiseFn(controller.signal);
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === "AbortError" || controller.signal.aborted) {
      throw new Error(`Operation timed out after ${timeoutMs}ms`, { cause: err });
    }
    throw err;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const maxRetries = config.maxRetries ?? 3;
  const initialDelay = config.initialDelayMs ?? 100;
  const maxDelay = config.maxDelayMs ?? 2000;
  const factor = config.factor ?? 2;

  let attempt = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) {
        throw err;
      }
      // Add small jitter
      const jitter = Math.random() * 50;
      await new Promise((r) => setTimeout(r, Math.min(delay + jitter, maxDelay)));
      delay *= factor;
    }
  }
}
