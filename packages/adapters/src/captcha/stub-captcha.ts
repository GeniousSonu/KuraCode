import type { ICaptchaVerifier, CaptchaVerificationResult } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

export class StubCaptchaVerifier implements ICaptchaVerifier {
  public async verifyToken(token: string): Promise<CaptchaVerificationResult> {
    if (!token || token === "invalid_token") {
      return {
        success: false,
        errorCodes: ["invalid-input-response"],
      };
    }

    return {
      success: true,
      hostname: "localhost",
      challengeTs: new Date().toISOString(),
    };
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: "StubCaptchaVerifier active in zero-account mode.",
    };
  }
}
