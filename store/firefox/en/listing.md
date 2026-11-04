# Mozilla Firefox Add-ons (AMO) Listing Package (en-US)

## Store Details
- **Add-on Name:** KuraCode — Code Snippet Capture & Collaboration
- **Add-on Summary (max 250 chars):**
  Capture, clean, and organize code from any website with source context intact. Strips line numbers and shell prompts, keeping clean code locally.
- **Gecko ID:** `kuracode@sahinur.islam`
- **Minimum Firefox Version:** `115.0`
- **License:** MIT License
- **Categories:** Developer Tools, Web Development
- **Tags:** code, developer, snippets, syntax, programming

---

## Detailed Description
```markdown
KuraCode is a local-first, zero-friction snippet memory for software engineers and technical writers.

Detect code blocks on any webpage, strip away distracting line numbers and command prompts, and preserve your snippets alongside their original source URL and heading.

FEATURES
• 1-Click Code Capture: Hover over `<pre>` code elements and click "Save".
• Shortcut Capture: Select text and press Ctrl+Shift+S (Cmd+Shift+S).
• Intelligent Cleanup: Automatically removes line gutters, `$`, and `PS >` prompts.
• Provenance Tracking: Records domain, source page URL, and heading context.
• Local Sandbox Storage: Purely local-first. No tracking, telemetry, or external servers.
```

---

## Notes to Reviewer (Reviewer Information)
```markdown
Dear Mozilla Add-on Reviewer:

Build and Source Verification:
- All source code is completely open and build instructions are provided in SOURCE_BUILD_INSTRUCTIONS.md inside the attached source zip file (kuracode-source-0.1.0.zip).
- The package is bundled with standard esbuild into IIFE format to comply with WebExtension standards.
- No obfuscated or encrypted code is present.
- Zero remote scripts are executed.

Data Collection Declaration:
- KuraCode does not collect, transmit, or monetize any personal or behavioral data.
- The gecko configuration includes data_collection_permissions = { required: ["none"] }.

Testing the Add-on:
1. Load the built extension via about:debugging -> "Load Temporary Add-on" using manifest.json in packages/extension/.output/firefox-mv3/.
2. Visit any site with code blocks (e.g. MDN Web Docs).
3. Hover over a code block, click "Save", and inspect the popup via the toolbar icon.
```
