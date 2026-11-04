# SnipHub State (updated: 2025-08-18T00:00:00Z by codvian session 1)

## Snapshot
- Current milestone: M2/M3 (Capture Engine + Cleaning partial) | Overall: ~35% (manual estimate)
- Last verified build: PASS (extension esbuild + web tsc/vite)
- Health: lint PASS | types PASS | unit 9/9 | e2e NOT SET UP | build PASS
- Package manager: npm workspaces (deviation from pnpm, see DECISIONS #1)
- Extension build: esbuild (deviation from Vite/CRXJS, see DECISIONS #2)

## Done milestones / working software
- M0 Foundations: PARTIAL (monorepo, TS strict, lint, vitest, build scripts done; Playwright, CI, verify.sh, resume.sh, fixtures pending)
- M1 Local storage + library UI: PARTIAL (Dexie-style local storage via chrome.storage wrapper, library renderer, web app UI built; property tests, 50k seed, import/export not yet verified)
- M2 Basic capture: PARTIAL (selection capture via toolbar button in content script, clipboard-friendly library, popup + side panel built; hotkey/context-menu, iframe capture, e2e not yet done)
- M3 Smart cleaning: PARTIAL (cleaner with line-number/prompt/copy-button/ANSI removal, language detection; unit tests pass; 85% fixture accuracy not yet verified)

## In progress
- Establishing agent scaffolding under M0 per starting-point.md (state files, scripts, git)

## Next 5 tasks
T-001, T-002, T-003, T-004, T-005

## Blocked / needs human
- none

## Top 3 risks right now
1. No e2e harness yet — capture flows unverified in a real browser with the packed extension.
2. No test fixtures (real saved HTML pages) — cleaner/detection accuracy not measured on real sites.
3. Chrome extension not yet loaded/run to verify context-menu, hotkey, and inject on real pages.

## Commands
- Verify all: `npm run typecheck && npm run lint && npm test && npm run build` | `./scripts/verify.sh`
- Build ext: `npm run build --workspace @kuracode/extension`
- Build web: `npm run build --workspace @kuracode/web`
- Run web dev: `npm run dev:web`
