/**
 * Clipboard Hub Manager (CLIP-1..CLIP-7)
 * Ephemeral multi-device clipboard with explicit opt-in,
 * secret scanner filtering, auto-retention pruning, and pin protection.
 */

import { scanForSecrets } from "./secret-scanner";
import type { Snippet } from "./types";
import { makeSnippet } from "./storage";

export interface ClipboardItem {
  id: string;
  text: string;
  capturedAt: number;
  expiresAt: number;
  pinned: boolean;
  sourceDomain?: string;
  sourceUrl?: string;
  hasSecret: boolean;
  secretTypes?: string[];
  charCount: number;
}

export interface ClipboardPreferences {
  syncEnabled: boolean;
  retentionHours: number; // default: 720 (30 days)
  autoCapturePageCopy: boolean;
  allowedSites: string[];
  blockedSites: string[];
}

export const DEFAULT_CLIPBOARD_PREFS: ClipboardPreferences = {
  syncEnabled: false, // strictly off by default (CLIP-2)
  retentionHours: 24 * 30, // 30 days default
  autoCapturePageCopy: false,
  allowedSites: [],
  blockedSites: [],
};

export class ClipboardHubManager {
  private items: ClipboardItem[] = [];
  private prefs: ClipboardPreferences;

  constructor(prefs: ClipboardPreferences = DEFAULT_CLIPBOARD_PREFS) {
    this.prefs = { ...prefs };
  }

  getPreferences(): ClipboardPreferences {
    return { ...this.prefs };
  }

  setPreferences(updated: Partial<ClipboardPreferences>): void {
    this.prefs = { ...this.prefs, ...updated };
  }

  /**
   * Adds an item to the Clipboard Hub.
   * Performs secret scanning and enforces retention limits.
   */
  addItem(text: string, context?: { domain?: string; sourceUrl?: string }): ClipboardItem {
    const now = Date.now();
    const secrets = scanForSecrets(text);
    const ttlMs = this.prefs.retentionHours * 3600 * 1000;

    const item: ClipboardItem = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text,
      capturedAt: now,
      expiresAt: now + ttlMs,
      pinned: false,
      sourceDomain: context?.domain,
      sourceUrl: context?.sourceUrl,
      hasSecret: secrets.length > 0,
      secretTypes: secrets.map((s) => s.type),
      charCount: text.length,
    };

    // Newest first
    this.items.unshift(item);
    this.pruneExpired();
    return item;
  }

  /**
   * Prunes items older than expiresAt unless pinned.
   */
  pruneExpired(currentTime: number = Date.now()): number {
    const beforeCount = this.items.length;
    this.items = this.items.filter((item) => item.pinned || item.expiresAt > currentTime);
    return beforeCount - this.items.length;
  }

  togglePin(itemId: string): boolean {
    const item = this.items.find((i) => i.id === itemId);
    if (item) {
      item.pinned = !item.pinned;
      return item.pinned;
    }
    return false;
  }

  deleteItem(itemId: string): void {
    this.items = this.items.filter((i) => i.id !== itemId);
  }

  clearAll(): void {
    // Retain pinned items
    this.items = this.items.filter((i) => i.pinned);
  }

  listItems(): ClipboardItem[] {
    this.pruneExpired();
    return [...this.items];
  }

  /**
   * Converts a Clipboard Item into a permanent KuraCode Snippet.
   */
  convertToSnippet(itemId: string, language: string = "text"): Snippet | null {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return null;

    const snippet = makeSnippet({
      title: item.text.slice(0, 40).replace(/\n/g, " "),
      code: item.text,
      raw: item.text,
      language,
      context: {
        sourceUrl: item.sourceUrl || "",
        pageTitle: item.sourceDomain || "Clipboard Hub",
        domain: item.sourceDomain || "clipboard",
        capturedAt: item.capturedAt,
      },
    });

    return snippet;
  }
}
