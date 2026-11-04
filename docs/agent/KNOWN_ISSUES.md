# Known Issues & Gaps

## #1 No e2e harness yet
- Severity: high | Req: CAP-1..5 | Found: T-001 | Status: open
- Symptom: capture flows not verified in a real browser with the built extension.
- Workaround: unit tests cover the cleaner; build verified by tsc/esbuild/vite.

## #2 No test fixtures (real saved HTML pages)
- Severity: medium | Req: CLEAN-5, CTX-2 | Found: T-001 | Status: open
- Symptom: cleaner/detection accuracy not measured on real sites.
- Workaround: table-driven unit tests only.

## #3 Storage is chrome.storage.local, not Dexie/IndexedDB
- Severity: medium | Req: ORG-1 | Found: T-001 | Status: open
- Symptom: no proper queries, migrations, or 50k benchmark.
- Upgrade path: T-006/T-007 (Dexie).

## #4 No secret scanner / license detection yet
- Severity: high (privacy) | Req: PRIV-3, LIC-1 | Found: T-001 | Status: open
- Symptom: captured snippets are not scanned before share (share not yet implemented either).
- Upgrade path: T-016.

## #5 Vite dev on a non-default port
- Severity: low | Found: T-001 | Status: open
- Symptom: port 5173 was occupied during development; dev server ran on 5199.
- Workaround: `npm run dev:web -- --port 5199 --strictPort`.
