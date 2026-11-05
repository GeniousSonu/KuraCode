import type { PublicConfig } from "./schema.ts";

export interface RedirectUriSet {
  webAppRedirectUri: string;
  chromiumExtensionRedirectUri: string;
  firefoxExtensionRedirectUri: string;
  supabaseAuthCallbackUri: string;
  authorizedOrigins: string[];
  corsOrigins: string[];
}

/**
 * Derives exact redirect URIs and CORS origins based on public configuration.
 */
export function generateRedirectUris(config: Partial<PublicConfig> = {}): RedirectUriSet {
  const appUrl = config.PUBLIC_APP_URL || "https://www.genioussonu.me/extensions/kuracode";
  const chromeExtId = config.PUBLIC_CHROME_EXTENSION_ID || "kmbodbaepkmhfeohkbfbkpmnnjfkknmg";
  const firefoxExtId = config.PUBLIC_FIREFOX_EXTENSION_ID || "kuracode@sahinur.islam";
  const supabaseUrl = config.PUBLIC_SUPABASE_URL || "https://your-project-id.supabase.co";

  // Chromium WebAuthFlow format: https://<extension-id>.chromiumapp.org/
  const chromiumExtensionRedirectUri = `https://${chromeExtId}.chromiumapp.org/`;
  
  // Firefox identity redirect URI
  const firefoxSanitizedId = firefoxExtId.replace(/[@.]/g, "");
  const firefoxExtensionRedirectUri = `https://${firefoxSanitizedId}.extensions.allizom.org/`;

  const webAppRedirectUri = `${appUrl.replace(/\/$/, "")}/auth/callback`;
  const supabaseAuthCallbackUri = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/callback`;

  const authorizedOrigins = [
    appUrl,
    "https://www.genioussonu.me",
    "http://localhost:5173",
    "http://localhost:3000",
    `chrome-extension://${chromeExtId}`,
  ];

  const corsOrigins = [
    appUrl,
    "http://localhost:5173",
    "http://localhost:3000",
    `chrome-extension://${chromeExtId}`,
    "moz-extension://*",
  ];

  return {
    webAppRedirectUri,
    chromiumExtensionRedirectUri,
    firefoxExtensionRedirectUri,
    supabaseAuthCallbackUri,
    authorizedOrigins,
    corsOrigins,
  };
}

/**
 * Returns formatted Markdown listing of redirect URIs and origins.
 */
export function formatRedirectUrisMarkdown(uris: RedirectUriSet): string {
  return `# KuraCode Registered Redirect URIs & Authorized Origins

*Auto-generated from \`packages/config\` to prevent documentation and implementation drift.*

## 1. OAuth Redirect URIs (Google Cloud, GitHub, GitLab, Microsoft Entra)

| Client Surface | Redirect URI | Notes |
| :--- | :--- | :--- |
| **Web App / PWA** | \`${uris.webAppRedirectUri}\` | User sign-in on web app |
| **Chrome / Edge MV3** | \`${uris.chromiumExtensionRedirectUri}\` | \`chrome.identity.launchWebAuthFlow\` callback |
| **Firefox Add-on** | \`${uris.firefoxExtensionRedirectUri}\` | Firefox WebAuthFlow callback |
| **Supabase Auth** | \`${uris.supabaseAuthCallbackUri}\` | Supabase managed OAuth bridge |

## 2. Authorized JavaScript Origins

- \`${uris.authorizedOrigins[0]}\`
- \`https://www.genioussonu.me\`
- \`http://localhost:5173\` (local web dev)
- \`http://localhost:3000\` (local API dev)

## 3. CORS Allowed Origins

\`\`\`json
${JSON.stringify(uris.corsOrigins, null, 2)}
\`\`\`
`;
}
