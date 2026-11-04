# KuraCode State (updated: 2025-08-18T00:00:00Z by codvian session 1)

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

1. e2e harness now passes (smoke) but only covers one fixture; real-site capture flows still unverified.
2. Test fixtures are minimal — cleaner/detection accuracy not measured on a real corpus.
3. Context-menu / hotkey capture not yet exercised in e2e.

## Commands

- Verify all: `./scripts/verify.sh` (lint → typecheck → unit → build → e2e)
- Build ext: `npm run build --workspace @kuracode/extension`
- e2e ext: `npm run e2e --workspace @kuracode/extension` (xvfb-run when no display)
- Build web: `npm run build --workspace @kuracode/web`
- Run web dev: `npm run dev:web`
