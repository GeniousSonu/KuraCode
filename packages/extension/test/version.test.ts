import { describe, expect, it } from "vitest";
import { parseManifestVersion } from "../../../scripts/sync-version";

describe("parseManifestVersion (Browser Manifest Spec)", () => {
  it("parses standard stable releases into 3-digit dot separated string", () => {
    const v = parseManifestVersion("0.1.0");
    expect(v.manifestVersion).toBe("0.1.0");
    expect(v.isPrerelease).toBe(false);
    expect(v.versionName).toBeUndefined();
  });

  it("handles standard minor and major updates", () => {
    expect(parseManifestVersion("1.0.0").manifestVersion).toBe("1.0.0");
    expect(parseManifestVersion("2.14.8").manifestVersion).toBe("2.14.8");
  });

  it("translates beta suffixes into numeric 4th integer and sets version_name", () => {
    const v = parseManifestVersion("1.3.0-beta.2");
    expect(v.manifestVersion).toBe("1.3.0.2");
    expect(v.versionName).toBe("1.3.0-beta.2");
    expect(v.isPrerelease).toBe(true);
  });

  it("translates rc releases into numeric 4th integer", () => {
    const v = parseManifestVersion("2.0.0-rc.1");
    expect(v.manifestVersion).toBe("2.0.0.1");
    expect(v.versionName).toBe("2.0.0-rc.1");
    expect(v.isPrerelease).toBe(true);
  });

  it("translates non-numbered prerelease to zero", () => {
    const v = parseManifestVersion("1.0.0-alpha");
    expect(v.manifestVersion).toBe("1.0.0.0");
    expect(v.versionName).toBe("1.0.0-alpha");
    expect(v.isPrerelease).toBe(true);
  });

  it("throws on invalid semver format", () => {
    expect(() => parseManifestVersion("not-a-version")).toThrow(/Invalid semver/);
    expect(() => parseManifestVersion("1.2")).toThrow(/Invalid semver/);
  });

  it("throws if any segment exceeds 65535 limit", () => {
    expect(() => parseManifestVersion("70000.1.0")).toThrow(/exceeds browser maximum 65535/);
    expect(() => parseManifestVersion("1.0.0-beta.70000")).toThrow(/exceeds 65535/);
  });
});
