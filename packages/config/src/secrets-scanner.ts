import fs from "node:fs";
import path from "node:path";

export interface LeakFinding {
  file: string;
  pattern: string;
  line: number;
  snippet: string;
}

const FORBIDDEN_SERVER_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "service_role",
  "RESEND_API_KEY",
  "UPSTASH_REDIS_REST_TOKEN",
  "TURNSTILE_SECRET_KEY",
  "SESSION_SECRET",
  "JWT_SECRET",
  "CHROME_CLIENT_SECRET",
  "CHROME_REFRESH_TOKEN",
  "EDGE_API_KEY",
  "FIREFOX_API_SECRET",
];

const SECRET_PATTERNS = [
  { name: "AWS Key ID", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub Personal Access Token", regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/ },
  { name: "Resend Live API Key", regex: /re_[a-zA-Z0-9]{24,}/ },
  { name: "Private Key Header", regex: /-----BEGIN (RSA|EC|OPENSSH|PGP|ENCRYPTED|PRIVATE) KEY-----/ },
  { name: "Supabase Service Role JWT", regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/ },
];

/**
 * Calculates Shannon entropy of a given string.
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const map: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    map[c] = (map[c] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const c in map) {
    const p = map[c] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Scans a file or string content for forbidden server secrets.
 */
export function scanContentForSecrets(content: string, filename = "buffer"): LeakFinding[] {
  const findings: LeakFinding[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for explicit forbidden server variable names or service-role mentions
    for (const forbidden of FORBIDDEN_SERVER_KEYS) {
      if (line.includes(forbidden)) {
        findings.push({
          file: filename,
          pattern: `Forbidden server key reference: ${forbidden}`,
          line: i + 1,
          snippet: line.trim().slice(0, 80),
        });
      }
    }

    // Check for known token regex patterns
    for (const pat of SECRET_PATTERNS) {
      if (pat.regex.test(line)) {
        findings.push({
          file: filename,
          pattern: `Matches secret pattern: ${pat.name}`,
          line: i + 1,
          snippet: line.trim().slice(0, 80),
        });
      }
    }
  }

  return findings;
}

/**
 * Recursively scans a directory (e.g. client build output) for leaked secrets.
 */
export function scanDirectoryForLeakedSecrets(dirPath: string): LeakFinding[] {
  const findings: LeakFinding[] = [];
  if (!fs.existsSync(dirPath)) return findings;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      findings.push(...scanDirectoryForLeakedSecrets(fullPath));
    } else if (entry.isFile()) {
      // Only scan code, text, maps, html, json
      if (/\.(js|mjs|cjs|ts|tsx|json|html|map|css)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        findings.push(...scanContentForSecrets(content, fullPath));
      }
    }
  }
  return findings;
}

