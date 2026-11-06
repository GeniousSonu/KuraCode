import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseManifestVersion } from "../../../scripts/sync-version";

describe("Version Consistency Check Across Workspaces", () => {
  const root = path.resolve(__dirname, "../../..");
  const rootPkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const expectedInfo = parseManifestVersion(rootPkg.version);

  it("ensures canonical version conforms to semver specification", () => {
    expect(rootPkg.version).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  });

  it("ensures manifest versions conform to browser numeric rules (1-4 dot-separated integers <= 65535)", () => {
    const chromeManifest = JSON.parse(fs.readFileSync(path.join(root, "packages/extension/manifest.json"), "utf8"));
    const firefoxManifest = JSON.parse(fs.readFileSync(path.join(root, "packages/extension/manifest.firefox.json"), "utf8"));

    const validateBrowserVersion = (v: string) => {
      const parts = v.split(".");
      expect(parts.length).toBeGreaterThanOrEqual(1);
      expect(parts.length).toBeLessThanOrEqual(4);
      for (const p of parts) {
        const num = parseInt(p, 10);
        expect(Number.isInteger(num)).toBe(true);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(65535);
      }
    };

    validateBrowserVersion(chromeManifest.version);
    validateBrowserVersion(firefoxManifest.version);
  });

  it("ensures all package.json files match root package.json", () => {
    const packages = [
      "packages/extension/package.json",
      "packages/web/package.json",
      "packages/config/package.json",
      "packages/adapters/package.json",
      "packages/api/package.json",
    ];

    for (const pkgRel of packages) {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, pkgRel), "utf8"));
      expect(pkg.version, `${pkgRel} version must match root version`).toBe(rootPkg.version);
    }
  });

  it("ensures packages/extension/manifest.json matches manifest version", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "packages/extension/manifest.json"), "utf8"));
    expect(manifest.version).toBe(expectedInfo.manifestVersion);
    if (expectedInfo.versionName) {
      expect(manifest.version_name).toBe(expectedInfo.versionName);
    }
  });

  it("ensures packages/extension/manifest.firefox.json matches manifest version", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "packages/extension/manifest.firefox.json"), "utf8"));
    expect(manifest.version).toBe(expectedInfo.manifestVersion);
    if (expectedInfo.versionName) {
      expect(manifest.version_name).toBe(expectedInfo.versionName);
    }
  });

  it("ensures version constants in shared files match root version", () => {
    const extVersionPath = path.join(root, "packages/extension/src/shared/version.ts");
    const webVersionPath = path.join(root, "packages/web/src/version.ts");
    const apiVersionPath = path.join(root, "packages/api/src/version.ts");

    if (fs.existsSync(extVersionPath)) {
      expect(fs.readFileSync(extVersionPath, "utf8")).toContain(`"${rootPkg.version}"`);
    }
    if (fs.existsSync(webVersionPath)) {
      expect(fs.readFileSync(webVersionPath, "utf8")).toContain(`"${rootPkg.version}"`);
    }
    if (fs.existsSync(apiVersionPath)) {
      expect(fs.readFileSync(apiVersionPath, "utf8")).toContain(`"${rootPkg.version}"`);
    }
  });

  it("ensures CHANGELOG.md top release header matches root version", () => {
    const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
    const match = changelog.match(/##\s*\[(\d+\.\d+\.\d+[^\]]*)\]/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe(rootPkg.version);
  });
});
