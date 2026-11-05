/**
 * Secret Scanner Module (CLIP-4, PRIV-3, CODE-5)
 * Analyzes text for sensitive credentials, API keys, tokens, and passwords.
 * Blocks sensitive data from syncing or sharing without explicit acknowledgement.
 */

export interface SecretFinding {
  type: string;
  description: string;
  match: string;
  index: number;
}

interface SecretPattern {
  type: string;
  description: string;
  regex: RegExp;
}

const PATTERNS: SecretPattern[] = [
  // AWS Access Key ID
  {
    type: "AWS_ACCESS_KEY",
    description: "AWS Access Key ID",
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
  },
  // AWS Secret Access Key
  {
    type: "AWS_SECRET_KEY",
    description: "AWS Secret Access Key",
    regex: /\b(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])\b/g,
  },
  // GitHub Personal Access Token / Fine-grained PAT
  {
    type: "GITHUB_TOKEN",
    description: "GitHub Access Token",
    regex: /\b(ghp_[A-Za-z0-9_]{36}|github_pat_[A-Za-z0-9_]{82})\b/g,
  },
  // OpenAI API Key
  {
    type: "OPENAI_API_KEY",
    description: "OpenAI API Key",
    regex: /\b(sk-[a-zA-Z0-9]{48}|sk-proj-[a-zA-Z0-9_-]{48,})\b/g,
  },
  // Anthropic API Key
  {
    type: "ANTHROPIC_API_KEY",
    description: "Anthropic Claude API Key",
    regex: /\b(sk-ant-[a-zA-Z0-9_-]{80,})\b/g,
  },
  // Private Key Headers
  {
    type: "PRIVATE_KEY",
    description: "RSA / EC / OpenSSH Private Key",
    regex: /-----BEGIN\s+(?:RSA|OPENSSH|EC|DSA|PGP)?\s*PRIVATE\s+KEY-----/g,
  },
  // Generic Password in connection strings
  {
    type: "CONNECTION_PASSWORD",
    description: "Database connection password",
    regex: /(?:postgres|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s]+:([^@\s]{4,})@/g,
  },
  // Generic JWT token
  {
    type: "JWT_TOKEN",
    description: "JSON Web Token",
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
];

/**
 * Calculates the Shannon entropy of a string to identify high-randomness tokens.
 */
export function calculateShannonEntropy(str: string): number {
  if (!str) return 0;
  const frequencies = new Map<string, number>();
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  const len = str.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Scans text for credentials and secrets.
 */
export function scanForSecrets(text: string): SecretFinding[] {
  if (!text || text.length < 8) return [];
  const findings: SecretFinding[] = [];

  for (const p of PATTERNS) {
    p.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = p.regex.exec(text)) !== null) {
      // For connection strings, capture the password group
      const secretStr = match[1] || match[0];
      findings.push({
        type: p.type,
        description: p.description,
        match: secretStr.slice(0, 4) + "••••" + secretStr.slice(-4),
        index: match.index,
      });
    }
  }

  return findings;
}

export function containsSecrets(text: string): boolean {
  return scanForSecrets(text).length > 0;
}

