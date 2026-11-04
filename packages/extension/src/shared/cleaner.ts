/**
 * Cleaning engine — implements CLEAN-1..CLEAN-5.
 * Smart cleanup of copied web code: strip line numbers/gutter text, strip
 * terminal prompts (with an option to keep them), preserve indentation, and
 * auto-detect the language from page hints.
 */

export interface CleanOptions {
  /** Keep terminal prompts like `$`, `>`, `PS C:\>` (default false). */
  keepPrompts?: boolean;
}

const PROMPT_RE = /^\s*(?:\$|>|#|%)\s+/;
const PS_PROMPT_RE = /^\s*PS\s+[A-Za-z]:[^\n]*>\s*/;

function detectGutter(lines: string[]): boolean {
  // If a majority of non-empty lines start with a gutter pattern
  // (digits followed by whitespace / colon / pipe), assume line numbers.
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length < 2) return false;
  const gutter = nonEmpty.filter((l) => /^\s*\d+\s*[.:|]?\s*(\S)/.test(l));
  return gutter.length / nonEmpty.length >= 0.6;
}

/** Strip leading line numbers / gutter text (CLEAN-1). */
export function stripLineNumbers(code: string): string {
  const lines = code.split("\n");
  if (!detectGutter(lines)) return code;
  return lines
    .map((line) => line.replace(/^\s*\d+\s*[.:|]?\s*/, "").replace(/\s+$/, ""))
    .join("\n");
}

/** Remove terminal prompts, preserving everything else (CLEAN-2). */
export function stripPrompts(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      let out = line.replace(PS_PROMPT_RE, "");
      out = out.replace(PROMPT_RE, "");
      return out;
    })
    .join("\n");
}

/**
 * Clean captured code. Preserves indentation and tabs/spaces (CLEAN-3).
 */
export function cleanCode(raw: string, options: CleanOptions = {}): string {
  let code = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  code = stripLineNumbers(code);
  if (!options.keepPrompts) {
    code = stripPrompts(code);
  }
  // Collapse trailing blank lines but keep leading/structure otherwise.
  code = code
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[\t ]+$/gm, "")
    .trimEnd();
  return code;
}

const LANGUAGE_HINTS: [RegExp, string][] = [
  [/\btypescript\b/i, "typescript"],
  [/\bjavascript\b/i, "javascript"],
  [/\bjs\b/i, "javascript"],
  [/\bpython\b/i, "python"],
  [/\bpy\b/i, "python"],
  [/\bbash\b/i, "bash"],
  [/\bshell\b/i, "bash"],
  [/\bsh\b/i, "bash"],
  [/\bjson\b/i, "json"],
  [/\bcss\b/i, "css"],
  [/\bhtml\b/i, "html"],
  [/\bxml\b/i, "xml"],
  [/\bjava\b/i, "java"],
  [/\bcsharp\b/i, "csharp"],
  [/\bc#\b/i, "csharp"],
  [/\bcpp\b/i, "cpp"],
  [/\bc\+\+\b/i, "cpp"],
  [/\bgo\b/i, "go"],
  [/\brust\b/i, "rust"],
  [/\bphp\b/i, "php"],
  [/\bsql\b/i, "sql"],
  [/\bmarkdown\b/i, "markdown"],
  [/\bdockerfile\b/i, "dockerfile"],
];

/** Auto-detect language from element class/content hints (CLEAN-4). */
export function detectLanguage(
  element: Element | null,
  text = "",
  fallback = "text",
): string {
  const source = [
    element?.getAttribute("class") ?? "",
    element?.getAttribute("data-lang") ?? "",
    element?.getAttribute("data-language") ?? "",
    element?.getAttribute("lang") ?? "",
    text,
  ].join(" ");

  for (const [re, lang] of LANGUAGE_HINTS) {
    if (re.test(source)) return lang;
  }
  return fallback;
}

/** Find the nearest preceding heading on the page (used for CTX-2). */
export function nearestHeading(el: Element | null): string | undefined {
  if (!el) return undefined;
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  let best: Element | null = null;
  for (const h of headings) {
    try {
      // True when `el` follows `h` in document order, i.e. `h` comes before it.
      if (el.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) {
        if (best === null || headings.indexOf(h) > headings.indexOf(best)) {
          best = h;
        }
      }
    } catch {
      // ignore
    }
  }
  return best?.textContent?.trim().slice(0, 200) || undefined;
}
