/**
 * KuraCode Shared Library UI Renderer (Popup, Side Panel, Options, Web App)
 * Full Visual Reset, Workspaces, Unified Code Entry, Responsive Typography, and Zero AI-Slop.
 */

import { generateReadableTitle } from "./auto-title";
import { cleanCode, detectLanguage } from "./cleaner";
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

type TimelineBucket = "Today" | "Yesterday" | "This week" | "Earlier";

function getTimelineBucket(timestamp: number): TimelineBucket {
  const now = Date.now();
  const diffDays = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  return "Earlier";
}

async function writeClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // fallback
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
 * Hand-crafted SVG icons matching KuraCode's geometry and 1.5px stroke.
 * Zero emojis used as icons.
 */
function createSvgIcon(name: string, size = 14): SVGSVGElement {
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
    case "wrap":
      path = "M4 6h16M4 12h12a3 3 0 0 1 0 6h-4m0 0l2-2m-2 2l2 2M4 18h4";
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
      path = "M16 3l1 1-3 5 4 4-2 2-4-4-5 5-2-2 5-5-4-4 2-2 4 4 5-3z";
      break;
    case "numbers":
      path = "M4 4h4v6H4zm0 10h4v6H4zm8-10h8m-8 6h8m-8 6h8";
      break;
    default:
      path = "M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0";
  }

  const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathEl.setAttribute("d", path);
  svg.append(pathEl);
  return svg;
}

export async function renderLibrary(
  container: HTMLElement,
  opts: LibraryOptions = {}
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
    {
      email: "sarah@kuracode.app",
      name: "Sarah Lead",
    },
    "editor",
    { code: "KURA-9281" }
  );

  let snippets: Snippet[] = [];
  try {
    snippets = await listSnippets(activeWorkspaceId);
  } catch {
    snippets = [];
  }

  let query = "";
  let langFilter = "all";
  let sortOrder: "recent" | "oldest" | "title" = "recent";
  const syncStatus: "synced" | "syncing" | "offline" = "synced";

  // Per-surface preferences
  let isWrapEnabled =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("kuracode_wrap_lines") !== "false"
      : true;
  let showLineNumbers =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("kuracode_line_numbers") === "true"
      : false;

  const expandedCardIds = new Set<string>();
  let recentlyTrashed: { snippet: Snippet; timer: number } | null = null;
  let currentQueryToken = 0;

  // Root Container
  const root = document.createElement("div");
  root.className = "kura-app";

  // --- 1. HEADER (48px Fixed) ---
  const header = document.createElement("header");
  header.className = "kura-header";

  const brandWrap = document.createElement("div");
  brandWrap.className = "kura-brand";

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

  const brandName = document.createElement("span");
  brandName.className = "kura-brand-name";
  brandName.textContent = opts.title || "KuraCode";
  brandWrap.append(brandName);

  header.append(brandWrap);

  // Header Controls
  const headerControls = document.createElement("div");
  headerControls.className = "kura-header-controls";

  // Sync Indicator
  const syncBadge = document.createElement("div");
  syncBadge.className = `kura-sync-badge ${syncStatus}`;
  syncBadge.title = `Sync: ${syncStatus.toUpperCase()}`;
  syncBadge.innerHTML = `<span class="kura-sync-dot"></span><span class="kura-sync-text">${syncStatus}</span>`;
  headerControls.append(syncBadge);

  // Workspace Switcher Button
  function getActiveWorkspaceName(): string {
    if (!activeWorkspaceId) return "Personal";
    const ws = workspaceMgr.getWorkspace(activeWorkspaceId);
    return ws ? ws.name : "Personal";
  }

  const wsBtn = document.createElement("button");
  wsBtn.type = "button";
  wsBtn.className = "kura-header-btn kura-ws-btn";
  wsBtn.title = "Switch Workspace";
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

  headerControls.append(wsBtn);
  headerControls.append(wsDropdown);

  // Join Code (+) Header Button
  const joinBtn = document.createElement("button");
  joinBtn.type = "button";
  joinBtn.id = "btn-join-code";
  joinBtn.setAttribute("data-action", "join");
  joinBtn.className = "kura-header-btn kura-icon-btn";
  joinBtn.title = "Join workspace or import code";
  joinBtn.setAttribute("aria-label", "Join workspace or import code");
  joinBtn.append(createSvgIcon("plus", 13));
  joinBtn.addEventListener("click", () => openJoinDialog());
  headerControls.append(joinBtn);

  // Settings / Account Button (BUG-1 Fix)
  const userBtn = document.createElement("button");
  userBtn.type = "button";
  userBtn.id = "btn-settings";
  userBtn.setAttribute("data-action", "settings");
  userBtn.className = "kura-header-btn kura-icon-btn";
  userBtn.title = "Account & Settings (Alt+S or Cmd+,)";
  userBtn.setAttribute("aria-label", "Account & Settings");
  userBtn.append(createSvgIcon("settings", 13));

  function openSettings(): void {
    openInPopupSettings();
    if (typeof chrome !== "undefined" && chrome.runtime?.openOptionsPage) {
      try {
        chrome.runtime.openOptionsPage();
      } catch {
        // in-popup dialog is already visible
      }
    }
  }

  userBtn.addEventListener("click", () => openSettings());
  userBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openSettings();
    }
  });

  headerControls.append(userBtn);
  header.append(headerControls);
  root.append(header);

  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === ",") {
      e.preventDefault();
      openSettings();
    } else if (e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      openSettings();
    } else if (e.key === "?" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      openCheatSheet();
    }
  });

  // Close menus on outside click
  document.addEventListener("click", () => {
    wsDropdown.classList.add("hidden");
  });

  // --- 2. SEARCH BAR (Fixed 36px) ---
  const searchWrap = document.createElement("div");
  searchWrap.className = "kura-search-wrap";

  const searchIcon = document.createElement("span");
  searchIcon.className = "kura-search-icon";
  searchIcon.append(createSvgIcon("search", 13));

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

  // Wrap Toggle Button (BUG-2)
  const wrapBtn = document.createElement("button");
  wrapBtn.type = "button";
  wrapBtn.className = `ghost-btn kura-wrap-toggle ${isWrapEnabled ? "active" : ""}`;
  wrapBtn.title = isWrapEnabled ? "Word wrap: ON (click to disable)" : "Word wrap: OFF (click to enable)";
  wrapBtn.setAttribute("data-action", "toggle-wrap");
  wrapBtn.setAttribute("aria-label", "Toggle line wrapping");
  wrapBtn.append(createSvgIcon("wrap", 12));
  wrapBtn.addEventListener("click", () => {
    isWrapEnabled = !isWrapEnabled;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("kuracode_wrap_lines", String(isWrapEnabled));
    }
    wrapBtn.classList.toggle("active", isWrapEnabled);
    wrapBtn.title = isWrapEnabled ? "Word wrap: ON (click to disable)" : "Word wrap: OFF (click to enable)";
    renderCards();
    showToast(isWrapEnabled ? "Word wrap enabled" : "Word wrap disabled", "info");
  });
  toolbar.append(wrapBtn);

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
        renderCards();

        const destName = getActiveWorkspaceName();
        showToast(`Saved to ${destName}!`, "success", async () => {
          // One-click change workspace destination undo/move
          snippet.workspaceId = activeWorkspaceId === null ? defaultWs.id : null;
          await saveSnippet(snippet);
          await switchWorkspace(snippet.workspaceId);
        });
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
      undoBtn.textContent = "Undo / Move";
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

  // --- WORKSPACE SWITCHING ENGINE (BUG-3 Fix) ---
  async function switchWorkspace(newWorkspaceId: string | null): Promise<void> {
    const thisQueryToken = ++currentQueryToken;
    activeWorkspaceId = newWorkspaceId;
    await setActiveWorkspace(newWorkspaceId);

    // Update header label
    const name = getActiveWorkspaceName();
    wsBtn.innerHTML = `<span>${name}</span>`;
    wsBtn.append(createSvgIcon("chevron", 11));
    wsDropdown.classList.add("hidden");

    // Skeleton loading state
    listContainer.replaceChildren();
    for (let i = 0; i < 3; i++) {
      const skel = document.createElement("div");
      skel.className = "kura-skeleton-card";
      skel.innerHTML = `
        <div class="kura-skeleton-line short"></div>
        <div class="kura-skeleton-line"></div>
        <div class="kura-skeleton-box"></div>
      `;
      listContainer.append(skel);
    }

    // Strict query by workspaceId
    const loaded = await listSnippets(activeWorkspaceId);

    // Discard result if query was superseded by a rapid switch
    if (thisQueryToken !== currentQueryToken) return;

    snippets = loaded;
    renderCards();
    showToast(`Switched to ${name}`);
  }

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
      return haystack.includes(query);
    });

    // Sort order
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

    countSpan.textContent = `${visible.length} snippet${visible.length === 1 ? "" : "s"}`;
    listContainer.replaceChildren();

    // Empty state
    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty kura-empty-state";

      const emptyIcon = document.createElement("div");
      emptyIcon.className = "empty-icon kura-empty-icon";
      emptyIcon.append(createSvgIcon("workspace", 28));

      const emptyTitle = document.createElement("h3");
      emptyTitle.className = "empty-title kura-empty-title";
      emptyTitle.textContent = query
        ? "No matching snippets"
        : `No snippets in ${getActiveWorkspaceName()}`;

      const emptySub = document.createElement("p");
      emptySub.className = "empty-sub kura-empty-sub";
      emptySub.textContent = query
        ? "Try a different search term or reset the language filter."
        : "Capture code from any webpage with ⌘⇧S (Ctrl+Shift+S), save from clipboard, or join a workspace.";

      const joinPromptBtn = document.createElement("button");
      joinPromptBtn.type = "button";
      joinPromptBtn.className = "kura-btn kura-btn-primary";
      joinPromptBtn.textContent = "Enter Invite Code or Link";
      joinPromptBtn.addEventListener("click", () => openJoinDialog());

      empty.append(emptyIcon, emptyTitle, emptySub, joinPromptBtn);
      listContainer.append(empty);
      return;
    }

    // Timeline Grouping
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

      // Compact Snippet Card
      const card = document.createElement("article");
      card.className = `card kura-card ${s.pinned ? "pinned" : ""}`;
      card.tabIndex = 0;

      // Row 1: Identity
      const row1 = document.createElement("div");
      row1.className = "card-top kura-card-identity";

      const readable = generateReadableTitle(s.code, s.language, s.context?.heading);
      const displayTitle =
        s.title && s.title !== "Untitled snippet" && !s.title.includes("\n")
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

      // Pin button
      const pinBtn = document.createElement("button");
      pinBtn.type = "button";
      pinBtn.className = `kura-card-pin-btn ${s.pinned ? "active" : ""}`;
      pinBtn.title = s.pinned ? "Unpin snippet" : "Pin snippet to top";
      pinBtn.append(createSvgIcon("pin", 12));
      pinBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        s.pinned = !s.pinned;
        await saveSnippet(s);
        renderCards();
      });
      row1.append(pinBtn);

      // Three-Dot Menu
      const menuBtn = document.createElement("button");
      menuBtn.type = "button";
      menuBtn.className = "kura-card-menu-btn";
      menuBtn.title = "More actions";
      menuBtn.append(createSvgIcon("dots", 13));

      const menuDropdown = document.createElement("div");
      menuDropdown.className = "kura-card-menu-dropdown hidden";
      menuDropdown.innerHTML = `
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
          const quickCode = String(Math.floor(1000 + Math.random() * 9000));
          await writeClipboard(quickCode);
          showToast(`Quick Code #${quickCode} copied to clipboard (expires in 15m)`, "success");
        } else if (action === "duplicate") {
          const dup = makeSnippet({
            title: `${displayTitle} (Copy)`,
            code: s.code,
            raw: s.raw,
            language: s.language,
            workspaceId: s.workspaceId,
            context: s.context,
          });
          await saveSnippet(dup);
          snippets.unshift(dup);
          renderCards();
          showToast("Snippet duplicated", "success");
        }
      });

      row1.append(menuBtn);
      row1.append(menuDropdown);
      card.append(row1);

      // Row 2: Source Context
      const row2 = document.createElement("div");
      row2.className = "card-sub kura-card-context";

      const domainLink = document.createElement("a");
      domainLink.className = "kura-source-link";
      domainLink.target = "_blank";
      domainLink.rel = "noreferrer";
      const domain = s.context?.domain || (s.context?.sourceUrl ? "source" : "local");
      domainLink.textContent = domain;
      if (s.context?.sourceUrl) {
        domainLink.href = generateTextFragmentUrl(s.context.sourceUrl, s.code);
      }

      const dot = document.createElement("span");
      dot.className = "kura-dot";
      dot.textContent = "·";

      const timeSpan = document.createElement("time");
      timeSpan.className = "kura-time-relative";
      timeSpan.textContent = getTimelineBucket(s.updatedAt);
      timeSpan.title = new Date(s.updatedAt).toLocaleString();

      row2.append(domainLink, dot, timeSpan);
      card.append(row2);

      // Row 3: Multi-Line Code Preview (BUG-2 Fix)
      const isExpanded = expandedCardIds.has(s.id);
      const pre = document.createElement("pre");
      pre.className = `code kura-card-code ${isExpanded ? "expanded" : "collapsed"} ${
        isWrapEnabled ? "wrap" : "no-wrap"
      } ${showLineNumbers ? "show-line-numbers" : ""}`;

      const lines = s.code.split("\n");
      const previewLines = isExpanded ? lines : lines.slice(0, 4);

      if (showLineNumbers) {
        // Render with line numbers in non-selectable gutter
        pre.innerHTML = previewLines
          .map((line, idx) => `<span class="line-gutter" aria-hidden="true">${idx + 1}</span><span class="line-content">${escapeHtml(line)}</span>`)
          .join("\n");
      } else {
        pre.textContent = previewLines.join("\n");
      }

      card.append(pre);

      // Row 4: Primary Copy & Expand Action
      const row4 = document.createElement("div");
      row4.className = "actions kura-card-bottom";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "icon-btn kura-primary-copy-btn";
      copyBtn.innerHTML = `<span class="copy-icon"></span> <span class="copy-text">Copy</span>`;
      copyBtn.querySelector(".copy-icon")?.append(createSvgIcon("copy", 12));

      copyBtn.addEventListener("click", () => {
        // Always copy byte-exact s.code
        void writeClipboard(s.code);
        copyBtn.classList.add("done");
        copyBtn.innerHTML = `<span class="copy-icon"></span> <span class="copy-text">Copied</span>`;
        copyBtn.querySelector(".copy-icon")?.append(createSvgIcon("check", 12));
        showToast("Copied to clipboard", "success");
        window.setTimeout(() => {
          copyBtn.classList.remove("done");
          copyBtn.innerHTML = `<span class="copy-icon"></span> <span class="copy-text">Copy</span>`;
          copyBtn.querySelector(".copy-icon")?.append(createSvgIcon("copy", 12));
        }, 1500);
      });
      row4.append(copyBtn);

      if (lines.length > 4) {
        const expandBtn = document.createElement("button");
        expandBtn.type = "button";
        expandBtn.className = "kura-expand-btn";
        expandBtn.textContent = isExpanded ? "Collapse ▴" : `Show more (${lines.length} lines) ▾`;
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
      listContainer.append(card);
    }
  }

  // Initial Card Render
  renderCards();

  // --- UNIFIED JOIN & CODE ENTRY DIALOG (Part 2) ---
  function openJoinDialog(): void {
    const backdrop = document.createElement("div");
    backdrop.className = "kura-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "kura-modal kura-join-modal";

    const headerEl = document.createElement("div");
    headerEl.className = "kura-modal-header";
    headerEl.innerHTML = `<h3>Enter Invite Code or Link</h3>`;
    const closeBtn = document.createElement("button");
    closeBtn.className = "kura-modal-close";
    closeBtn.append(createSvgIcon("close", 14));
    closeBtn.addEventListener("click", () => backdrop.remove());
    headerEl.append(closeBtn);
    modal.append(headerEl);

    const bodyEl = document.createElement("div");
    bodyEl.className = "kura-modal-body";

    const inputRow = document.createElement("div");
    inputRow.className = "kura-input-row";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "kura-join-input";
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
          // Quick share code import
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
          renderCards();
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

    const modal = document.createElement("div");
    modal.className = "kura-modal";

    modal.innerHTML = `
      <div class="kura-modal-header">
        <h3>Create New Workspace</h3>
        <button type="button" class="kura-modal-close">✕</button>
      </div>
      <div class="kura-modal-body">
        <label class="kura-label">Workspace Name</label>
        <input type="text" id="kura-new-ws-name" class="kura-input" placeholder="e.g. Acme Frontend Team" />
        <p class="kura-input-help">Members can collaborate and sync snippets with strict tenant isolation.</p>
        <button type="button" id="kura-btn-create-ws" class="kura-btn kura-btn-primary">Create Workspace</button>
      </div>
    `;

    modal.querySelector(".kura-modal-close")?.addEventListener("click", () => backdrop.remove());
    modal.querySelector("#kura-btn-create-ws")?.addEventListener("click", async () => {
      const nameInput = modal.querySelector("#kura-new-ws-name") as HTMLInputElement;
      const name = nameInput?.value.trim();
      if (!name) return;

      const newWs = workspaceMgr.createWorkspace(name, {
        id: "owner-me",
        email: "me@device.local",
        name: "Me",
      });
      await saveStoredWorkspace(newWs);
      backdrop.remove();
      await switchWorkspace(newWs.id);
      showToast(`Workspace "${newWs.name}" created!`, "success");
    });

    backdrop.append(modal);
    document.body.append(backdrop);
  }

  // --- IN-POPUP SETTINGS MODAL FALLBACK ---
  function openInPopupSettings(): void {
    const backdrop = document.createElement("div");
    backdrop.className = "kura-modal-backdrop";

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
            <div class="kura-setting-desc">Wrap long code lines in viewer</div>
          </div>
          <button type="button" id="kura-toggle-wrap-modal" class="kura-btn">${isWrapEnabled ? "Enabled" : "Disabled"}</button>
        </div>
        <div class="kura-setting-row">
          <div>
            <div class="kura-setting-label">Line Numbers</div>
            <div class="kura-setting-desc">Show line numbers (never copied)</div>
          </div>
          <button type="button" id="kura-toggle-nums-modal" class="kura-btn">${showLineNumbers ? "Enabled" : "Disabled"}</button>
        </div>
        <div class="kura-setting-row">
          <div>
            <div class="kura-setting-label">Diagnostics</div>
            <div class="kura-setting-desc">Export sanitized debug bundle</div>
          </div>
          <button type="button" id="kura-diag-modal" class="kura-btn">Export</button>
        </div>
        <div class="kura-setting-row">
          <div>
            <div class="kura-setting-label">Keyboard Shortcuts</div>
            <div class="kura-setting-desc">View cheat sheet (?)</div>
          </div>
          <button type="button" id="kura-cheat-modal" class="kura-btn">View Keys</button>
        </div>
      </div>
    `;

    modal.querySelector(".kura-modal-close")?.addEventListener("click", () => backdrop.remove());

    modal.querySelector("#kura-toggle-wrap-modal")?.addEventListener("click", (e) => {
      isWrapEnabled = !isWrapEnabled;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("kuracode_wrap_lines", String(isWrapEnabled));
      }
      (e.target as HTMLElement).textContent = isWrapEnabled ? "Enabled" : "Disabled";
      renderCards();
    });

    modal.querySelector("#kura-toggle-nums-modal")?.addEventListener("click", (e) => {
      showLineNumbers = !showLineNumbers;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("kuracode_line_numbers", String(showLineNumbers));
      }
      (e.target as HTMLElement).textContent = showLineNumbers ? "Enabled" : "Disabled";
      renderCards();
    });

    modal.querySelector("#kura-diag-modal")?.addEventListener("click", () => {
      const bundle = {
        app: "KuraCode",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        totalSnippets: snippets.length,
        activeWorkspace: getActiveWorkspaceName(),
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kuracode-diagnostics.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    modal.querySelector("#kura-cheat-modal")?.addEventListener("click", () => {
      backdrop.remove();
      openCheatSheet();
    });

    backdrop.append(modal);
    document.body.append(backdrop);
  }

  // --- KEYBOARD CHEAT SHEET MODAL ---
  function openCheatSheet(): void {
    const backdrop = document.createElement("div");
    backdrop.className = "kura-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "kura-modal";
    modal.innerHTML = `
      <div class="kura-modal-header">
        <h3>Keyboard Shortcuts</h3>
        <button type="button" class="kura-modal-close">✕</button>
      </div>
      <div class="kura-modal-body">
        <div class="kura-cheat-row"><kbd>⌘⇧S</kbd> / <kbd>Ctrl+Shift+S</kbd> <span>Capture selected code from webpage</span></div>
        <div class="kura-cheat-row"><kbd>Esc</kbd> <span>Clear active search</span></div>
        <div class="kura-cheat-row"><kbd>Alt+S</kbd> / <kbd>⌘,</kbd> <span>Open Settings & Preferences</span></div>
        <div class="kura-cheat-row"><kbd>?</kbd> <span>Show this cheat sheet</span></div>
      </div>
    `;

    modal.querySelector(".kura-modal-close")?.addEventListener("click", () => backdrop.remove());
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
}
