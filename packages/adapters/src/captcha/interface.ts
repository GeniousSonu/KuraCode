import type { HealthCheckResult } from "../common/types.ts";

export interface CaptchaVerificationResult {
  success: boolean;
  hostname?: string;
  challengeTs?: string;
  errorCodes?: string[];
}

export interface ICaptchaVerifier {
  verifyToken(token: string, remoteIp?: string): Promise<CaptchaVerificationResult>;
  checkHealth(): Promise<HealthCheckResult>;
}
