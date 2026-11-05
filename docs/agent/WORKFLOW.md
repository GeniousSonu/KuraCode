# Multi-Machine Workflow & Discipline

This document defines the operating procedure for working across multiple machines (e.g., work and home computers) on KuraCode.

---

## 1. Daily Operating Loop

### Starting a Session (Beginning of day or after switching computers)
```bash
pnpm sync
```
This automated script (`scripts/sync.sh`):
1. Runs `git fetch --all --prune --tags`.
2. Inspects remote incoming commits and local outgoing commits.
3. Pulls using `git pull --rebase --autostash origin <branch>` to keep a linear history.
4. Executes `pnpm install --frozen-lockfile` to keep dependencies in sync.
5. Runs `pnpm brand:build` to keep brand assets up to date.
6. Runs quick verification (`lint`, `typecheck`, `unit tests`).

### During the Session
- Run focused tests frequently: `pnpm test`.
- Check status often: `git status`.
- Do not commit secrets (`.env`, auth tokens, private keys).

### Ending a Session (Leaving machine or wrapping up work)
```bash
pnpm finish
```
This automated script (`scripts/finish-session.sh`):
1. Scans working tree to block accidental commits of `.env` or secret files.
2. Runs the full verification pipeline: `pnpm verify` (lint, typecheck, unit, build chrome, build firefox, brand check, web-ext lint, e2e).
3. Warns if uncommitted tracked changes exist.
4. Pushes the branch cleanly to the remote (`git push origin <branch>`).

---

## 2. Dry-Run Mode
Both scripts support `--dry-run` to preview actions without mutating:
```bash
bash scripts/sync.sh --dry-run
bash scripts/finish-session.sh --dry-run
```

---

## 3. Conflict Resolution Policy
- Never use `git reset --hard` or `git checkout -- .` to discard remote or local work blindly.
- If conflicts occur during rebase:
  - Keep the semantic intent of both machines.
  - For generated files or lockfiles (`pnpm-lock.yaml`), accept the incoming version and run `pnpm install`.
  - Re-run `pnpm verify`.
  - Log the conflict and resolution in `docs/agent/DECISIONS.md`.

