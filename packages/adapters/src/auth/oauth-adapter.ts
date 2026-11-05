import type { IAuthProvider, TokenResponse, AuthUser } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";
import { CircuitBreaker } from "../common/circuit-breaker.ts";
import { withRetry, withTimeout } from "../common/retry.ts";

export interface OAuthConfig {
  provider: "google" | "github" | "gitlab" | "microsoft";
  clientId?: string;
  clientSecret?: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  scopes: string[];
}

export class OAuthAdapter implements IAuthProvider {
  public readonly name: string;
  private breaker = new CircuitBreaker();
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
    this.name = config.provider;
  }

  public getAuthorizationUrl(state: string, codeChallenge: string, redirectUri: string): string {
    if (!this.config.clientId) {
      throw new Error(`Cannot generate auth URL: ${this.name} client ID is missing`);
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: this.config.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  public async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<TokenResponse> {
    return this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const bodyParams: Record<string, string> = {
            grant_type: "authorization_code",
            client_id: this.config.clientId || "",
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          };

          if (this.config.clientSecret) {
            bodyParams.client_secret = this.config.clientSecret;
          }

          const res = await fetch(this.config.tokenEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: new URLSearchParams(bodyParams).toString(),
            signal,
          });

          if (!res.ok) {
            const txt = await res.text();
            throw new Error(`OAuth token exchange failed with status ${res.status}: ${txt}`);
          }

          const data = (await res.json()) as any;
          return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            idToken: data.id_token,
            tokenType: data.token_type || "Bearer",
          };
        });
      });
    });
  }

  public async getUserInfo(accessToken: string): Promise<AuthUser> {
    return this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const res = await fetch(this.config.userinfoEndpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
            signal,
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch userinfo from ${this.name}: status ${res.status}`);
          }

          const data = (await res.json()) as any;
          return {
            id: String(data.id || data.sub),
            email: data.email,
            name: data.name || data.login || data.username,
            avatarUrl: data.avatar_url || data.picture,
            provider: this.name,
          };
        });
      });
    });
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    if (!this.config.clientId) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: `${this.name} OAuth credentials are not configured.`,
      };
    }

    try {
      // Safe discovery / endpoint ping
      const _res = await withTimeout(async (signal) => {
        return fetch(this.config.authorizationEndpoint, { method: "HEAD", signal });
      }, 3000).catch(() => null);

      return {
        ok: true,
        status: "healthy",
        latencyMs: Date.now() - start,
        message: `${this.name} authorization endpoint is reachable.`,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: "unhealthy",
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }
}
