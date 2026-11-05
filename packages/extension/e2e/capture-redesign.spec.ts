import { expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { test } from "./extension";

const outDir = path.resolve(
  process.cwd(),
  "..",
  "..",
  "docs",
  "agent",
  "evidence",
  "design",
  "after",
);

const urlOf = (id: string, p: string) => `chrome-extension://${id}/${p}`;

test("capture redesigned popup states and measure after metrics", async ({ page, browser }) => {
  fs.mkdirSync(outDir, { recursive: true });

  const worker = browser.serviceWorkers()[0];
  expect(worker).toBeTruthy();
  const id = new URL(worker.url()).host;

  const setSnippets = async (snippets: any[]) => {
    await page.evaluate(async (snips) => {
      await chrome.storage.local.set({ "kuracode.snippets.v1": snips });
    }, snippets);
  };

  // State 1: Empty
  await page.goto(urlOf(id, "popup.html"));
  await page.waitForLoadState("domcontentloaded");
  await setSnippets([]);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-empty.png") });

  const metrics: Record<string, any> = {};
  const box = await page.evaluate(() => ({
    width: document.body.clientWidth,
    height: document.body.clientHeight,
    scrollWidth: document.body.scrollWidth,
    scrollHeight: document.body.scrollHeight,
  }));
  metrics.popupDimensions = box;

  // Four sample snippets to verify card density
  const fourSnippets = [
    {
      id: "snip-1",
      title: "React useEffect hook",
      code: "useEffect(() => {\n  const sub = api.subscribe();\n  return () => sub.unsubscribe();\n}, []);",
      raw: "useEffect...",
      language: "typescript",
      tags: ["react", "hooks"],
      favorite: false,
      status: "draft",
      createdAt: Date.now() - 1000 * 60 * 15,
      updatedAt: Date.now() - 1000 * 60 * 15,
      context: {
        sourceUrl: "https://react.dev/reference/react/useEffect",
        pageTitle: "useEffect – React",
        domain: "react.dev",
        capturedAt: Date.now() - 1000 * 60 * 15,
      },
    },
    {
      id: "snip-2",
      title: "PostgreSQL Recursive CTE query",
      code: "WITH RECURSIVE subordinates AS (\n  SELECT id, manager_id FROM employees WHERE id = 1\n  UNION\n  SELECT e.id, e.manager_id FROM employees e JOIN subordinates s ON s.id = e.manager_id\n)\nSELECT * FROM subordinates;",
      raw: "WITH RECURSIVE...",
      language: "sql",
      tags: ["sql", "postgres"],
      favorite: true,
      status: "approved",
      createdAt: Date.now() - 1000 * 3600 * 2,
      updatedAt: Date.now() - 1000 * 3600 * 2,
      context: {
        sourceUrl: "https://postgresql.org/docs/current/queries-with.html",
        pageTitle: "PostgreSQL Queries",
        domain: "postgresql.org",
        capturedAt: Date.now() - 1000 * 3600 * 2,
      },
    },
    {
      id: "snip-3",
      title: "Rayon parallel iterator",
      code: "use rayon::prelude::*;\n\nlet sum: u64 = (0..1_000_000)\n  .into_par_iter()\n  .map(|x| x * x)\n  .sum();",
      raw: "use rayon...",
      language: "rust",
      tags: ["rust", "rayon"],
      favorite: false,
      status: "draft",
      createdAt: Date.now() - 1000 * 3600 * 20,
      updatedAt: Date.now() - 1000 * 3600 * 20,
      context: {
        sourceUrl: "https://docs.rs/rayon/latest/rayon/",
        pageTitle: "rayon - Rust Docs",
        domain: "docs.rs",
        capturedAt: Date.now() - 1000 * 3600 * 20,
      },
    },
    {
      id: "snip-4",
      title: "Python retry with exponential backoff",
      code: "import time\nfor attempt in range(5):\n  try:\n    response = fetch_data()\n    break\n  except Exception:\n    time.sleep(2 ** attempt)",
      raw: "import time...",
      language: "python",
      tags: ["python", "retry"],
      favorite: false,
      status: "draft",
      createdAt: Date.now() - 1000 * 3600 * 48,
      updatedAt: Date.now() - 1000 * 3600 * 48,
      context: {
        sourceUrl: "https://docs.python.org/3/library/time.html",
        pageTitle: "time - Python Docs",
        domain: "docs.python.org",
        capturedAt: Date.now() - 1000 * 3600 * 48,
      },
    },
  ];

  // State 2: 4 snippets (Testing >= 4 visible cards & collapsed height)
  await setSnippets(fourSnippets);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-4-snippets-dark.png") });

  const measurement = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("article.card"));
    const viewHeight = window.innerHeight;
    let fullyVisibleCount = 0;
    let mostlyVisibleCount = 0;

    const heights: number[] = [];
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      heights.push(Math.round(rect.height));
      if (rect.top >= 0 && rect.bottom <= viewHeight) {
        fullyVisibleCount++;
        mostlyVisibleCount++;
      } else if (rect.top < viewHeight && rect.bottom > 0) {
        const overlap = (Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0)) / rect.height;
        if (overlap >= 0.5) mostlyVisibleCount++;
      }
    }
    return {
      cardHeights: heights,
      fullyVisibleCount,
      mostlyVisibleCount,
      viewHeight,
    };
  });
  metrics.measurement = measurement;

  // State 3: Light Theme
  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-4-snippets-light.png") });
  await page.emulateMedia({ colorScheme: "dark" }); // restore dark

  // State 4: 50 snippets
  const fiftySnippets = Array.from({ length: 50 }).map((_, i) => ({
    id: `snip-gen-${i}`,
    title: `Deterministic Title #${i}`,
    code: `function handler${i}() {\n  const id = ${i};\n  return id * 10;\n}`,
    raw: `raw snippet ${i}`,
    language: ["typescript", "javascript", "python", "rust", "sql"][i % 5],
    tags: [`tag-${i % 4}`],
    favorite: i % 4 === 0,
    status: "draft",
    createdAt: Date.now() - i * 1000 * 3600,
    updatedAt: Date.now() - i * 1000 * 3600,
    context: {
      sourceUrl: `https://example.com/item/${i}`,
      pageTitle: `Example Page ${i}`,
      domain: "example.com",
      capturedAt: Date.now() - i * 1000 * 3600,
    },
  }));
  await setSnippets(fiftySnippets);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-50-snippets.png") });

  // State 5: Long titles truncation & layout preservation
  const longTitleSnippet = [
    {
      id: "snip-long-title",
      title: "Extremely long snippet title that exceeds normal card boundaries and tests whether text wrapping, truncation, and layout integrity are maintained without pushing actions out of frame",
      code: "const test = 'long title test';",
      raw: "test",
      language: "typescript",
      tags: ["layout", "longtitle"],
      favorite: false,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      context: {
        sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow",
        pageTitle: "text-overflow - CSS | MDN",
        domain: "developer.mozilla.org",
        capturedAt: Date.now(),
      },
    },
  ];
  await setSnippets(longTitleSnippet);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-long-titles.png") });

  // State 6: Long code line horizontal scrolling
  const longLinesSnippet = [
    {
      id: "snip-long-lines",
      title: "Horizontal Scrollable Code Line",
      code: "const ultraDeeplyNestedConfigWithExcessiveParametersAndVeryLongStringLiterals = fetch('https://api.service.internal.domain.example.com/v2/organizations/org_987216482146/projects/proj_98712398124/deployments/deploy_91823719824/logs?tail=1000&follow=true&timestamps=true&filter=status:failed');",
      raw: "long line code",
      language: "typescript",
      tags: ["scroll"],
      favorite: false,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      context: {
        sourceUrl: "https://api.example.com/v2",
        pageTitle: "API Documentation",
        domain: "api.example.com",
        capturedAt: Date.now(),
      },
    },
  ];
  await setSnippets(longLinesSnippet);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-long-code-lines.png") });

  // State 7: Search with results
  await setSnippets(fourSnippets);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  const searchInput = page.locator("input.search");
  await searchInput.fill("React");
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, "popup-search-with-results.png") });

  // State 8: Search with no results
  await searchInput.fill("nonexistentqueryxyz");
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, "popup-search-no-results.png") });

  // State 9: Side Panel view
  await page.goto(urlOf(id, "sidepanel.html"));
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "sidepanel-redesign.png") });

  // Save after-metrics
  fs.writeFileSync(
    path.join(outDir, "after-metrics.json"),
    JSON.stringify(metrics, null, 2),
    "utf8"
  );
  console.info("After metrics:", metrics);
});

