# Handoff (2025-08-18T00:00:00Z)
- Working on: T-001 (agent scaffolding)
- Done: moved docs to docs/PRD.md + docs/DESIGN.md; created docs/agent/{STATE,TASKS,PROGRESS,DECISIONS,KNOWN_ISSUES,IMPROVEMENTS,VERIFICATION,CHANGELOG,HANDOFF}.md/json.
- Left to do: create `scripts/verify.sh` + `scripts/resume.sh` (T-002); init git + commit; then proceed to M0 tasks T-003 (Playwright), T-004 (CI), T-005 (fixtures).
- Next command to run: `./scripts/verify.sh` (after creating it) or `git status`.
- Gotchas: npm workspaces (not pnpm); extension build is esbuild; dev web port 5173 was occupied (use 5199).
- Uncommitted changes: yes (everything, pre-initial-commit).
