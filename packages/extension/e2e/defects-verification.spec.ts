import { expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import axeCore from "axe-core";
import { test } from "./extension";

const afterDir = path.resolve(
  process.cwd(),
  "..",
  "..",
  "docs",
  "agent",
  "evidence",
  "design",
  "after"
);

const urlOf = (id: string, p: string) => `chrome-extension://${id}/${p}`;

const baselineTwoItems = [
  {
    id: "snip-reported-1",
    title: "", // No user title -> Untitled prose
    code: "Created by Facebook, Zstandard is designed to scale dynamically from fast real-time streaming to deep archival storage (offering 22 compression levels).",
    raw: "Created by Facebook, Zstandard is designed to scale dynamically from fast real-time streaming to deep archival storage (offering 22 compression levels).",
    language: "text", // Fixed language detection
    tags: [],
    workspaceId: null,
    context: {
      sourceUrl: "https://www.google.com/search?q=zstandard",
      pageTitle: "Google Search",
      domain: "google.com",
      capturedAt: Date.now() - 60000,
    },
    createdAt: Date.now() - 60000,
    updatedAt: Date.now() - 60000,
  },
  {
    id: "snip-reported-2",
    title: "", // Single word untitled
    code: "Feature",
    raw: "Feature",
    language: "text",
    tags: [],
    workspaceId: null,
    context: {
      sourceUrl: "https://www.google.com",
      pageTitle: "Google",
      domain: "google.com",
      capturedAt: Date.now() - 120000,
    },
    createdAt: Date.now() - 120000,
    updatedAt: Date.now() - 120000,
  },
];

const multilineCodeItem = {
  id: "snip-code-multi",
  title: "Zstandard Streaming Context Configuration",
  code: [
    "export interface ZstdStreamingOptions {",
    "  compressionLevel: number; // 1 to 22",
    "  enableChecksum: boolean;",
    "  windowLogSize: number;",
    "  dictionaryBuffer?: Uint8Array;",
    "  workerThreads?: number;",
    "}",
  ].join("\n"),
  raw: "export interface ZstdStreamingOptions ...",
  language: "typescript",
  tags: ["compression", "zstd"],
  workspaceId: null,
  context: {
    sourceUrl: "https://facebook.github.io/zstd/",
    pageTitle: "Zstandard Manual",
    domain: "facebook.github.io",
    capturedAt: Date.now() - 180000,
  },
  createdAt: Date.now() - 180000,
  updatedAt: Date.now() - 180000,
};

test.describe("Defects D1-D14 Verification & Visual Proof Capture", () => {
  test.beforeAll(() => {
    fs.mkdirSync(afterDir, { recursive: true });
  });

  test("Part C: Capture all required after screenshots (default, light, code-truncated, 320px, 420px, zoom150)", async ({
    page,
    browser,
  }) => {
    const worker = browser.serviceWorkers()[0];
    expect(worker).toBeTruthy();
    const id = new URL(worker.url()).host;

    // 1. Default Dark Mode (380x600, same two items: Zstandard and Feature)
    await page.setViewportSize({ width: 380, height: 600 });
    await page.goto(urlOf(id, "popup.html"));
    await page.evaluate(async (snips) => {
      await chrome.storage.local.set({
        "kuracode.active_workspace.v1": null,
        "kuracode.snippets.v1": snips,
      });
    }, baselineTwoItems);
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(200);

    const defaultScreenshot = path.join(afterDir, "popup-after-default.png");
    await page.screenshot({ path: defaultScreenshot });
    console.info("Captured:", defaultScreenshot);

    // 2. Light Mode (380x600)
    await page.emulateMedia({ colorScheme: "light" });
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });
    await page.waitForTimeout(200);
    const lightScreenshot = path.join(afterDir, "popup-after-light.png");
    await page.screenshot({ path: lightScreenshot });
    console.info("Captured:", lightScreenshot);

    // Reset color scheme back to dark
    await page.emulateMedia({ colorScheme: "dark" });
    await page.evaluate(() => {
      document.documentElement.removeAttribute("data-theme");
    });

    // 3. Truncated Code with 3-line clamp, bottom fade, and Show More
    await page.evaluate(async (item) => {
      const existing = (await chrome.storage.local.get("kuracode.snippets.v1"))["kuracode.snippets.v1"] || [];
      await chrome.storage.local.set({
        "kuracode.snippets.v1": [item, ...(Array.isArray(existing) ? existing : [])],
      });
    }, multilineCodeItem);
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(200);

    const codeTruncatedScreenshot = path.join(afterDir, "popup-after-code-truncated.png");
    await page.screenshot({ path: codeTruncatedScreenshot });
    console.info("Captured:", codeTruncatedScreenshot);

    // 4. Minimum Width Stress Test (320px)
    await page.setViewportSize({ width: 320, height: 600 });
    await page.waitForTimeout(200);
    const minWidthScreenshot = path.join(afterDir, "popup-after-320px.png");
    await page.screenshot({ path: minWidthScreenshot });
    console.info("Captured:", minWidthScreenshot);

    // 5. Maximum Width Stress Test (420px)
    await page.setViewportSize({ width: 420, height: 600 });
    await page.waitForTimeout(200);
    const maxWidthScreenshot = path.join(afterDir, "popup-after-420px.png");
    await page.screenshot({ path: maxWidthScreenshot });
    console.info("Captured:", maxWidthScreenshot);

    // 6. Zoom Stress Test (150% zoom at 380px)
    await page.setViewportSize({ width: 380, height: 600 });
    await page.evaluate(() => {
      document.body.style.zoom = "1.5";
    });
    await page.waitForTimeout(200);
    const zoomScreenshot = path.join(afterDir, "popup-after-zoom150.png");
    await page.screenshot({ path: zoomScreenshot });
    console.info("Captured:", zoomScreenshot);

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = "1";
    });
  });

  test("Part E.1: Layout overflow tests across widths (320, 360, 380, 420px) and pseudo-localization", async ({
    page,
    browser,
  }) => {
    const worker = browser.serviceWorkers()[0];
    const id = new URL(worker.url()).host;

    const widths = [320, 360, 380, 420];
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 600 });
      await page.goto(urlOf(id, "popup.html"));
      await page.waitForLoadState("domcontentloaded");

      // Verify no horizontal element or parent overflow
      const overflowingElements = await page.evaluate(() => {
        const list: Array<{ tag: string; cls: string; id: string; scrollWidth: number; clientWidth: number }> = [];
        const all = document.querySelectorAll("*");
        for (const el of all) {
          const style = window.getComputedStyle(el);
          // Deliberate horizontal scroll track
          if (el.classList.contains("kura-chips-scroll")) continue;
          // Single-line text containers with intentional ellipsis truncation
          if (style.textOverflow === "ellipsis" && (style.overflowX === "hidden" || style.overflow === "hidden")) {
            continue;
          }

          if (el.scrollWidth > el.clientWidth + 2 && (el as HTMLElement).offsetWidth > 0) {
            list.push({
              tag: el.tagName,
              cls: el.className,
              id: el.id,
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
            });
          }
        }
        return list;
      });
      if (overflowingElements.length > 0) {
        console.info(`At width ${w}px, overflowing elements:`, overflowingElements);
      }
      expect(overflowingElements.length).toBe(0);

      // Verify header and search row do not overflow or wrap
      const headerOverflow = await page.evaluate(() => {
        const header = document.querySelector(".kura-header");
        if (!header) return false;
        return header.scrollWidth > header.clientWidth;
      });
      expect(headerOverflow).toBe(false);
    }

    // Pseudo-localization test (+40% text length)
    await page.setViewportSize({ width: 380, height: 600 });
    await page.evaluate(() => {
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim()) {
          node.nodeValue = `[!!! ${node.nodeValue} ~~~~ !!!]`;
        } else {
          for (const child of node.childNodes) walk(child);
        }
      };
      walk(document.body);
    });

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);
  });

  test("Part E.2: Border budget test (max 3 visible bordered elements per view)", async ({
    page,
    browser,
  }) => {
    const worker = browser.serviceWorkers()[0];
    const id = new URL(worker.url()).host;

    await page.setViewportSize({ width: 380, height: 600 });
    await page.goto(urlOf(id, "popup.html"));
    await page.waitForLoadState("domcontentloaded");

    const borderedCount = await page.evaluate(() => {
      let count = 0;
      const all = Array.from(document.querySelectorAll("*"));
      for (const el of all) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        // Element must be rendered and visible
        if (rect.width === 0 || rect.height === 0 || style.display === "none" || style.visibility === "hidden") {
          continue;
        }

        const borderTop = parseFloat(style.borderTopWidth || "0");
        const borderBottom = parseFloat(style.borderBottomWidth || "0");
        const borderLeft = parseFloat(style.borderLeftWidth || "0");
        const borderRight = parseFloat(style.borderRightWidth || "0");
        const outline = parseFloat(style.outlineWidth || "0");

        const hasBorder =
          (borderTop > 0 && style.borderTopStyle !== "none") ||
          (borderBottom > 0 && style.borderBottomStyle !== "none") ||
          (borderLeft > 0 && style.borderLeftStyle !== "none") ||
          (borderRight > 0 && style.borderRightStyle !== "none") ||
          (outline > 0 && style.outlineStyle !== "none");

        if (hasBorder) {
          // Only count distinct visible borders (exclude hidden dropdowns or transparent outlines)
          if (style.borderColor !== "transparent" && style.borderTopColor !== "rgba(0, 0, 0, 0)") {
            count++;
          }
        }
      }
      return count;
    });

    console.info("Visible bordered elements count:", borderedCount);
    // Spec allows maximum of 3 visible bordered elements per screen
    expect(borderedCount).toBeLessThanOrEqual(3);
  });

  test("Part E.3: Duplicate text check (no duplicate title and code preview)", async ({
    page,
    browser,
  }) => {
    const worker = browser.serviceWorkers()[0];
    const id = new URL(worker.url()).host;

    await page.goto(urlOf(id, "popup.html"));
    await page.evaluate(async (snips) => {
      await chrome.storage.local.set({
        "kuracode.active_workspace.v1": null,
        "kuracode.snippets.v1": snips,
      });
    }, baselineTwoItems);
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    const duplicates = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll(".kura-row"));
      const errors: string[] = [];
      for (const row of rows) {
        const titleEl = row.querySelector(".kura-row-title, .kura-row-prose");
        const previewEl = row.querySelector(".kura-code-preview");
        if (titleEl && previewEl) {
          const title = (titleEl.textContent || "").trim();
          const preview = (previewEl.textContent || "").trim();
          if (title && preview && title === preview) {
            errors.push(`Row has duplicate title and preview: "${title}"`);
          }
        }
      }
      return errors;
    });

    expect(duplicates).toEqual([]);
  });

  test("Part E.4: Nested scrollbars test (only one list scroll container, previews overflow: hidden)", async ({
    page,
    browser,
  }) => {
    const worker = browser.serviceWorkers()[0];
    const id = new URL(worker.url()).host;

    await page.goto(urlOf(id, "popup.html"));
    await page.waitForLoadState("domcontentloaded");

    const scrollContainers = await page.evaluate(() => {
      const autoScrollEls: string[] = [];
      const all = Array.from(document.querySelectorAll("*"));
      for (const el of all) {
        const style = window.getComputedStyle(el);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          autoScrollEls.push(el.className || el.tagName.toLowerCase());
        }
      }
      return autoScrollEls;
    });

    // Only .kura-list should have overflow-y: auto
    console.info("Scroll containers with overflow-y auto:", scrollContainers);
    expect(scrollContainers.every((cls) => cls.includes("kura-list"))).toBe(true);

    // Assert preview blocks have overflow: hidden or visible, never scroll/auto
    const previewOverflows = await page.evaluate(() => {
      const previews = Array.from(document.querySelectorAll(".kura-code-preview, .kura-code-preview-wrap"));
      return previews.map((p) => window.getComputedStyle(p).overflowY);
    });

    for (const ov of previewOverflows) {
      expect(["hidden", "visible", "clip"]).toContain(ov);
    }
  });

  test("Part E.5: Contrast check (all text >= 4.5:1 AA contrast against computed background)", async ({
    page,
    browser,
  }) => {
    const worker = browser.serviceWorkers()[0];
    const id = new URL(worker.url()).host;

    await page.goto(urlOf(id, "popup.html"));
    await page.waitForLoadState("domcontentloaded");

    const contrastViolations = await page.evaluate(() => {
      function parseRgb(colorStr: string): [number, number, number] {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return [255, 255, 255];
        return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
      }

      function getLuminance(r: number, g: number, b: number): number {
        const a = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }

      function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
        const lum1 = getLuminance(...rgb1);
        const lum2 = getLuminance(...rgb2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
      }

      function parseRgba(colorStr: string): [number, number, number, number] {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) return [255, 255, 255, 1];
        return [
          parseInt(match[1], 10),
          parseInt(match[2], 10),
          parseInt(match[3], 10),
          match[4] !== undefined ? parseFloat(match[4]) : 1,
        ];
      }

      function getEffectiveBackgroundColor(el: Element): [number, number, number] {
        let cur: Element | null = el;
        while (cur) {
          const bgStyle = window.getComputedStyle(cur).backgroundColor;
          if (bgStyle && bgStyle !== "transparent") {
            const [r, g, b, a] = parseRgba(bgStyle);
            if (a > 0.3) {
              return [r, g, b];
            }
          }
          cur = cur.parentElement;
        }
        return [12, 13, 16]; // Default root background #0c0d10
      }

      const issues: string[] = [];
      const textEls = Array.from(document.querySelectorAll("h1, h2, h3, p, span, button, time, div, input"));
      for (const el of textEls) {
        if (!el.textContent?.trim()) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const style = window.getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") continue;

        const fg = parseRgb(style.color);
        const bg = getEffectiveBackgroundColor(el);
        const ratio = getContrastRatio(fg, bg);

        // AA standard is 4.5:1 (3.0:1 for large text >= 18px or 14px bold)
        const fontSize = parseFloat(style.fontSize || "13");
        const fontWeight = parseInt(style.fontWeight || "400", 10);
        const isLarge = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 600);
        const minRatio = isLarge ? 3.0 : 4.5;

        if (ratio < minRatio) {
          issues.push(`${el.tagName}.${el.className} ratio ${ratio.toFixed(2)}:1 < ${minRatio}:1`);
        }
      }
      return issues;
    });

    console.info("Contrast violations count:", contrastViolations.length);
    expect(contrastViolations).toHaveLength(0);
  });

  test("Part E.6: Axe-core accessibility audit on the popup (zero critical or serious violations)", async ({
    page,
    browser,
  }) => {
    const worker = browser.serviceWorkers()[0];
    const id = new URL(worker.url()).host;

    await page.goto(urlOf(id, "popup.html"));
    await page.waitForLoadState("domcontentloaded");

    // Inject axe-core source into page and run
    await page.evaluate(axeCore.source);

    const results = await page.evaluate(async () => {
      // @ts-expect-error axe is in global window
      return await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa"],
        },
      });
    });

    const severeViolations = results.violations.filter(
      (v: any) => v.impact === "critical" || v.impact === "serious"
    );

    if (severeViolations.length > 0) {
      console.error(
        "Axe violations:",
        JSON.stringify(
          severeViolations.map((v: any) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.map((n: any) => n.html),
          })),
          null,
          2
        )
      );
    }

    expect(severeViolations).toHaveLength(0);
  });

  test("Part B: Visible rows measurement at 380x600 (assert >= 4 code rows or >= 5 prose rows)", async ({
    page,
    browser,
  }) => {
    const worker = browser.serviceWorkers()[0];
    const id = new URL(worker.url()).host;

    await page.setViewportSize({ width: 380, height: 600 });
    await page.goto(urlOf(id, "popup.html"));

    // Populate with 6 prose items
    const proseItems = Array.from({ length: 6 }).map((_, i) => ({
      id: `prose-${i}`,
      title: "",
      code: `Prose note #${i + 1}: Fast streaming compression scales from low latency to high ratio.`,
      raw: `Prose note #${i + 1}: Fast streaming compression scales from low latency to high ratio.`,
      language: "text",
      tags: [],
      workspaceId: null,
      context: {
        sourceUrl: "https://example.com",
        pageTitle: "Example",
        domain: "example.com",
        capturedAt: Date.now() - i * 60000,
      },
      createdAt: Date.now() - i * 60000,
      updatedAt: Date.now() - i * 60000,
    }));

    await page.evaluate(async (items) => {
      await chrome.storage.local.set({
        "kuracode.active_workspace.v1": null,
        "kuracode.snippets.v1": items,
      });
    }, proseItems);
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector(".kura-row");

    const visibleProseCount = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll(".kura-row"));
      const viewportHeight = 600;
      return rows.filter((r) => {
        const rect = r.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= viewportHeight;
      }).length;
    });

    console.info("Visible prose rows at 380x600:", visibleProseCount);
    // Target is >= 5 prose rows
    expect(visibleProseCount).toBeGreaterThanOrEqual(5);
  });
});
