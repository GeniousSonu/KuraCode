import { describe, it, expect } from "vitest";
import {
  evaluateCapabilities,
  validatePublicConfig,
  generateConfigReport,
  scanContentForSecrets,
  generateRedirectUris,
} from "../src/index.ts";

describe("@kuracode/config", () => {
  describe("Capability Evaluation", () => {
    it("reports DEGRADED or DISABLED_MISSING_CONFIG when environment is empty", () => {
      const caps = evaluateCapabilities({});
      expect(caps["auth.google"].status).toBe("DISABLED_MISSING_CONFIG");
      expect(caps["auth.github"].status).toBe("DISABLED_MISSING_CONFIG");
      expect(caps["db.cloud"].status).toBe("DEGRADED"); // fallback to local storage
      expect(caps["ratelimit.redis"].status).toBe("DEGRADED"); // fallback to memory/postgres
      expect(caps["email.send"].status).toBe("DEGRADED"); // fallback to link-only
    });

    it("flips capability to ENABLED when required keys are supplied", () => {
      const caps = evaluateCapabilities({
        PUBLIC_GITHUB_CLIENT_ID: "gh_client_12345",
        PUBLIC_SUPABASE_URL: "https://test.supabase.co",
        PUBLIC_SUPABASE_ANON_KEY: "anon_key_mock",
        RESEND_API_KEY: "re_mock_api_key_valid",
      });

      expect(caps["auth.github"].status).toBe("ENABLED");
      expect(caps["db.cloud"].status).toBe("ENABLED");
      expect(caps["email.send"].status).toBe("ENABLED");
      expect(caps["auth.google"].status).toBe("DISABLED_MISSING_CONFIG");
    });

    it("respects owner explicit disable flags", () => {
      const caps = evaluateCapabilities({
        PUBLIC_GITHUB_CLIENT_ID: "gh_client_12345",
        DISABLE_AUTH_GITHUB: "true",
      });

      expect(caps["auth.github"].status).toBe("DISABLED_BY_OWNER");
    });
  });

  describe("Public Config Validation", () => {
    it("validates default public config safely", () => {
      const res = validatePublicConfig({});
      expect(res.success).toBe(true);
      expect(res.config?.PUBLIC_APP_URL).toBe("https://www.genioussonu.me/extensions/kuracode");

      const report = generateConfigReport({});
      expect(report.environment).toBe("development");
      expect(report.readyForProduction).toBe(false);
    });
  });

  describe("Secret Leak Scanner", () => {
    it("detects forbidden server-only secrets in text", () => {
      const leakyCode = `const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;`;
      const findings = scanContentForSecrets(leakyCode, "test.js");
      expect(findings.length).toBeGreaterThanOrEqual(1);
      expect(findings[0].pattern).toContain("SUPABASE_SERVICE_ROLE_KEY");
    });

    it("passes clean client code with public keys", () => {
      const cleanCode = `const url = "https://test.supabase.co"; const anon = "eyJhbGciOi...";`;
      const findings = scanContentForSecrets(cleanCode, "client.js");
      expect(findings.length).toBe(0);
    });
  });

  describe("Redirect URIs Generator", () => {
    it("generates valid Chromium and web redirect URIs matching extension ID", () => {
      const uris = generateRedirectUris({
        PUBLIC_CHROME_EXTENSION_ID: "kmbodbaepkmhfeohkbfbkpmnnjfkknmg",
        PUBLIC_APP_URL: "https://www.genioussonu.me/extensions/kuracode",
      });

      expect(uris.chromiumExtensionRedirectUri).toBe("https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/");
      expect(uris.webAppRedirectUri).toBe("https://www.genioussonu.me/extensions/kuracode/auth/callback");
      expect(uris.authorizedOrigins).toContain("https://www.genioussonu.me/extensions/kuracode");
    });
  });
});
