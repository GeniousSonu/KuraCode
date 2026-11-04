// Shared flat ESLint config for the KuraCode monorepo.
// Covers both the extension (TS, browser globals) and the web app (TS/TSX).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.map"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  {
    files: ["**/*.test.ts"],
    languageOptions: {
      globals: { ...globals.vitest },
    },
  },
  {
    // Build plumbing (build.mjs) runs under Node.
    files: ["**/build.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
