/**
 * KuraCode brand asset generator — deterministic, script-only.
 *
 * Reads the supplied master SVG (brand/source/kuracode-icon.svg) and produces
 * every derived raster/vector asset into brand/generated/. Never modifies the
 * source. Run via `npm run brand:build` (see scripts/run-build-icons.mjs).
 *
 * The master logo is used EXACTLY as supplied: no redraw, recolor, or
 * restyle. Only the render viewBox is tightened to the artwork's bounding box
 * so raster output is cropped correctly; this does not change the paths.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MASTER = path.join(ROOT, "brand", "source", "kuracode-icon.svg");
const OUT = path.join(ROOT, "brand", "generated");

/** Tight bounding box of the artwork, derived from the path extents. */
const BBOX = { x: 467, y: 36, w: 1037, h: 826 };

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const GRAPHITE = { r: 12, g: 13, b: 16, alpha: 1 };

function tightSvg(text: string): string {
  return text.replace(/viewBox="[^"]*"/, `viewBox="${BBOX.x} ${BBOX.y} ${BBOX.w} ${BBOX.h}"`);
}

const masterText = fs.readFileSync(MASTER, "utf8");
const tightMaster = Buffer.from(tightSvg(masterText));

async function readPng(buf: Buffer) {
  return sharp(buf).metadata();
}

/** Render mark scaled to `size` (square, contained, transparent bg). */
async function renderMark(size: number): Promise<Buffer> {
  return sharp(tightMaster)
    .resize(size, size, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();
}

/** Render mark at artworkFraction*size centered on a size×size canvas. */
async function renderArtwork(size: number, fraction = 1): Promise<Buffer> {
  const mark = await renderMark(Math.max(1, Math.round(size * fraction)));
  const meta = await readPng(mark);
  const left = Math.floor((size - meta.width!) / 2);
  const top = Math.floor((size - meta.height!) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: mark, left, top }])
    .png()
    .toBuffer();
}

async function save(name: string, buf: Buffer) {
  const file = path.join(OUT, name);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, buf);
  console.info(`  ✓ ${name} (${buf.length} B)`);
}

/** Minimal ICO packer (Vista+ PNG-compressed entries). */
function packIco(entries: { data: Buffer; size: number }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dir = Buffer.alloc(16 * entries.length);
  for (let i = 0; i < entries.length; i++) {
    const e = Buffer.alloc(16);
    const s = entries[i].size;
    e[0] = s >= 256 ? 0 : s;
    e[1] = s >= 256 ? 0 : s;
    e[2] = 0;
    e[3] = 0;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(entries[i].data.length, 8);
    e.writeUInt32LE(offset, 12);
    e.copy(dir, i * 16);
    offset += entries[i].data.length;
  }
  return Buffer.concat([header, dir, ...entries.map((x) => x.data)]);
}

async function build() {
  await fs.promises.rm(OUT, { recursive: true, force: true });
  console.info("KuraCode brand generation → brand/generated/");

  // ---- Extension manifest + action toolbar icons (square, transparent) ----
  for (const size of [16, 32, 48, 96, 128]) {
    await save(`extension/icon-${size}.png`, await renderArtwork(size));
  }
  for (const theme of ["light", "dark"]) {
    for (const size of [16, 24, 32, 48, 64]) {
      await save(`action/icon-${theme}-${size}.png`, await renderArtwork(size));
    }
    // disabled = grayscale of the medium size
    const g = await sharp(await renderArtwork(32)).greyscale().png().toBuffer();
    await save(`action/icon-${theme}-disabled-32.png`, g);
  }

  // ---- Store artwork (mark centered, transparent padding) ----
  const storeSizes: Record<string, number> = {
    "chrome-web-store-128.png": 128,
    "edge-300.png": 300,
  };
  for (const [name, size] of Object.entries(storeSizes)) {
    await save(`store/${name}`, await renderArtwork(size, 0.75));
  }
  await save(
    "store/promo-440x280.png",
    await sharp({
      create: { width: 440, height: 280, channels: 4, background: GRAPHITE },
    })
      .composite([{ input: await renderMark(180), left: 130, top: 50 }])
      .png()
      .toBuffer(),
  );
  await save(
    "store/marquee-1400x560.png",
    await sharp({
      create: { width: 1400, height: 560, channels: 4, background: GRAPHITE },
    })
      .composite([{ input: await renderMark(340), left: 530, top: 110 }])
      .png()
      .toBuffer(),
  );

  // ---- Web / PWA favicons ----
  const icoEntries: { data: Buffer; size: number }[] = [];
  for (const size of [16, 32, 48]) {
    const png = await renderArtwork(size);
    await save(`web/favicon-${size}.png`, png);
    icoEntries.push({ data: png, size });
  }
  await save("web/favicon.ico", packIco(icoEntries));
  await save("web/apple-touch-icon-180.png", await renderArtwork(180));
  for (const size of [192, 512]) {
    await save(`web/pwa-${size}.png`, await renderArtwork(size));
    await save(`web/maskable-${size}.png`, await renderArtwork(size, 0.8));
  }
  await save("web/favicon.svg", tightMaster);

  // ---- Social / OG ----
  await save(
    "social/og-image-1200x630.png",
    await sharp({
      create: { width: 1200, height: 630, channels: 4, background: GRAPHITE },
    })
      .composite([{ input: await renderMark(420), left: 390, top: 105 }])
      .png()
      .toBuffer(),
  );
  await save(
    "social/twitter-card-1200x600.png",
    await sharp({
      create: { width: 1200, height: 600, channels: 4, background: GRAPHITE },
    })
      .composite([{ input: await renderMark(400), left: 400, top: 100 }])
      .png()
      .toBuffer(),
  );

  // ---- Docs / README svgs (mark; no invented wordmark) ----
  await save("docs/logo-mark.svg", tightMaster);
  await save("docs/logo-light.svg", tightMaster);
  await save("docs/logo-dark.svg", tightMaster);

  console.info("done.");
}

build().catch((err) => {
  console.error("brand generation failed:", err);
  process.exit(1);
});
