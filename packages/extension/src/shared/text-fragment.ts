/**
 * Text Fragment URL Generator (Scroll to Text Fragment specification).
 * Computes #:~:text=[prefix-,]textStart[,textEnd][,-suffix]
 * Allows source URLs to scroll and highlight the exact captured code on compatible browsers.
 */

export function generateTextFragmentUrl(
  baseUrl: string,
  selectedText: string,
  prefix?: string,
  suffix?: string
): string {
  if (!baseUrl || !selectedText) return baseUrl || "";

  // Strip existing fragments
  const urlWithoutHash = baseUrl.split("#")[0];

  // Clean and encode snippet text for text-fragment spec
  const cleanSnippet = selectedText
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (cleanSnippet.length === 0) return baseUrl;

  const fragmentParam =
    cleanSnippet.length === 1
      ? encodeURIComponent(cleanSnippet[0].slice(0, 80))
      : `${encodeURIComponent(cleanSnippet[0].slice(0, 50))},${encodeURIComponent(cleanSnippet[cleanSnippet.length - 1].slice(0, 50))}`;

  let fullDirective = `#:~:text=${fragmentParam}`;
  if (prefix) {
    fullDirective = `#:~:text=${encodeURIComponent(prefix.slice(-20))}-,${fragmentParam}`;
  }
  if (suffix) {
    fullDirective = `${fullDirective},-${encodeURIComponent(suffix.slice(0, 20))}`;
  }

  return `${urlWithoutHash}${fullDirective}`;
}

export function isTextFragmentSupported(): boolean {
  if (typeof window === "undefined") return true;
  return "fragmentDirective" in document;
}
