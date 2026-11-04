/**
 * Browser-agnostic scenario driver (Release Guide section 4.2).
 *
 * A ScenarioDriver hides the browser-specific mechanics (launching the
 * extension, talking to chrome.storage, loading fixture pages) behind one
 * small interface. Chromium today; Firefox later uses the same interface so
 * the scenario library in ./steps.ts runs identically everywhere.
 */
import type { BrowserContext, Page } from "@playwright/test";

export const STORAGE_KEY = "kuracode.snippets.v1";

export interface SnippetShape {
  id: string;
  title: string;
  language: string;
  code: string;
  raw: string;
  tags: string[];
  context: {
    sourceUrl: string;
    pageTitle: string;
    domain: string;
    capturedAt: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ScenarioDriver {
  /** Open a fixture page served by the static server on :8931. */
  openPage(name: string): Promise<Page>;
  /** All snippets currently stored by the extension. */
  readSnippets(): Promise<SnippetShape[]>;
  /** Clear the snippet store (fresh state per scenario). */
  resetStorage(): Promise<void>;
  /** Seed snippets directly into storage (bypasses capture). */
  seedSnippets(snippets: SnippetShape[]): Promise<void>;
  /** Drive the background bridge (hotkey / context-menu path). */
  captureSelection(): Promise<void>;
  /** Open the extension's popup page. */
  popup(): Promise<Page>;
  /** The extension id (from the service worker URL). */
  extensionId(): Promise<string>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function getServiceWorker(context: BrowserContext): Promise<Worker> {
  for (let i = 0; i < 40; i += 1) {
    const [sw] = context.serviceWorkers();
    if (sw) return sw;
    await sleep(150);
  }
  throw new Error("extension service worker not available");
}

export function createDriver(context: BrowserContext): ScenarioDriver {
  async function sw<T, A extends unknown[]>(
    fn: (...args: A) => Promise<T> | T,
    ...args: A
  ): Promise<T> {
    const serviceWorker = await getServiceWorker(context);
    return serviceWorker.evaluate(fn, ...args);
  }

  return {
    async extensionId() {
      const serviceWorker = await getServiceWorker(context);
      return new URL(serviceWorker.url()).host;
    },

    async openPage(name) {
      const page = await context.newPage();
      await page.goto(`http://localhost:8931/${name}`);
      return page;
    },

    async readSnippets() {
      return sw(async () => {
        const data = (await chrome.storage.local.get(
          "kuracode.snippets.v1",
        )) as Record<string, unknown>;
        return ((data["kuracode.snippets.v1"] as SnippetShape[]) ??
          []) as SnippetShape[];
      });
    },

    async resetStorage() {
      await sw(async () => {
        await chrome.storage.local.remove("kuracode.snippets.v1");
      });
    },

    async seedSnippets(snippets) {
      await sw((list: SnippetShape[]) => {
        chrome.storage.local.set({ "kuracode.snippets.v1": list });
      }, snippets);
    },

    async captureSelection() {
      await sw(async () => {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tab?.id) throw new Error("no active tab");
        await chrome.tabs.sendMessage(tab.id, {
          kind: "kuracode:capture-selection",
        });
      });
    },

    async popup() {
      const page = await context.newPage();
      await page.goto(
        `chrome-extension://${await this.extensionId()}/popup.html`,
      );
      return page;
    },
  };
}
