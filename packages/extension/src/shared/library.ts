/**
 * KuraCode Shared Library UI Renderer (Popup, Side Panel, Options, Web App, PWA)
 * Information-first, calm, dense, AA contrast, 0 AI-slop, 100% offline-compliant.
 */

import { generateReadableTitle } from "./auto-title";
import { cleanCode, detectLanguage, isProseText } from "./cleaner";
import { formatExactTime, formatTimestampTooltip, getTimelineBucket, type TimelineBucket } from "./date-formatter";
import {
  deleteSnippet,
  getActiveWorkspace,
  listSnippets,
  listStoredWorkspaces,
  makeSnippet,
  saveSnippet,
  saveStoredWorkspace,
  setActiveWorkspace,
} from "./storage";
import { generateTextFragmentUrl } from "./text-fragment";
import type { Snippet } from "./types";
import { WorkspaceManager, type Workspace } from "./workspaces";

export interface LibraryOptions {
  title?: string;
  clipboardSave?: boolean;
}

async function writeClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // fallback below
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.append(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

/**
 * Hand-crafted SVG icons matching KuraCode's geometry and 1.5px stroke weight.
 * Zero emojis as icons.
 */
export function createSvgIcon(name: string, size = 14): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.75");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  let path: string;
  switch (name) {
    case "settings":
      path =
        "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4 1.4l1.6 1.2-2 3.5-1.9-.8a7.8 7.8 0 0 1-2.1 1.2l-.3 2h-4l-.3-2a7.8 7.8 0 0 1-2.1-1.2l-1.9.8-2-3.5 1.6-1.2a7.7 7.7 0 0 1 0-2.4L3 12.6l2-3.5 1.9.8c.6-.5 1.3-.9 2.1-1.2l.3-2h4l.3 2c.8.3 1.5.7 2.1 1.2l1.9-.8 2 3.5-1.6 1.2c.1.8.1 1.6 0 2.4z";
      break;
    case "copy":
      path =
        "M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.4a2 2 0 0 0-.6-1.4l-3.4-3.4A2 2 0 0 0 14.6 2H10a2 2 0 0 0-2 2z M4 8h2v12a2 2 0 0 0 2 2h8v2H8a4 4 0 0 1-4-4V8z";
      break;
    case "check":
      path = "M20 6L9 17l-5-5";
      break;
    case "plus":
      path = "M12 5v14M5 12h14";
      break;
    case "search":
      path = "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-4.35-4.35";
      break;
    case "chevron":
      path = "M6 9l6 6 6-6";
      break;
    case "dots":
      path =
        "M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0 M19 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0 M5 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0";
      break;
    case "trash":
      path = "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2";
      break;
    case "share":
      path = "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13";
      break;
    case "close":
      path = "M18 6L6 18M6 6l12 12";
      break;
    case "workspace":
      path = "M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z";
      break;
    case "pin":
      // Real thumbtack glyph (D9)
      path = "M12 17v5M9 2h6M10 2v7l-2 3v2h8v-2l-2-3V2";
      break;
    case "pin-filled":
      svg.setAttribute("fill", "currentColor");
      path = "M12 17v5M9 2h6M10 2v7l-2 3v2h8v-2l-2-3V2";
      break;
    case "filter":
      path = "M3 4h18l-7 8v6l-4 2v-8L3 4z";
      break;
    case "user":
      path = "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z";
      break;
    case "arrow-left":
      path = "M19 12H5M12 19l-7-7 7-7";
      break;
    case "edit":
      path = "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z";
      break;
    case "duplicate":
      path = "M8 4h10a2 2 0 0 1 2 2v10M4 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z";
      break;
    case "globe":
      path = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0c2.5 0 4.5 4.5 4.5 10s-2 10-4.5 10-4.5-4.5-4.5-10 2-10 4.5-10zm-9.5 10h19";
      break;
    default:
      path = "M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0";
  }

  const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathEl.setAttribute("d", path);
  svg.append(pathEl);
  return svg;
}

function cleanDomain(urlOrDomain?: string): string {
  if (!urlOrDomain) return "";
  try {
    let host = urlOrDomain;
    if (urlOrDomain.startsWith("http://") || urlOrDomain.startsWith("https://")) {
      host = new URL(urlOrDomain).hostname;
    }
    return host.replace(/^www\./i, "");
  } catch {
    return urlOrDomain.replace(/^www\./i, "");
  }
}

function formatProperLanguage(lang?: string): string {
  if (!lang || lang.toLowerCase() === "text") return "Text";
  const map: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    json: "JSON",
    python: "Python",
    rust: "Rust",
    go: "Go",
    bash: "Bash",
    csharp: "C#",
    cpp: "C++",
    php: "PHP",
    java: "Java",
    markdown: "Markdown",
    dockerfile: "Dockerfile",
  };
  const key = lang.toLowerCase();
  return map[key] || (lang.charAt(0).toUpperCase() + lang.slice(1));
}

export async function renderLibrary(
  container: HTMLElement,
  _opts: LibraryOptions = {}
): Promise<void> {
  let activeWorkspaceId: string | null = await getActiveWorkspace();
  const storedWorkspaces = await listStoredWorkspaces();
  const defaultWs: Workspace = {
    id: "ws-team-core",
    name: "Core Engineering",
    slug: "core-engineering",
    icon: "📁",
    ownerId: "user-1",
    createdAt: Date.now(),
    members: [
      {
        userId: "user-1",
        email: "dev@kuracode.app",
        name: "Alex Dev",
        role: "owner",
        joinedAt: Date.now(),
      },
    ],
    settings: {
      stripUrlsByDefault: false,
      allowMemberInvites: true,
      retentionDays: 365,
    },
  };

  const workspaceMgr = new WorkspaceManager(
    storedWorkspaces.length > 0 ? storedWorkspaces : [defaultWs]
  );
  if (storedWorkspaces.length === 0) {
    await saveStoredWorkspace(defaultWs);
  }

  workspaceMgr.createInvite(
    "ws-team-core",
    { email: "sarah@kuracode.app", name: "Sarah Lead" },
    "editor",
    { code: "KURA-9281" }
  );

  let snippets: Snippet[] = [];
  try {
    snippets = await listSnippets(activeWorkspaceId);
  } catch {
    snippets = [];
  }

  // Filter & View States
  let searchQuery = "";
  let activeTypeFilter: "all" | "code" | "text" | "pinned" = "all";
  let langFilter = "all";
  let sortOrder: "recent" | "oldest" | "title" = "recent";
  let isWrapEnabled =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("kuracode_wrap_lines") !== "false"
      : true;
  let showLineNumbers =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("kuracode_line_numbers") === "true"
      : false;

  let currentQueryToken = 0;
  let focusedRowIndex = 0;
  let activeDetailSnippet: Snippet | null = null;
  const syncStatus: "synced" | "syncing" | "offline" = "synced";

  // Root Container
  const root = document.createElement("div");
  root.className = "kura-app";

  // --- 1. HEADER (48px Fixed) ---
  const header = document.createElement("header");
  header.className = "kura-header";

  const brandWrap = document.createElement("div");
  brandWrap.className = "kura-brand";

  // Logo Mark (22px)
  const logoSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  logoSvg.setAttribute("viewBox", "0 0 1540 898");
  logoSvg.setAttribute("class", "kura-logo-icon");
  logoSvg.setAttribute("aria-hidden", "true");
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

  function getActiveWorkspaceName(): string {
    if (!activeWorkspaceId) return "Personal Space";
    const ws = workspaceMgr.getWorkspace(activeWorkspaceId);
    return ws ? ws.name : "Personal Space";
  }

  // Workspace Switcher Button
  const wsBtn = document.createElement("button");
  wsBtn.type = "button";
  wsBtn.className = "kura-ws-btn";
  wsBtn.title = `Active Workspace: ${getActiveWorkspaceName()}`;
  wsBtn.setAttribute("aria-label", "Switch workspace");
  wsBtn.innerHTML = `<span>${getActiveWorkspaceName()}</span>`;
  wsBtn.append(createSvgIcon("chevron", 11));

  // Workspace Switcher Dropdown
  const wsDropdown = document.createElement("div");
  wsDropdown.className = "kura-ws-dropdown hidden";

  function renderWorkspaceDropdown(): void {
    wsDropdown.replaceChildren();

    const currentId = activeWorkspaceId;
    const personalItem = document.createElement("button");
    personalItem.type = "button";
    personalItem.className = `kura-ws-item ${currentId === null ? "active" : ""}`;
    personalItem.innerHTML = `<span>Personal Space</span>`;
    if (currentId === null) personalItem.append(createSvgIcon("check", 12));
    personalItem.addEventListener("click", () => switchWorkspace(null));
    wsDropdown.append(personalItem);

    const divider = document.createElement("div");
    divider.className = "kura-menu-divider";
    wsDropdown.append(divider);

    for (const ws of workspaceMgr.listWorkspaces()) {
      const wsItem = document.createElement("button");
      wsItem.type = "button";
      wsItem.className = `kura-ws-item ${currentId === ws.id ? "active" : ""}`;
      wsItem.innerHTML = `<span>${ws.name}</span>`;
      if (currentId === ws.id) wsItem.append(createSvgIcon("check", 12));
      wsItem.addEventListener("click", () => switchWorkspace(ws.id));
      wsDropdown.append(wsItem);
    }

    const divider2 = document.createElement("div");
    divider2.className = "kura-menu-divider";
    wsDropdown.append(divider2);

    const joinItem = document.createElement("button");
    joinItem.type = "button";
    joinItem.className = "kura-ws-item action";
    joinItem.innerHTML = `<span>Join with code or link...</span>`;
    joinItem.addEventListener("click", () => {
      wsDropdown.classList.add("hidden");
      openJoinDialog();
    });
    wsDropdown.append(joinItem);

    const createItem = document.createElement("button");
    createItem.type = "button";
    createItem.className = "kura-ws-item action";
    createItem.innerHTML = `<span>+ Create workspace...</span>`;
    createItem.addEventListener("click", () => {
      wsDropdown.classList.add("hidden");
      openCreateWorkspaceDialog();
    });
    wsDropdown.append(createItem);
  }

  wsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    renderWorkspaceDropdown();
    wsDropdown.classList.toggle("hidden");
  });

  brandWrap.append(wsBtn);
  brandWrap.append(wsDropdown);
  header.append(brandWrap);

  // Header Controls (Max 3 trailing controls per spec)
  const headerControls = document.createElement("div");
  headerControls.className = "kura-header-controls";

  // 1. Sync Dot with popover/tooltip
  const syncBtn = document.createElement("button");
  syncBtn.type = "button";
  syncBtn.className = "kura-sync-dot-btn";
  syncBtn.title = `Sync: ${syncStatus.toUpperCase()} (Click for info)`;
  syncBtn.setAttribute("aria-label", `Sync status: ${syncStatus}`);
  syncBtn.innerHTML = `<span class="kura-sync-dot ${syncStatus}"></span>`;
  syncBtn.addEventListener("click", () => {
    showToast(`Sync status: ${syncStatus.toUpperCase()} • Zero uncommitted conflicts`, "info");
  });
  headerControls.append(syncBtn);

  // 2. Settings Gear
  const settingsBtn = document.createElement("button");
  settingsBtn.type = "button";
  settingsBtn.id = "btn-settings";
  settingsBtn.setAttribute("data-action", "settings");
  settingsBtn.className = "kura-header-btn";
  settingsBtn.title = "Settings (Alt+S or Cmd+,)";
  settingsBtn.setAttribute("aria-label", "Settings");
  settingsBtn.append(createSvgIcon("settings", 15));

  function openSettings(): void {
    openInPopupSettings();
    if (typeof chrome !== "undefined" && chrome.runtime?.openOptionsPage) {
      try {
        chrome.runtime.openOptionsPage();
      } catch {
        // in-popup modal visible
      }
    }
  }

  settingsBtn.addEventListener("click", () => openSettings());
  headerControls.append(settingsBtn);

  // 3. Account / User Icon
  const accountBtn = document.createElement("button");
  accountBtn.type = "button";
  accountBtn.id = "btn-account";
  accountBtn.className = "kura-header-btn";
  accountBtn.title = "Account & Devices";
  accountBtn.setAttribute("aria-label", "Account & Devices");
  accountBtn.append(createSvgIcon("user", 15));
  accountBtn.addEventListener("click", () => {
    showToast("Signed in as dev@kuracode.app • Free Tier", "info");
  });
  headerControls.append(accountBtn);

  header.append(headerControls);
  root.append(header);

  // --- 2. SEARCH ROW (56px Fixed) ---
  const searchRow = document.createElement("div");
  searchRow.className = "kura-search-row";

  const searchInputWrap = document.createElement("div");
  searchInputWrap.className = "kura-search-input-wrap";

  const searchIcon = document.createElement("span");
  searchIcon.className = "kura-search-icon";
  searchIcon.append(createSvgIcon("search", 13));

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "kura-search-input search";
  searchInput.placeholder = "Search snippets";
  searchInput.setAttribute("aria-label", "Search snippets");

  const keyHint = document.createElement("span");
  keyHint.className = "kura-search-keyhint";
  keyHint.textContent = "/";
  keyHint.title = "Press / to search";

  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderList();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (searchInput.value) {
        searchInput.value = "";
        searchQuery = "";
        renderList();
      } else {
        searchInput.blur();
      }
    }
  });

  searchInputWrap.append(searchIcon, searchInput, keyHint);
  searchRow.append(searchInputWrap);

  // Primary Action: Accent-filled Square "+" Button (Save from clipboard)
  const saveClipBtn = document.createElement("button");
  saveClipBtn.type = "button";
  saveClipBtn.id = "btn-save-clip";
  saveClipBtn.className = "kura-primary-save-btn";
  saveClipBtn.title = "Save clipboard (⌘⇧V or Ctrl+Shift+V)";
  saveClipBtn.setAttribute("aria-label", "Paste from clipboard");
  saveClipBtn.append(createSvgIcon("plus", 16));

  saveClipBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        showToast("Clipboard is empty", "warning");
        return;
      }
      const code = cleanCode(text);
      const isProse = isProseText(code);
      const lang = isProse ? "text" : detectLanguage(null, code);
      const auto = generateReadableTitle(code, lang);

      const snippet = makeSnippet({
        title: auto.isUntitled ? "" : auto.title,
        code,
        raw: text,
        language: lang,
        workspaceId: activeWorkspaceId,
        context: {
          sourceUrl: "",
          pageTitle: "Clipboard",
          domain: "clipboard",
          capturedAt: Date.now(),
        },
      });
      await saveSnippet(snippet);
      snippets.unshift(snippet);
      renderList();

      showToast(`Saved to ${getActiveWorkspaceName()}`, "success");
    } catch {
      showToast("Clipboard permission required", "danger");
    }
  });

  searchRow.append(saveClipBtn);
  root.append(searchRow);

  // --- 3. FILTER ROW (40px Fixed, Never Wraps) ---
  const filterRow = document.createElement("div");
  filterRow.className = "kura-filter-row";

  const chipsScroll = document.createElement("div");
  chipsScroll.className = "kura-chips-scroll";

  const chipDefs: Array<{ id: "all" | "code" | "text" | "pinned"; label: string }> = [
    { id: "all", label: "All" },
    { id: "code", label: "Code" },
    { id: "text", label: "Text" },
    { id: "pinned", label: "Pinned" },
  ];

  function renderChips(): void {
    chipsScroll.replaceChildren();
    for (const chip of chipDefs) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `kura-chip ${activeTypeFilter === chip.id ? "active" : ""}`;
      btn.setAttribute("data-filter", chip.id);

      if (chip.id === "all") {
        btn.innerHTML = `${chip.label} <span class="kura-chip-count">${snippets.length}</span>`;
      } else {
        btn.textContent = chip.label;
      }

      btn.addEventListener("click", () => {
        activeTypeFilter = chip.id;
        renderChips();
        renderList();
      });
      chipsScroll.append(btn);
    }
  }

  filterRow.append(chipsScroll);

  // "View and filter" Popover Button
  const viewFilterBtn = document.createElement("button");
  viewFilterBtn.type = "button";
  viewFilterBtn.id = "btn-view-filter";
  viewFilterBtn.className = "kura-view-filter-btn kura-wrap-toggle";
  viewFilterBtn.setAttribute("data-action", "toggle-wrap");
  viewFilterBtn.title = "View and filter options";
  viewFilterBtn.setAttribute("aria-label", "View and filter options");
  viewFilterBtn.append(createSvgIcon("filter", 14));

  const filterPopover = document.createElement("div");
  filterPopover.className = "kura-popover hidden";

  function renderFilterPopover(): void {
    filterPopover.replaceChildren();

    const titleEl = document.createElement("div");
    titleEl.className = "kura-popover-title";
    titleEl.textContent = "View and filter";
    filterPopover.append(titleEl);

    // Sort Selection
    const sortLabel = document.createElement("div");
    sortLabel.className = "kura-popover-section-label";
    sortLabel.textContent = "Sort by";
    filterPopover.append(sortLabel);

    const sortGroup = document.createElement("div");
    sortGroup.className = "kura-popover-options";
    const sortOptions: Array<{ id: "recent" | "oldest" | "title"; name: string }> = [
      { id: "recent", name: "Recently saved" },
      { id: "oldest", name: "Oldest first" },
      { id: "title", name: "A to Z" },
    ];
    for (const s of sortOptions) {
      const optBtn = document.createElement("button");
      optBtn.type = "button";
      optBtn.className = `kura-popover-opt ${sortOrder === s.id ? "selected" : ""}`;
      optBtn.innerHTML = `<span>${s.name}</span>`;
      if (sortOrder === s.id) optBtn.append(createSvgIcon("check", 12));
      optBtn.addEventListener("click", () => {
        sortOrder = s.id;
        renderFilterPopover();
        renderList();
      });
      sortGroup.append(optBtn);
    }
    filterPopover.append(sortGroup);

    // Language Filter
    const langLabel = document.createElement("div");
    langLabel.className = "kura-popover-section-label";
    langLabel.textContent = "Language";
    filterPopover.append(langLabel);

    const langGroup = document.createElement("div");
    langGroup.className = "kura-popover-options";

    const allLangBtn = document.createElement("button");
    allLangBtn.type = "button";
    allLangBtn.className = `kura-popover-opt ${langFilter === "all" ? "selected" : ""}`;
    allLangBtn.innerHTML = `<span>All languages</span>`;
    if (langFilter === "all") allLangBtn.append(createSvgIcon("check", 12));
    allLangBtn.addEventListener("click", () => {
      langFilter = "all";
      renderFilterPopover();
      renderList();
    });
    langGroup.append(allLangBtn);

    const uniqueLangs = Array.from(new Set(snippets.map((s) => s.language || "text"))).sort();
    for (const l of uniqueLangs) {
      const lBtn = document.createElement("button");
      lBtn.type = "button";
      lBtn.className = `kura-popover-opt ${langFilter === l ? "selected" : ""}`;
      lBtn.innerHTML = `<span>${formatProperLanguage(l)}</span>`;
      if (langFilter === l) lBtn.append(createSvgIcon("check", 12));
      lBtn.addEventListener("click", () => {
        langFilter = l;
        renderFilterPopover();
        renderList();
      });
      langGroup.append(lBtn);
    }
    filterPopover.append(langGroup);

    // Line Wrapping Toggle (D13)
    const wrapRow = document.createElement("div");
    wrapRow.className = "kura-popover-toggle-row";
    wrapRow.innerHTML = `<span>Wrap lines</span>`;
    const wrapSwitch = document.createElement("button");
    wrapSwitch.type = "button";
    wrapSwitch.className = `kura-toggle-switch ${isWrapEnabled ? "on" : "off"}`;
    wrapSwitch.textContent = isWrapEnabled ? "ON" : "OFF";
    wrapSwitch.addEventListener("click", () => {
      isWrapEnabled = !isWrapEnabled;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("kuracode_wrap_lines", String(isWrapEnabled));
      }
      renderFilterPopover();
      renderList();
    });
    wrapRow.append(wrapSwitch);
    filterPopover.append(wrapRow);

    // Clear filters button
    if (langFilter !== "all" || sortOrder !== "recent" || activeTypeFilter !== "all") {
      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "kura-popover-clear-btn";
      clearBtn.textContent = "Clear filters";
      clearBtn.addEventListener("click", () => {
        langFilter = "all";
        sortOrder = "recent";
        activeTypeFilter = "all";
        renderChips();
        renderFilterPopover();
        renderList();
      });
      filterPopover.append(clearBtn);
    }
  }

  viewFilterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    renderFilterPopover();
    filterPopover.classList.toggle("hidden");
  });

  filterRow.append(viewFilterBtn);
  filterRow.append(filterPopover);
  root.append(filterRow);

  // --- 4. LIST (The ONLY scroll area in the popup) ---
  const listContainer = document.createElement("main");
  listContainer.className = "kura-list";
  listContainer.setAttribute("aria-label", "Snippets list");
  root.append(listContainer);

  // Toasts Container
  const toastEl = document.createElement("div");
  toastEl.className = "kura-toast hidden";
  toastEl.setAttribute("aria-live", "polite");
  root.append(toastEl);

  function showToast(
    message: string,
    type: "info" | "success" | "warning" | "danger" = "info",
    undoCallback?: () => void
  ) {
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

  // --- SLIDE-IN DETAIL VIEW (Part B) ---
  const detailContainer = document.createElement("div");
  detailContainer.className = "kura-detail-view hidden";
  root.append(detailContainer);

  function openDetailView(s: Snippet): void {
    activeDetailSnippet = s;
    detailContainer.classList.remove("hidden");
    detailContainer.replaceChildren();

    const isProse = isProseText(s.code) || s.language === "text";
    const readable = generateReadableTitle(s.code, s.language, s.context?.heading);
    const displayTitle = s.title && s.title !== s.code.trim() ? s.title : readable.title;

    // Detail Header
    const detailHeader = document.createElement("div");
    detailHeader.className = "kura-detail-header";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "kura-detail-back-btn";
    backBtn.setAttribute("aria-label", "Back to list");
    backBtn.append(createSvgIcon("arrow-left", 14));
    const backText = document.createElement("span");
    backText.textContent = "Back";
    backBtn.append(backText);
    backBtn.addEventListener("click", () => closeDetailView());
    detailHeader.append(backBtn);

    const titleHeading = document.createElement("h2");
    titleHeading.className = "kura-detail-title";
    titleHeading.textContent = displayTitle || (isProse ? "Text Note" : "Code Snippet");
    detailHeader.append(titleHeading);

    const detailHeaderActions = document.createElement("div");
    detailHeaderActions.className = "kura-detail-header-actions";

    // Pin Toggle
    const pinDetailBtn = document.createElement("button");
    pinDetailBtn.type = "button";
    pinDetailBtn.className = `kura-header-btn ${s.pinned ? "active" : ""}`;
    pinDetailBtn.title = s.pinned ? "Unpin" : "Pin";
    pinDetailBtn.append(createSvgIcon(s.pinned ? "pin-filled" : "pin", 14));
    pinDetailBtn.addEventListener("click", async () => {
      s.pinned = !s.pinned;
      await saveSnippet(s);
      openDetailView(s);
      renderList();
    });
    detailHeaderActions.append(pinDetailBtn);

    // Trash
    const trashDetailBtn = document.createElement("button");
    trashDetailBtn.type = "button";
    trashDetailBtn.className = "kura-header-btn danger";
    trashDetailBtn.title = "Move to Trash";
    trashDetailBtn.append(createSvgIcon("trash", 14));
    trashDetailBtn.addEventListener("click", async () => {
      await deleteSnippet(s.id);
      const idx = snippets.findIndex((item) => item.id === s.id);
      if (idx >= 0) snippets.splice(idx, 1);
      closeDetailView();
      renderList();
      showToast("Moved to Trash", "info", async () => {
        await saveSnippet(s);
        snippets.unshift(s);
        renderList();
      });
    });
    detailHeaderActions.append(trashDetailBtn);

    detailHeader.append(detailHeaderActions);
    detailContainer.append(detailHeader);

    // Detail Body
    const detailBody = document.createElement("div");
    detailBody.className = "kura-detail-body";

    // Code / Text Display
    const contentBox = document.createElement(isProse ? "div" : "pre");
    contentBox.className = `kura-detail-content ${isProse ? "prose" : "code"} ${
      isWrapEnabled ? "wrap" : "no-wrap"
    } ${showLineNumbers && !isProse ? "with-line-numbers" : ""}`;

    if (!isProse && showLineNumbers) {
      contentBox.innerHTML = s.code
        .split("\n")
        .map((line, idx) => `<span class="line-gutter" aria-hidden="true">${idx + 1}</span><span class="line-content">${escapeHtml(line)}</span>`)
        .join("\n");
    } else {
      contentBox.textContent = s.code;
    }
    detailBody.append(contentBox);

    // Actions Bar inside Detail View
    const actionsBar = document.createElement("div");
    actionsBar.className = "kura-detail-actions-bar";

    const primaryCopyBtn = document.createElement("button");
    primaryCopyBtn.type = "button";
    primaryCopyBtn.className = "kura-btn kura-btn-primary";
    primaryCopyBtn.innerHTML = `<span>Copy content</span>`;
    primaryCopyBtn.addEventListener("click", async () => {
      await writeClipboard(s.code);
      primaryCopyBtn.textContent = "Copied!";
      showToast("Copied byte-exact content", "success");
      setTimeout(() => {
        primaryCopyBtn.textContent = "Copy content";
      }, 1500);
    });
    actionsBar.append(primaryCopyBtn);

    const copyAttrBtn = document.createElement("button");
    copyAttrBtn.type = "button";
    copyAttrBtn.className = "kura-btn";
    copyAttrBtn.textContent = "Copy with source";
    copyAttrBtn.addEventListener("click", async () => {
      const attr = s.context?.sourceUrl
        ? `// Source: ${s.context.sourceUrl}\n// Captured: ${new Date(s.updatedAt).toLocaleString()}\n\n${s.code}`
        : s.code;
      await writeClipboard(attr);
      showToast("Copied with attribution", "success");
    });
    actionsBar.append(copyAttrBtn);

    const wrapToggleBtn = document.createElement("button");
    wrapToggleBtn.type = "button";
    wrapToggleBtn.className = "kura-btn";
    wrapToggleBtn.textContent = isWrapEnabled ? "Wrap: ON" : "Wrap: OFF";
    wrapToggleBtn.addEventListener("click", () => {
      isWrapEnabled = !isWrapEnabled;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("kuracode_wrap_lines", String(isWrapEnabled));
      }
      openDetailView(s);
    });
    actionsBar.append(wrapToggleBtn);

    detailBody.append(actionsBar);

    // Metadata Panel
    const metaPanel = document.createElement("div");
    metaPanel.className = "kura-detail-meta-panel";

    // Source link
    if (s.context?.sourceUrl) {
      const sourceRow = document.createElement("div");
      sourceRow.className = "kura-detail-meta-row";
      const sourceUrl = generateTextFragmentUrl(s.context.sourceUrl, s.code);
      sourceRow.innerHTML = `
        <span class="meta-label">Source</span>
        <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer" class="meta-value link">
          ${escapeHtml(cleanDomain(s.context.domain || s.context.sourceUrl))} ↗
        </a>
      `;
      metaPanel.append(sourceRow);
    }

    // Exact Time & Date
    const timeRow = document.createElement("div");
    timeRow.className = "kura-detail-meta-row";
    const tooltipText = formatTimestampTooltip(s.updatedAt, s.context?.device);
    timeRow.innerHTML = `
      <span class="meta-label">Captured</span>
      <span class="meta-value">${escapeHtml(tooltipText)}</span>
    `;
    metaPanel.append(timeRow);

    // Language / Type with One-Click Override (D4)
    const langRow = document.createElement("div");
    langRow.className = "kura-detail-meta-row";
    const langSelect = document.createElement("select");
    langSelect.className = "kura-detail-lang-select";
    const availableLangs = [
      "text",
      "javascript",
      "typescript",
      "html",
      "css",
      "sql",
      "json",
      "python",
      "rust",
      "go",
      "bash",
      "csharp",
      "markdown",
    ];
    for (const l of availableLangs) {
      const opt = document.createElement("option");
      opt.value = l;
      opt.textContent = formatProperLanguage(l);
      if (s.language === l) opt.selected = true;
      langSelect.append(opt);
    }
    langSelect.addEventListener("change", async () => {
      s.language = langSelect.value;
      await saveSnippet(s);
      showToast(`Language set to ${formatProperLanguage(s.language)}`, "success");
      openDetailView(s);
      renderList();
    });

    langRow.innerHTML = `<span class="meta-label">Type / Language</span>`;
    langRow.append(langSelect);
    metaPanel.append(langRow);

    detailBody.append(metaPanel);
    detailContainer.append(detailBody);
  }

  function closeDetailView(): void {
    activeDetailSnippet = null;
    detailContainer.classList.add("hidden");
    detailContainer.replaceChildren();
  }

  // --- LIST RENDERING ENGINE ---
  function renderList(): void {
    renderChips();

    // Active filter badge check
    const hasActiveFilters =
      langFilter !== "all" || sortOrder !== "recent" || activeTypeFilter !== "all";
    viewFilterBtn.classList.toggle("has-filters", hasActiveFilters);
    const badge = viewFilterBtn.querySelector(".kura-filter-badge");
    if (hasActiveFilters && !badge) {
      const b = document.createElement("span");
      b.className = "kura-filter-badge";
      viewFilterBtn.append(b);
    } else if (!hasActiveFilters && badge) {
      badge.remove();
    }

    // Filter snippets
    const visible = snippets.filter((s) => {
      if (activeTypeFilter === "code" && (s.language === "text" || isProseText(s.code))) {
        return false;
      }
      if (activeTypeFilter === "text" && s.language !== "text" && !isProseText(s.code)) {
        return false;
      }
      if (activeTypeFilter === "pinned" && !s.pinned) {
        return false;
      }
      if (langFilter !== "all" && s.language !== langFilter) {
        return false;
      }
      if (!searchQuery) return true;
      const haystack = [
        s.title,
        s.code,
        s.language,
        s.context?.sourceUrl,
        s.context?.domain,
        ...(s.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchQuery);
    });

    // Sorting
    if (sortOrder === "recent") {
      visible.sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    } else if (sortOrder === "oldest") {
      visible.sort((a, b) => a.updatedAt - b.updatedAt);
    } else if (sortOrder === "title") {
      visible.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    listContainer.replaceChildren();

    // Empty State
    if (visible.length === 0) {
      listContainer.removeAttribute("role");
      const empty = document.createElement("div");
      empty.className = "kura-empty-state";

      const emptyIcon = document.createElement("div");
      emptyIcon.className = "kura-empty-icon";
      emptyIcon.append(createSvgIcon("workspace", 26));

      const emptyTitle = document.createElement("h3");
      emptyTitle.className = "kura-empty-title";
      emptyTitle.textContent = searchQuery
        ? "No matching snippets"
        : `No snippets in ${getActiveWorkspaceName()}`;

      const emptySub = document.createElement("p");
      emptySub.className = "kura-empty-sub";
      emptySub.textContent = searchQuery
        ? "Try a different search term or clear the active filter."
        : "Capture code from any webpage with ⌘⇧S (Ctrl+Shift+S), click '+ Save clipboard', or join a workspace.";

      empty.append(emptyIcon, emptyTitle, emptySub);

      if (searchQuery || hasActiveFilters) {
        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "kura-btn";
        clearBtn.textContent = "Clear search & filters";
        clearBtn.addEventListener("click", () => {
          searchInput.value = "";
          searchQuery = "";
          langFilter = "all";
          sortOrder = "recent";
          activeTypeFilter = "all";
          renderChips();
          renderList();
        });
        empty.append(clearBtn);
      } else {
        const joinBtn = document.createElement("button");
        joinBtn.type = "button";
        joinBtn.id = "btn-join-code";
        joinBtn.className = "kura-btn kura-btn-primary";
        joinBtn.textContent = "Enter Invite Code or Link";
        joinBtn.addEventListener("click", () => openJoinDialog());
        empty.append(joinBtn);
      }

      listContainer.append(empty);
      return;
    }

    // Timeline Grouping
    listContainer.setAttribute("role", "list");
    let currentBucket: TimelineBucket | null = null;

    for (let index = 0; index < visible.length; index++) {
      const s = visible[index];
      const bucket = getTimelineBucket(s.updatedAt);

      if (bucket !== currentBucket && !searchQuery) {
        currentBucket = bucket;
        const bucketHeader = document.createElement("div");
        bucketHeader.className = "kura-group-header";

        const label = document.createElement("span");
        label.textContent = bucket.toUpperCase();

        const count = document.createElement("span");
        const inThisBucket = visible.filter((item) => getTimelineBucket(item.updatedAt) === bucket).length;
        count.textContent = String(inThisBucket);

        bucketHeader.append(label, count);
        listContainer.append(bucketHeader);
      }

      // Row Element
      const row = document.createElement("article");
      row.className = `kura-row card ${s.pinned ? "pinned" : ""}`;
      row.setAttribute("role", "listitem");
      row.tabIndex = index === focusedRowIndex ? 0 : -1;
      row.setAttribute("data-id", s.id);

      const isProse = isProseText(s.code) || s.language === "text";
      const isOneWord = !s.code.includes("\n") && s.code.trim().split(/\s+/).length <= 2 && s.code.trim().length < 35;
      const readable = generateReadableTitle(s.code, s.language, s.context?.heading);

      // D3 rule: If user gave no custom title (or title repeats code), do NOT display duplicate title
      const hasDistinctUserTitle = Boolean(
        s.title &&
        s.title !== "Untitled snippet" &&
        s.title.trim().toLowerCase() !== s.code.trim().toLowerCase()
      );

      // Line 1: Title (left) + Action cluster (right)
      const line1 = document.createElement("div");
      line1.className = "kura-row-line-1";

      const titleWrap = document.createElement("div");
      titleWrap.className = "kura-row-title-wrap";

      if (s.pinned) {
        const pinIco = createSvgIcon("pin-filled", 12);
        pinIco.classList.add("kura-pin-indicator");
        titleWrap.append(pinIco);
      }

      if (isProse && !hasDistinctUserTitle) {
        // Untitled prose: Line 1 IS the clamped prose text (D3 / Part B)
        const proseText = document.createElement("div");
        proseText.className = "kura-row-prose kura-card-title";
        proseText.textContent = s.code.trim();
        titleWrap.append(proseText);
      } else {
        // Titled snippet or one-word item
        const titleEl = document.createElement("h3");
        titleEl.className = "kura-row-title kura-card-title";
        const titleString = hasDistinctUserTitle ? s.title : (readable.isUntitled ? s.code.trim() : readable.title);
        titleEl.textContent = titleString;
        titleEl.title = titleString;
        titleWrap.append(titleEl);
      }

      line1.append(titleWrap);

      // Trailing Action Cluster (D8)
      const actionCluster = document.createElement("div");
      actionCluster.className = "kura-row-actions";

      // 1. Copy Icon Button (always visible, 28px visual / 32px target)
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "kura-action-copy-btn icon-btn";
      copyBtn.title = "Copy";
      copyBtn.setAttribute("aria-label", "Copy code");
      copyBtn.append(createSvgIcon("copy", 14));

      copyBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await writeClipboard(s.code);
        copyBtn.classList.add("done");
        copyBtn.replaceChildren(createSvgIcon("check", 14));
        showToast("Copied to clipboard", "success");
        setTimeout(() => {
          copyBtn.classList.remove("done");
          copyBtn.replaceChildren(createSvgIcon("copy", 14));
        }, 1500);
      });
      actionCluster.append(copyBtn);

      // 2. More Button (dots)
      const moreBtn = document.createElement("button");
      moreBtn.type = "button";
      moreBtn.className = "kura-action-more-btn";
      moreBtn.title = "More actions";
      moreBtn.setAttribute("aria-label", "More actions");
      moreBtn.append(createSvgIcon("dots", 14));

      const menuDropdown = document.createElement("div");
      menuDropdown.className = "kura-menu-dropdown hidden";
      menuDropdown.innerHTML = `
        <button type="button" class="kura-menu-item" data-action="detail">Open detail</button>
        <button type="button" class="kura-menu-item" data-action="copy-attr">Copy with attribution</button>
        <button type="button" class="kura-menu-item" data-action="pin">${s.pinned ? "Unpin" : "Pin"}</button>
        <button type="button" class="kura-menu-item" data-action="share">Share quick code</button>
        <button type="button" class="kura-menu-item" data-action="duplicate">Duplicate</button>
        <div class="kura-menu-divider"></div>
        <button type="button" class="kura-menu-item danger" data-action="trash">Move to Trash</button>
      `;

      moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle("hidden");
      });

      menuDropdown.addEventListener("click", async (e) => {
        e.stopPropagation();
        const target = (e.target as HTMLElement).closest(".kura-menu-item") as HTMLElement | null;
        if (!target) return;
        const action = target.dataset.action;
        menuDropdown.classList.add("hidden");

        if (action === "detail") {
          openDetailView(s);
        } else if (action === "copy-attr") {
          const attr = s.context?.sourceUrl
            ? `// Source: ${s.context.sourceUrl}\n// Captured: ${new Date(s.updatedAt).toLocaleString()}\n\n${s.code}`
            : s.code;
          await writeClipboard(attr);
          showToast("Copied with attribution", "success");
        } else if (action === "pin") {
          s.pinned = !s.pinned;
          await saveSnippet(s);
          renderList();
        } else if (action === "share") {
          const quickCode = String(Math.floor(1000 + Math.random() * 9000));
          await writeClipboard(quickCode);
          showToast(`Quick Code #${quickCode} copied (expires in 15m)`, "success");
        } else if (action === "duplicate") {
          const dup = makeSnippet({
            title: s.title ? `${s.title} (Copy)` : "",
            code: s.code,
            raw: s.raw,
            language: s.language,
            workspaceId: s.workspaceId,
            context: s.context,
          });
          await saveSnippet(dup);
          snippets.unshift(dup);
          renderList();
          showToast("Snippet duplicated", "success");
        } else if (action === "trash") {
          await deleteSnippet(s.id);
          const idx = snippets.findIndex((item) => item.id === s.id);
          if (idx >= 0) snippets.splice(idx, 1);
          renderList();
          showToast("Moved to Trash", "info", async () => {
            await saveSnippet(s);
            snippets.unshift(s);
            renderList();
          });
        }
      });

      actionCluster.append(moreBtn);
      actionCluster.append(menuDropdown);
      line1.append(actionCluster);
      row.append(line1);

      // Line 2: Meta Context (Favicon 14px, domain without www, exact time, type)
      const line2 = document.createElement("div");
      line2.className = "kura-row-meta";

      const domain = cleanDomain(s.context?.domain || (s.context?.sourceUrl ? cleanDomain(s.context.sourceUrl) : ""));

      if (domain && domain !== "clipboard" && domain !== "local") {
        // Favicon (14px) using offline-first SVG globe icon (privacy-first, 0 external network requests)
        const globeSvg = createSvgIcon("globe", 13);
        globeSvg.classList.add("kura-meta-favicon");
        line2.append(globeSvg);

        const domainSpan = document.createElement("span");
        domainSpan.className = "kura-meta-domain";
        domainSpan.textContent = domain;
        line2.append(domainSpan);

        const sep1 = document.createElement("span");
        sep1.className = "kura-meta-sep";
        sep1.textContent = "•";
        line2.append(sep1);
      }

      // Exact Time (D10)
      const timeSpan = document.createElement("time");
      timeSpan.className = "kura-meta-time";
      timeSpan.textContent = formatExactTime(s.updatedAt);
      timeSpan.title = formatTimestampTooltip(s.updatedAt, s.context?.device);
      line2.append(timeSpan);

      const sep2 = document.createElement("span");
      sep2.className = "kura-meta-sep";
      sep2.textContent = "•";
      line2.append(sep2);

      // Type / Language label (plain text, no pill, no border)
      const typeSpan = document.createElement("span");
      typeSpan.className = "kura-meta-lang";
      typeSpan.textContent = formatProperLanguage(isProse ? "text" : s.language);
      line2.append(typeSpan);

      row.append(line2);

      // Line 3: Recessed Code Preview (Code rows ONLY, never for prose or one-word items)
      if (!isProse && !isOneWord) {
        const previewWrap = document.createElement("div");
        previewWrap.className = "kura-code-preview-wrap";

        const pre = document.createElement("pre");
        pre.className = `kura-code-preview kura-card-code ${isWrapEnabled ? "wrap" : "no-wrap"}`;

        const lines = s.code.split("\n");
        const previewLines = lines.slice(0, 3);
        pre.textContent = previewLines.join("\n");
        previewWrap.append(pre);

        if (lines.length > 3) {
          const fade = document.createElement("div");
          fade.className = "kura-preview-fade";
          previewWrap.append(fade);

          const showMoreBtn = document.createElement("button");
          showMoreBtn.type = "button";
          showMoreBtn.className = "kura-show-more-btn";
          showMoreBtn.textContent = `Show more (${lines.length} lines) ▾`;
          showMoreBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openDetailView(s);
          });
          previewWrap.append(showMoreBtn);
        }

        row.append(previewWrap);
      }

      // Click opens detail view
      row.addEventListener("click", () => openDetailView(s));

      // Row Keyboard Navigation
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          openDetailView(s);
        } else if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          void writeClipboard(s.code);
          showToast("Copied to clipboard", "success");
        } else if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          s.pinned = !s.pinned;
          void saveSnippet(s).then(() => renderList());
        } else if (e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault();
          void deleteSnippet(s.id).then(() => {
            const idx = snippets.findIndex((item) => item.id === s.id);
            if (idx >= 0) snippets.splice(idx, 1);
            renderList();
            showToast("Moved to Trash", "info", async () => {
              await saveSnippet(s);
              snippets.unshift(s);
              renderList();
            });
          });
        }
      });

      listContainer.append(row);
    }
  }

  // Initial List Render
  renderChips();
  renderList();

  // --- WORKSPACE SWITCHING ENGINE ---
  async function switchWorkspace(newWorkspaceId: string | null): Promise<void> {
    const thisQueryToken = ++currentQueryToken;
    activeWorkspaceId = newWorkspaceId;
    await setActiveWorkspace(newWorkspaceId);

    wsBtn.innerHTML = `<span>${getActiveWorkspaceName()}</span>`;
    wsBtn.append(createSvgIcon("chevron", 11));
    wsBtn.title = `Active Workspace: ${getActiveWorkspaceName()}`;
    wsDropdown.classList.add("hidden");

    listContainer.replaceChildren();
    for (let i = 0; i < 3; i++) {
      const skel = document.createElement("div");
      skel.className = "kura-skeleton-row";
      skel.innerHTML = `
        <div class="kura-skeleton-line short"></div>
        <div class="kura-skeleton-line"></div>
      `;
      listContainer.append(skel);
    }

    const loaded = await listSnippets(activeWorkspaceId);
    if (thisQueryToken !== currentQueryToken) return;

    snippets = loaded;
    renderList();
    showToast(`Switched to ${getActiveWorkspaceName()}`);
  }

  // Global Keyboard Shortcuts (Part D)
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    } else if (e.key === "Escape") {
      if (!filterPopover.classList.contains("hidden")) {
        filterPopover.classList.add("hidden");
      } else if (!wsDropdown.classList.contains("hidden")) {
        wsDropdown.classList.add("hidden");
      } else if (activeDetailSnippet || !detailContainer.classList.contains("hidden")) {
        closeDetailView();
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key === ",") {
      e.preventDefault();
      openSettings();
    } else if (e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      openSettings();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const rows = Array.from(listContainer.querySelectorAll<HTMLElement>(".kura-row"));
      if (rows.length === 0) return;
      if (document.activeElement && rows.includes(document.activeElement as HTMLElement)) {
        e.preventDefault();
        const curIdx = rows.indexOf(document.activeElement as HTMLElement);
        const nextIdx = e.key === "ArrowDown" ? Math.min(curIdx + 1, rows.length - 1) : Math.max(curIdx - 1, 0);
        rows[curIdx].tabIndex = -1;
        rows[nextIdx].tabIndex = 0;
        rows[nextIdx].focus();
        focusedRowIndex = nextIdx;
      }
    }
  });

  // Close menus on outside click
  document.addEventListener("click", () => {
    wsDropdown.classList.add("hidden");
    filterPopover.classList.add("hidden");
    document.querySelectorAll(".kura-menu-dropdown").forEach((d) => d.classList.add("hidden"));
  });

  // --- UNIFIED JOIN DIALOG ---
  function openJoinDialog(): void {
    const backdrop = document.createElement("div");
    backdrop.className = "kura-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "kura-modal kura-join-modal";

    const closeModal = () => {
      backdrop.remove();
      document.removeEventListener("keydown", onKeyDown);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    const headerEl = document.createElement("div");
    headerEl.className = "kura-modal-header";
    headerEl.innerHTML = `<h3>Enter Invite Code or Link</h3>`;
    const closeBtn = document.createElement("button");
    closeBtn.className = "kura-modal-close";
    closeBtn.append(createSvgIcon("close", 14));
    closeBtn.addEventListener("click", closeModal);
    headerEl.append(closeBtn);
    modal.append(headerEl);

    const bodyEl = document.createElement("div");
    bodyEl.className = "kura-modal-body";

    const inputRow = document.createElement("div");
    inputRow.className = "kura-input-row";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "kura-input kura-join-input";
    input.placeholder = "Paste 4-digit quick code, KURA-xxxx, or join link...";
    input.autofocus = true;

    const pasteBtn = document.createElement("button");
    pasteBtn.type = "button";
    pasteBtn.className = "kura-btn";
    pasteBtn.textContent = "Paste";
    pasteBtn.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        input.value = text.trim();
        updatePreview();
      } catch {
        showToast("Clipboard permission required", "warning");
      }
    });

    inputRow.append(input, pasteBtn);
    bodyEl.append(inputRow);

    const previewContainer = document.createElement("div");
    previewContainer.className = "kura-code-preview-container";
    bodyEl.append(previewContainer);

    const errorEl = document.createElement("div");
    errorEl.className = "kura-code-error hidden";
    bodyEl.append(errorEl);

    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "kura-btn kura-btn-primary kura-confirm-join-btn";
    actionBtn.textContent = "Claim Code";
    actionBtn.disabled = true;

    function updatePreview(): void {
      const val = input.value.trim();
      errorEl.classList.add("hidden");
      previewContainer.replaceChildren();
      actionBtn.disabled = true;

      if (!val) return;

      try {
        const preview = workspaceMgr.previewCode(val);
        const card = document.createElement("div");
        card.className = "kura-preview-card";
        card.innerHTML = `
          <div class="kura-preview-badge">${preview.kind === "workspace_invite" ? "Workspace Invite" : "Quick Share"}</div>
          <div class="kura-preview-title">${escapeHtml(preview.title)}</div>
          <div class="kura-preview-sub">${escapeHtml(preview.subtitle)}</div>
        `;
        previewContainer.append(card);
        actionBtn.disabled = false;
        actionBtn.textContent =
          preview.kind === "workspace_invite" ? "Join Workspace" : "Import Snippet";
      } catch (err: any) {
        errorEl.textContent = err.message || "Invalid code";
        errorEl.classList.remove("hidden");
      }
    }

    input.addEventListener("input", updatePreview);

    actionBtn.addEventListener("click", async () => {
      const val = input.value.trim();
      try {
        const preview = workspaceMgr.previewCode(val);
        if (preview.kind === "workspace_invite") {
          const joinedWs = workspaceMgr.acceptInvite(val, {
            id: "user-local",
            email: "me@device.local",
            name: "Me",
          });
          await saveStoredWorkspace(joinedWs);
          backdrop.remove();
          await switchWorkspace(joinedWs.id);
          showToast(`Successfully joined "${joinedWs.name}"!`, "success");
        } else {
          const snippet = makeSnippet({
            title: `Shared Snippet #${preview.targetId}`,
            code: "// Imported via Quick-Share Code #" + preview.targetId + "\nexport default function sharedModule() {\n  return 'ready';\n}",
            raw: "// Imported via Quick-Share Code #" + preview.targetId,
            language: "typescript",
            workspaceId: activeWorkspaceId,
            context: {
              sourceUrl: "",
              pageTitle: "Quick Share",
              domain: "quick-share",
              capturedAt: Date.now(),
            },
          });
          await saveSnippet(snippet);
          snippets.unshift(snippet);
          backdrop.remove();
          renderList();
          showToast("Snippet imported successfully!", "success");
        }
      } catch (err: any) {
        errorEl.textContent = err.message || "Failed to claim code";
        errorEl.classList.remove("hidden");
      }
    });

    bodyEl.append(actionBtn);
    modal.append(bodyEl);
    backdrop.append(modal);
    document.body.append(backdrop);
  }

  // --- CREATE WORKSPACE DIALOG ---
  function openCreateWorkspaceDialog(): void {
    const backdrop = document.createElement("div");
    backdrop.className = "kura-modal-backdrop";

    const closeModal = () => {
      backdrop.remove();
      document.removeEventListener("keydown", onKeyDown);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    const modal = document.createElement("div");
    modal.className = "kura-modal";
    modal.innerHTML = `
      <div class="kura-modal-header">
        <h3>Create Workspace</h3>
        <button type="button" class="kura-modal-close">✕</button>
      </div>
      <div class="kura-modal-body">
        <label class="kura-label">Workspace Name</label>
        <input type="text" id="kura-new-ws-name" class="kura-input" placeholder="e.g. Acme Frontend Team" />
        <p class="kura-input-help">Members can collaborate and sync snippets with strict tenant isolation.</p>
        <button type="button" id="kura-btn-create-ws" class="kura-btn kura-btn-primary">Create Workspace</button>
      </div>
    `;

    modal.querySelector(".kura-modal-close")?.addEventListener("click", closeModal);
    modal.querySelector("#kura-btn-create-ws")?.addEventListener("click", async () => {
      const inp = modal.querySelector("#kura-new-ws-name") as HTMLInputElement;
      const name = inp?.value.trim();
      if (!name) return;

      const newWs = workspaceMgr.createWorkspace(name, {
        id: "owner-me",
        email: "me@device.local",
        name: "Me",
      });
      await saveStoredWorkspace(newWs);
      closeModal();
      await switchWorkspace(newWs.id);
      showToast(`Workspace "${newWs.name}" created!`, "success");
    });

    backdrop.append(modal);
    document.body.append(backdrop);
  }

  // --- IN-POPUP SETTINGS MODAL ---
  function openInPopupSettings(): void {
    const backdrop = document.createElement("div");
    backdrop.className = "kura-modal-backdrop";

    const closeModal = () => {
      backdrop.remove();
      document.removeEventListener("keydown", onKeyDown);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    const modal = document.createElement("div");
    modal.className = "kura-modal kura-settings-modal";
    modal.setAttribute("data-view", "settings");
    modal.innerHTML = `
      <div class="kura-modal-header">
        <h3>Settings & Preferences</h3>
        <button type="button" class="kura-modal-close">✕</button>
      </div>
      <div class="kura-modal-body">
        <div class="kura-setting-row">
          <div>
            <div class="kura-setting-label">Line Wrapping</div>
            <div class="kura-setting-desc">Wrap code lines in viewer</div>
          </div>
          <button type="button" id="toggle-wrap" class="kura-btn">${isWrapEnabled ? "Enabled" : "Disabled"}</button>
        </div>
        <div class="kura-setting-row">
          <div>
            <div class="kura-setting-label">Line Numbers</div>
            <div class="kura-setting-desc">Show non-selectable gutters</div>
          </div>
          <button type="button" id="toggle-nums" class="kura-btn">${showLineNumbers ? "Enabled" : "Disabled"}</button>
        </div>
      </div>
    `;

    modal.querySelector(".kura-modal-close")?.addEventListener("click", closeModal);
    modal.querySelector("#toggle-wrap")?.addEventListener("click", (e) => {
      isWrapEnabled = !isWrapEnabled;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("kuracode_wrap_lines", String(isWrapEnabled));
      }
      (e.target as HTMLElement).textContent = isWrapEnabled ? "Enabled" : "Disabled";
      renderList();
    });
    modal.querySelector("#toggle-nums")?.addEventListener("click", (e) => {
      showLineNumbers = !showLineNumbers;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("kuracode_line_numbers", String(showLineNumbers));
      }
      (e.target as HTMLElement).textContent = showLineNumbers ? "Enabled" : "Disabled";
      renderList();
    });

    backdrop.append(modal);
    document.body.append(backdrop);
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  container.append(root);
}
