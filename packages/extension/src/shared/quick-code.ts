/**
 * Quick-Share Codes Engine (CODE-1..CODE-6)
 * Generates short-lived, rate-limited, guess-resistant codes for 2-tap snippet sharing.
 * Automatic pool widening from 4 digits to 6 digits if active pool > 5,000.
 */

export interface QuickSharePayload {
  code: string;
  targetId: string;
  type: "snippet" | "group" | "clipboard";
  authorName: string;
  createdAt: number;
  expiresAt: number;
  maxClaims: number;
  claimCount: number;
  stripSourceUrl: boolean;
  content: {
    title: string;
    code: string;
    language: string;
    sourceUrl?: string;
  };
}

export interface VerificationResult {
  valid: boolean;
  error?: "EXPIRED" | "CLAIM_LIMIT_REACHED" | "RATE_LIMITED" | "INVALID_CODE";
  payload?: QuickSharePayload;
}

// In-memory rate limiting tracker (per client / session)
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Generates a cryptographically random quick code.
 * Uses 4 digits (0000-9999) normally, or 6 digits if active pool > 5,000.
 */
export function generateQuickCode(activePoolSize: number = 0): string {
  const digits = activePoolSize > 5000 ? 6 : 4;
  const max = Math.pow(10, digits);
  const buffer = new Uint32Array(1);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buffer);
  } else {
    buffer[0] = Math.floor(Math.random() * max);
  }

  const num = buffer[0] % max;
  return num.toString().padStart(digits, "0");
}

/**
 * Validates a submitted quick code with rate-limiting and constant-time check.
 */
export function verifyQuickCode(
  submittedCode: string,
  storedPayloads: Map<string, QuickSharePayload>,
  clientIpOrId: string = "default-client"
): VerificationResult {
  const now = Date.now();
  const cleanCode = submittedCode.trim();

  // Check rate limiting / lockout
  const rateRecord = failedAttempts.get(clientIpOrId);
  if (rateRecord && rateRecord.lockedUntil > now) {
    return { valid: false, error: "RATE_LIMITED" };
  }

  // Find matching payload with constant-time comparison
  let matchedPayload: QuickSharePayload | undefined;
  for (const [code, payload] of storedPayloads.entries()) {
    if (timingSafeEqual(code, cleanCode)) {
      matchedPayload = payload;
      break;
    }
  }

  if (!matchedPayload) {
    const current = rateRecord ? rateRecord.count + 1 : 1;
    const lockout = current >= 5 ? now + 10 * 60 * 1000 : 0; // 10 min lockout after 5 fails
    failedAttempts.set(clientIpOrId, { count: current, lockedUntil: lockout });
    return { valid: false, error: "INVALID_CODE" };
  }

  // Check TTL
  if (now > matchedPayload.expiresAt) {
    return { valid: false, error: "EXPIRED" };
  }

  // Check claim limits
  if (matchedPayload.maxClaims > 0 && matchedPayload.claimCount >= matchedPayload.maxClaims) {
    return { valid: false, error: "CLAIM_LIMIT_REACHED" };
  }

  // Success: reset failed attempts
  failedAttempts.delete(clientIpOrId);
  matchedPayload.claimCount++;

  return { valid: true, payload: matchedPayload };
}

