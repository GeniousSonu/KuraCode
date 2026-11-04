# Decision Log (ADR-lite)

## #1 Use npm workspaces instead of pnpm
- Date: 2025-08-18 | Status: accepted
- Starting-point default: pnpm workspaces. This repo was already scaffolded with npm workspaces and works.
- Reason: `npm` is preinstalled (Node 22) and avoids a pnpm install step; keeps the environment minimal.
- Reverse: change root `package.json` to `packageManager: "pnpm"` and add `pnpm-workspace.yaml`.

## #2 Extension built with esbuild instead of Vite/CRXJS/WXT
- Date: 2025-08-18 | Status: accepted
- Starting-point default: Vite + MV3 plugin (CRXJS or WXT).
- Reason: the extension is small (content script, background, popup, side panel). esbuild bundles TS → `dist/` quickly with no plugin/version churn. HMR is unnecessary for a build-on-demand workflow.
- Reverse: adopt WXT if the extension grows (per-site adapters, more builds).

## #3 Local storage: chrome.storage.local for now (not Dexie/IndexedDB)
- Date: 2025-08-18 | Status: accepted (with gap)
- Starting-point default: IndexedDB via Dexie for snippets; chrome.storage for settings.
- Reason: `chrome.storage.local` was the quickest path to a working library and is available in every extension context. Capacity is large enough for thousands of snippets.
- Gap: no queries beyond in-memory index, no migrations, no 50k benchmark. Upgrade path (Dexie) is T-006/T-007.

## #4 UI library: React (not Preact), plain CSS (not Tailwind)
- Date: 2025-08-18 | Status: accepted
- Starting-point default: Preact or React + Tailwind + Shadow DOM. React chosen (ecosystem + existing web app uses React). Tailwind skipped in favor of the design-system tokens (CSS custom props) from docs/DESIGN.md.

## #5 Web app: Vite + React SPA (not Next.js)
- Date: 2025-08-18 | Status: accepted
- Reason: viewer + library is a client-side SPA; no SSR need yet. Next.js can be adopted for SEO-heavy public sharing (M8).
