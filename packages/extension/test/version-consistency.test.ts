import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseManifestVersion } from "../../../scripts/sync-version";

describe("Version Consistency Check Across Workspaces", () => {
  const root = path.resolve(__dirname, "../../..");
  const rootPkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const expectedInfo = parseManifestVersion(rootPkg.version);

  it("ensures packages/extension/package.json version matches root package.json", () => {
    const extPkg = JSON.parse(fs.readFileSync(path.join(root, "packages/extension/package.json"), "utf8"));
    expect(extPkg.version).toBe(rootPkg.version);
  });

  it("ensures packages/web/package.json version matches root package.json", () => {
    const webPkg = JSON.parse(fs.readFileSync(path.join(root, "packages/web/package.json"), "utf8"));
    expect(webPkg.version).toBe(rootPkg.version);
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
});
