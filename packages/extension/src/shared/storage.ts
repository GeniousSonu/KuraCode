/**
 * Local storage layer (PRIV-1/PRIV-2, WS-1..WS-3):
 * Local-first by default, uses chrome.storage.local via namespaced keys.
 * Supports workspace partitioning (null = Personal Space) and active workspace persistence.
 */
import type { Snippet } from './types';
import type { Workspace } from './workspaces';

const KEY = 'kuracode.snippets.v1';
const ACTIVE_WS_KEY = 'kuracode.active_workspace.v1';
const WORKSPACES_KEY = 'kuracode.workspaces.v1';
const MAX_SNIPPETS = 50_000;

export async function listStoredWorkspaces(): Promise<Workspace[]> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return [];
  const data = (await chrome.storage.local.get(WORKSPACES_KEY)) as Record<string, unknown>;
  const raw = data[WORKSPACES_KEY] as Workspace[] | undefined;
  if (!Array.isArray(raw)) return [];
  return raw;
}

export async function saveStoredWorkspace(workspace: Workspace): Promise<void> {
  const all = await listStoredWorkspaces();
  const idx = all.findIndex((w) => w.id === workspace.id);
  if (idx >= 0) {
    all[idx] = workspace;
  } else {
    all.push(workspace);
  }
  await chrome.storage.local.set({ [WORKSPACES_KEY]: all });
}

export async function getActiveWorkspace(): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;
  const data = (await chrome.storage.local.get(ACTIVE_WS_KEY)) as Record<string, unknown>;
  const val = data[ACTIVE_WS_KEY];
  return typeof val === 'string' ? val : null;
}

export async function setActiveWorkspace(id: string | null): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  await chrome.storage.local.set({ [ACTIVE_WS_KEY]: id });
}

export async function listAllSnippets(): Promise<Snippet[]> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return [];
  const data = (await chrome.storage.local.get(KEY)) as Record<string, unknown>;
  const raw = data[KEY] as Snippet[] | undefined;
  if (!Array.isArray(raw)) return [];
  return [...raw].sort((a, b) => {
    // Pinned snippets first, then recent
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return b.updatedAt - a.updatedAt;
  });
}

export async function listSnippets(workspaceId?: string | null): Promise<Snippet[]> {
  const all = await listAllSnippets();
  if (workspaceId === undefined) {
    return all;
  }
  const targetId = workspaceId ?? null;
  return all.filter((s) => (s.workspaceId ?? null) === targetId);
}

export async function getSnippet(id: string): Promise<Snippet | undefined> {
  const all = await listAllSnippets();
  return all.find((s) => s.id === id);
}

export async function saveSnippet(snippet: Snippet): Promise<void> {
  const all = await listAllSnippets();
  const idx = all.findIndex((s) => s.id === snippet.id);
  const normalized: Snippet = {
    ...snippet,
    workspaceId: snippet.workspaceId ?? null,
  };

  if (idx >= 0) {
    all[idx] = normalized;
  } else {
    all.unshift(normalized);
    if (all.length > MAX_SNIPPETS) all.length = MAX_SNIPPETS;
  }
  await chrome.storage.local.set({ [KEY]: all });
}

export async function deleteSnippet(id: string): Promise<void> {
  const all = await listAllSnippets();
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
  workspaceId?: string | null;
  tags?: string[];
  pinned?: boolean;
}): Snippet {
  const now = Date.now();
  return {
    id: newId(),
    workspaceId: partial.workspaceId ?? null,
    title: partial.title || 'Untitled snippet',
    code: partial.code,
    raw: partial.raw,
    language: partial.language || 'text',
    note: undefined,
    tags: partial.tags ?? [],
    collection: undefined,
    favorite: false,
    pinned: partial.pinned ?? false,
    context: partial.context,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}
