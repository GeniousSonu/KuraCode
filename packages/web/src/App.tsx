import { useMemo, useState } from 'react';

interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  domain: string;
  updatedAt: string;
}

const SAMPLE_SNIPPETS: Snippet[] = [
  {
    id: '1',
    title: 'Retry an async function with backoff',
    language: 'typescript',
    code: `async function withRetry<T>(\n  fn: () => Promise<T>,\n  { retries = 3, delay = 200 } = {},\n): Promise<T> {\n  for (let i = 0; i < retries; i++) {\n    try { return await fn(); } catch (e) {\n      if (i === retries - 1) throw e;\n      await new Promise((r) => setTimeout(r, delay * 2 ** i));\n    }\n  }\n  throw new Error('unreachable');\n}`,
    tags: ['async', 'retry', 'utility'],
    domain: 'stackoverflow.com',
    updatedAt: '2h ago',
  },
  {
    id: '2',
    title: 'Debounce function (no deps)',
    language: 'javascript',
    code: `function debounce(fn, wait = 200) {\n  let t;\n  return (...args) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), wait);\n  };\n}`,
    tags: ['debounce', 'utility'],
    domain: 'github.com',
    updatedAt: '1d ago',
  },
];

function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        ◧
      </div>
      <p className="empty-title">No snippets yet.</p>
      <p className="empty-sub">
        Highlight any code and press ⌘⇧S to capture your first snippet in the
        KuraCode extension.
      </p>
      <button className="ghost-btn" type="button">
        Read the Guide
      </button>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('all');

  const languages = useMemo(() => {
    return Array.from(new Set(SAMPLE_SNIPPETS.map((s) => s.language))).sort();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_SNIPPETS.filter((s) => {
      if (language !== 'all' && s.language !== language) return false;
      if (!q) return true;
      return [s.title, s.code, s.tags.join(' '), s.domain]
        .join('\n')
        .toLowerCase()
        .includes(q);
    });
  }, [query, language]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">KuraCode</div>
        <button className="primary-btn" type="button">
          + New snippet
        </button>
      </header>

      <main className="content">
        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder="Search snippets… (code, tags, source)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="filter-row">
            <button
              className={`pill ${language === 'all' ? 'pill-active' : ''}`}
              type="button"
              onClick={() => setLanguage('all')}
            >
              All
            </button>
            {languages.map((lang) => (
              <button
                key={lang}
                className={`pill ${language === lang ? 'pill-active' : ''}`}
                type="button"
                onClick={() => setLanguage(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid">
            {visible.map((s) => (
              <article key={s.id} className="card">
                <div className="card-top">
                  <h3 className="card-title">{s.title}</h3>
                  <span className="pill">{s.language}</span>
                </div>
                <div className="tags">
                  {s.tags.map((t) => (
                    <span key={t} className="tag">
                      #{t}
                    </span>
                  ))}
                </div>
                <pre className="code">{s.code}</pre>
                <div className="meta">
                  <span className="domain">{s.domain}</span>
                  <span>·</span>
                  <span>{s.updatedAt}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
