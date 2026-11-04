# Human Action Required (Owner Tasks)

This document tracks items that require human owner intervention, official developer portal accounts, credit card payment, or private API credentials. Everything else is implemented and verified in the automated repository.

---

## 1. Developer Portal Accounts Setup

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

## 2. GitHub Secrets Setup

Once your developer accounts and cloud projects are active, add these secrets to your GitHub repository under **Settings > Secrets and variables > Actions**:

```env
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
```

Detailed instructions for generating each credential are provided in [docs/PUBLISHING.md](../PUBLISHING.md).
