# Setup Guide 02: Google Cloud Console (Google Sign-In)

*Verified Date: November 2026*

This guide sets up the Google Cloud project, OAuth consent screen, and OAuth 2.0 Web/Extension Client IDs to enable "Continue with Google".

---

## 1. Project & OAuth Consent Screen Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project named `KuraCode`.
3. Go to **APIs & Services** -> **OAuth consent screen**:
   - **User Type:** Select **External** and click **Create**.
   - **App name:** `KuraCode`
   - **User support email:** Select your developer email.
   - **App logo:** Optional (upload `brand/generated/web/pwa-192.png`).
   - **Application home page:** `https://www.genioussonu.me/extensions/kuracode`
   - **Application privacy policy link:** `https://www.genioussonu.me/extensions/kuracode#privacy` (or `/privacy`)
   - **Application terms of service link:** `https://www.genioussonu.me/extensions/kuracode#terms`
   - **Authorized domains:** Add `genioussonu.me`
   - **Developer contact information:** Your developer email address.
4. Click **Save and Continue**.
5. On the **Scopes** page:
   - Click **Add or Remove Scopes**.
   - Select ONLY non-sensitive identity scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - *(Never select Google Drive, Gmail, or sensitive scopes)*
6. Click **Save and Continue**.
7. Under **Test users** (while in Testing mode):
   - Add your own email address so you can test sign-in immediately.
   *(Note on Verification: Because KuraCode uses only non-sensitive scopes `openid, email, profile`, full Google app verification is NOT required for production release; you simply click "Publish App" on the consent screen).*

---

## 2. Create OAuth Client ID

1. Go to **APIs & Services** -> **Credentials**.
2. Click **+ Create Credentials** -> **OAuth client ID**.
3. **Application type:** Select **Web application**.
4. **Name:** `KuraCode Client`
5. **Authorized JavaScript origins:**
   - `https://www.genioussonu.me`
   - `http://localhost:5173`
   - `http://localhost:3000`
6. **Authorized redirect URIs:**
   - Web App: `https://www.genioussonu.me/extensions/kuracode/auth/callback`
   - Chrome Extension Identity: `https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/`
   - Supabase Bridge: `https://<your-project-id>.supabase.co/auth/v1/callback`
7. Click **Create**.
8. Copy the **Client ID** and **Client Secret**.

---

## 3. Environment Variables

Add to `.env.local`:
```bash
PUBLIC_GOOGLE_CLIENT_ID="<your-google-client-id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
```

### Testing the Integration
```bash
pnpm setup:test google
```

**Success output:**
```
✔ [PASS] Google OAuth Client verified. Capability 'auth.google' is now ENABLED.
```

---

## 4. Free-Tier Limits & Rotation

- **Limits:** Google Identity Services is free with no quota limits for standard consumer sign-in.
- **Rotation:** If exposed, go to Credentials -> Edit OAuth Client -> click **Reset secret**, update `.env.local`, and delete the previous secret.

