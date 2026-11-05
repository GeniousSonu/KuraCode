import { describe, it, expect } from "vitest";
import { cleanCode } from "../src/shared/cleaner";
import { makeSnippet } from "../src/shared/storage";

describe("Code Capture & Round-Trip Fidelity (BUG-2)", () => {
  it("preserves exact multi-line structure and indentation for MDN snippet", () => {
    const mdnRaw = `const numbers = [1, 4, 9];\nconst roots = numbers.map((num) => Math.sqrt(num));\n\nconsole.log(roots);\n// Expected output: Array [1, 2, 3]`;
    const cleaned = cleanCode(mdnRaw);
    expect(cleaned).toBe(mdnRaw);
    expect(cleaned.split("\n").length).toBe(5);
  });

  it("preserves indented blocks and removes gutters without eating code indentation", () => {
    const rawGutter = `1   function computeSum(a: number, b: number): number {\n2     const result = a + b;\n3     return result;\n4   }`;
    const cleaned = cleanCode(rawGutter);
    const expected = `function computeSum(a: number, b: number): number {\n  const result = a + b;\n  return result;\n}`;
    expect(cleaned).toBe(expected);
  });

  it("handles CRLF line endings cleanly", () => {
    const crlf = "export default function handler() {\r\n  return 200;\r\n}";
    const cleaned = cleanCode(crlf);
    expect(cleaned).toBe("export default function handler() {\n  return 200;\n}");
    expect(cleaned.includes("\r")).toBe(false);
  });

  it("preserves minified single-line code without mangling", () => {
    const minified = `!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():e.Kura=t()}(this,function(){return{ready:!0}});`;
    const cleaned = cleanCode(minified);
    expect(cleaned).toBe(minified);
  });

  it("property test: preserves exact line counts, indentation, and structure across random code topologies", () => {
    // Generate 50 randomized multi-line code samples
    for (let i = 0; i < 50; i++) {
      const lineCount = 3 + Math.floor(Math.random() * 20);
      const lines: string[] = [];

      for (let j = 0; j < lineCount; j++) {
        const indentLevel = Math.floor(Math.random() * 4);
        const indent = "  ".repeat(indentLevel);
        if (j > 0 && Math.random() < 0.2) {
          lines.push(""); // empty blank line
        } else {
          lines.push(`${indent}const var_${j} = processValue(${j});`);
        }
      }

      const originalCode = lines.join("\n");
      const cleaned = cleanCode(originalCode);

      // Verify line counts match expected (accounting for collapsed 3+ blanks to 2)
      const expectedLines = originalCode.replace(/\n{3,}/g, "\n\n").trimEnd().split("\n");
      expect(cleaned.split("\n").length).toBe(expectedLines.length);

      // Verify each non-empty line has exact indentation preserved
      const cleanedLines = cleaned.split("\n");
      for (let k = 0; k < cleanedLines.length; k++) {
        if (expectedLines[k].trim().length > 0) {
          const originalIndent = expectedLines[k].match(/^\s*/)?.[0] || "";
          const cleanedIndent = cleanedLines[k].match(/^\s*/)?.[0] || "";
          expect(cleanedIndent).toBe(originalIndent);
        }
      }

      // Verify snippet domain model stores it byte-exact
      const snippet = makeSnippet({
        title: "Test",
        code: cleaned,
        raw: originalCode,
        language: "typescript",
        context: { sourceUrl: "", pageTitle: "", domain: "", capturedAt: Date.now() },
      });
      expect(snippet.code).toBe(cleaned);
      expect(snippet.raw).toBe(originalCode);
    }
  });
});
