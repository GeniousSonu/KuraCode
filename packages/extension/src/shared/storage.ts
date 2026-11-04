/**
 * Local storage layer (PRIV-1/PRIV-2): local-first by default, uses
 * chrome.storage.local via a single namespaced key. Nothing leaves the device
 * until the user explicitly syncs/shares. Contains the implementations of
 * PRIV-1, PRIV-2, and the local portion of ORG-1/ORG-2.
 */
import type { Snippet } from './types';

const KEY = 'kuracode.snippets.v1';
const MAX_SNIPPETS = 50_000;

export async function listSnippets(): Promise<Snippet[]> {
  const data = (await chrome.storage.local.get(KEY)) as Record<string, unknown>;
  const raw = data[KEY] as Snippet[] | undefined;
  if (!Array.isArray(raw)) return [];
  return [...raw].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getSnippet(id: string): Promise<Snippet | undefined> {
  const all = await listSnippets();
  return all.find((s) => s.id === id);
}

export async function saveSnippet(snippet: Snippet): Promise<void> {
  const all = await listSnippets();
  const idx = all.findIndex((s) => s.id === snippet.id);
  if (idx >= 0) {
    all[idx] = snippet;
  } else {
    all.unshift(snippet);
    if (all.length > MAX_SNIPPETS) all.length = MAX_SNIPPETS;
  }
  await chrome.storage.local.set({ [KEY]: all });
}

export async function deleteSnippet(id: string): Promise<void> {
  const all = await listSnippets();
  await chrome.storage.local.set({ [KEY]: all.filter((s) => s.id !== id) });
}

export async function updateSnippet(
  id: string,
  patch: Partial<Snippet>,
): Promise<Snippet | undefined> {
  const cur = await getSnippet(id);
  if (!cur) return undefined;
  const next: Snippet = { ...cur, ...patch, updatedAt: Date.now() };
  await saveSnippet(next);
  return next;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `snip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeSnippet(partial: {
  title: string;
  code: string;
  raw: string;
  language: string;
  context: Snippet['context'];
  tags?: string[];
}): Snippet {
  const now = Date.now();
  return {
    id: newId(),
    title: partial.title || 'Untitled snippet',
    code: partial.code,
    raw: partial.raw,
    language: partial.language || 'text',
    note: undefined,
    tags: partial.tags ?? [],
    collection: undefined,
    favorite: false,
    context: partial.context,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}
