# KuraCode Repository Maintenance & Governance Guide

This document specifies repository settings, branch protection rules, and routine maintenance protocols for KuraCode.

---

## 1. Branch Protection Settings (`main`)

To preserve trunk-based release stability and prevent accidental overwrites or broken code on `main`, the repository owner must configure GitHub branch protection:

### Where to click:
**GitHub Repository > Settings > Branches > Add branch protection rule**

### Configuration Settings:
- **Branch name pattern:** `main`
- [x] **Require a pull request before merging**
  - [x] Require approvals: `1` (or self-approved when solo)
  - [x] Dismiss stale pull request approvals when new commits are pushed
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks:**
    - `Full Quality Gate (Ubuntu Linux)`
    - `Build Smoke (macos-latest)`
    - `Build Smoke (windows-latest)`
- [x] **Require conversation resolution before merging**
- [x] **Require signed commits** *(Recommended)*
- [x] **Require linear history** (enforces clean squash merges)
- [x] **Do not allow bypassing the above settings**
- [ ] *Allow force pushes* (**Unchecked** — never allow force pushes to main)
- [ ] *Allow deletions* (**Unchecked**)

### Enable Auto-Merge:
**GitHub Repository > Settings > General > Pull Requests**
- [x] **Allow auto-merge** (enables `gh pr merge --auto --squash` so clean PRs merge immediately upon CI passing).
- [x] **Automatically delete head branches** (keeps the repository free of stale branches).

---

## 2. GitHub Environments & Deployment Approvals

To enforce least-privilege security and prevent accidental store uploads:
**GitHub Repository > Settings > Environments > New Environment**

Create the following 3 environments:
1. `chrome-web-store`
   - [x] **Required reviewers:** Add your GitHub username.
   - [x] **Deployment branches:** `Selected branches` > `main` and `refs/tags/v*`.
2. `edge-addons`
   - [x] **Required reviewers:** Add your GitHub username.
   - [x] **Deployment branches:** `Selected branches` > `main` and `refs/tags/v*`.
3. `firefox-amo`
   - [x] **Required reviewers:** Add your GitHub username.
   - [x] **Deployment branches:** `Selected branches` > `main` and `refs/tags/v*`.

---

## 3. Automated Routine Maintenance Schedules

| Schedule | Workflow / Tool | Purpose |
| :--- | :--- | :--- |
| **Every Push & PR** | `ci.yml` | Full gate (lint, types, vitest, dual MV3 build, brand, web-ext lint, playwright e2e, release allow-list). |
| **Daily (02:00 UTC)** | `nightly.yml` | Deep cross-browser E2E (Chromium + Firefox), high-severity dependency audit (`pnpm audit`), and policy verification. |
| **Weekly (Sunday 03:00 UTC)** | `cleanup.yml` | Deletes stale CI workflow runs and abandoned draft releases older than 30 days. Never deletes tagged releases or the last 3 stable versions. |
| **Weekly (Monday 04:00 UTC)** | Dependabot | Grouped dependency security PRs. Only patch versions are eligible for automated review. |

---

## 4. Daily Developer Commands

- **Start of work session:**
  ```bash
  pnpm sync
  ```
- **Fast local check (pre-push):**
  ```bash
  pnpm verify:fast
  ```
- **Full quality check & package audit:**
  ```bash
  pnpm verify
  ```
- **End of work session (clean -> verify -> package -> commit -> push):**
  ```bash
  pnpm ship "feat(scope): your descriptive conventional commit message"
  ```
