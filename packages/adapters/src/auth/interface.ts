import type { HealthCheckResult } from "../common/types.ts";

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  idToken?: string;
  tokenType: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: string;
}

export interface IAuthProvider {
  readonly name: string;
  getAuthorizationUrl(state: string, codeChallenge: string, redirectUri: string): string;
  exchangeCodeForTokens(code: string, codeVerifier: string, redirectUri: string): Promise<TokenResponse>;
  getUserInfo(accessToken: string): Promise<AuthUser>;
  checkHealth(): Promise<HealthCheckResult>;
}
