import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readPngDimensions(buf: Buffer): [number, number] {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("Not a PNG");
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

describe("Manifest Built Icon Assets Validation", () => {
  const root = path.resolve(__dirname, "../../..");
  const chromeOut = path.join(root, "packages/extension/.output/chrome-mv3");
  const firefoxOut = path.join(root, "packages/extension/.output/firefox-mv3");

  it("verifies Chrome manifest icon sizes and presence in build output", () => {
    const manifestPath = path.join(chromeOut, "manifest.json");
    expect(fs.existsSync(manifestPath), "Chrome manifest missing in .output").toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    expect(manifest.icons).toBeDefined();
    for (const [sizeStr, relPath] of Object.entries(manifest.icons as Record<string, string>)) {
      const expectedSize = parseInt(sizeStr, 10);
      const iconPath = path.join(chromeOut, relPath);
      expect(fs.existsSync(iconPath), `Icon missing: ${relPath}`).toBe(true);

      const [w, h] = readPngDimensions(fs.readFileSync(iconPath));
      expect(w).toBe(expectedSize);
      expect(h).toBe(expectedSize);
    }
  });

  it("verifies Chrome action icon sizes and presence in build output", () => {
    const manifestPath = path.join(chromeOut, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const actionIcons = manifest.action?.default_icon as Record<string, string>;

    expect(actionIcons).toBeDefined();
    for (const [sizeStr, relPath] of Object.entries(actionIcons)) {
      const expectedSize = parseInt(sizeStr, 10);
      const iconPath = path.join(chromeOut, relPath);
      expect(fs.existsSync(iconPath), `Action icon missing: ${relPath}`).toBe(true);

      const [w, h] = readPngDimensions(fs.readFileSync(iconPath));
      expect(w).toBe(expectedSize);
      expect(h).toBe(expectedSize);
    }
  });

  it("verifies Firefox manifest icon sizes and presence in build output", () => {
    const manifestPath = path.join(firefoxOut, "manifest.json");
    expect(fs.existsSync(manifestPath), "Firefox manifest missing in .output").toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    expect(manifest.icons).toBeDefined();
    for (const [sizeStr, relPath] of Object.entries(manifest.icons as Record<string, string>)) {
      const expectedSize = parseInt(sizeStr, 10);
      const iconPath = path.join(firefoxOut, relPath);
      expect(fs.existsSync(iconPath), `Icon missing: ${relPath}`).toBe(true);

      const [w, h] = readPngDimensions(fs.readFileSync(iconPath));
      expect(w).toBe(expectedSize);
      expect(h).toBe(expectedSize);
    }
  });
});
