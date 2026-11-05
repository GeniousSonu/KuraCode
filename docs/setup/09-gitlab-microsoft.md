# Setup Guide 09: GitLab & Microsoft Azure Entra (Optional Providers)

*Verified Date: November 2026*

This guide sets up optional third-party OAuth providers: **GitLab** and **Microsoft Azure Entra ID**.

---

## 1. GitLab OAuth Application

### Exact Steps
1. Log in to [GitLab.com](https://gitlab.com).
2. Click your avatar (top left) -> **Edit profile** -> **Applications** (in sidebar).
3. Fill out the application form:
   - **Name:** `KuraCode`
   - **Redirect URI:** `https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/`
     *(or Supabase callback: `https://<your-project>.supabase.co/auth/v1/callback`)*
   - **Confidential:** Yes (checked)
   - **Scopes:** Select `read_user` and `openid`.
4. Click **Save application**.
5. Copy **Application ID** and **Secret**.

### Environment Variables
Add to `.env.local`:
```bash
PUBLIC_GITLAB_CLIENT_ID="<your-gitlab-application-id>"
GITLAB_CLIENT_SECRET="<your-gitlab-secret>"
```
Test with: `pnpm setup:test gitlab`

---

## 2. Microsoft Azure Entra ID (Microsoft Sign-In)

### Exact Steps
1. Open the [Azure Portal](https://portal.azure.com/) and search for **Microsoft Entra ID**.
2. Click **App registrations** -> **+ New registration**:
   - **Name:** `KuraCode`
   - **Supported account types:** Select **Accounts in any organizational directory and personal Microsoft accounts** (multitenant + personal).
   - **Redirect URI:** Select **Single-page application (SPA)** or **Web**:
     - `https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/`
3. Click **Register**.
4. In the Overview tab:
   - Copy **Application (client) ID**.
5. Go to **Certificates & secrets** -> **+ New client secret**:
   - Copy the secret **Value** immediately.
6. Under **API permissions**:
   - Ensure `User.Read` and `openid` are present.

### Environment Variables
Add to `.env.local`:
```bash
PUBLIC_MICROSOFT_CLIENT_ID="<your-azure-client-id>"
MICROSOFT_CLIENT_SECRET="<your-azure-client-secret>"
```
Test with: `pnpm setup:test microsoft`

