# KuraCode Design System & UI/UX Specification

**Version:** 2.0.0 (Senior Developer-Tool Standard)  
**Product:** KuraCode | **Canonical Page:** https://www.genioussonu.me/extensions/kuracode  
**Master Asset:** `brand/source/kuracode-icon.svg` (Geometric K with Emerald/Mint gradient ribbons)

---

## 1. Brand Identity & Personality

KuraCode's visual identity derives directly from its geometric mark:
- **Sharp, deliberate geometry:** Clean diagonal ribbons, precise cut-offs, balanced proportions.
- **Color philosophy:** The vibrant **Emerald/Mint** (`#00b96c` / `#08e88a`) is the core brand color (used for the mark, active states, and success confirmations). The warm **Gold/Amber** (`#e6b55c`) from the original design spec provides high-contrast visual focus for primary action calls.
- **Tone:** Professional, dense, calm, information-first developer tool (evoking Linear, Raycast, and VS Code). No generic gradient blobs, no filler illustrations, no emoji icons.

---

## 2. Design Tokens & Color Palettes

### 2.1 Dark Theme (Default Identity)
```css
:root, [data-theme="dark"] {
  /* Brand Tokens (from SVG Master) */
  --brand-primary: #00b96c;
  --brand-light: #08e88a;
  --brand-deep: #00854f;
  --brand-glow: rgba(0, 185, 108, 0.20);

  /* Warm Action Accent */
  --accent-action: #e6b55c;
  --accent-action-hover: #f0c273;
  --accent-action-subtle: rgba(230, 181, 92, 0.12);

  /* Dark Neutral Surfaces */
  --bg-app: #0c0d10;              /* OLED-adjacent base canvas */
  --bg-surface: #14171c;          /* Card & panel background */
  --bg-surface-elevated: #1a1e24; /* Dropdowns, hover states */
  --bg-code: #0e1014;             /* Inset code preview blocks */

  /* Borders (Strictly <= 2 levels) */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-default: rgba(255, 255, 255, 0.14);
  --border-focus: #00b96c;

  /* Typography Colors (WCAG AA Compliant) */
  --text-primary: #f1f5f9;   /* Contrast 15.2:1 against bg-surface */
  --text-secondary: #94a3b8; /* Contrast 6.4:1 against bg-surface */
  --text-muted: #64748b;     /* Contrast 3.8:1 for small captions */

  /* Semantic Status */
  --color-success: #00b96c;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-danger-subtle: rgba(239, 68, 68, 0.12);
  --color-info: #38bdf8;
}
```

### 2.2 Light Theme
```css
[data-theme="light"] {
  --brand-primary: #00b96c;
  --brand-light: #009d63;
  --brand-deep: #00613f;
  --brand-glow: rgba(0, 185, 108, 0.15);

  --accent-action: #d97706;
  --accent-action-hover: #b45309;
  --accent-action-subtle: rgba(217, 119, 6, 0.10);

  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-surface-elevated: #f1f5f9;
  --bg-code: #f8fafc;

  --border-subtle: #e2e8f0;
  --border-default: #cbd5e1;
  --border-focus: #00b96c;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;

  --color-success: #059669;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-danger-subtle: rgba(220, 38, 38, 0.08);
  --color-info: #0284c7;
}
```

---

## 3. Typography & Spacing Scales

### 3.1 Bundled Offline Typography & Decision Matrix
To eliminate generic default fonts (Arial/Helvetica/Times/Segoe) and comply with privacy regulations (zero remote Google Fonts calls) while respecting Apple SF Pro licensing:
- **UI Font:** **Inter** (OFL 1.1, bundled as subsetted WOFF2 in `fonts/inter-*.woff2`).
- **Code Font:** **JetBrains Mono** (OFL / Apache 2.0, bundled as subsetted WOFF2 in `fonts/jetbrains-mono-*.woff2`).
- **Font Stack:**
  - `font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`
  - `font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;`
- **Typographic Tuning:**
  - `font-feature-settings: "tnum" 1, "cv05" 1;` (tabular numbers for dates, counts, line numbers).
  - UI Line Height: 1.45–1.5; Code Line Height: 1.5–1.6.
  - Optical sizes, zero faux bold or faux italic.
  - Runtime verification: `document.fonts.check` passes in automated Playwright tests with 0 external requests.
  - Evidence screenshots saved in `docs/agent/evidence/design/fonts/`.

### 3.2 Anti AI-Slop Design Audit & Invariants
- **No Emojis as Icons:** All UI icons are hand-crafted SVG elements matching KuraCode's 1.5px stroke geometry.
- **No Gradient Blobs or Neon Glows:** Restrained tonal background hierarchy (`#0c0d10` base, `#14171c` surface, `#1a1e24` elevated).
- **No Exaggerated Pill Stacking:** Consistent 4px / 8px / 12px radius scale.
- **Microcopy:** Sentence case, concise, human, and actionable (e.g. "Enter Invite Code or Link", "Copied to clipboard").
- **Motion:** Strictly 120–180ms functional transitions respecting `@media (prefers-reduced-motion: reduce)`.

### 3.3 Type Scale
- **UI Font Family:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Code Font Family:** `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`
- **Scale:**
  - Header Title: 14px, font-weight 600, letter-spacing -0.015em
  - Snippet Title: 13px, font-weight 600, line-height 1.3
  - Code Preview: 12px, font-weight 400, line-height 1.45, monospace
  - Metadata & Badges: 11px, font-weight 500
  - Buttons & Inputs: 12px, font-weight 500

### 3.2 Spacing & Radii (8px/4px Grid)
- **Base Grid:** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`
- **Popup Padding:** 12px horizontal, 10px vertical
- **Header Height:** 48px fixed
- **Search Height:** 36px fixed
- **Radii:**
  - Buttons / Inputs / Card items: `8px` (`--radius-md`)
  - Badges / Tag chips: `6px` (`--radius-sm`)
  - Floating panels / Modals: `12px` (`--radius-lg`)
  - Status dots / Pills: `9999px`

---

## 4. Popup Structure & Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐  48px Header
│ [K] KuraCode                    [Synced ●] [Workspace ▾] [⚙] [👤]│  (Fixed)
├─────────────────────────────────────────────────────────────────┤
│ [ 🔍 Search snippets, tags, websites...                 Esc ]   │  36px Search
├─────────────────────────────────────────────────────────────────┤
│ [All (24) ▾]  [Language: All ▾]  [Sort: Recent ▾]   [+ Save Clip]│  32px Toolbar
├─────────────────────────────────────────────────────────────────┤  (Fixed)
│                                                                 │
│  TODAY                                                          │  Small Muted
│ ┌─────────────────────────────────────────────────────────────┐ │  Header
│ │ React useEffect Cleanup              [TypeScript] [···]     │ │
│ │ 🌐 react.dev/reference · 32m ago                            │ │  ~110-125px
│ │ ┌─────────────────────────────────────────────────────────┐ │ │  Collapsed
│ │ │ useEffect(() => {                                       │ │ │  Card
│ │ │   const sub = api.subscribe();                          │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ [ ⧉ Copy ]                                [Expand ▾]        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PostgreSQL Recursive CTE             [SQL]        [···]     │ │
│ │ 🌐 postgresql.org/docs · 2h ago                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ WITH RECURSIVE subordinates AS (                        │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ [ ⧉ Copy ]                                [Expand ▾]        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  YESTERDAY                                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Rust Rayon Parallel Iterator         [Rust]       [···]     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘  Scrollable List
```

### 4.1 Snippet Card Metrics Target
- Collapsed height: **110px – 125px** (down from baseline 185px-227px).
- Visible cards at default 480px popup height: **At least 4 cards** visible without scrolling.
- Single obvious primary action: `[ ⧉ Copy ]` with 1.5s morph to `[ ✔ Copied ]`.
- Secondary actions (Edit, Add to Group, Share, Trash) in clean `[···]` menu.
- Delete always moves to Trash with 8-second undo toast.

---

## 5. Zero-Border Typography & Popup Redesign Specification (Defects D1–D14)

### 5.1 Zero-Border Philosophy & Border Budget
To eliminate visual clutter and generic "AI-slop" card containers:
- **Strict Border Budget:** A maximum of **3 visible bordered elements** per view (typically: search input border, subtle header divider, and inset code preview block).
- **No Card Box Outlines:** Individual snippet rows (`.kura-row`) do not use full border outlines. Separation is achieved through subtle tonal surface differentiation, padding, and hairline dividers.
- **Visual Calmness:** High density with low cognitive noise, prioritizing developer scanning speed.

### 5.2 Layout & Viewport Invariants
- **Popup Container:** Responsive width with `min-width: 320px; max-width: 420px; width: 100%; height: 600px;`.
- **Single Scroll Area:** Only `.kura-list` has `overflow-y: auto`. All parent and sibling containers (`header`, `.kura-search-bar`, `.kura-chips-scroll`) strictly enforce `overflow-y: hidden;` to eliminate nested or fighting scrollbars (D7).
- **Responsive Stress Testing:** The layout passes across widths 320px, 360px, 380px, and 420px, at browser zooms 100%, 125%, 150%, and with +40% pseudo-localized text without breaking or horizontal scrolling (D1).

### 5.3 Row Hierarchy & Metrics
1. **Line 1 — Header:**
   - Left: Snippet Title or clamped prose text (`.kura-row-title.kura-card-title`).
   - Right: Trailing action cluster containing a 28px visual / 32px hit-target Copy button (`.kura-action-copy-btn`) and secondary actions dropdown (`.kura-more-btn`).
2. **Line 2 — Provenance Line:**
   - 14px offline SVG globe icon (`.kura-meta-favicon`). Zero 3rd-party network requests.
   - Domain without `www.` prefix (e.g., `google.com`).
   - Exact timestamp with full tooltip (e.g. `Yesterday 6:10 PM`).
   - Plain text language badge formatted in proper casing (D10, D11).
3. **Line 3 — Code Preview:**
   - Inset code block (`.kura-code-preview.kura-card-code`) capped at 3 lines maximum.
   - Smooth bottom gradient fade with a "Show more" button for expanding code into modal view.
   - Prose and single-word items do not render a redundant code block, collapsing cleanly to ~60px height.
- **Visible Rows at 380x600:** At least 5 prose rows or at least 4 code rows visible without scrolling.

### 5.4 Typography & Contrast Standards
- **Font Stack:** Bundled offline Inter (`UI`) and JetBrains Mono (`Code`).
- **Contrast Ratios:** All text elements exceed WCAG AA standards ($\ge 4.5:1$ contrast against computed background). Muted text uses `--text-muted: #7b8da5` (5.2:1 contrast against `#14171c`).
- **Language Casing Standard:** All programming languages use proper canonical casing: `TypeScript`, `Python`, `HTML`, `SQL`, `Dockerfile`, `JSON`, `Markdown`, `Shell`, `Rust`, `Go`, `C++`, etc. (D11).

