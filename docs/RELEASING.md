# KuraCode Release Engineering & Operations Guide

This document defines the release engineering policy, automated workflows, and safety procedures for KuraCode.

---

## 1. Release Philosophy & Core Invariants

1. **Trunk-Based Delivery:** `main` is always in a releasable, production-ready state.
2. **Zero Stale Artifacts:** Every release build begins by purging all prior build, packaging, and test caches (`scripts/clean.sh`). Cached output is never reused across releases.
3. **Single-Source Version Synchronization:** `package.json` version strictly equals Chrome MV3 manifest, Firefox MV3 manifest, Web app package, `CHANGELOG.md` latest entry, and release archive filenames. Any mismatch fails CI immediately (`scripts/version-integrity.ts`).
4. **Allow-List Archive Contents:** Extension bundles (`kuracode-chrome-*.zip`, `kuracode-edge-*.zip`, `kuracode-firefox-*.zip`) contain exclusively approved production assets. Test files, `.env` configs, node_modules, and documentation are strictly forbidden (`scripts/verify-release-contents.ts`).
5. **No Production Store Release Without Approval:** Release builds to GitHub Releases are automated upon tagging; store deployments require explicit approval in GitHub Protected Environments (`chrome-web-store`, `edge-addons`, `firefox-amo`).

---

## 2. Release Lifecycle Flowchart

```
[Feature Branch]
       │
       ▼
 [pnpm ship] ───► Full Local Gate (clean -> verify -> package -> audit)
       │
       ▼
 [Push Branch] ───► Pull Request to main
       │
       ▼
[GitHub Actions CI] ───► Ubuntu verify + Windows/macOS smoke
       │
       ▼
  [Auto-Merge] ───► Merged into main (Squash)
       │
       ▼
[Release-Please] ───► Maintains Release PR (Version bump + CHANGELOG)
       │
       ▼
[Merge Release PR] ──► Tags vX.Y.Z
       │
       ▼
[release.yml] ───► Clean rebuild from scratch -> Run all gates -> Generate SHA256SUMS + SBOM
       │
       ▼
[GitHub Release] ───► Assets attached as "Latest"
       │
       ▼
[publish.yml] ───► Protected Environments (Requires Owner Approval) -> Store APIs
```

---

## 3. Emergency Controls & Safety Rails

### Release Freeze Switch
If an unexpected vulnerability, breaking upstream API change, or policy inquiry occurs, freeze the automated release pipeline immediately:
1. Navigate to repository **Settings > Secrets and variables > Actions > Variables**.
2. Set or update variable: `RELEASE_FROZEN = true`.
3. Both `release.yml` and `publish.yml` will fail-fast with a descriptive safety abort notice before packaging or transmitting any artifacts.
4. To unfreeze: set `RELEASE_FROZEN = false`.

### Store Rollback Procedures

| Store Channel | Rollback Capability | Required Owner Action |
| :--- | :--- | :--- |
| **Chrome Web Store** | Staged rollout halt / Immediate update | In Developer Console, halt staged rollout if $< 100\%$. If fully published, deploy immediate patch release (e.g. `v0.2.1`). |
| **Microsoft Edge Add-ons** | Revert to previous package | Select previous approved submission in Partner Center and click "Revert", or submit hotfix patch. |
| **Mozilla Firefox AMO** | Version disabling | Open Developer Hub > Manage Versions > Select compromised version > Click "Disable Version". AMO immediately rolls users back to the previous active version. |

---

## 4. Hotfix Workflow

When a critical bug in production requires an immediate fix:
1. **Checkout from Production Tag:**
   ```bash
   git checkout -b hotfix/v0.2.1 tags/v0.2.0
   ```
2. **Apply Minimal Fix and Bump Patch Version:**
   ```bash
   # Make code fix, then bump patch version across all manifests:
   pnpm bump patch
   ```
3. **Verify Locally:**
   ```bash
   pnpm ship "fix(security): resolve issue XYZ"
   ```
4. **Merge to Main and Tag:**
   Open PR against `main`. Once merged, release-please creates `v0.1.1` and triggers the clean release pipeline.

---

## 5. Artifact Determinism & Verification

Every release produces:
- `kuracode-chrome-<version>.zip` (Standard Chromium MV3)
- `kuracode-edge-<version>.zip` (Microsoft Edge MV3)
- `kuracode-firefox-<version>.zip` (Mozilla AMO MV3)
- `kuracode-source-<version>.zip` (Clean source code without build leaks for Mozilla review)
- `SHA256SUMS.txt` (Cryptographic checksum ledger)
- `kuracode-sbom-<version>.json` (CycloneDX Software Bill of Materials)

To verify release artifacts post-build:
```bash
pnpm test:smoke-release
```
