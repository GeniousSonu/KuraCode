# Human Action Required (Owner Tasks)

This document tracks items that require human owner intervention, official developer portal accounts, credit card payment, or private API credentials. Everything else is implemented, tested, and verified in the automated repository.

---

## 1. GitHub Repository Protection & Auto-Merge Configuration

To protect `main` while allowing autonomous pull request merging:

### [ ] Task A: Enable Auto-Merge and Branch Deletion
- **Where to click:** [GitHub Repository > Settings > General](https://github.com/GeniousSonu/KuraCode/settings).
- **Steps:**
  1. Under **Pull Requests**, check `[x] Allow auto-merge`.
  2. Check `[x] Automatically delete head branches`.

### [ ] Task B: Configure Branch Protection for `main`
- **Where to click:** [GitHub Repository > Settings > Branches > Add branch protection rule](https://github.com/GeniousSonu/KuraCode/settings/branches).
- **Steps:**
  1. Branch name pattern: `main`.
  2. Check `[x] Require a pull request before merging`.
     - Check `[x] Require approvals` (set to 1).
     - Check `[x] Dismiss stale pull request approvals when new commits are pushed`.
  3. Check `[x] Require status checks to pass before merging`.
     - Check `[x] Require branches to be up to date before merging`.
     - Search and select required checks:
       - `Full Quality Gate (Ubuntu Linux)`
       - `Build Smoke (macos-latest)`
       - `Build Smoke (windows-latest)`
  4. Check `[x] Require linear history`.
  5. Check `[x] Do not allow bypassing the above settings`.
  6. Click **Save changes**.

### [ ] Task C: Configure Protected Environments for Store Deployments
- **Where to click:** [GitHub Repository > Settings > Environments](https://github.com/GeniousSonu/KuraCode/settings/environments).
- **Steps:**
  Create 3 environments:
  1. `chrome-web-store` -> Check `[x] Required reviewers` -> Add your GitHub username.
  2. `edge-addons` -> Check `[x] Required reviewers` -> Add your GitHub username.
  3. `firefox-amo` -> Check `[x] Required reviewers` -> Add your GitHub username.

### [ ] Task D: Emergency Release Freeze Variable
- **Where to click:** [GitHub Repository > Settings > Secrets and variables > Actions > Variables](https://github.com/GeniousSonu/KuraCode/settings/variables/actions).
- **Steps:**
  - Variable Name: `RELEASE_FROZEN`
  - Value: `false` (Set to `true` anytime you need an emergency freeze on automated releases).

---

## 2. Developer Portal Accounts Setup

### [ ] Task 1: Chrome Web Store Developer Registration
- **Fee:** \$5 USD one-time registration fee.
- **Where to click:** [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole).
- **Steps:** Sign in with your Google account, pay the \$5 registration fee, and complete account identity verification.
- **Listing Draft:** Upload `release/kuracode-chrome-0.1.0.zip` to create your initial extension ID.

### [ ] Task 2: Microsoft Partner Center Registration (Edge Add-ons)
- **Fee:** Free.
- **Where to click:** [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge).
- **Steps:** Register as an extension developer and create an Edge extension entry with `release/kuracode-edge-0.1.0.zip`.

### [ ] Task 3: Mozilla Add-ons (AMO) Developer Account
- **Fee:** Free.
- **Where to click:** [Mozilla Add-ons Developer Hub](https://addons.mozilla.org/developers/).
- **Steps:** Register your developer account, generate API keys under [API Keys](https://addons.mozilla.org/developers/addon/api/key/), and set `FIREFOX_EXTENSION_ID = kuracode@sahinur.islam`.

---

## 3. Cloud Infrastructure & OAuth Provisioning (One-Click Login & Real-Time Sync)

### [ ] Task 4: Google Cloud OAuth 2.0 Client ID
- **Fee:** Free.
- **Where to click:** [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
- **Steps:**
  1. Create a project named `KuraCode`.
  2. Configure OAuth Consent Screen: User Type **External**, App Name **KuraCode**, Support Email **sahinurislam52@gmail.com**.
  3. Scopes: `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`.
  4. Create Credentials > OAuth client ID > Application type: **Web application**.
  5. **Authorized JavaScript origins:**
     - `https://app.kuracode.dev`
     - `https://www.genioussonu.me`
  6. **Authorized redirect URIs:**
     - `https://<your-chrome-extension-id>.chromiumapp.org/`
     - `https://app.kuracode.dev/auth/callback`
  7. Copy Client ID and Client Secret for repository environment secrets.

### [ ] Task 5: GitHub OAuth App Registration
- **Fee:** Free.
- **Where to click:** [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers).
- **Steps:**
  1. Click **New OAuth App**.
  2. Application name: `KuraCode`.
  3. Homepage URL: `https://www.genioussonu.me/extensions/kuracode`.
  4. Authorization callback URL: `https://<your-chrome-extension-id>.chromiumapp.org/` and `https://app.kuracode.dev/auth/callback`.
  5. Generate client secret and record `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

### [ ] Task 6: Supabase Free-Tier Project Provisioning
- **Fee:** Free tier (50,000 MAU, 500 MB Postgres, 200 concurrent Realtime connections).
- **Where to click:** [Supabase Dashboard](https://supabase.com/dashboard).
- **Steps:**
  1. Create a new organization and project named `kuracode-prod` (Region: pick nearest, e.g. Central India / Frankfurt).
  2. Under **Authentication > Providers**:
     - Enable **Google**: paste Google Client ID & Secret from Task 4.
     - Enable **GitHub**: paste GitHub Client ID & Secret from Task 5.
  3. Under **Authentication > URL Configuration**:
     - Site URL: `https://www.genioussonu.me/extensions/kuracode`
     - Redirect URLs:
       - `https://<your-chrome-extension-id>.chromiumapp.org/**`
       - `https://app.kuracode.dev/**`
       - `moz-extension://**`
  4. Under **SQL Editor**, execute the migration script located at `packages/sync-server/schema.sql` to initialize:
     - `profiles`, `snippets`, `snippet_versions`, `workspaces`, `workspace_members`, `clipboard_items`, `quick_shares`.
     - Row Level Security (RLS) policies enforcing multi-tenant isolation.
  5. Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to project secrets.

---

## 4. GitHub Secrets Setup

Once your developer accounts and cloud projects are active, add these secrets to your GitHub repository under **Settings > Secrets and variables > Actions**:

```env
# Extension Store Publishing
CHROME_EXTENSION_ID=<your-chrome-extension-id>
CHROME_CLIENT_ID=<google-cloud-oauth-client-id>
CHROME_CLIENT_SECRET=<google-cloud-oauth-client-secret>
CHROME_REFRESH_TOKEN=<google-oauth-refresh-token>

EDGE_PRODUCT_ID=<edge-product-uuid>
EDGE_CLIENT_ID=<azure-ad-client-id>
EDGE_API_KEY=<edge-api-key>

FIREFOX_API_KEY=<user:amo-jwt-issuer>
FIREFOX_API_SECRET=<amo-jwt-secret>
FIREFOX_EXTENSION_ID=kuracode@sahinur.islam

# Cloud Auth & Sync (Production)
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<public-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-for-migrations-only>
OAUTH_GOOGLE_CLIENT_ID=<google-oauth-client-id>
OAUTH_GITHUB_CLIENT_ID=<github-oauth-client-id>
```

Detailed instructions for generating each credential are provided in [docs/PUBLISHING.md](../PUBLISHING.md).
