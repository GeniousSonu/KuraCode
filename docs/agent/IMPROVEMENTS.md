# Improvement Ideas (for stronger agents)

## IMP-1 Adopt Dexie/IndexedDB for snippets

- Current: chrome.storage.local + in-memory index.
- Why not better: no complex queries, migrations, or large-volume benchmarks.
- Upgrade path: add `dexie` dep, define schema, write migrations; property tests (T-006) + 50k seed (T-007).
- Effort: M | Impact: high

## IMP-2 Add Playwright e2e harness

- Current: no e2e.
- Upgrade path: load `dist/` as unpacked extension in Chromium; script hotkey, context-menu, popup flows.
- Effort: M | Impact: high

## IMP-3 Build a real test-fixture corpus

- Current: no saved real pages.
- Upgrade path: save anonymized HTML from GitHub, Stack Overflow, MDN, dev.to, docs frameworks, etc. (≥15 pages).
- Effort: M | Impact: high

## IMP-4 Train/improve language detection

- Current: heuristic, no corpus accuracy (see VERIFICATION V-1).
- Upgrade path: build 40+ snippet corpus per language, measure per-language accuracy, target ≥85% overall.
- Effort: M | Impact: high

## IMP-5 Secret scanner + license detection (M6)

- Current: missing.
- Upgrade path: implement PRIV-3/LIC-1 with precision/recall tests.
- Effort: M | Impact: high (privacy)

## IMP-6 Brand assets: wordmark, monochrome dark SVG, Safari 1024 app icon

- Current: mark-only geometric K from the supplied SVG; no official wordmark; `logo-dark.svg` is identical to `logo-light.svg`; no Safari 1024×1024 opaque app icon.
- Why not better: these are original-design assets an agent should not invent (hard rule: never redraw/recolor the logo).
- What to supply: (1) an official wordmark SVG (mark + “KuraCode” lockup) for README/store; (2) a monochrome white/light SVG variant for dark toolbars and dark surfaces; (3) a 1024×1024 opaque (no transparency) app-icon for Safari; (4) optional 16px-optimized mark. Include exact files, not just guidance.
- Effort: S–M (designer) | Impact: medium (store polish, toolbar contrast)
