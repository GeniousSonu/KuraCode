# KuraCode Developer & Agent Workflow Specification

This document defines the strict standard operating procedure (SOP) for development, verification, and shipping on the KuraCode project.

---

## 1. Golden Rule of KuraCode Engineering
> **"Never push red. Never commit secrets. Never ship stale artifacts."**  
> Every change must be verified against real gates before pushing. Statuses must reflect honest reality backed by evidence files.

---

## 2. Standard Session Lifecycle

```
[Start of Session]
       │
       ▼
  `pnpm sync` ────────► Pulls latest work, preserves WIP, checks environment
       │
       ▼
 [Coding Phase] ─────► Implement features & write unit/e2e tests
       │
       ▼
 `pnpm verify:fast` ──► Quick sanity check (lint, typecheck, unit, build)
       │
       ▼
  `pnpm ship` ────────► 7-step master gate (clean -> verify -> package -> commit -> push)
       │
       ▼
 [End of Session] ───► Working tree clean, remote updated, state files fresh
```

---

## 3. Daily Command Reference

### Start of Work:
```bash
# Sync local machine with latest remote git changes
pnpm sync
```

### During Development:
```bash
# Run unit & migration tests
pnpm test

# Run typechecks across workspace packages
pnpm typecheck

# Fast pre-push check (lint + types + unit + build + version check in <10s)
pnpm verify:fast

# Full quality gate (includes Playwright E2E and web-ext lint)
pnpm verify
```

### Packaging & Release Simulation:
```bash
# Wipe all build outputs and old release artifacts
pnpm clean

# Generate release packages and SHA256SUMS.txt
pnpm package

# Validate release archive allow-list
pnpm test:release-contents

# Validate single-source version consistency
pnpm test:version-integrity

# Run post-release sandboxed smoke test
pnpm test:smoke-release

# Full dry-run release simulation
pnpm release:dry
```

### Finishing Work / Shipping:
```bash
# Master pipeline command: runs pre-flight, clean, verify, package, commit, push
pnpm ship "feat(module): description of your change"
```

---

## 4. Feature Branch & PR Protocol

When developing larger multi-step features:
1. Create a short-lived branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make changes, run `pnpm verify:fast`.
3. Open PR and enable auto-merge:
   ```bash
   bash scripts/create-pr.sh "feat: implement feature XYZ" "Details on changes..."
   ```
4. GitHub Actions CI runs the full gate. Upon passing, the PR is automatically squash-merged into `main`.
