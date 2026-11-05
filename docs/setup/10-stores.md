# Setup Guide 10: Extension Store Accounts & Automated Publishing

*Verified Date: November 2026*

This guide sets up official developer accounts for the three primary browser extension marketplaces:
1. **Google Chrome Web Store**
2. **Microsoft Edge Add-ons (Partner Center)**
3. **Mozilla Firefox Add-ons (AMO)**

> [!IMPORTANT]
> **Store Policy Rule:** The initial version of any extension MUST be submitted manually once through the web dashboard so store reviewers can verify ownership, privacy disclosures, and single-purpose descriptions. Once approved, subsequent releases are automated via GitHub Actions (`publish.yml`).

---

## 1. Google Chrome Web Store

- **Account Signup:** [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- **Registration Fee:** \$5 one-time developer registration fee.
- **Two-Step Verification:** Required on the Google developer account.
- **Initial Submission:**
  - Package: [`release/kuracode-chrome-0.1.0.zip`](file:///home/dayshift/Pictures/extension%20tool/release/kuracode-chrome-0.1.0.zip)
  - Promotional Assets: Use generated assets from `brand/generated/store/` (`chrome-web-store-128.png`, `promo-440x280.png`, `marquee-1400x560.png`).
  - Single-Purpose Description: *"Capture, organize, and collaborate on code snippets with full context."*
  - Permissions Justifications: Documented in [`docs/STORE_POLICY_AUDIT.md`](file:///home/dayshift/Pictures/extension%20tool/docs/STORE_POLICY_AUDIT.md).
- **Automated Publishing API (OAuth2):**
  - Create a GCP project, enable the **Chrome Web Store API**, generate OAuth Client ID and refresh token per [Chrome Web Store API Docs](https://developer.chrome.com/docs/webstore/using_webstore_api/).
  - Map to GitHub Environment `chrome-web-store`:
    - `CHROME_EXTENSION_ID`
    - `CHROME_CLIENT_ID`
    - `CHROME_CLIENT_SECRET`
    - `CHROME_REFRESH_TOKEN`

---

## 2. Microsoft Edge Add-ons (Partner Center)

- **Account Signup:** [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge)
- **Registration Fee:** Free.
- **Initial Submission:**
  - Package: [`release/kuracode-edge-0.1.0.zip`](file:///home/dayshift/Pictures/extension%20tool/release/kuracode-edge-0.1.0.zip)
  - Store Asset: `brand/generated/store/edge-300.png`.
- **Automated Publishing API:**
  - Go to Partner Center -> Settings -> Developer settings -> API keys.
  - Map to GitHub Environment `edge-addons`:
    - `EDGE_PRODUCT_ID`
    - `EDGE_CLIENT_ID`
    - `EDGE_API_KEY`

---

## 3. Mozilla Firefox Add-ons (AMO)

- **Account Signup:** [Mozilla Add-ons Developer Hub](https://addons.mozilla.org/developers/)
- **Registration Fee:** Free.
- **Fixed Gecko ID:** `kuracode@sahinur.islam` (set in `manifest.firefox.json`).
- **Initial Submission:**
  - Package: [`release/kuracode-firefox-0.1.0.zip`](file:///home/dayshift/Pictures/extension%20tool/release/kuracode-firefox-0.1.0.zip)
  - Source Code Archive: [`release/kuracode-source-0.1.0.zip`](file:///home/dayshift/Pictures/extension%20tool/release/kuracode-source-0.1.0.zip) (Clean TypeScript source with build instructions in `SOURCE_BUILD_INSTRUCTIONS.md`).
- **Automated Signing & Publishing API:**
  - Go to AMO -> Tools -> Manage API Keys.
  - Generate JWT issuer key and secret.
  - Map to GitHub Environment `firefox-amo`:
    - `FIREFOX_API_KEY`
    - `FIREFOX_API_SECRET`
    - `FIREFOX_EXTENSION_ID` (`kuracode@sahinur.islam`)

---

## 4. Emergency Kill Switch (`RELEASE_FROZEN`)

If any store issue or token compromise occurs:
Go to **GitHub Repo** -> **Settings** -> **Secrets and variables** -> **Actions** -> **Variables**:
Set `RELEASE_FROZEN="true"`.
All publishing workflows immediately exit with status code 0 and release assets are safely halted.

