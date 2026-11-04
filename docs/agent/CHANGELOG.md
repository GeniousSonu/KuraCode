# Changelog

## 0.1.0 (2025-08-18) — initial foundation
- Moved docs: `docs/PRD.md` (from root), `docs/DESIGN.md` (design system).
- Bootstrapped Agent State System under `docs/agent/`.
- Established monorepo (npm workspaces): `packages/extension`, `packages/web`.
- Extension (MV3, esbuild): content script capture with inline save button, background service worker, popup + side panel, shared cleaner/library/storage/types/messages.
- Web app (Vite + React): library UI with design tokens.
- Gates green: typecheck, lint, 9 unit tests, extension+web build.
- Known gaps: no e2e, no fixtures, storage is chrome.storage.local, no secret/license scanner.
