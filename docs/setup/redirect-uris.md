# KuraCode Registered Redirect URIs & Authorized Origins

*Auto-generated from `@kuracode/config` to prevent documentation and implementation drift.*
*Verified Date: November 2026*

## 1. OAuth Redirect URIs (Google Cloud, GitHub, GitLab, Microsoft Entra)

| Client Surface | Redirect URI | Notes |
| :--- | :--- | :--- |
| **Web App / PWA** | `https://www.genioussonu.me/extensions/kuracode/auth/callback` | Web client OAuth redirect callback |
| **Chrome / Edge MV3** | `https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/` | `chrome.identity.launchWebAuthFlow` callback |
| **Firefox Add-on** | `https://kuracodesahinurislam.extensions.allizom.org/` | Firefox WebAuthFlow callback |
| **Supabase Auth** | `https://<your-project-id>.supabase.co/auth/v1/callback` | Supabase managed OAuth bridge callback |

## 2. Authorized JavaScript Origins

- `https://www.genioussonu.me/extensions/kuracode`
- `https://www.genioussonu.me`
- `http://localhost:5173` (local web development)
- `http://localhost:3000` (local API development)
- `chrome-extension://kmbodbaepkmhfeohkbfbkpmnnjfkknmg`

## 3. CORS Allowed Origins

```json
[
  "https://www.genioussonu.me/extensions/kuracode",
  "http://localhost:5173",
  "http://localhost:3000",
  "chrome-extension://kmbodbaepkmhfeohkbfbkpmnnjfkknmg",
  "moz-extension://*"
]
```

