/**
 * KuraCode Options & Settings Page Controller
 */
import { listAllSnippets } from "../shared/storage";

interface KuraSettings {
  wrapLines: boolean;
  tabSize: number;
  lineNumbers: boolean;
  secretScan: boolean;
  stripUrls: boolean;
}

const SETTINGS_KEY = "kuracode.settings.v1";

const DEFAULT_SETTINGS: KuraSettings = {
  wrapLines: true,
  tabSize: 2,
  lineNumbers: false,
  secretScan: true,
  stripUrls: true,
};

async function getStoredSettings(): Promise<KuraSettings> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return DEFAULT_SETTINGS;
  }
  const data = (await chrome.storage.local.get(SETTINGS_KEY)) as Record<string, unknown>;
  const raw = data[SETTINGS_KEY] as Partial<KuraSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...raw };
}

async function saveStoredSettings(patch: Partial<KuraSettings>): Promise<void> {
  const cur = await getStoredSettings();
  const next = { ...cur, ...patch };
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  }
  showToast("Settings saved");
}

function showToast(msg: string): void {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2000);
}

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await getStoredSettings();

  const wrapCheck = document.getElementById("setting-wrap") as HTMLInputElement | null;
  const tabSelect = document.getElementById("setting-tab-size") as HTMLSelectElement | null;
  const lineNumbersCheck = document.getElementById("setting-line-numbers") as HTMLInputElement | null;
  const secretScanCheck = document.getElementById("setting-secret-scan") as HTMLInputElement | null;
  const stripUrlsCheck = document.getElementById("setting-strip-urls") as HTMLInputElement | null;

  if (wrapCheck) {
    wrapCheck.checked = settings.wrapLines;
    wrapCheck.addEventListener("change", () => saveStoredSettings({ wrapLines: wrapCheck.checked }));
  }

  if (tabSelect) {
    tabSelect.value = String(settings.tabSize);
    tabSelect.addEventListener("change", () => saveStoredSettings({ tabSize: Number(tabSelect.value) }));
  }

  if (lineNumbersCheck) {
    lineNumbersCheck.checked = settings.lineNumbers;
    lineNumbersCheck.addEventListener("change", () => saveStoredSettings({ lineNumbers: lineNumbersCheck.checked }));
  }

  if (secretScanCheck) {
    secretScanCheck.checked = settings.secretScan;
    secretScanCheck.addEventListener("change", () => saveStoredSettings({ secretScan: secretScanCheck.checked }));
  }

  if (stripUrlsCheck) {
    stripUrlsCheck.checked = settings.stripUrls;
    stripUrlsCheck.addEventListener("change", () => saveStoredSettings({ stripUrls: stripUrlsCheck.checked }));
  }

  // Export Diagnostics (sanitized, 0 code)
  document.getElementById("btn-export-diagnostics")?.addEventListener("click", async () => {
    const snippets = await listAllSnippets();
    const manifest = chrome.runtime?.getManifest ? chrome.runtime.getManifest() : { version: "0.1.0" };
    const bundle = {
      app: "KuraCode",
      version: manifest.version,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      totalSnippets: snippets.length,
      languages: Array.from(new Set(snippets.map((s) => s.language))),
      settings,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kuracode-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Diagnostic bundle downloaded");
  });

  // Report Problem
  document.getElementById("btn-report-issue")?.addEventListener("click", () => {
    const manifest = chrome.runtime?.getManifest ? chrome.runtime.getManifest() : { version: "0.1.0" };
    const issueBody = encodeURIComponent(
      `### Problem Description\n\n[Describe what happened]\n\n### Environment\n- KuraCode Version: ${manifest.version}\n- Browser: ${navigator.userAgent}\n`
    );
    window.open(`https://github.com/GeniousSonu/KuraCode/issues/new?title=Bug+Report&body=${issueBody}`, "_blank");
  });

  // Backup JSON
  document.getElementById("btn-export-data")?.addEventListener("click", async () => {
    const snippets = await listAllSnippets();
    const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kuracode-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${snippets.length} snippets`);
  });

  // Clear data
  document.getElementById("btn-clear-data")?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear all snippets and settings? This cannot be undone.")) {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await chrome.storage.local.clear();
      }
      showToast("All data cleared");
      window.setTimeout(() => location.reload(), 1000);
    }
  });
});

