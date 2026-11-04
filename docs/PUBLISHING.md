# Browser Extension Store Publishing Guide

This guide details account requirements, fees, API credentials setup, and step-by-step submission procedures for Chrome Web Store, Microsoft Edge Add-ons, and Mozilla Firefox Add-ons.

---

## 1. Developer Accounts & Costs Overview

| Store | Registration Fee | Account Portal | Typical Review Time |
| :--- | :--- | :--- | :--- |
| **Chrome Web Store** | \$5 USD (one-time fee) | [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) | 24 - 72 hours |
| **Microsoft Edge Add-ons** | Free | [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge) | 12 - 48 hours |
| **Mozilla Firefox AMO** | Free | [AMO Developer Hub](https://addons.mozilla.org/developers/) | Automated / 2-24 hours |

---

## 2. GitHub Secrets Setup for Automated Publishing

To enable GitHub Actions store publishing, add the following secrets in your repository settings under **Settings > Secrets and variables > Actions**:

### A. Chrome Web Store Credentials
- `CHROME_EXTENSION_ID`: Your Chrome Web Store extension item ID (generated after first draft creation).
- `CHROME_CLIENT_ID`: Google Cloud OAuth2 Client ID.
- `CHROME_CLIENT_SECRET`: Google Cloud OAuth2 Client Secret.
- `CHROME_REFRESH_TOKEN`: OAuth2 Refresh Token authorized for Chrome Web Store API scope.

> **Google Cloud Setup Steps:**
> 1. Go to [Google Cloud Console](https://console.cloud.google.com/).
> 2. Create a project and enable the **Chrome Web Store API**.
> 3. Go to **Credentials > Create Credentials > OAuth client ID** (Application type: Desktop App).
> 4. Use `npx chrome-webstore-upload-cli rc` to generate your refresh token.

### B. Microsoft Edge Add-ons Credentials
- `EDGE_PRODUCT_ID`: Product UUID from Edge Partner Center.
- `EDGE_CLIENT_ID`: Azure AD Application Client ID.
- `EDGE_API_KEY`: Azure AD Client Secret or API Key.

### C. Mozilla Firefox AMO Credentials
- `FIREFOX_API_KEY`: JWT Issuer Key from [AMO API Keys](https://addons.mozilla.org/developers/addon/api/key/).
- `FIREFOX_API_SECRET`: JWT Secret Key.
- `FIREFOX_EXTENSION_ID`: `kuracode@sahinur.islam`

---

## 3. First-Time Manual Submission Walkthrough

For the very first release (`v0.1.0`), browser stores require a human developer to establish the store listing draft manually:

### 1. Chrome Web Store
1. Log into the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Click **Add new item**.
3. Upload `release/kuracode-chrome-0.1.0.zip`.
4. Copy text from `store/chrome/en/listing.md` into the Title, Description, and Category fields.
5. Upload visual assets:
   - Icon: `brand/generated/store/chrome-web-store-128.png`
   - Promo Small Tile: `brand/generated/store/promo-440x280.png`
   - Marquee Tile: `brand/generated/store/marquee-1400x560.png`
6. Fill in the **Privacy** tab using disclosures in `store/chrome/en/listing.md`.
7. Submit for review.

### 2. Microsoft Edge Add-ons
1. Log into [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge).
2. Click **Create new extension**.
3. Upload `release/kuracode-edge-0.1.0.zip`.
4. Copy listing copy from `store/edge/en/listing.md`.
5. Upload icon: `brand/generated/store/edge-300.png`.
6. Paste certification test notes into the Notes field.
7. Submit for certification.

### 3. Mozilla Firefox Add-ons (AMO)
1. Log into [AMO Developer Hub](https://addons.mozilla.org/developers/).
2. Click **Submit a New Add-on**.
3. Select **On this site (Listed)**.
4. Upload `release/kuracode-firefox-0.1.0.zip`.
5. When prompted *"Does your add-on contain minified, concatenated or generated code?"*, select **YES**.
6. Upload `release/kuracode-source-0.1.0.zip` as the source archive.
7. Provide the contents of `SOURCE_BUILD_INSTRUCTIONS.md` in the notes box.
8. Submit for review.
