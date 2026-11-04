import { test, expect } from "./extension";

// Smoke test: the content script attaches the KuraCode capture engine to code
// blocks. The injected UI lives in a closed shadow DOM inside <pre>; the
// observable light-DOM effect is the `data-kuracode-ui` attribute on <pre>.
test("content script instruments <pre> code blocks", async ({ page }) => {
  await page.goto("http://localhost:8931/simple.html");

  const pre = page.locator("pre[data-kuracode-ui]");
  await expect(pre).toHaveCount(1, { timeout: 15_000 });
});
