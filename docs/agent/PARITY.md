# Cross-Surface Feature Parity

Maintained per Release Guide section 6. Anything marked **no** must have a
reason in the Notes column. "yes" means the feature works and is covered by a
test (unit or e2e S-series). This table reflects the current repo state at
milestone **M0/M1** — backend-dependent features are later-phase.

| Feature                        | Chrome/Edge | Firefox | Safari | Web app         | VS Code | Notes                                                                                                   |
| ------------------------------ | ----------- | ------- | ------ | --------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| Select + hotkey capture        | yes         | no      | no     | no (n/a)        | no      | Background bridge, S1 e2e. Firefox/Safari/VS Code later.                                                |
| Inline code-block button       | yes         | no      | no     | n/a             | n/a     | S3 e2e. Redirect button installs on `<pre>`.                                                            |
| Clipboard capture              | yes         | no      | no     | paste box (n/a) | no      | Popup paste-save, S4. Web app has no paste surface yet.                                                 |
| Side panel library             | yes         | no      | no     | full page       | no      | popup + side panel render library; no Firefox sidebar.                                                  |
| Search                         | yes         | no      | no     | yes             | no      | Client-side full-text (FIND-1/2).                                                                       |
| Copy / insert                  | yes         | no      | no     | n/a             | no      | Copy-to-clipboard byte-exact, S6.                                                                       |
| Offline / local-first          | yes         | no      | no     | PWA (later)     | no      | `chrome.storage.local` namespaced key (PRIV-1/2).                                                       |
| Share links / comments / fork  | no          | no      | no     | no              | no      | Requires backend (SHARE/COLLAB), M7+.                                                                   |
| Workspaces and roles           | no          | no      | no     | no              | no      | Requires backend (ORG/TRUST), M7+.                                                                      |
| Secret scanner / license hints | no          | no      | no     | no              | no      | T-016, M6.                                                                                              |
| Brand icons / logo             | yes         | partial | no     | yes             | no      | Chrome icons wired + verified (T-027). Firefox needs firefox-mv3 target; Safari needs 1024 opaque icon. |

**Build targets present:** only `chrome-mv3` (esbuild → `packages/extension/dist`).
Firefox (`firefox-mv3`) and Safari require the WXT/multi-target build step
(Release Guide section 2.1) — not yet introduced.

**Test coverage per surface (current):** extension L1 unit (cleaner) + L5
browser e2e (S1/S3/S4/S6/S11 on Chromium). No Firefox/Safari/web-app e2e yet.
