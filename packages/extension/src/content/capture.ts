/**
 * Content script — the capture engine (CAP-1..CAP-7, CTX-1..CTX-4).
 *
 * Injects a "Save" button (inside a shadow DOM so we never break host pages)
 * on detected code blocks, and listens for the hotkey / context-menu capture
 * request forwarded by the background service worker.
 */
import { cleanCode, detectLanguage, nearestHeading } from "../shared/cleaner";
import { makeSnippet, saveSnippet } from "../shared/storage";
import {
  MSG_CAPTURE_SELECTION,
  type CaptureSelectionMessage,
} from "../shared/messages";
import type { SnippetContext } from "../shared/types";

const UI_ATTR = "data-kuracode-ui";

const BTN_CSS = `
  :host { all: initial; }
  button {
    position: absolute; top: 8px; right: 8px; z-index: 2147483647;
    display: flex; align-items: center; gap: 6px;
    padding: 5px 10px; border-radius: 8px;
    background: rgba(22, 24, 29, 0.85); backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #EDEDEF; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font: 600 12px/1 'SF Pro Text', -apple-system, system-ui, sans-serif;
    cursor: pointer; opacity: 0; transform: scale(0.95);
    transition: opacity 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.15s, color 0.15s;
  }
  button:hover { background: rgba(28, 31, 38, 0.95); }
  button:active { transform: scale(0.95); }
  button.visible { opacity: 1; transform: scale(1); }
  button.saved { color: #23C185; }
  svg { width: 14px; height: 14px; fill: currentColor; }
  span.label { white-space: nowrap; }
`;

const BOOKMARK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>';
const CHECK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5 1.4-1.4L9 14.2 18.6 4.6 20 6z"/></svg>';

function autoTitle(code: string): string {
  const first = code
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!first) return "Untitled snippet";
  const cleaned = first.replace(/[{}();]/g, "").trim();
  return cleaned.slice(0, 48) || "Untitled snippet";
}

function buildContext(pre: HTMLElement | null): SnippetContext {
  return {
    sourceUrl: location.href,
    pageTitle: document.title,
    domain: location.hostname,
    capturedAt: Date.now(),
    heading: nearestHeading(pre),
  };
}

async function persistSnippet(
  raw: string,
  language: string,
  context: SnippetContext,
): Promise<void> {
  const cleaned = cleanCode(raw);
  await saveSnippet(
    makeSnippet({
      title: autoTitle(cleaned),
      code: cleaned,
      raw,
      language,
      context,
    }),
  );
}

function showSaved(btn: HTMLButtonElement): void {
  btn.innerHTML = `${CHECK_SVG}<span class="label">Saved</span>`;
  btn.classList.add("saved");
  window.setTimeout(() => {
    btn.innerHTML = `${BOOKMARK_SVG}<span class="label">Save</span>`;
    btn.classList.remove("saved");
  }, 2000);
}

async function captureElement(
  pre: HTMLElement,
  btn: HTMLButtonElement,
): Promise<void> {
  const codeEl = pre.querySelector("code");
  const raw = (codeEl ?? pre).innerText ?? pre.textContent ?? "";
  if (!raw.trim()) return;
  const language = detectLanguage(codeEl ?? pre, raw);
  const context = buildContext(pre);
  await persistSnippet(raw, language, context);
  showSaved(btn);
}

function attachInlineButton(pre: HTMLElement): void {
  if (pre.hasAttribute(UI_ATTR)) return;
  pre.setAttribute(UI_ATTR, "true");

  if (getComputedStyle(pre).position === "static")
    pre.style.position = "relative";

  const host = document.createElement("div");
  host.style.position = "absolute";
  host.style.top = "0";
  host.style.right = "0";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "none";

  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = BTN_CSS;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.title = "Save this code to KuraCode";
  btn.innerHTML = `${BOOKMARK_SVG}<span class="label">Save</span>`;
  btn.style.pointerEvents = "auto";

  shadow.append(style, btn);

  let hideTimer = 0;
  const show = () => {
    window.clearTimeout(hideTimer);
    btn.classList.add("visible");
  };
  const scheduleHide = () => {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => btn.classList.remove("visible"), 350);
  };

  pre.addEventListener("mouseenter", show);
  pre.addEventListener("mouseleave", scheduleHide);
  host.addEventListener("mouseenter", show);
  host.addEventListener("mouseleave", scheduleHide);

  btn.addEventListener("click", () => void captureElement(pre, btn));

  pre.append(host);
}

function attachToExistingBlocks(): void {
  document.querySelectorAll<HTMLElement>("pre").forEach(attachInlineButton);
}

function watchForNewBlocks(): void {
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement) {
          node.querySelectorAll<HTMLElement>("pre").forEach(attachInlineButton);
          if (node.tagName === "PRE") attachInlineButton(node);
        }
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

async function captureSelection(): Promise<void> {
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  if (!text) return;
  const ancestor =
    (selection?.anchorNode?.parentElement as HTMLElement | null) ?? null;
  const pre = ancestor?.closest("pre") ?? ancestor;
  const language = detectLanguage(pre, text);
  const context = buildContext(pre);
  await persistSnippet(text, language, context);
  // Toast feedback for keyboard-captured text.
  console.info("[KuraCode] snippet saved", { title: autoTitle(text) });
}

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse) => {
    const msg = message as CaptureSelectionMessage;
    if (msg?.kind === MSG_CAPTURE_SELECTION) {
      void captureSelection().then(() => sendResponse({ ok: true }));
      return true; // async response
    }
    return false;
  },
);

// Guard against double-injection if the script runs more than once.
if (!(window as unknown as { __kuracode?: boolean }).__kuracode) {
  (window as unknown as { __kuracode?: boolean }).__kuracode = true;
  attachToExistingBlocks();
  watchForNewBlocks();
}
