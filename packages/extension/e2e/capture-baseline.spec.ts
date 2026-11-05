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
  "before",
);

const urlOf = (id: string, p: string) => `chrome-extension://${id}/${p}`;

test("capture baseline popup states and measure metrics", async ({ page, browser }) => {
  fs.mkdirSync(outDir, { recursive: true });

  const worker = browser.serviceWorkers()[0];
  expect(worker).toBeTruthy();
  const id = new URL(worker.url()).host;

  const setSnippets = async (snippets: any[]) => {
    await page.evaluate(async (snips) => {
      await chrome.storage.local.set({ "kuracode.snippets.v1": snips });
    }, snippets);
  };

  // State 1: empty
  await page.goto(urlOf(id, "popup.html"));
  await page.waitForLoadState("domcontentloaded");
  await setSnippets([]);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-empty.png") });

  // Baseline dimensions & timing record
  const metrics: Record<string, any> = {};
  const box = await page.evaluate(() => {
    return {
      width: document.body.clientWidth,
      height: document.body.clientHeight,
      scrollWidth: document.body.scrollWidth,
      scrollHeight: document.body.scrollHeight,
    };
  });
  metrics.popupDimensions = box;

  // State 2: 3 snippets
  const threeSnippets = [
    {
      id: "snip-1",
      title: "React useEffect Cleanup",
      code: "useEffect(() => {\n  const sub = api.subscribe();\n  return () => sub.unsubscribe();\n}, []);",
      raw: "useEffect(() => {\n  const sub = api.subscribe();\n  return () => sub.unsubscribe();\n}, []);",
      language: "typescript",
      tags: ["react", "hooks"],
      favorite: false,
      status: "draft",
      createdAt: Date.now() - 1000 * 60 * 30,
      updatedAt: Date.now() - 1000 * 60 * 30,
      context: {
        sourceUrl: "https://react.dev/reference/react/useEffect",
        pageTitle: "useEffect – React",
        domain: "react.dev",
        capturedAt: Date.now() - 1000 * 60 * 30,
        heading: "Connecting to an external system",
      },
    },
    {
      id: "snip-2",
      title: "PostgreSQL Recursive CTE query",
      code: "WITH RECURSIVE subordinates AS (\n  SELECT id, manager_id, name FROM employees WHERE id = 1\n  UNION\n  SELECT e.id, e.manager_id, e.name FROM employees e INNER JOIN subordinates s ON s.id = e.manager_id\n)\nSELECT * FROM subordinates;",
      raw: "WITH RECURSIVE subordinates AS (...)",
      language: "sql",
      tags: ["sql", "postgres"],
      favorite: true,
      status: "approved",
      createdAt: Date.now() - 1000 * 3600 * 3,
      updatedAt: Date.now() - 1000 * 3600 * 3,
      context: {
        sourceUrl: "https://postgresql.org/docs/current/queries-with.html",
        pageTitle: "PostgreSQL: Documentation: Queries with CTE",
        domain: "postgresql.org",
        capturedAt: Date.now() - 1000 * 3600 * 3,
        heading: "Recursive Queries",
      },
    },
    {
      id: "snip-3",
      title: "Rust parallel iterator with rayon",
      code: "use rayon::prelude::*;\n\nlet sum: u64 = (0..1_000_000)\n  .into_par_iter()\n  .map(|x| x * x)\n  .sum();",
      raw: "use rayon::prelude::*;\n...",
      language: "rust",
      tags: ["rust", "rayon"],
      favorite: false,
      status: "draft",
      createdAt: Date.now() - 1000 * 3600 * 24,
      updatedAt: Date.now() - 1000 * 3600 * 24,
      context: {
        sourceUrl: "https://docs.rs/rayon/latest/rayon/",
        pageTitle: "rayon - Rust Docs",
        domain: "docs.rs",
        capturedAt: Date.now() - 1000 * 3600 * 24,
        heading: "Parallel Iterators",
      },
    },
  ];

  await setSnippets(threeSnippets);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-3-snippets.png") });

  // Measure visible cards at default viewport height
  const visibleCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("article.card"));
    const viewHeight = window.innerHeight;
    let visibleCount = 0;
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.top >= 0 && rect.bottom <= viewHeight) {
        visibleCount++;
      } else if (rect.top < viewHeight && rect.bottom > 0) {
        // partially visible
        visibleCount += (Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0)) / rect.height >= 0.5 ? 1 : 0.5;
      }
    }
    return {
      totalCards: cards.length,
      visibleCount,
      cardHeights: cards.map((c) => c.getBoundingClientRect().height),
    };
  });
  metrics.visibleCardsAtDefaultHeight = visibleCards;

  // State 3: 50 snippets
  const fiftySnippets = Array.from({ length: 50 }).map((_, i) => ({
    id: `snip-gen-${i}`,
    title: i % 3 === 0 ? `Snippet #${i} with long descriptive name for testing layout` : `Snippet #${i}`,
    code: `function example${i}() {\n  const x = ${i};\n  console.log("Snippet index", x);\n  return x * 2;\n}`,
    raw: `raw snippet ${i}`,
    language: ["typescript", "javascript", "python", "rust", "go", "sql"][i % 6],
    tags: [`tag-${i % 5}`],
    favorite: i % 5 === 0,
    status: "draft",
    createdAt: Date.now() - i * 1000 * 3600,
    updatedAt: Date.now() - i * 1000 * 3600,
    context: {
      sourceUrl: `https://example.com/item/${i}`,
      pageTitle: `Example Page ${i}`,
      domain: "example.com",
      capturedAt: Date.now() - i * 1000 * 3600,
      heading: `Section ${i}`,
    },
  }));
  await setSnippets(fiftySnippets);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-50-snippets.png") });

  // State 4: Long titles
  const longTitleSnippet = [
    {
      id: "snip-long-title",
      title: "Extremely long snippet title that exceeds normal card boundaries and tests whether text wrapping, truncation, and layout integrity are maintained without pushing actions out of frame",
      code: "const test = 'long title test';",
      raw: "test",
      language: "typescript",
      tags: ["layout", "longtitle", "overflow"],
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

  // State 5: Long code lines
  const longLinesSnippet = [
    {
      id: "snip-long-lines",
      title: "Horizontal Scrollable Code Line",
      code: "const ultraDeeplyNestedConfigWithExcessiveParametersAndVeryLongStringLiterals = fetch('https://api.service.internal.domain.example.com/v2/organizations/org_987216482146/projects/proj_98712398124/deployments/deploy_91823719824/logs?tail=1000&follow=true&timestamps=true&filter=status:failed');",
      raw: "long line code",
      language: "typescript",
      tags: ["scroll", "overflow"],
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

  // State 6: Missing source URL
  const missingSourceSnippet = [
    {
      id: "snip-no-source",
      title: "Locally Created Quick Note",
      code: "export const DEFAULT_TIMEOUT_MS = 5000;\nexport const RETRY_ATTEMPTS = 3;",
      raw: "code without source url",
      language: "typescript",
      tags: ["config"],
      favorite: false,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      context: {
        sourceUrl: "",
        pageTitle: "",
        domain: "",
        capturedAt: Date.now(),
      },
    },
  ];
  await setSnippets(missingSourceSnippet);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "popup-missing-source-url.png") });

  // State 7: Search with results
  await setSnippets(threeSnippets);
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

  // Side panel view
  await page.goto(urlOf(id, "sidepanel.html"));
  await page.waitForLoadState("domcontentloaded");
  await page.screenshot({ path: path.join(outDir, "sidepanel-baseline.png") });

  // Record baseline metrics
  fs.writeFileSync(
    path.join(outDir, "baseline-metrics.json"),
    JSON.stringify(metrics, null, 2),
    "utf8"
  );
  console.info("Baseline metrics:", metrics);
});

