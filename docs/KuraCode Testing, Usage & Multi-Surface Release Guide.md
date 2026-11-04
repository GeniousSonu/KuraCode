# KuraCode: Testing, Usage & Multi-Surface Release Guide

_One backend, one core, many faces: Chrome, Edge, Brave, Firefox, Safari, web app, VS Code, and more. Companion to the PRD and the Master Agent Prompt. Browser store rules and tool flags change, so verify exact current details in each vendor's docs at release time._

## 1. The big idea: one brain, many faces

Every "face" (browser extension, web app, IDE plugin, Slack app, CLI) is a thin client. All logic that matters lives in two shared places, so behavior is identical everywhere and testing is not repeated per surface.

```
            +-------------------- Backend (single API, versioned /v1) --------------------+
            |  Auth | Snippets | Collections | Workspaces | Comments | Share links | Sync   |
            +-------------------------------------------------------------------------------+
                      ^                 ^                  ^                 ^
                      | generated SDK + shared types (packages/sdk, packages/core)
   +------------------+--+  +-----------+---+  +-------------+--+  +-------------+--+
   | Browser extension   |  | Web app / PWA |  | VS Code ext    |  | Slack / CLI /  |
   | Chrome Edge Brave   |  | viewer+library|  | (JetBrains     |  | API clients    |
   | Firefox Safari      |  |               |  |  later)        |  |                |
   +---------------------+  +---------------+  +----------------+  +----------------+
```

**Two shared layers**

1. **`packages/core`** (TypeScript): snippet model, cleaner, language detector, secret scanner, license detector, search index, sync logic. Identical code in every client.
2. **`packages/sdk`**: API client generated from one OpenAPI spec. Every client talks to the backend only through it.

**Rule:** a bug fixed in `core` or the backend is fixed for every face at once. Per-surface code is limited to UI and platform glue (capture hooks, storage adapter, auth flow).

## 2. Surface and browser matrix

| Face                       | Engine / platform                     | Build target                                      | Status in plan          |
| -------------------------- | ------------------------------------- | ------------------------------------------------- | ----------------------- |
| Chrome                     | Chromium, MV3 service worker          | `chrome-mv3`                                      | Primary                 |
| Edge                       | Chromium                              | same build as Chrome (separate store listing)     | Primary                 |
| Brave, Opera, Vivaldi, Arc | Chromium                              | same Chrome build, sideload or store              | Supported (smoke tests) |
| Firefox                    | Gecko, MV3 with event-page background | `firefox-mv3`                                     | Primary                 |
| Firefox Android            | Gecko                                 | `firefox-mv3` (limited UI)                        | Later                   |
| Safari (macOS/iOS)         | WebKit                                | converted from the Firefox/Chrome build via Xcode | Later                   |
| Web app / PWA              | Any modern browser                    | `apps/web`                                        | Collaboration launch    |
| VS Code                    | Node extension host                   | `apps/vscode`                                     | Phase 5                 |
| Slack / CLI / API          | Server or terminal                    | `apps/slack`, `apps/cli`, public API              | Phase 5                 |

### 2.1 Known cross-browser differences (and how we absorb them)

| Topic              | Chrome / Chromium                                | Firefox                                                        | Our approach                                                     |
| ------------------ | ------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Namespace          | `chrome.*` (promises in MV3)                     | `browser.*` (promises), also exposes `chrome.*`                | Use a thin `webextension-polyfill` wrapper in one file           |
| Background         | Service worker (can be suspended)                | Event page / background scripts in MV3                         | Write the background as stateless event handlers; works in both  |
| Side UI            | `sidePanel` API                                  | `sidebar_action`                                               | Abstract as `SidePanelAdapter`; fall back to popup or a full tab |
| Manifest           | `background.service_worker`                      | `background.scripts` plus `browser_specific_settings.gecko.id` | Generate two manifests from one source at build time             |
| Host permissions   | Granted at install or optional                   | Treated as optional/user-granted in MV3                        | Request on demand; design for permission being absent            |
| OAuth in extension | `chrome.identity.launchWebAuthFlow`              | `browser.identity.launchWebAuthFlow` (different redirect URL)  | Auth adapter per browser, same backend OAuth endpoints           |
| Omnibox, commands  | Supported                                        | Supported with small differences                               | Feature-detect, degrade gracefully                               |
| Safari             | Needs Apple developer account and an app wrapper | Converter from an existing extension                           | Separate packaging step, same code                               |

**Build tool:** use a multi-browser-aware framework (WXT or equivalent) that outputs `chrome-mv3` and `firefox-mv3` from one codebase, with feature flags per target.

## 3. Test strategy overview

Testing is layered so that most checks run once on shared code, and only thin, browser-specific checks run per face.

| Layer                 | What                                               | Runs on                                                      | Frequency                              |
| --------------------- | -------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| L1 Unit               | cleaner, detector, scanner, license, search, sync  | Node (Vitest)                                                | every commit                           |
| L2 Fixture            | capture on saved HTML pages of real sites          | Node + jsdom, plus real browser                              | every commit                           |
| L3 Backend contract   | API against OpenAPI spec, auth, permissions, RLS   | CI with test database                                        | every commit                           |
| L4 Client contract    | each client uses the SDK, mocked then real backend | CI                                                           | every commit                           |
| L5 Browser E2E        | real extension in real browser                     | Chromium (auto), Firefox (auto via web-ext), Safari (manual) | every PR (Chromium), nightly (Firefox) |
| L6 Cross-surface E2E  | save in extension, appear in web app and VS Code   | CI against staging                                           | nightly                                |
| L7 Manual exploratory | human checklist per release                        | real machines/devices                                        | every release                          |
| L8 Non-functional     | performance, security, accessibility, privacy      | CI plus manual                                               | per milestone                          |

## 4. How to test the extension, step by step

### 4.1 Build and load locally

```bash
pnpm install
pnpm -F extension build:chrome      # output: apps/extension/.output/chrome-mv3
pnpm -F extension build:firefox     # output: apps/extension/.output/firefox-mv3
pnpm -F extension dev:chrome        # hot reload dev session
pnpm -F extension dev:firefox
```

**Chrome / Edge / Brave / Opera / Vivaldi (manual load)**

1. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose the `chrome-mv3` output folder.
4. Pin the extension; open its service worker console from the extension card to see logs.
5. After rebuilds, press the reload icon on the card.

**Firefox (temporary add-on)**

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and choose `manifest.json` inside `firefox-mv3`.
3. Click **Inspect** to open the background console. Temporary add-ons are removed when Firefox closes.
4. Preferred for repeat testing: `npx web-ext run --source-dir apps/extension/.output/firefox-mv3`, which launches a clean Firefox profile and auto-reloads on changes. Use `web-ext lint` before every release.

**Safari (later phase)**

1. Run `xcrun safari-web-extension-converter <extension folder>` to generate an Xcode project.
2. Build and run from Xcode; enable the extension in Safari settings (and enable the Develop menu to allow unsigned extensions).
3. Test on macOS first, then iOS/iPadOS simulators and one real device.

### 4.2 Automated browser tests

**Chromium (Playwright)**: launch with a persistent context and load the unpacked extension, then drive real pages and assert on storage, UI, and network.

```ts
const context = await chromium.launchPersistentContext(tmpProfile, {
  channel: "chromium",
  args: [
    `--disable-extensions-except=${extPath}`,
    `--load-extension=${extPath}`,
  ],
});
// find the extension id from the service worker URL, then test popup/side panel pages directly
```

**Firefox**: Playwright does not load Firefox extensions out of the box, so use `web-ext run` with a Selenium/WebDriver (geckodriver) session or Firefox's remote debugging to install the add-on temporarily, then run the same scenario scripts. Keep scenarios in a **browser-agnostic scenario library** (`tests/scenarios/*.ts`) so Chromium and Firefox runners execute identical steps through a small driver interface.

**Edge, Brave, Opera, Vivaldi**: run the Chromium suite using their binaries (via `executablePath`) in a nightly smoke job. They share the Chrome build, so only launch, permissions, and storage need smoke checks.

### 4.3 Core scenario list (must pass on every browser)

| ID  | Scenario                                              | Pass condition                                                                 |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| S1  | Select code on a Stack Overflow fixture, press hotkey | Snippet saved in under 300 ms with URL, title, language                        |
| S2  | Right-click selection, "Save to KuraCode"             | Same as S1                                                                     |
| S3  | Hover a GitHub code block, click inline Save          | Cleaned code (no line numbers), correct language, button does not shift layout |
| S4  | Copy from an IDE, open popup, paste-save              | Snippet created, source marked "clipboard"                                     |
| S5  | Search by code fragment, tag, and source domain       | Correct result in under 100 ms (10k seed)                                      |
| S6  | Copy and insert from library                          | Clipboard content matches saved code exactly (tabs/spaces/newlines)            |
| S7  | Work offline, save 5 snippets, reconnect              | All 5 synced once, no duplicates                                               |
| S8  | Sign in, save on device A, open on device B           | Appears within sync interval                                                   |
| S9  | Share with workspace; secret in code                  | Scanner warns before share                                                     |
| S10 | Open share link logged out                            | Viewer renders; private snippet returns not-found                              |
| S11 | Page with strict CSP, iframes, shadow DOM             | Capture still works or degrades with a clear message                           |
| S12 | Disable site access / revoke permissions              | Extension explains what is missing; no crash                                   |

## 5. Same backend, many faces: how to test that it truly behaves the same

### 5.1 Contract-first

- One **OpenAPI spec** is the source of truth. Generate the SDK and server validators from it.
- **Backend contract tests** run the spec against a real test database, including every role/permission combination (Owner, Admin, Editor, Commenter, Viewer, anonymous, link holder).
- **Client contract tests** replay recorded API fixtures through each client to prove it handles success, errors, pagination, and version changes.

### 5.2 Cross-surface E2E (the proof)

A nightly job against a staging environment runs this chain with separate clients:

1. Extension (Chromium) saves a snippet with tags.
2. Same account in Firefox extension sees it after sync; edits the note.
3. Web app shows the edit and creates a share link.
4. VS Code client (headless test host) searches and inserts the snippet.
5. Second user, in a workspace, comments on line 4 via the web app.
6. Extension receives the comment notification and displays it.

Assert the **same snippet ID, same content hash, correct version history** at every step.

### 5.3 Versioning and compatibility

- API is versioned (`/v1`). Additive changes only within a version; breaking changes get `/v2` and an overlap period.
- Clients send `X-Client`, `X-Client-Version`. The backend can return a **minimum supported version** so old extensions show an "update required" screen instead of failing weirdly.
- Run an **N-1 compatibility test**: the previous released client build against the new backend must pass the core scenarios.
- Feature flags (server-driven) allow turning features on per surface without a store release.

### 5.4 Auth per surface

| Face      | Login method                                                                                | Token handling                                                                          |
| --------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Extension | OAuth/OIDC via `identity.launchWebAuthFlow`, or open the web app and return a one-time code | Short-lived access token plus refresh token in extension storage; never in page context |
| Web app   | Cookie session or standard OAuth                                                            | HttpOnly secure cookies                                                                 |
| VS Code   | Browser-based device/code flow                                                              | Stored in the editor's secret storage                                                   |
| CLI/Slack | Device code or workspace-installed app token                                                | Scoped, revocable                                                                       |

Test each flow for expiry, revocation, refresh failure, and sign-out on one device invalidating sessions where intended.

## 6. Cross-surface feature parity matrix

Maintain this table in `docs/agent/PARITY.md` and update it each milestone. Anything marked "no" must have a reason.

| Feature                  | Chrome/Edge | Firefox    | Safari      | Web app          | VS Code         |
| ------------------------ | ----------- | ---------- | ----------- | ---------------- | --------------- |
| Select + hotkey capture  | yes         | yes        | yes         | no (n/a)         | yes (selection) |
| Inline code-block button | yes         | yes        | yes         | n/a              | n/a             |
| Clipboard capture        | yes         | yes        | yes         | paste box        | yes             |
| Side panel library       | sidePanel   | sidebar    | popover/tab | full page        | tree view       |
| Search                   | yes         | yes        | yes         | yes              | yes             |
| Insert into editor       | web fields  | web fields | web fields  | n/a              | yes             |
| Offline mode             | yes         | yes        | yes         | PWA cache        | yes             |
| Share / comments / fork  | yes         | yes        | yes         | yes              | yes (basic)     |
| Workspaces and roles     | yes         | yes        | yes         | admin lives here | yes             |

## 7. How end users use it (user guide outline)

This becomes the in-product onboarding and the public docs.

**Install**

- Chrome / Edge / Brave / Opera: install from the respective store (Brave and Opera can use the Chrome Web Store).
- Firefox: install from Firefox Add-ons (AMO).
- Safari: from the Mac App Store app wrapper.
- VS Code: Marketplace (and Open VSX for VSCodium and similar).
- Web app: open the site; optionally "Install" as a PWA.

**First 60 seconds (onboarding script)**

1. Pin the extension. A short tour shows the hotkey (default suggestion shown on screen).
2. Open a sample page (we host a demo page with code blocks). Select code, press the hotkey, see the toast.
3. Open the side panel, search for the snippet, copy it.
4. Optional: sign in to sync and share. Everything works without an account.

**Daily use**

- **Save:** hotkey on selection, right-click, or the inline Save button on code blocks.
- **Find:** side panel, popup, or type the omnibox keyword followed by a search.
- **Reuse:** one-click copy, or insert into the focused editor field.
- **Share:** choose a visibility level; share link works for people without the extension.
- **Team:** join a workspace, browse approved snippets, comment on lines, fork and improve.
- **From the IDE:** copy and paste-save today; with the VS Code extension, save, search, and insert directly.

**Troubleshooting page must cover:** shortcut conflicts, site access permission, restricted pages (Chrome Web Store, `about:` pages cannot be scripted), private/incognito mode needing explicit enablement, and how to export data.

## 8. Test environments and data

| Environment  | Purpose                                        | Data                                         |
| ------------ | ---------------------------------------------- | -------------------------------------------- |
| Local        | Developer loop                                 | Seeded fake data, local backend via Docker   |
| CI ephemeral | Every PR                                       | Fresh database per run, fixtures             |
| Staging      | Nightly cross-surface E2E, store review builds | Synthetic users, 3 workspaces, 10k snippets  |
| Production   | Real users                                     | Real data; synthetic monitoring account only |

**Seed generator:** one script creates N snippets across languages, with tags, collections, shared/private mix, comments, and forks. Use sizes 0, 1, 100, 10k, 50k.

**Test accounts:** owner, admin, editor, commenter, viewer, outsider, expired-link holder. Never use real customer data in tests.

## 9. Non-functional testing

- **Performance:** quick save, search latency at 10k and 50k, content-script cost on heavy pages, memory growth on long sessions. Budgets are CI-enforced.
- **Security:** XSS payloads in titles/notes/code, malicious URLs, permission audit per browser build, dependency audit, backend authorization fuzzing (try every endpoint as every role), token leakage checks.
- **Privacy:** verify no network requests carrying snippet content occur before the user enables sync or share (assert in E2E by blocking and inspecting traffic).
- **Accessibility:** axe-core on all UI, keyboard-only walkthrough, screen reader spot check (NVDA/VoiceOver) each release.
- **Compatibility:** latest stable plus one older major of Chrome, Edge, and Firefox; ESR Firefox; macOS, Windows, Linux; high-DPI and dark mode.
- **Chaos and reliability:** drop network mid-sync, kill the service worker/event page during a save, full storage quota, clock skew.

## 10. Release process (same backend, many channels)

### 10.1 Versioning

One version number for all clients (for example `1.4.0`), plus an independent `API v1`. Tag releases in git; each store build is produced from the same tag.

### 10.2 Pipeline

```
merge to main
  -> CI: lint, types, unit, fixtures, backend contract, build all targets
  -> deploy backend to staging (migrations first, backward compatible)
  -> nightly/on-demand: cross-surface E2E + Chromium + Firefox E2E
  -> tag release candidate (rc)
  -> manual exploratory checklist (Section 11) on real machines
  -> package: zip (Chrome/Edge), signed xpi (Firefox), Xcode archive (Safari), vsix (VS Code)
  -> submit to stores; backend stays compatible with N-1 clients
  -> staged rollout, monitor errors and metrics
  -> promote, then retire old API behavior only after adoption
```

### 10.3 Per-channel notes

| Channel                        | Package                              | Notes                                                                                                                |
| ------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Chrome Web Store               | zip of `chrome-mv3`                  | Justify every permission; use staged rollout percentage; reviews can take days                                       |
| Microsoft Edge Add-ons         | same zip                             | Separate listing and review                                                                                          |
| Firefox AMO                    | signed `.xpi` via `web-ext sign`/AMO | Source code submission may be requested if the build is bundled/minified; keep a reproducible build and instructions |
| Safari                         | Xcode archive via App Store Connect  | Needs Apple Developer account; TestFlight for beta                                                                   |
| VS Code Marketplace / Open VSX | `.vsix` via `vsce` / `ovsx`          | Separate publisher tokens                                                                                            |
| Web app                        | Deployed continuously                | Feature-flagged; PWA update strategy tested                                                                          |

### 10.4 Migration safety (the key to "same backend")

- Database migrations are **expand, then contract**: add new columns/tables first, deploy clients that use them, remove old ones only after old clients are gone.
- Never ship a backend change that breaks the previously published client. The N-1 test enforces this.
- Roll back plan: previous backend image plus feature flags off; store builds can be superseded but not instantly recalled, which is why backend compatibility matters most.

### 10.5 Post-release monitoring

Track crash/error rates per client and version, capture success rate by site (privacy-safe, content-free), sync failures, p95 latency, store reviews, and support tickets. A **kill switch** (server flag) can disable a faulty site adapter without a new release.

## 11. Manual release checklist (human, about 45 minutes per browser)

1. Fresh profile, install release candidate, complete onboarding.
2. Run S1 to S12 on a real Stack Overflow answer, a GitHub file, a docs site, a blog, and a web IDE.
3. Toggle dark mode, zoom 150%, narrow window, non-English page, right-to-left page.
4. Test with another extension that also injects UI (ad blocker, password manager) to check for conflicts.
5. Test in a private window after enabling the extension there.
6. Upgrade test: install the previous public version, create data, upgrade to the RC, confirm data and settings survive.
7. Sign in on two browsers (for example Chrome and Firefox) and confirm sync both ways.
8. Open a share link in a different browser while logged out.
9. Check store listing text, screenshots, permission descriptions, privacy policy link.
10. Record results in `VERIFICATION.md` and sign off per browser.

## 12. Definition of "ready to release" per face

- All S1 to S12 pass on that browser, automated or manual.
- Cross-surface E2E green on staging for 3 consecutive nightly runs.
- N-1 compatibility test green.
- No open severity-high issues; medium issues documented with workarounds.
- Performance, security, accessibility, and privacy gates green.
- Parity matrix updated; any gaps are explained to users in the docs.
- Rollback and kill-switch verified.

## 13. Recommended rollout order

1. **Chrome** (and Edge, Brave via the same build) with solo local-first.
2. **Firefox** as soon as the capture core is stable (cheap if the core is clean).
3. Backend, accounts, and the **web app** (sharing and viewer).
4. **Teams and collaboration** across all browsers at once.
5. **VS Code** companion, then Slack and Gist integrations.
6. **Safari** when there is demand and an Apple developer account.

This order delivers value early, keeps one codebase, and lets every later face reuse the same tested core and backend.
