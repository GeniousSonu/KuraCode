# Cross-Surface Feature Parity

**Applies to version:** v0.2.0  
**Maintained per:** Release Guide section 6. Anything marked **no** has a verified rationale in the Notes column. "yes" means the feature works and is covered by unit or Playwright browser E2E test suites.

| Feature                        | Chrome/Edge | Firefox | Safari | Web app         | VS Code | Notes                                                                                                   |
| ------------------------------ | ----------- | ------- | ------ | --------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| Select + hotkey capture        | yes         | yes     | no     | no (n/a)        | no      | Background bridge, S1 e2e. Chrome MV3 & Firefox MV3 parity verified.                                   |
| Inline code-block button       | yes         | yes     | no     | n/a             | n/a     | S3 e2e. Redirect button installs on `<pre>`. Indentation and gutters preserved.                       |
| Clipboard capture (Hub)        | yes         | yes     | no     | paste box       | no      | Popup paste-save (S4) & opt-in Clipboard Hub with Shannon entropy secret scanner.                       |
| Side panel library             | yes         | yes     | no     | full page       | no      | Popup + side panel render library; offline bundled fonts (Inter + JetBrains Mono).                     |
| Search & filtering             | yes         | yes     | no     | yes             | no      | Client-side full-text search (FIND-1/2), language chips, Esc clear, `/` shortcut.                       |
| Instant copy                   | yes         | yes     | no     | yes             | no      | Copy-to-clipboard byte-exact (S6), 32px hit-target action cluster.                                     |
| Offline / local-first          | yes         | yes     | no     | yes             | no      | 100% operational offline without account; zero external network requests before explicit opt-in.       |
| Share links / 4-digit codes    | yes         | yes     | no     | yes             | no      | Cryptographic 4/6-digit quick-share codes with constant-time compare & rate-limiting lockout.          |
| Workspaces & isolation         | yes         | yes     | no     | yes             | no      | Strict storage scoping by `workspaceId`; active workspace persistence; race-condition immunity.         |
| Secret scanner                 | yes         | yes     | no     | yes             | no      | Pre-upload Shannon entropy scanner blocks AWS/GitHub/token leaks. Client leak scan in CI.               |
| Zero-border redesign           | yes         | yes     | no     | yes             | no      | Strict border budget <= 3 borders; 115px compact cards; 5 prose / 4 code rows visible at 380x600.       |
| Brand icons / logo             | yes         | yes     | no     | yes             | no      | Chrome & Firefox MV3 bundles contain all required multi-size icons generated from master SVG.          |

**Build targets present:**
- Chrome / Edge MV3: `.output/chrome-mv3` (bundled with esbuild)
- Firefox MV3: `.output/firefox-mv3` (bundled with esbuild + Mozilla Gecko ID `kuracode@sahinur.islam`)

**Test coverage per surface:**
- Extension Vitest unit suite: 73 passed across cleaner, new-modules, defects, fidelity, upgrade, consistency.
- Playwright Browser E2E: 28 passed across Chromium and Firefox (S1, S3, S4, S6, S11, defects D1-D14, typography, interactive controls, two-user collaboration).
