import type { IAuthProvider, TokenResponse, AuthUser } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

export class MockAuthProvider implements IAuthProvider {
  public readonly name: string;
  private mockUser: Partial<AuthUser>;

  constructor(
    providerName = "mock-auth",
    mockUser: Partial<AuthUser> = {}
  ) {
    this.name = providerName;
    this.mockUser = mockUser;
  }

  public getAuthorizationUrl(state: string, codeChallenge: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: "mock_client_id",
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      code_challenge: codeChallenge,
      mock_provider: this.name,
    });
    return `http://localhost:3000/api/auth/mock/${this.name}/authorize?${params.toString()}`;
  }

  public async exchangeCodeForTokens(
    code: string,
    _codeVerifier: string,
    _redirectUri: string
  ): Promise<TokenResponse> {
    if (!code || code === "invalid_code") {
      throw new Error(`[MockAuth] Invalid or expired authorization code`);
    }

    return {
      accessToken: `mock_access_token_${this.name}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${this.name}`,
      expiresIn: 3600,
      idToken: `mock_id_token_${this.name}`,
      tokenType: "Bearer",
    };
  }

  public async getUserInfo(accessToken: string): Promise<AuthUser> {
    if (!accessToken.startsWith("mock_access_token")) {
      throw new Error(`[MockAuth] Unauthorized token`);
    }

    return {
      id: this.mockUser.id || `user_${this.name}_101`,
      email: this.mockUser.email || `developer@example.com`,
      name: this.mockUser.name || `KuraCode Developer`,
      avatarUrl: this.mockUser.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=kuracode`,
      provider: this.name,
    };
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: `MockAuthProvider (${this.name}) ready in offline-first mode.`,
    };
  }
}
