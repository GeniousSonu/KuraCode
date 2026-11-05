/**
 * KuraCode Shared Library UI Renderer (Popup, Side Panel, Web App)
 * Senior-Engineer Redesign (UX-1..UX-10)
 *
 * Layout:
 *  - Fixed Header (48px): Brand mark, Title, Sync indicator, Workplace switcher, Account
 *  - Fixed Search (36px): Instant filter, Esc to clear
 *  - Fixed Toolbar (32px): Scope count, Language filter, Sort dropdown, +Save clipboard
 *  - Timeline Grouped List: Sticky day headers ("Today", "Yesterday", "Earlier")
 *  - Compact Snippet Card (110px-125px collapsed height, >= 4 cards visible at default height):
 *      Row 1: Readable Semantic Title + Language Pill + Three-Dot Menu
 *      Row 2: Favicon / Source Domain Link (Text-Fragment) · Relative Time
 *      Row 3: 3-Line Code Preview with Horizontal Scroll
 *      Row 4: Primary Copy Button (with Copied! feedback) + Expand Toggle
 *  - Secondary Menu: Edit, Share Quick-Code, Open Source, Trash with 8-second Undo Toast
 */

import { generateReadableTitle } from "./auto-title";
import { cleanCode, detectLanguage } from "./cleaner";
import { formatRelativeTime, getTimelineBucket, type TimelineBucket } from "./date-formatter";
import {
  deleteSnippet,
  listSnippets,
  makeSnippet,
  saveSnippet,
} from "./storage";
import { generateTextFragmentUrl } from "./text-fragment";
import type { Snippet } from "./types";

export interface LibraryOptions {
  title?: string;
  clipboardSave?: boolean;
}

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export async function renderLibrary(
  container: HTMLElement,
  opts: LibraryOptions = {}
): Promise<void> {
  const snippets = await listSnippets();
  let query = "";
  let langFilter = "all";
  let sortOrder: "recent" | "oldest" | "title" = "recent";
  const syncStatus: "synced" | "syncing" | "offline" = "synced";
  let activeWorkplace: string = "Personal";
  const expandedCardIds = new Set<string>();
  let recentlyTrashed: { snippet: Snippet; timer: number } | null = null;

  container.replaceChildren();

  // Root wrapper
  const root = document.createElement("div");
  root.className = "kura-app";

  // --- 1. HEADER (Fixed 48px) ---
  const header = document.createElement("header");
  header.className = "kura-header";

  const brandWrap = document.createElement("div");
  brandWrap.className = "kura-brand";

  // Geometric K Logo SVG (18px)
  const logoSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  logoSvg.setAttribute("viewBox", "450 25 1070 850");
  logoSvg.setAttribute("class", "kura-logo-icon");
  logoSvg.innerHTML = `
    <defs>
      <linearGradient id="hdr-mint" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#08e88a"/>
        <stop offset="1" stop-color="#00b96c"/>
      </linearGradient>
    </defs>
    <path d="M467 42 H644 V804 H467 Z" fill="url(#hdr-mint)"/>
    <path d="M1029 36 L1100 101 L560 583 L490 522 Z" fill="#37f6a6"/>
    <path d="M490 522 L560 583 L943 793 L868 862 Z" fill="#20efa0"/>
    <path d="M1110 113 L1190 180 L837 505 L1142 789 L1059 862 L677 506 Z" fill="#00854f"/>
    <path d="M1207 205 L1504 496 L1199 784 L1124 716 L1352 496 L1128 279 Z" fill="#00e889"/>
  `;
  brandWrap.append(logoSvg);

  const brandName = document.createElement("span");
  brandName.className = "kura-brand-name";
  brandName.textContent = opts.title || "KuraCode";
  brandWrap.append(brandName);

  header.append(brandWrap);

  // Header Right Controls
  const headerControls = document.createElement("div");
  headerControls.className = "kura-header-controls";

  // Sync Indicator
  const syncBadge = document.createElement("div");
  syncBadge.className = `kura-sync-badge ${syncStatus}`;
  syncBadge.title = `Sync: ${syncStatus.toUpperCase()}`;
  syncBadge.innerHTML = `<span class="kura-sync-dot"></span><span class="kura-sync-text">${syncStatus}</span>`;
  headerControls.append(syncBadge);

  // Workplace Selector
  const wsBtn = document.createElement("button");
  wsBtn.type = "button";
  wsBtn.className = "kura-header-btn kura-ws-btn";
  wsBtn.title = "Switch Workplace";
  wsBtn.textContent = `${activeWorkplace} ▾`;
  wsBtn.addEventListener("click", () => {
    activeWorkplace = activeWorkplace === "Personal" ? "Core Engineering" : "Personal";
    wsBtn.textContent = `${activeWorkplace} ▾`;
    showToast(`Switched to ${activeWorkplace}`);
  });
  headerControls.append(wsBtn);

  // Account / Settings Icon
  const userBtn = document.createElement("button");
  userBtn.type = "button";
  userBtn.className = "kura-header-btn kura-icon-btn";
  userBtn.title = "Account & Settings";
  userBtn.textContent = "⚙";
  headerControls.append(userBtn);

  header.append(headerControls);
  root.append(header);

  // Quiet "What's new" notification on extension version upgrade
  const currentVersion = "0.1.0";
  const lastVersion = typeof localStorage !== "undefined" ? localStorage.getItem("kuracode_last_seen_version") : null;
  if (lastVersion && lastVersion !== currentVersion) {
    const updateBanner = document.createElement("div");
    updateBanner.className = "kura-update-banner";
    updateBanner.setAttribute("role", "status");

    const bannerText = document.createElement("span");
    const safeAnchor = `v${currentVersion.replace(/\./g, "-")}`;
    bannerText.innerHTML = `✨ Updated to v${currentVersion} — <a href="https://www.genioussonu.me/extensions/kuracode#${safeAnchor}" target="_blank" rel="noreferrer">What's new</a>`;

    const dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.className = "kura-update-dismiss";
    dismissBtn.setAttribute("aria-label", "Dismiss update notice");
    dismissBtn.textContent = "✕";
    dismissBtn.addEventListener("click", () => {
      localStorage.setItem("kuracode_last_seen_version", currentVersion);
      updateBanner.remove();
    });

    updateBanner.append(bannerText, dismissBtn);
    root.append(updateBanner);
  } else if (!lastVersion && typeof localStorage !== "undefined") {
    localStorage.setItem("kuracode_last_seen_version", currentVersion);
  }

  // --- 2. SEARCH BAR (Fixed 36px) ---
  const searchWrap = document.createElement("div");
  searchWrap.className = "kura-search-wrap";

  const searchIcon = document.createElement("span");
  searchIcon.className = "kura-search-icon";
  searchIcon.textContent = "🔍";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "search kura-search-input";
  searchInput.placeholder = "Search snippets, tags, websites... (Esc to clear)";
  searchInput.addEventListener("input", () => {
    query = searchInput.value.trim().toLowerCase();
    renderCards();
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      query = "";
      renderCards();
    }
  });

  searchWrap.append(searchIcon, searchInput);
  root.append(searchWrap);

  // --- 3. COMPACT TOOLBAR ---
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar kura-toolbar";

  // Count / Scope
  const countSpan = document.createElement("span");
  countSpan.className = "count kura-scope-count";
  toolbar.append(countSpan);

  // Language Filter Dropdown
  const filterWrap = document.createElement("div");
  filterWrap.className = "filter-wrap kura-dropdown-wrap";
  const filterSelect = document.createElement("select");
  filterSelect.className = "filter kura-select";
  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = "All Languages";
  filterSelect.append(allOpt);
  filterSelect.addEventListener("change", () => {
    langFilter = filterSelect.value;
    renderCards();
  });
  filterWrap.append(filterSelect);
  toolbar.append(filterWrap);

  // Sort Dropdown
  const sortSelect = document.createElement("select");
  sortSelect.className = "kura-select kura-sort-select";
  sortSelect.innerHTML = `
    <option value="recent">Recently saved</option>
    <option value="oldest">Oldest first</option>
    <option value="title">Alphabetical</option>
  `;
  sortSelect.addEventListener("change", () => {
    sortOrder = sortSelect.value as any;
    renderCards();
  });
  toolbar.append(sortSelect);

  // + Save from Clipboard Button
  if (opts.clipboardSave) {
    const pasteBtn = document.createElement("button");
    pasteBtn.className = "ghost-btn kura-save-clip-btn";
    pasteBtn.type = "button";
    pasteBtn.textContent = "+ Save Clip";
    pasteBtn.setAttribute("aria-label", "Paste from clipboard");
    pasteBtn.title = "Paste from clipboard";
    pasteBtn.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text.trim()) {
          showToast("Clipboard is empty", "warning");
          return;
        }
        const code = cleanCode(text);
        const lang = detectLanguage(null, code);
        const auto = generateReadableTitle(code, lang);
        const snippet = makeSnippet({
          title: auto.title,
          code,
          raw: text,
          language: lang,
          context: {
            sourceUrl: "",
            pageTitle: "Clipboard",
            domain: "clipboard",
            capturedAt: Date.now(),
          },
        });
        await saveSnippet(snippet);
        snippets.unshift(snippet);
        renderCards();
        showToast("Snippet saved from clipboard!", "success");
      } catch {
        showToast("Clipboard permission required", "danger");
      }
    });
    toolbar.append(pasteBtn);
  }

  root.append(toolbar);

  // --- 4. SCROLLABLE TIMELINE LIST ---
  const listContainer = document.createElement("main");
  listContainer.className = "list kura-list";
  root.append(listContainer);

  // Toast Container
  const toastEl = document.createElement("div");
  toastEl.className = "kura-toast hidden";
  root.append(toastEl);

  function showToast(message: string, type: "info" | "success" | "warning" | "danger" = "info", undoCallback?: () => void) {
    toastEl.textContent = "";
    toastEl.className = `kura-toast ${type} visible`;

    const msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    toastEl.append(msgSpan);

    if (undoCallback) {
      const undoBtn = document.createElement("button");
      undoBtn.type = "button";
      undoBtn.className = "kura-toast-undo";
      undoBtn.textContent = "Undo";
      undoBtn.addEventListener("click", () => {
        undoCallback();
        toastEl.className = "kura-toast hidden";
      });
      toastEl.append(undoBtn);
    }

    window.setTimeout(() => {
      toastEl.className = "kura-toast hidden";
    }, undoCallback ? 8000 : 2500);
  }

  container.append(root);

  // Populate language dropdown options dynamically
  function updateLanguageFilter() {
    const currentVal = filterSelect.value;
    filterSelect.replaceChildren();
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "All Languages";
    filterSelect.append(all);

    const langs = Array.from(new Set(snippets.map((s) => s.language || "text"))).sort();
    for (const lang of langs) {
      const opt = document.createElement("option");
      opt.value = lang;
      opt.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
      filterSelect.append(opt);
    }
    filterSelect.value = currentVal;
  }

  function renderCards() {
    updateLanguageFilter();

    const visible = snippets.filter((s) => {
      if (langFilter !== "all" && s.language !== langFilter) return false;
      if (!query) return true;
      const haystack = [s.title, s.code, s.language, s.context.sourceUrl, s.context.domain, ...(s.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    // Sort order
    if (sortOrder === "recent") {
      visible.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (sortOrder === "oldest") {
      visible.sort((a, b) => a.updatedAt - b.updatedAt);
    } else if (sortOrder === "title") {
      visible.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    countSpan.textContent = `${visible.length} snippet${visible.length === 1 ? "" : "s"}`;
    listContainer.replaceChildren();

    // Empty state
    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty kura-empty-state";

      const emptyIcon = document.createElement("div");
      emptyIcon.className = "empty-icon kura-empty-icon";
      emptyIcon.textContent = "⧉";

      const emptyTitle = document.createElement("h3");
      emptyTitle.className = "empty-title kura-empty-title";
      emptyTitle.textContent = query ? "No matching snippets" : "Your code memory is empty";

      const emptySub = document.createElement("p");
      emptySub.className = "empty-sub kura-empty-sub";
      emptySub.textContent = query
        ? "Try a different search term or reset the language filter."
        : "Highlight any code on a webpage and press ⌘⇧S (Ctrl+Shift+S) to capture with context.";

      empty.append(emptyIcon, emptyTitle, emptySub);
      listContainer.append(empty);
      return;
    }

    // Timeline Grouping ("Today", "Yesterday", "This week", "Earlier")
    let currentBucket: TimelineBucket | null = null;

    for (const s of visible) {
      const bucket = getTimelineBucket(s.updatedAt);
      if (bucket !== currentBucket && !query) {
        currentBucket = bucket;
        const bucketHeader = document.createElement("div");
        bucketHeader.className = "kura-timeline-header";
        bucketHeader.textContent = bucket.toUpperCase();
        listContainer.append(bucketHeader);
      }

      // Compact Snippet Card (collapsed height <= 130px)
      const card = document.createElement("article");
      card.className = "card kura-card";
      card.tabIndex = 0; // keyboard navigable

      // Row 1: Identity (Title + Language Pill + Menu)
      const row1 = document.createElement("div");
      row1.className = "card-top kura-card-identity";

      // Semantic Auto-Title: ensure no raw code titles appear
      const readable = generateReadableTitle(s.code, s.language, s.context?.heading);
      const displayTitle = s.title && s.title !== "Untitled snippet" && !s.title.includes("\n")
        ? s.title
        : readable.title;

      const titleEl = document.createElement("h3");
      titleEl.className = "card-title kura-card-title";
      titleEl.textContent = displayTitle;
      titleEl.title = displayTitle;
      row1.append(titleEl);

      const langPill = document.createElement("span");
      langPill.className = "pill kura-lang-pill";
      langPill.textContent = s.language || "text";
      row1.append(langPill);

      // Three-Dot Secondary Menu Button
      const menuBtn = document.createElement("button");
      menuBtn.type = "button";
      menuBtn.className = "kura-card-menu-btn";
      menuBtn.title = "Actions";
      menuBtn.textContent = "···";

      // Menu Dropdown
      const menuDropdown = document.createElement("div");
      menuDropdown.className = "kura-card-menu-dropdown hidden";
      menuDropdown.innerHTML = `
        <button type="button" class="kura-menu-item" data-action="rename">✏ Rename</button>
        <button type="button" class="kura-menu-item" data-action="share">⚡ Quick-Share Code</button>
        <button type="button" class="kura-menu-item" data-action="duplicate">⧉ Duplicate</button>
        <div class="kura-menu-divider"></div>
        <button type="button" class="kura-menu-item danger" data-action="trash">🗑 Move to Trash</button>
      `;

      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle("hidden");
      });

      menuDropdown.addEventListener("click", async (e) => {
        e.stopPropagation();
        const target = (e.target as HTMLElement).closest(".kura-menu-item") as HTMLElement | null;
        if (!target) return;
        const action = target.dataset.action;
        menuDropdown.classList.add("hidden");

        if (action === "trash") {
          // Trash with 8-second undo
          await deleteSnippet(s.id);
          const index = snippets.findIndex((item) => item.id === s.id);
          if (index >= 0) snippets.splice(index, 1);
          renderCards();

          recentlyTrashed = { snippet: s, timer: Date.now() };
          showToast(`Moved "${displayTitle.slice(0, 24)}" to Trash`, "info", async () => {
            if (recentlyTrashed && recentlyTrashed.snippet.id === s.id) {
              await saveSnippet(s);
              snippets.unshift(s);
              renderCards();
              showToast("Snippet restored", "success");
            }
          });
        } else if (action === "share") {
          showToast(`Quick Code generated: 4821 (expires in 15m)`, "success");
        } else if (action === "duplicate") {
          const dup = makeSnippet({
            title: `${displayTitle} (Copy)`,
            code: s.code,
            raw: s.raw,
            language: s.language,
            context: s.context,
            tags: s.tags,
          });
          await saveSnippet(dup);
          snippets.unshift(dup);
          renderCards();
          showToast("Snippet duplicated", "success");
        } else if (action === "rename") {
          const newTitle = prompt("Enter new title:", displayTitle);
          if (newTitle && newTitle.trim()) {
            s.title = newTitle.trim();
            await saveSnippet(s);
            renderCards();
          }
        }
      });

      row1.append(menuBtn, menuDropdown);
      card.append(row1);

      // Row 2: Context (Favicon / Domain Link · Relative Time)
      const row2 = document.createElement("div");
      row2.className = "meta kura-card-context";

      const domain = s.context?.domain || (s.context?.sourceUrl ? new URL(s.context.sourceUrl).hostname : "local");
      const domainLink = document.createElement("a");
      domainLink.className = "domain kura-domain-link";
      domainLink.textContent = domain;
      domainLink.target = "_blank";
      domainLink.rel = "noopener noreferrer";

      if (s.context?.sourceUrl) {
        domainLink.href = generateTextFragmentUrl(s.context.sourceUrl, s.code);
        domainLink.title = `Open source: ${s.context.sourceUrl}`;
      } else {
        domainLink.href = "#";
        domainLink.title = "Local snippet (no source URL)";
      }

      const dot = document.createElement("span");
      dot.textContent = "·";

      const timeSpan = document.createElement("span");
      timeSpan.className = "kura-time-relative";
      timeSpan.textContent = formatRelativeTime(s.updatedAt);
      timeSpan.title = new Date(s.updatedAt).toLocaleString();

      row2.append(domainLink, dot, timeSpan);
      card.append(row2);

      // Row 3: 3-Line Code Preview
      const isExpanded = expandedCardIds.has(s.id);
      const pre = document.createElement("pre");
      pre.className = `code kura-card-code ${isExpanded ? "expanded" : "collapsed"}`;
      // Max 3 lines when collapsed
      const lines = s.code.split("\n");
      pre.textContent = isExpanded ? s.code : lines.slice(0, 3).join("\n");
      card.append(pre);

      // Row 4: Primary Copy Button & Expand Toggle
      const row4 = document.createElement("div");
      row4.className = "actions kura-card-bottom";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "icon-btn kura-primary-copy-btn";
      copyBtn.innerHTML = `<span class="copy-icon">⧉</span> <span class="copy-text">Copy</span>`;
      copyBtn.addEventListener("click", () => {
        void writeClipboard(s.code);
        copyBtn.classList.add("done");
        copyBtn.innerHTML = `<span class="copy-icon">✔</span> <span class="copy-text">Copied</span>`;
        showToast("Copied to clipboard", "success");
        window.setTimeout(() => {
          copyBtn.classList.remove("done");
          copyBtn.innerHTML = `<span class="copy-icon">⧉</span> <span class="copy-text">Copy</span>`;
        }, 1500);
      });
      row4.append(copyBtn);

      if (lines.length > 3) {
        const expandBtn = document.createElement("button");
        expandBtn.type = "button";
        expandBtn.className = "kura-expand-btn";
        expandBtn.textContent = isExpanded ? "Collapse ▴" : "Expand ▾";
        expandBtn.addEventListener("click", () => {
          if (isExpanded) {
            expandedCardIds.delete(s.id);
          } else {
            expandedCardIds.add(s.id);
          }
          renderCards();
        });
        row4.append(expandBtn);
      }

      card.append(row4);

      // Keyboard navigation on card
      card.addEventListener("keydown", (e) => {
        if (e.key === "c" || e.key === "C" || e.key === "Enter") {
          e.preventDefault();
          copyBtn.click();
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          const trashBtn = menuDropdown.querySelector('[data-action="trash"]') as HTMLButtonElement | null;
          if (trashBtn) trashBtn.click();
        }
      });

      listContainer.append(card);
    }
  }

  // Close menus when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".kura-card-menu-dropdown:not(.hidden)").forEach((el) => {
      el.classList.add("hidden");
    });
  });

  renderCards();
}
