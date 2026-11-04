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
