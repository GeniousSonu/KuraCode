/**
 * Core domain types shared across the extension surfaces.
 * Mirrors the PRD data model (snippet = code + metadata/provenance/history).
 */

export type SnippetStatus = 'draft' | 'approved' | 'deprecated';

export interface SnippetContext {
  /** Provenance (CTX-1): where the code came from. */
  sourceUrl: string;
  pageTitle: string;
  domain: string;
  capturedAt: number;
  /** Nearest preceding heading on the page (CTX-2). */
  heading?: string;
  surroundingText?: string;
  /** License hint detected from the page (LIC-2). */
  licenseHint?: string;
}

export interface Snippet {
  id: string;
  workspaceId: string | null; // null = Personal Space
  title: string;
  language: string;
  /** Cleaned code (ready to run/copy). */
  code: string;
  /** Original raw text, always retained (CTX-4). */
  raw: string;
  note?: string;
  tags: string[];
  collection?: string;
  favorite: boolean;
  pinned?: boolean;
  context: SnippetContext;
  status: SnippetStatus;
  createdAt: number;
  updatedAt: number;
}

export interface CaptureCommand {
  /** Where the capture came from (inline button, hotkey, context menu, clipboard). */
  origin: 'inline' | 'hotkey' | 'contextmenu' | 'clipboard';
  /** Raw text to capture. */
  text: string;
  /** Detected language hint (may be empty). */
  language?: string;
}
