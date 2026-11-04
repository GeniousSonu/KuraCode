# KuraCode: Design System & UI/UX Specification
**Version:** 1.0.0
**Product:** KuraCode (Browser Extension & Web App)
**Design Philosophy:** "Linear meets Raycast for the Web." Zero-friction, high-density, keyboard-first, and visually subdued to let the user's code take center stage.

---

## 1. Design Analysis & Core Philosophy
To avoid the "generic SaaS" look, KuraCode adopts a **dark-mode native, ultra-minimalist aesthetic**. Developers suffer from cognitive overload; our UI must feel like a natural, native extension of macOS or a premium IDE. 

*   **Invisible until needed:** The extension UI (inline buttons, toasts) must use heavy backdrop blurs and subtle borders to blend into any host site without breaking its layout.
*   **Tactile feedback:** Every action (copy, save, fork) must have a micro-interaction. We rely on spring physics, not linear eases, to make the tool feel instantly responsive.
*   **Information Density:** We respect the developer's screen real estate. Use a tight 4px grid system. No excessive padding.

---

## 2. Typography System (Apple SF Suite)
Since KuraCode targets a premium feel and you hold the licenses, we strictly utilize the San Francisco typeface family. It provides unparalleled legibility at small sizes.

*   **Display / Headers:** `SF Pro Display`
    *   *Weight:* Semibold (600)
    *   *Tracking:* -0.015em
    *   *Usage:* Extension panel titles, Workspace headers, large empty state copy.
*   **Body / UI Controls:** `SF Pro Text`
    *   *Weight:* Medium (500) & Regular (400)
    *   *Tracking:* 0em
    *   *Usage:* Buttons, dropdowns, contextual metadata (source, date), search inputs.
*   **Code / Raw Data:** `SF Mono`
    *   *Weight:* Regular (400)
    *   *Usage:* All captured code blocks, inline code tags, secret scanner warnings, line numbers.

---

## 3. Premium Color Palette (Dark Theme Default)
The palette is built around "Kura Slate" (a very deep, desaturated blue/grey) and "Electric Indigo" to signify action, moving away from standard flat blues.

### Base Backgrounds (The Depth System)
*   **Background Base (Web App):** `#0C0D10` (OLED-adjacent black)
*   **Background Elevated (Extension Panel/Cards):** `#16181D`
*   **Background Floating (Dropdowns/Toasts):** `rgba(22, 24, 29, 0.75)` + `backdrop-filter: blur(16px)`
*   **Borders:** `rgba(255, 255, 255, 0.08)` (Hairline borders to define shapes without visual weight)

### Accents & Typography
*   **Primary Text:** `#EDEDEF` (Off-white to reduce eye strain)
*   **Secondary Text / Metadata:** `#8B909A`
*   **Kura Indigo (Primary Action):** `#5C6BFA` (Vibrant but sophisticated)
*   **Kura Indigo Hover:** `#717EFB`

### State Colors (Muted for Professionalism)
*   **Success (Saved/Copied):** `#23C185` (Mint green)
*   **Warning (Secret Detected/Deprecated):** `#F5A623` (Amber)
*   **Danger/Failed (Network Error):** `#E5484D` (Crimson)

---

## 4. UI States & Component Architecture

A premium tool never leaves the user guessing. Every component must have a defined state.

### 4.1 The "Inline Save" Button (On Host Website)
Injected near `pre` or `code` blocks on sites like StackOverflow or GitHub.
*   **Default (Hidden):** `opacity: 0` until the user hovers over the code block container.
*   **Hover (Revealed):** Floating in the top-right of the code block. `background: rgba(22, 24, 29, 0.6)`. Icon: SF Symbol `bookmark`.
*   **Active (Pressed):** Scale down to `0.95`.
*   **Processing:** Icon replaces with a bespoke, fast-spinning SVG ring (16px).
*   **Complete:** Icon becomes a checkmark (`#23C185`). Text expands smoothly to say "Saved to KuraCode". Fades out after 2 seconds.

### 4.2 Empty States (No data)
Avoid generic "illustration of a guy holding a magnifying glass." Use typography and keyboard shortcuts.
*   **State:** User opens the extension, but has zero snippets.
*   **Visual:** Centered in the panel.
*   **Icon:** A subtle, monochromatic SF Symbol (`square.stack.3d.up.slash`) with 20% opacity.
*   **Copy:** `SF Pro Display`, 16px, `#EDEDEF`. "No snippets yet."
*   **Sub-copy:** `SF Pro Text`, 13px, `#8B909A`. "Highlight any code and press ⌘ + Shift + S to capture your first snippet."
*   **Action:** A ghost button `[ Read the Guide ]`.

### 4.3 Processing / Working States
Instead of blocking the UI with a massive loading spinner, use **Skeleton UI** for lists and **Linear Activity Bars** for actions.
*   **Saving Detailed Snippet:** A 2px high indigo progress bar shoots across the top border of the extension panel.
*   **Fetching Context (Metadata):** The metadata fields (URL, Heading) pulse gently with a skeleton gradient `linear-gradient(90deg, #16181D, #1C1F26, #16181D)`.

### 4.4 Complete / Success States
*   **Action:** User clicks "Copy to Clipboard" on a snippet.
*   **Feedback:** The copy icon morphs into a checkmark. A subtle, pill-shaped toast slides down from the top center: `background: #16181D`, border `#23C185`.
*   **Haptic/Audio:** If supported by the OS API, trigger a subtle haptic "tick".

### 4.5 Failed / Error States
Errors must be graceful, explain the *why*, and offer a *retry*.
*   **State:** Network failure during cloud sync.
*   **Visual:** Inline banner at the top of the panel. Background: `rgba(229, 72, 77, 0.1)`. Border: `#E5484D`.
*   **Copy:** "Failed to sync to KuraCode cloud. Changes saved locally."
*   **Action:** A small "Retry" text button on the right edge of the banner.
*   **State (Secret Scanner Block):** If an API key is detected upon hitting "Share to Team", the code block highlights the exact line with a red wavy underline, and a modal blocks the share with a strict warning.

### 4.6 The Annotation Panel (Detailed Save)
When a user hits the hotkey, the KuraCode command palette drops down from the top of the browser (similar to Raycast).
*   **Structure:**
    *   **Header:** Title input (auto-focused). Large text. `SF Pro Display`.
    *   **Body:** The captured code in an `SF Mono` block, syntax highlighted. Custom scrollbars (2px width).
    *   **Footer/Metadata:** Auto-populated pills for `[TypeScript]` `[github.com]`.
    *   **Primary Action:** A solid Indigo button: `Save ↵` (indicating Enter key triggers it).

---

## 5. Animation & Motion Guidelines
*   **Curve:** `cubic-bezier(0.2, 0.8, 0.2, 1)` (Quick start, smooth deceleration).
*   **Duration:** 150ms for micro-interactions (hover, click). 300ms for panel slides and modal reveals.
*   **No bouncing:** Avoid overly playful spring physics. Motion should feel authoritative, deterministic, and instant.

## 6. Implementation Handoff Notes (CSS Variables)
```css
:root {
  /* Typography */
  --font-display: 'SF Pro Display', -apple-system, sans-serif;
  --font-ui: 'SF Pro Text', -apple-system, sans-serif;
  --font-code: 'SF Mono', ui-monospace, monospace;
  
  /* Colors */
  --kura-bg-base: #0C0D10;
  --kura-bg-elevated: #16181D;
  --kura-border: rgba(255, 255, 255, 0.08);
  --kura-accent: #5C6BFA;
  --kura-text-primary: #EDEDEF;
  --kura-text-muted: #8B909A;
  
  /* Shadows */
  --shadow-elevation-1: 0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--kura-border);
}
```