# KuraCode Release Management Guide

This document outlines the standard release process, hotfix workflow, rollback plan, and post-release verification checklist.

---

## 1. Normal Release Flow (Automated Trunk-Based)

KuraCode uses automated release management powered by Conventional Commits:

```
[Developer Commits]
      │ (feat:, fix:, perf:)
      ▼
[Push to main]
      │
      ▼
[Release-Please Action]
      │ (Bumps version, creates Release PR & CHANGELOG.md)
      ▼
[Review & Merge Release PR]
      │
      ▼
[GitHub Tag vX.Y.Z created]
      │
      ▼
[Release Workflow Runs]
      ├── 1. Build and test all packages
      ├── 2. Run release:check security & permission gates
      ├── 3. Generate release/*.zip, SBOM, and SHA256SUMS.txt
      ├── 4. Publish GitHub Release
      └── 5. Dispatch store publish jobs (Chrome, Edge, Firefox)
```

### Manual Release Steps (Dry Run / Local)
```bash
# 1. Ensure clean working directory on main
git checkout main
git pull origin main

# 2. Run full dry-run verification
pnpm release:dry

# 3. Artifacts will be generated in release/
ls -lh release/
```

---

## 2. Hotfix Workflow
If a critical production bug is detected:
```bash
# 1. Create hotfix branch from release tag
git checkout -b hotfix/v0.1.1 v0.1.0

# 2. Apply fix and test locally
pnpm test
pnpm release:check

# 3. Commit with fix conventional commit
git commit -m "fix(cleaner): resolve edge case prompt stripping"

# 4. Open PR targeting main. Once merged, release-please generates patch release v0.1.1
```

---

## 3. Rollback Plan
Because browser extension stores enforce distinct review cycles:
- **Chrome Web Store:** Staged rollout can be halted immediately in the Developer Dashboard. To rollback, submit a new release with an incremented version number (`v0.1.2`) containing the reverted commit.
- **Microsoft Edge Add-ons:** Edge takes 12-48h for certification review. If an issue occurs, immediately submit an expedited update with a reverted build.
- **Mozilla Firefox AMO:** Firefox allows unlisting or immediate submission of a replacement patch.

---

## 4. Post-Release Verification Checklist
After a release goes live on web stores:
- [ ] Install extension from store on a fresh browser profile.
- [ ] Verify version number in toolbar popup matches `vX.Y.Z`.
- [ ] Open test page (`test-pages/demo.html`) and verify inline Save button renders.
- [ ] Test keyboard capture shortcut (`Ctrl+Shift+S` / `Cmd+Shift+S`).
- [ ] Test search and copy-to-clipboard functionality.
- [ ] Check Chrome Web Store / AMO developer console for crash telemetry or user reports.
