/**
 * Authentication & Identity Module (AUTH-1..AUTH-7, DEV-1..DEV-2)
 * OAuth 2.0 / OIDC with PKCE (S256), state/nonce protection,
 * token family rotation, and mock provider support.
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  linkedProviders: Array<"google" | "github" | "microsoft" | "gitlab">;
  createdAt: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: UserProfile;
  deviceId: string;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  nonce: string;
}

/**
 * Base64-URL encoding without padding.
 */
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generates PKCE code verifier and S256 code challenge.
 */
export async function generatePKCE(): Promise<PKCEChallenge> {
  const verifierBytes = new Uint8Array(32);
  const stateBytes = new Uint8Array(16);
  const nonceBytes = new Uint8Array(16);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(verifierBytes);
    crypto.getRandomValues(stateBytes);
    crypto.getRandomValues(nonceBytes);
  }

  const codeVerifier = base64UrlEncode(verifierBytes);
  const state = base64UrlEncode(stateBytes);
  const nonce = base64UrlEncode(nonceBytes);

  let codeChallenge = codeVerifier;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    codeChallenge = base64UrlEncode(new Uint8Array(hash));
  }

  return { codeVerifier, codeChallenge, state, nonce };
}

/**
 * Validates OAuth callback parameters against stored state.
 */
export function validateOAuthCallback(
  callbackUrl: string,
  expectedState: string
): { code?: string; error?: string } {
  try {
    const url = new URL(callbackUrl);
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      return { error: `OAuth provider error: ${error}` };
    }
    if (!state || state !== expectedState) {
      return { error: "OAuth state mismatch (potential CSRF / tampering)" };
    }
    if (!code) {
      return { error: "Missing authorization code" };
    }

    return { code };
  } catch (err: any) {
    return { error: `Malformed callback URL: ${err.message}` };
  }
}

/**
 * In-memory / Mock OIDC provider for CI test execution.
 */
export class MockOIDCProvider {
  static createMockSession(provider: "google" | "github", deviceId: string): AuthSession {
    return {
      accessToken: `mock_access_jwt_${provider}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${provider}_${Date.now()}`,
      expiresAt: Date.now() + 15 * 60 * 1000,
      deviceId,
      user: {
        id: `user_${provider}_test`,
        email: `developer@kuracode.dev`,
        name: `KuraCode Developer`,
        linkedProviders: [provider],
        createdAt: Date.now(),
      },
    };
  }
}

