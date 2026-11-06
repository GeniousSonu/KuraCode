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

/** Strip leading line numbers / gutter text while preserving code indentation (CLEAN-1). */
export function stripLineNumbers(code: string): string {
  const lines = code.split("\n");
  if (!detectGutter(lines)) return code;

  // Determine baseline post-number whitespace across all gutter lines
  const gutterLines = lines.filter((l) => /^\s*\d+\s*[.:|]?\s*(\S)/.test(l));
  let minPadding = Infinity;
  for (const gl of gutterLines) {
    const match = gl.match(/^\s*\d+[.:|]?([ \t]*)/);
    if (match) {
      minPadding = Math.min(minPadding, match[1].length);
    }
  }
  if (!isFinite(minPadding)) minPadding = 1;

  return lines
    .map((line) => {
      const match = line.match(/^(\s*\d+[.:|]?)([ \t]*)(.*)$/);
      if (match) {
        const postWs = match[2];
        const remainingIndent = postWs.slice(minPadding);
        return remainingIndent + match[3];
      }
      return line.replace(/\s+$/, "");
    })
    .join("\n");
}

/**
 * Robust DOM text extraction that converts <br>, <tr>, <div>, <p> to newlines
 * and preserves exact whitespace and indentation.
 */
export function extractCodeText(el: HTMLElement): string {
  if (typeof document === "undefined") {
    return el.textContent || "";
  }
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-kuracode-ui], script, style").forEach((n) => n.remove());

  clone.querySelectorAll("br").forEach((br) => {
    br.replaceWith(document.createTextNode("\n"));
  });

  clone.querySelectorAll("tr").forEach((tr) => {
    tr.after(document.createTextNode("\n"));
  });

  clone.querySelectorAll("div, p, li").forEach((block) => {
    block.after(document.createTextNode("\n"));
  });

  const raw = clone.innerText || clone.textContent || "";
  return raw;
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

/**
 * Content-based heuristics, used only when no explicit page/class hint matches.
 * Ordered roughly by how unambiguous a signal is (score, not order, wins).
 */
const LANGUAGE_CONTENT: [RegExp, string, number][] = [
  // ---- Python ----
  [/^\s*def\s+\w+\s*\(/m, "python", 95],
  [/^\s*class\s+\w+\s*:/m, "python", 95],
  [/^\s*(?:from\s+\w+\s+import|import\s+\w+)/m, "python", 93],
  [/__name__\s*==/, "python", 96],
  [/^\s*with\s+\w+\s+as\b.*:/m, "python", 94],
  [/^\s*try\s*:[^\n]*\n\s*except\b/m, "python", 94],
  [/@\w+\.route/, "python", 97],
  [/\bprint\s*\(/, "python", 90],
  [/\brange\s*\(/, "python", 88],
  [/\bself\b/, "python", 91],
  // ---- JavaScript ----
  [/`[^`]*\$\{[^}]*\}/, "javascript", 93],
  [/\bmodule\.exports\b/, "javascript", 92],
  [/\bdocument\./, "javascript", 91],
  [/\bconsole\.(?:log|error|warn|info)/, "javascript", 90],
  [/\bawait\s+\w/, "javascript", 90],
  [/\balert\s*\(/, "javascript", 89],
  [/\saddEventListener\s*\(/, "javascript", 92],
  [/^\s*(?:const|let|var)\s+\w+\s*=\s*[^;\n]*=>/, "javascript", 89],
  [/=>/, "javascript", 86],
  // ---- TypeScript ----
  [/\binterface\s+\w+\s*\{/, "typescript", 96],
  [/\btype\s+\w+\s*=/, "typescript", 95],
  [/\benum\s+\w+/, "typescript", 95],
  [/:\s*(?:string|number|boolean)\b/, "typescript", 94],
  [/\bPromise</, "typescript", 94],
  [/<[A-Z](?:,\s*[A-Z])*>/, "typescript", 92],
  // ---- Java ----
  [/public\s+static\s+void\s+main\s*\(\s*String\[\]/, "java", 99],
  [/\bSystem\.out\.println/, "java", 98],
  [/private\s+final\s+String/, "java", 96],
  [/protected\s+void\s+\w+\s*\(/, "java", 95],
  [/public\s+(?:static\s+)?(?!function)[\w<>,[\] ]+\s+\w+\s*\(/, "java", 93],
  // ---- Go ----
  [/^package\s+\w+\s*$/m, "go", 99],
  [/^type\s+\w+\s+struct\s*\{/m, "go", 97],
  [/\bfmt\./, "go", 96],
  [/^func\s+\w+\s*\(/m, "go", 95],
  // ---- Rust ----
  [/println!|format!/, "rust", 98],
  [/\bpub\s+(?:struct|fn|impl|enum)\b/, "rust", 97],
  [/^\s*fn\s+\w+\s*\(/m, "rust", 96],
  [/vec!/, "rust", 95],
  [/\bVec</, "rust", 94],
  [/\s+->\s+\w+/, "rust", 88],
// ---- SQL ----
  [/^\s*SELECT\b[\s\S]+\bFROM\b/im, "sql", 98],
  [/^\s*(?:INSERT\s+INTO|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|DELETE\s+FROM|UPDATE\s+\w+\s+SET|WITH\s+\w+\s+AS)\b/im, "sql", 98],
  [/\bFROM\s+[a-zA-Z0-9_]+\s+(WHERE|JOIN|GROUP\s+BY|ORDER\s+BY)\b/i, "sql", 95],
  // ---- Bash ----
  [/^\s*#!\s*\S*(?:bash|sh|zsh)/, "bash", 100],
  [
    /^\s*(?:sudo|apt-get|apt|yum|brew|chmod|chown|export|echo|grep|curl|wget|mkdir|rm|cat|sed|awk)\b/,
    "bash",
    96,
  ],
  [/^\s*if\s+\[/, "bash", 95],
  [/\$[A-Z_]\w*/, "bash", 97],
  // ---- C# ----
  [/\bConsole\.Write(Line)?/, "csharp", 99],
  [/namespace\s+\w+(\.\w+)+\s*\{/, "csharp", 97],
  [/static\s+void\s+Main\s*\(/, "csharp", 97],
  [/\{\s*get;\s*set;\s*\}/, "csharp", 96],
  // ---- PHP ----
  [/<\?php/, "php", 100],
  [/public\s+function\b/, "php", 98],
  [/\$[a-z_]\w*/, "php", 97],
  // ---- HTML ----
  [/<!DOCTYPE html>/i, "html", 97],
  [/^\s*<\/?(?:div|p|ul|li|span|a|h[1-6])\b/m, "html", 92],
  // ---- CSS ----
  [/@media/, "css", 98],
  [/^[ \t]*[.#]?[\w-]+\s*\{/m, "css", 97],
];

const COMMON_ENGLISH_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her",
  "she", "or", "an", "will", "my", "one", "all", "would", "there",
  "their", "what", "so", "up", "out", "if", "about", "who", "get",
  "which", "go", "me", "when", "make", "can", "like", "time", "no",
  "just", "him", "know", "take", "people", "into", "year", "your",
  "good", "some", "could", "them", "see", "other", "than", "then",
  "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first",
  "well", "way", "even", "new", "want", "because", "any", "these",
  "give", "day", "most", "us", "is", "are", "was", "were", "has",
  "had", "been", "designed", "created", "scale", "storage", "please",
  "thanks", "notes", "summary", "check", "documentation", "guide",
  "meeting", "report", "overview", "agenda", "feature", "features",
  "update", "reminder", "findings", "investigating", "announced"
]);

/**
 * Classifies whether text is natural language prose vs source code (D4).
 */
export function isProseText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  // Single word or simple title without code syntax (like "Feature")
  if (/^[a-zA-Z0-9_\s-]+$/.test(trimmed) && trimmed.split(/\s+/).length <= 2 && trimmed.length < 35) {
    // If it mentions an explicit language name in a short hint (e.g. "python example"), not prose
    if (/\b(python|typescript|javascript|bash|shell|rust|golang|csharp|php|ruby|swift|kotlin|dockerfile)\b/i.test(trimmed)) {
      return false;
    }
    // Unless it's an explicit code statement
    if (!/^(const|let|var|def|fn|func|class|package|import)\b/.test(trimmed)) {
      return true;
    }
  }

  // Strong code delimiters that do not occur in natural prose
  const hasStrongCodeDelimiters =
    /[;{}][\r\n]/.test(trimmed) ||
    /=>/.test(trimmed) ||
    /\b(function|def|fn|class|struct|interface|const|let|var|package|pub|fmt\.|System\.out|console\.log)\b/.test(trimmed) ||
    /<\/[a-zA-Z0-9]+>/.test(trimmed) ||
    /^\s*(SELECT\b[\s\S]+\bFROM|INSERT\s+INTO|CREATE\s+TABLE|DELETE\s+FROM|UPDATE\s+\w+\s+SET)\b/im.test(trimmed);

  if (hasStrongCodeDelimiters) {
    return false;
  }

  // Tokenize words
  const words = trimmed.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
  if (words.length === 0) return true;

  let stopWordCount = 0;
  for (const w of words) {
    if (COMMON_ENGLISH_WORDS.has(w)) {
      stopWordCount++;
    }
  }

  const stopWordRatio = stopWordCount / words.length;
  const hasSentencePunctuation = /[.!?](\s+|$)/.test(trimmed);

  // If >= 18% stop words and sentence punctuation, or >= 25% stop words overall
  if ((words.length >= 4 && stopWordRatio >= 0.16 && hasSentencePunctuation) || (words.length >= 5 && stopWordRatio >= 0.24)) {
    return true;
  }

  // Markdown prose headers or bullet lists
  if (/^#{1,6}\s+[A-Z]/m.test(trimmed) && stopWordRatio >= 0.12) {
    return true;
  }

  return false;
}

function detectContentLanguage(text: string): string | undefined {
  let best = 0;
  let found: string | undefined;
  for (const [re, lang, score] of LANGUAGE_CONTENT) {
    if (score <= best) continue;
    if (re.test(text)) {
      best = score;
      found = lang;
    }
  }
  return found;
}

/** Auto-detect language from element class/content hints (CLEAN-4). */
export function detectLanguage(
  element: Element | null,
  text = "",
  fallback = "text",
): string {
  // 1. Element class and data attributes
  const elSource = [
    element?.getAttribute("class") ?? "",
    element?.getAttribute("data-lang") ?? "",
    element?.getAttribute("data-language") ?? "",
    element?.getAttribute("lang") ?? "",
  ].join(" ");

  for (const [re, lang] of LANGUAGE_HINTS) {
    if (re.test(elSource)) return lang;
  }

  // 2. Prose classification (D4): if text is natural prose, classify as "text"
  if (isProseText(text)) {
    return fallback;
  }

  // 3. Short explicit text hints (e.g. "python example")
  if (text.length < 50) {
    for (const [re, lang] of LANGUAGE_HINTS) {
      if (re.test(text)) return lang;
    }
  }

  // 4. Content heuristics
  return detectContentLanguage(text) ?? fallback;
}

/** Find the nearest preceding heading on the page (used for CTX-2). */
export function nearestHeading(el: Element | null): string | undefined {
  if (!el) return undefined;
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  let best: Element | null = null;
  for (const h of headings) {
    try {
      // True when `el` follows `h` in document order, i.e. `h` comes before it.
      if (el.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_PRECEDING) {
        if (best === null || (best.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING)) {
          best = h;
        }
      }
    } catch {
      // ignore
    }
  }
  return best?.textContent?.trim().slice(0, 200) || undefined;
}
