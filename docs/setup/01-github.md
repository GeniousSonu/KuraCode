# Setup Guide 01: GitHub (Repository & OAuth App)

*Verified Date: November 2026*

This guide configures two aspects of GitHub:
1. **GitHub OAuth App:** Enables "Continue with GitHub" sign-in for KuraCode.
2. **GitHub Repository Settings:** Configures branch protection, protected environments, and release publishing.

---

## 1. GitHub OAuth App Setup (Sign-In)

### Exact Steps
1. Log in to GitHub and open **Settings** (top right avatar -> Settings).
2. In the left navigation, scroll to the bottom and click **Developer settings**.
3. Click **OAuth Apps** -> **New OAuth App**.
4. Fill in the exact registration form:
   - **Application name:** `KuraCode`
   - **Homepage URL:** `https://www.genioussonu.me/extensions/kuracode`
   - **Application description:** `Code snippet capture, search, and team workspaces.`
   - **Authorization callback URL:**
     - For Web & Chrome Extension: `https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/`
     - *(Note: Supabase can also serve as the callback bridge: `https://<your-project>.supabase.co/auth/v1/callback`)*
5. Click **Register application**.
6. On the application details page:
   - Copy the **Client ID**.
   - Click **Generate a new client secret** and copy the secret immediately.

### Scopes Requested
KuraCode requests the absolute minimum scopes required:
- `read:user` (to read public profile name and avatar)
- `user:email` (to associate account with snippets)
*(Never request `repo`, `write`, or administrative scopes)*

*Note on future VS Code extension:* For VS Code and IDE integrations, GitHub's Device Authorization Flow (`/login/device/code`) will use the same Client ID without client secrets.

### Environment Variables
Add to `.env.local`:
```bash
PUBLIC_GITHUB_CLIENT_ID="<your-client-id>"
GITHUB_CLIENT_SECRET="<your-client-secret>"
```

### Testing the Integration
```bash
pnpm setup:test github
```
**Success output:**
```
✔ [PASS] GitHub OAuth App credentials verified. Capability 'auth.github' is now ENABLED.
```

---

## 2. GitHub Repository Settings & CI/CD Protection

To protect the `main` branch from regression and configure automated store releases:

1. Open your repository on GitHub: `https://github.com/GeniousSonu/KuraCode`
2. Navigate to **Settings** -> **Branches** -> **Add branch ruleset** (or **Add rule**):
   - **Branch name pattern:** `main`
   - Check **Require a pull request before merging**
   - Check **Require status checks to pass before merging**
     - Select check: `ci / quality-gate`
   - Check **Do not allow bypassing the above settings**
3. Navigate to **Settings** -> **General** -> Under **Pull Requests**:
   - Check **Allow auto-merge** (permits automated clean updates)
4. Navigate to **Settings** -> **Environments** -> Click **New environment**:
   - Create 3 protected environments for store deployments:
     1. `chrome-web-store`
     2. `edge-addons`
     3. `firefox-amo`
   - For each environment, check **Required reviewers** (add yourself) so releases require explicit owner approval.

---

## 3. Free-Tier Limits & Rotation

- **Limits:** Unlimited public repository build minutes, OAuth free tier has no user limits.
- **Revocation / Rotation:** If `GITHUB_CLIENT_SECRET` is ever exposed, open the OAuth App page, click **Revoke all user tokens**, click **Generate a new client secret**, and delete the old secret.

