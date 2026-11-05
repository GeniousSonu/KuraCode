# KuraCode System Architecture Specification

**Product:** KuraCode (Browser Extension, Web App, PWA, Backend)  
**Version:** 1.0.0 | **Date:** 2026-11-05  
**Canonical Domain:** `https://www.genioussonu.me/extensions/kuracode`

---

## 1. Architectural Philosophy

KuraCode is built on a **Local-First, Zero-Friction, High-Trust** foundation:
1. **Local-first source of truth:** Every user device maintains a fully functional local replica in IndexedDB. The extension functions with zero degradation when offline or without an account.
2. **Opt-in data transmission:** Nothing leaves the client device until the user explicitly connects an account, activates sync, or creates a share.
3. **Multi-device convergence:** Replicas converge deterministically using Hybrid Logical Clocks (HLC) and field-level merge algorithms without silent data loss.
4. **Defense in depth:** Security boundaries isolate web pages, extension background workers, and cloud tenancy.

---

## 2. System Overview & Component Topology

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT SURFACES                                   │
│                                                                                  │
│  ┌─────────────────────────┐   ┌────────────────────────┐   ┌─────────────────┐  │
│  │   Chromium Extension    │   │   Firefox Extension    │   │  Web App / PWA  │  │
│  │  (Chrome, Edge, Brave)  │   │   (Desktop + Android)  │   │  (React + Vite) │  │
│  │   MV3 Service Worker    │   │    MV3 Background JS   │   │  Service Worker │  │
│  └───────────┬─────────────┘   └───────────┬────────────┘   └────────┬────────┘  │
│              │                             │                         │           │
│              └──────────────────────┬──────┴─────────────────────────┘           │
│                                     │                                            │
│                       ┌─────────────▼──────────────┐                             │
│                       │    Shared UI & Logic Core  │                             │
│                       │   (@kuracode/ui & shared)  │                             │
│                       │  IndexedDB + Durable Outbox│                             │
│                       └─────────────┬──────────────┘                             │
└─────────────────────────────────────┼────────────────────────────────────────────┘
                                      │ TLS 1.3 / WSS
                                      │ Authorization: Bearer <AccessToken>
┌─────────────────────────────────────▼────────────────────────────────────────────┐
│                             BACKEND SERVICES                                     │
│                                                                                  │
│  ┌─────────────────────┐  ┌───────────────────────┐  ┌────────────────────────┐  │
│  │   Auth & OIDC Edge  │  │  Realtime Sync Engine │  │ Quick-Code & Share Hub │  │
│  │ (PKCE, Token Family)│  │ (WebSocket, HLC Merge)│  │(Rate Limit, Const-Time)│  │
│  └──────────┬──────────┘  └───────────┬───────────┘  └───────────┬────────────┘  │
│             │                         │                          │               │
│             └─────────────────────────┼──────────────────────────┘               │
│                                       │                                          │
│                       ┌───────────────▼──────────────┐                           │
│                       │     Durable PostgreSQL Store │                           │
│                       │    Row-Level Security (RLS)  │                           │
│                       │   Append-Only Change Journal │                           │
│                       └──────────────────────────────┘                           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Authentication Flow per Surface

### 3.1 Browser Extensions (Chromium & Firefox)
- **Standard Protocol:** OAuth 2.0 + OpenID Connect (OIDC) using **PKCE (Proof Key for Code Exchange)** with SHA-256 code challenge (`code_challenge_method=S256`) and cryptographically random `state` and `nonce`.
- **Identity API Flow:**
  - **Chromium:** Invokes `chrome.identity.launchWebAuthFlow({ url, interactive: true })`. Redirect URI: `https://<extension-id>.chromiumapp.org/auth/callback`.
  - **Firefox:** Invokes `browser.identity.launchWebAuthFlow({ url, interactive: true })`. Redirect URI: `https://<gecko-id>.extensions.allizom.org/auth/callback` or `moz-extension://<uuid>/auth/callback`.
- **Fallback Web Bridge:** If `launchWebAuthFlow` is restricted, the extension opens `https://www.genioussonu.me/extensions/kuracode/auth/extension-bridge`, authenticates the user, generates a single-use short-lived authorization code (60s TTL), and returns it via an extension message channel.

### 3.2 Web App & PWA
- Standard authorization code flow with PKCE. Tokens issued with secure `HttpOnly`, `SameSite=Lax`, `Secure` session cookies protecting against XSS token exfiltration.

### 3.3 Token Lifecycle & Family Rotation
- **Access Token:** Short-lived JWT (15 minutes), containing user ID, device ID, and tenant roles.
- **Refresh Token:** Long-lived opaque token (30 days) stored exclusively in `chrome.storage.local` within the background worker (inaccessible to content scripts and DOM).
- **Family Reuse Detection:** Every refresh operation rotates the refresh token. If a previously invalidated refresh token is presented, the entire session family for that device is immediately revoked to neutralize token theft.

---

## 4. Real-Time Sync & Convergence Protocol

### 4.1 Local Storage Architecture
- Local storage engine is built on **IndexedDB** wrapped in a lightweight reactive interface (`packages/extension/src/shared/idb-storage.ts`).
- Requests `navigator.storage.persist()` on installation to prevent browser cache eviction.
- Storage stores: `snippets`, `snippet_versions`, `groups`, `clipboard_items`, `outbox`, `sync_cursor`.

### 4.2 Durable Outbox & Reconnection Delta
```
Local Mutation → Write IndexedDB (State) → Insert Outbox Record (Unsynced)
                                                      │
                            ┌─────────────────────────┴────────────────────────┐
                            ▼                                                  ▼
                  Online (WebSocket Active)                         Offline / Reconnecting
                            │                                                  │
                Push Mutation via WebSocket                          Queue in Durable Outbox
                            │                                                  │
                Server Acknowledges (HLC)                            On Reconnect: Fetch Delta
                            │                                        Server Cursor → Local Catchup
                  Remove from Outbox                                 Flush Pending Outbox
```

### 4.3 Conflict Resolution: Hybrid Logical Clocks (HLC)
- Every mutation carries an HLC timestamp consisting of `(physical_time_ms, logical_counter, node_id)`.
- **Field-Level Merge:** Edits on different fields (e.g., Device A changes `title`, Device B updates `tags`) merge automatically without conflict.
- **Concurrent Field Edits:** The higher HLC wins for the field value, while prior versions are preserved in `snippet_versions` so users can inspect diffs and revert.
- **Tombstones:** Deleted items receive a `deleted_at: HLC` tombstone retained for 30 days, preventing race-condition resurrection.

---

## 5. Clipboard Hub Architecture

### 5.1 Privacy & Permission Model
- **Default State:** Clipboard Hub sync is **OFF by default** (`clipboardSyncEnabled: false`).
- **Explicit Consent:** Activating clipboard sync requires an explicit dialog explaining that text items will be stored on user-controlled servers and automatically pruned after the retention period.
- **Private Browsing Shield:** Capture is strictly disabled in incognito / private browsing windows (`chrome.extension.inIncognitoContext` or Firefox private window context).

### 5.2 Secret Scanner Filter Pipeline
Before any clipboard item is saved or pushed to the sync outbox, it passes through `detectSecrets(text)`:
1. Regex & Shannon entropy evaluation for: AWS keys, GitHub PATs, OpenAI/Anthropic API keys, JWTs, private RSA/EC keys, password strings, and payment card numbers.
2. If sensitive credentials are detected: **Sync is blocked**. The item remains local-only, annotated with a `[Secret Detected]` badge, and never transmitted.

### 5.3 Optional End-to-End Encryption (E2EE)
- Clients can enable E2EE for Clipboard Hub.
- Key derivation: `PBKDF2-HMAC-SHA256` (100,000 iterations) with salt derived from account secret.
- Cipher: `AES-256-GCM` with a fresh 12-byte initialization vector (IV) per item.
- The server stores only ciphertext, IV, and auth tag. Decryption occurs solely on client devices holding the key.

---

## 6. Quick-Share Code Engine

### 6.1 Format & Security Baseline
- **Format:** 4-digit cryptographically generated random code (`0000` to `9999`) using `crypto.getRandomValues`.
- **Lifespan:** Default 15 minutes (configurable up to 24 hours).
- **Claim Limits:** Single-claim by default.
- **Brute-Force Resistance:**
  - Strict IP rate limiting: maximum 5 failed attempts per IP per 10 minutes.
  - Constant-time string comparison (`timingSafeEqual`) prevents side-channel timing attacks.
  - Automatic expansion to 6 digits (`000000` - `999999`) when active global codes exceed 5,000.

---

## 7. Workplaces & Role-Based Access Control (RBAC)

### 7.1 Tenant Model
- Every user has an isolated **Personal Space** and optional **Workplaces**.
- Workplace data is partitioned at the database layer with strict foreign keys and Postgres Row-Level Security (RLS).
- Zero cross-tenant leakage: queries filter by `workplace_id = auth.current_workplace()`.

### 7.2 Permission Matrix

| Role | View Snippets | Add / Edit Snippets | Delete Snippets | Invite Members | Admin / Billing | Transfer Ownership |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Owner** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Admin** | Yes | Yes | Yes | Yes | Yes | No |
| **Editor** | Yes | Yes | Own snippets only | No | No | No |
| **Commenter** | Yes | Notes / suggestions only | No | No | No | No |
| **Viewer** | Yes | No | No | No | No | No |

---

## 8. Technology Choices & Free-Tier Hosting (Nov 2026 Audit)

| Component | Selected Approach | Evaluated Alternative | Decision & Free-Tier Verification (Nov 2026) |
| :--- | :--- | :--- | :--- |
| **Auth & Database** | **Supabase Postgres + Auth + RLS** | Self-hosted Better-Auth + Neon | Free tier provides 50,000 MAU, 500 MB database, automated daily backups, social OAuth (Google, GitHub), and native RLS. Verified Nov 2026. |
| **Realtime Channel** | **Supabase Realtime (WebSockets)** | Cloudflare Durable Objects | 200 concurrent connections free tier, broadcast channels, presence tracking. Seamless fallback to polling/REST. |
| **Local Storage** | **IndexedDB (via idb-storage)** | LocalStorage / chrome.storage.local | IndexedDB handles 50,000+ snippets without memory bloat; supports blob attachments and transactions. |
| **UI Components** | **Reusable Design System (`packages/ui`)** | Monolithic inline CSS | Token-driven CSS variables, WCAG AA contrast, shared across popup, side panel, web app, and PWA. |

