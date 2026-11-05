/**
 * Shared, browser-agnostic scenario steps (Release Guide section 4.3).
 *
 * Every function is a self-contained "S-series" scenario. They talk only to
 * the ScenarioDriver interface, so the same steps run on Chromium today and
 * Firefox later. Storage is reset at the start of each scenario so runs are
 * independent.
 */
import { expect } from "@playwright/test";
import type { ScenarioDriver, SnippetShape } from "./driver";

async function waitFor<T>(
  get: () => Promise<T>,
  ok: (value: T) => boolean,
  timeout = 8000,
): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = await get();
    if (ok(value)) return value;
    if (Date.now() - start > timeout)
      throw new Error("condition not met in time");
    await new Promise((r) => setTimeout(r, 150));
  }
}

function seedSnippet(overrides: Partial<SnippetShape>): SnippetShape {
  const now = Date.now();
  return {
    id: `seed_${now}`,
    title: "Seeded snippet",
    language: "text",
    code: "const x = 1;",
    raw: "const x = 1;",
    tags: [],
    context: {
      sourceUrl: "",
      pageTitle: "Seed",
      domain: "seed",
      capturedAt: now,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * S1 — Select code on a Stack Overflow fixture, press the hotkey (the
 * background bridge). A snippet is saved with URL, title and language.
 */
export async function s1HotkeyCapture(driver: ScenarioDriver): Promise<void> {
  await driver.resetStorage();
  const page = await driver.openPage("stackoverflow.html");

  // Wait for the content script to attach before triggering the capture bridge.
  const pre = page.locator("pre").first();
  await expect(pre).toHaveAttribute("data-kuracode-ui", "true", {
    timeout: 15_000,
  });

  await page.evaluate(() => {
    const code = document.querySelector("pre code") as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(code);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });

  await driver.captureSelection();

  const snippets = await waitFor(
    () => driver.readSnippets(),
    (s) => s.length === 1,
  );
  const snippet = snippets[0];
  expect(snippet.title.length).toBeGreaterThan(0);
  expect(snippet.language).toBe("python");
  expect(snippet.context.domain).toBe("localhost");
  expect(snippet.context.sourceUrl).toContain("stackoverflow.html");
  expect(typeof snippet.context.capturedAt).toBe("number");
}

/**
 * S3 — Hover a GitHub-style code block and click the inline Save button.
 * The saved code is cleaned (gutter line numbers stripped) and the button
 * does not shift the layout.
 */
export async function s3InlineSave(driver: ScenarioDriver): Promise<void> {
  await driver.resetStorage();
  const page = await driver.openPage("github.html");

  const pre = page.locator("pre").first();
  await expect(pre).toHaveAttribute("data-kuracode-ui", "true", {
    timeout: 15_000,
  });

  const widthBefore = await pre.evaluate(
    (el) => (el as HTMLElement).getBoundingClientRect().width,
  );

  // Reveal the button on hover, then click where the injected host sits
  // (top-right of the <pre>).
  await pre.hover();
  const box = await pre.evaluate((el) => {
    const host = Array.from((el as HTMLElement).children).find(
      (child) => (child as HTMLElement).style.position === "absolute",
    ) as HTMLElement;
    const rect = host.getBoundingClientRect();
    return { x: rect.right - 12, y: rect.top + 14 };
  });
  await page.mouse.click(box.x, box.y);

  const snippets = await waitFor(
    () => driver.readSnippets(),
    (s) => s.length === 1,
  );
  // Gutter line numbers are stripped while relative code indentation is preserved (fixed in BUG-2 / T-026).
  expect(snippets[0].code).toBe(
    "function greet(name) {\n  return `Hello, ${name}`;\n}",
  );
  // Raw source retained.
  expect(snippets[0].raw).toContain("1 ");

  // Injected UI is absolutely positioned → layout must not shift.
  const widthAfter = await pre.evaluate(
    (el) => (el as HTMLElement).getBoundingClientRect().width,
  );
  expect(Math.abs(widthAfter - widthBefore)).toBeLessThan(1);
}

/**
 * S4 — Copy code in an IDE, open the popup, paste-save. The snippet is
 * created with source marked "clipboard".
 */
export async function s4ClipboardPasteSave(
  driver: ScenarioDriver,
): Promise<void> {
  await driver.resetStorage();
  const popup = await driver.popup();

  // Deterministic clipboard read (headless CI clipboard is unreliable);
  // the value below stands in for what a user copied in their IDE.
  await popup.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.resolve(),
        readText: () =>
          Promise.resolve("const cfg = 42;\nnavigator.userAgent;"),
      },
    });
  });

  await popup.getByRole("button", { name: /Paste from clipboard/i }).click();

  const snippets = await waitFor(
    () => driver.readSnippets(),
    (s) => s.length === 1,
  );
  expect(snippets[0].context.domain).toBe("clipboard");
  expect(snippets[0].code).toContain("const cfg = 42;");
  expect(snippets[0].context.pageTitle).toBe("Clipboard");
}

/**
 * S6 — Copy a snippet from the library. The clipboard content must match the
 * saved code exactly (tabs/spaces/newlines preserved).
 */
export async function s6CopyExact(driver: ScenarioDriver): Promise<void> {
  const code = 'if (a) {\n\treturn "x";   // keep spaces\n}\n';
  await driver.seedSnippets([
    seedSnippet({ code, raw: code, title: "Exact copy" }),
  ]);
  const popup = await driver.popup();

  await popup.evaluate(() => {
    window.__writes = [] as string[];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          (window as unknown as { __writes: string[] }).__writes.push(text);
          return Promise.resolve();
        },
        readText: () => Promise.resolve(""),
      },
    });
  });

  await popup.locator(".card .icon-btn").first().click();
  await popup.waitForTimeout(150);

  const written = await popup.evaluate(
    () => (window as unknown as { __writes: string[] }).__writes[0],
  );
  expect(written).toBe(code);
}

/**
 * S11 — A page with a strict CSP and a host that owns a closed shadow DOM.
 * The page's own code blocks are still instrumented, and capture degrades
 * gracefully (the shadow-host's <pre> is left alone, page keeps working).
 */
export async function s11StrictCspShadowDom(
  driver: ScenarioDriver,
): Promise<void> {
  const page = await driver.openPage("csp-shadow.html");

  // Two light-DOM <pre> blocks get instrumented despite the strict CSP.
  await expect(page.locator("pre[data-kuracode-ui]")).toHaveCount(2, {
    timeout: 15_000,
  });

  // The host page kept functioning.
  await expect(page.locator("#status")).toHaveText("loaded");

  // The page's own closed shadow root is untouched, our injection coexists.
  const hostSafe = await page.evaluate(() => {
    const host = document.getElementById("shadow-host") as unknown as {
      _ok?: boolean;
    };
    return host._ok === true;
  });
  expect(hostSafe).toBe(true);
}
