/**
 * Shared library UI renderer for the popup and side panel.
 * Implements the local-searchable snippet library: full-text search
 * (FIND-1), filters by language (FIND-2), copy (FIND-4), delete, and
 * quick-save from the clipboard (CAP-4). The empty state follows the
 * design spec (4.2).
 */
import { cleanCode } from './cleaner';
import {
  deleteSnippet,
  listSnippets,
  makeSnippet,
  saveSnippet,
} from './storage';
import type { Snippet } from './types';

export interface LibraryOptions {
  /** Extra short title shown in the toolbar (e.g. "KuraCode"). */
  title?: string;
  /** Whether to show the "paste from clipboard" quick-save button. */
  clipboardSave?: boolean;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function autoTitle(code: string): string {
  const first = code.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
  return (first ?? 'Untitled snippet').slice(0, 48) || 'Untitled snippet';
}

export async function renderLibrary(
  container: HTMLElement,
  opts: LibraryOptions = {},
): Promise<void> {
  let snippets = await listSnippets();
  const languages = Array.from(new Set(snippets.map((s) => s.language))).sort();
  let query = '';
  let langFilter = 'all';

  container.replaceChildren();

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  if (opts.title) {
    const brand = document.createElement('div');
    brand.className = 'brand';
    brand.textContent = opts.title;
    toolbar.append(brand);
  }

  const search = document.createElement('input');
  search.className = 'search';
  search.placeholder = 'Search snippets… (code, tags, source)';
  search.type = 'search';
  search.addEventListener('input', () => {
    query = search.value.trim().toLowerCase();
    render();
  });
  toolbar.append(search);

  const count = document.createElement('span');
  count.className = 'count';
  toolbar.append(count);

  const filterWrap = document.createElement('label');
  filterWrap.className = 'filter-wrap';
  const filter = document.createElement('select');
  filter.className = 'filter';
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All languages';
  filter.append(allOpt);
  for (const lang of languages) {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang;
    filter.append(opt);
  }
  filter.addEventListener('change', () => {
    langFilter = filter.value;
    render();
  });
  filterWrap.append(filter);
  toolbar.append(filterWrap);

  if (opts.clipboardSave) {
    const pasteBtn = document.createElement('button');
    pasteBtn.className = 'ghost-btn';
    pasteBtn.textContent = 'Paste from clipboard';
    pasteBtn.type = 'button';
    pasteBtn.addEventListener('click', async () => {
      const text = (await navigator.clipboard.readText().catch(() => '')) ?? '';
      if (!text.trim()) return;
      const cleaned = cleanCode(text);
      const newSnip = makeSnippet({
          title: autoTitle(cleaned),
          code: cleaned,
          raw: text,
          language: 'text',
          context: {
            sourceUrl: '',
            pageTitle: 'Clipboard',
            domain: 'clipboard',
            capturedAt: Date.now(),
          },
        });
      await saveSnippet(newSnip);
      snippets = await listSnippets();
      render();
    });
    toolbar.append(pasteBtn);
  }

  container.append(toolbar);

  const list = document.createElement('div');
  list.className = 'list';
  container.append(list);

  function matches(s: Snippet): boolean {
    if (langFilter !== 'all' && s.language !== langFilter) return false;
    if (!query) return true;
    const haystack = [
      s.title,
      s.code,
      s.note ?? '',
      s.tags.join(' '),
      s.context.sourceUrl,
      s.context.pageTitle,
      s.language,
    ]
      .join('\n')
      .toLowerCase();
    return haystack.includes(query);
  }

  function render(): void {
    list.replaceChildren();
    const visible = snippets.filter(matches);
    count.textContent = `${visible.length} snippet${visible.length === 1 ? '' : 's'}`;

    if (visible.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML = `
        <div class="empty-icon" aria-hidden="true">◧</div>
        <p class="empty-title">No snippets yet.</p>
        <p class="empty-sub">${
          query
            ? 'Nothing matches your search.'
            : 'Highlight any code and press ⌘⇧S (Ctrl+Shift+S) to capture your first snippet.'
        }</p>`;
      list.append(empty);
      return;
    }

    for (const s of visible) {
      const card = document.createElement('article');
      card.className = 'card';

      const top = document.createElement('div');
      top.className = 'card-top';
      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = s.title || 'Untitled';
      top.append(title);

      const lang = document.createElement('span');
      lang.className = 'pill';
      lang.textContent = s.language;
      top.append(lang);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'icon-btn';
      copyBtn.title = 'Copy code';
      copyBtn.textContent = '⧉';
      copyBtn.type = 'button';
      copyBtn.addEventListener('click', () => {
        void writeClipboard(s.code);
        copyBtn.classList.add('done');
        window.setTimeout(() => copyBtn.classList.remove('done'), 1200);
      });
      actions.append(copyBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn danger';
      delBtn.title = 'Delete';
      delBtn.textContent = '✕';
      delBtn.type = 'button';
      delBtn.addEventListener('click', async () => {
        await deleteSnippet(s.id);
        snippets = snippets.filter((item) => item.id !== s.id);
        render();
      });
      actions.append(delBtn);

      top.append(actions);
      card.append(top);

      if (s.tags.length) {
        const tags = document.createElement('div');
        tags.className = 'tags';
        for (const t of s.tags) {
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = `#${t}`;
          tags.append(tag);
        }
        card.append(tags);
      }

      const meta = document.createElement('div');
      meta.className = 'meta';
      const domain = s.context.domain || 'local';
      const source = s.context.sourceUrl ? s.context.sourceUrl : domain;
      meta.innerHTML = `<span class="domain">${escapeHtml(domain)}</span><span>·</span><span>${timeAgo(s.updatedAt)}</span>`;
      meta.title = source;
      card.append(meta);

      const pre = document.createElement('pre');
      pre.className = 'code';
      pre.textContent = s.code.split('\n').slice(0, 6).join('\n');
      card.append(pre);

      list.append(card);
    }
  }

  render();
}
