# Verification Log

## V-1 Cleaner unit tests (T-012)
- Ran: `npm test --workspace @kuracode/extension` (vitest run)
- Result: 9/9 pass. Cases: strip line numbers (plain, dotted, gutter padding), strip prompts ($, >, PS>, #), copy-button text, ANSI escapes, trailing whitespace, CRLF, and language detection happy paths.
- Not tested: real saved pages, split-diff views, mixed indentation with tabs+spaces, root prompt `#` vs real comment disambiguation across languages.

## V-2 Type-check
- Ran: `npm run typecheck` (tsc --noEmit in both workspaces)
- Result: PASS both packages.

## V-3 Lint
- Ran: `npm run lint` (eslint flat config)
- Result: PASS, 0 errors/0 warnings.

## V-4 Build
- Ran: `npm run build`
- Result: PASS. Extension → `packages/extension/dist/` (esbuild); web → `packages/web/dist/` (tsc + vite).

## V-5 Web app on localhost
- Ran: `npm run dev:web -- --port 5199 --strictPort`; browser_check on http://localhost:5199/
- Result: HTTP 200, title "KuraCode", seeded snippets render, 0 console errors, 0 failed requests (favicon 404 fixed via SVG favicon).
- Note: ran on 5199 because 5173 was occupied.

## V-6 Not yet verified
- e2e (no harness), context-menu/hotkey capture, iframe capture, Chrome extension load in a real browser, performance budgets, XSS/security suite, accessibility (axe), 50k-storage benchmark.
