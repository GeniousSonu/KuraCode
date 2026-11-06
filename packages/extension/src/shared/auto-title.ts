/**
 * Deterministic, local semantic auto-title generator.
 * Never outputs raw unformatted code as a title.
 * Analyzes language syntax and meaningful tokens to construct concise, professional titles.
 */

import { isProseText } from "./cleaner";

interface TitleRule {
  pattern: RegExp;
  formatter: (match: RegExpMatchArray, lang: string) => string;
}

const COMMON_RULES: TitleRule[] = [
  // React Hook
  {
    pattern: /\b(?:use([A-Z][a-zA-Z0-9]+))\b/,
    formatter: (m) => `React use${m[1]} hook`,
  },
  // React Component
  {
    pattern: /\b(?:function|const)\s+([A-Z][a-zA-Z0-9]+)\s*[:=]\s*(?:\([^)]*\)|props)\s*(?:=>|\{)/,
    formatter: (m) => `React ${m[1]} component`,
  },
  // Function declaration / definition
  {
    pattern: /\b(?:function|def|fn|func)\s+([a-zA-Z0-9_]+)\s*\(/,
    formatter: (m, lang) => `${capitalize(lang)} ${m[1]}() function`,
  },
  // Class / Struct / Interface / Type
  {
    pattern: /\b(?:class|struct|interface|type)\s+([a-zA-Z0-9_]+)\b/,
    formatter: (m, lang) => `${m[1]} ${lang === "sql" ? "table" : "definition"}`,
  },
  // SQL Queries
  {
    pattern: /\bWITH\s+RECURSIVE\s+([a-zA-Z0-9_]+)\b/i,
    formatter: (m) => `Recursive CTE query (${m[1]})`,
  },
  {
    pattern: /\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)\b/i,
    formatter: (m) => `SQL query on ${m[2]}`,
  },
  // Package / Module import
  {
    pattern: /\bimport\s+(?:\{[^}]+\}|\*\s+as\s+[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)\s+from\s+['"]([^'"]+)['"]/,
    formatter: (m) => `Import ${m[1]} module`,
  },
  // Rust Rayon / concurrency
  {
    pattern: /\brayon::prelude\b/,
    formatter: () => `Rayon parallel iterator`,
  },
  // Docker / Shell / CLI commands
  {
    pattern: /\b(?:docker|kubectl|pnpm|npm|cargo|git)\s+([a-zA-Z0-9_-]+)/,
    formatter: (m) => `CLI command: ${m[0].slice(0, 32)}`,
  },
];

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Generates a clean, readable snippet title.
 */
export function generateReadableTitle(
  code: string,
  language: string = "text",
  headingContext?: string
): { title: string; isAuto: boolean; isUntitled?: boolean } {
  if (headingContext && headingContext.trim().length > 3) {
    const cleanHeading = headingContext.trim().replace(/^#+\s*/, "").slice(0, 60);
    return { title: cleanHeading, isAuto: false, isUntitled: false };
  }

  const trimmed = code.trim();
  if (!trimmed) {
    return { title: "", isAuto: true, isUntitled: true };
  }

  // Match against rules
  for (const rule of COMMON_RULES) {
    const match = trimmed.match(rule.pattern);
    if (match) {
      return { title: rule.formatter(match, language), isAuto: true, isUntitled: false };
    }
  }

  // D3: If content is prose or single-word / short phrase, do not generate a title that repeats content
  if (language === "text" || isProseText(trimmed) || trimmed.split(/\s+/).length <= 2) {
    return { title: "", isAuto: true, isUntitled: true };
  }

  // Fallback: extract first meaningful line (strip comments, symbols)
  const firstLine = trimmed
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith("//") && !l.startsWith("#") && !l.startsWith("/*"));

  if (firstLine) {
    const sanitized = firstLine
      .replace(/[{};()]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 48);
    if (sanitized === trimmed || sanitized.length <= 4) {
      return { title: "", isAuto: true, isUntitled: true };
    }
    return { title: `${capitalize(language)}: ${sanitized}`, isAuto: true, isUntitled: false };
  }

  return { title: `${capitalize(language)} code example`, isAuto: true, isUntitled: false };
}

