import { describe, expect, it } from "vitest";
import { HybridLogicalClock } from "../src/shared/hlc";
import { generateReadableTitle } from "../src/shared/auto-title";

interface LegacySnippetV0 {
  id: string;
  title?: string;
  code: string;
  raw?: string;
  language?: string;
  url?: string;
  created?: number;
  tags?: string[];
}

interface ModernSnippetV1 {
  id: string;
  title: string;
  isAutoTitle?: boolean;
  code: string;
  raw: string;
  language: string;
  tags: string[];
  context: {
    sourceUrl: string;
    pageTitle: string;
    domain: string;
    capturedAt: number;
  };
  workspaceId: string | null;
  hlcTimestamp: {
    millis: number;
    counter: number;
    nodeId: string;
  };
  version: number;
}

/**
 * Migration function from legacy storage (v0.0.9 / N-1) to modern v0.1.0 schema.
 */
function migrateSnippetV0ToV1(legacy: LegacySnippetV0, deviceId: string): ModernSnippetV1 {
  const clock = new HybridLogicalClock(deviceId);
  const ts = clock.now(legacy.created || Date.now());

  let title = legacy.title?.trim();
  let isAuto = false;
  if (!title) {
    const auto = generateReadableTitle(legacy.code, legacy.language || "plaintext");
    title = auto.title;
    isAuto = auto.isAuto;
  }

  return {
    id: legacy.id,
    title,
    isAutoTitle: isAuto,
    code: legacy.code,
    raw: legacy.raw || legacy.code,
    language: legacy.language || "plaintext",
    tags: Array.isArray(legacy.tags) ? [...legacy.tags] : [],
    context: {
      sourceUrl: legacy.url || "",
      pageTitle: title,
      domain: legacy.url ? new URL(legacy.url).hostname : "",
      capturedAt: legacy.created || Date.now(),
    },
    workspaceId: null, // Personal space default
    hlcTimestamp: ts,
    version: 1,
  };
}

describe("Data Migration & Upgrade Compatibility (N-1 to N)", () => {
  it("migrates legacy v0.0.9 snippet data seamlessly to v0.1.0 without data loss", () => {
    const legacySnippets: LegacySnippetV0[] = [
      {
        id: "leg-1",
        code: "function add(a, b) { return a + b; }",
        language: "javascript",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        created: 1700000000000,
        tags: ["math", "utility"],
      },
      {
        id: "leg-2",
        title: "Custom React Hook",
        code: "useEffect(() => { init(); }, []);",
        language: "typescript",
        created: 1700005000000,
      },
    ];

    const migrated = legacySnippets.map((s) => migrateSnippetV0ToV1(s, "migrated-device-1"));

    // Verify snippet 1
    expect(migrated[0].id).toBe("leg-1");
    expect(migrated[0].code).toBe(legacySnippets[0].code);
    expect(migrated[0].tags).toEqual(["math", "utility"]);
    expect(migrated[0].context.sourceUrl).toBe("https://developer.mozilla.org/en-US/docs/Web/JavaScript");
    expect(migrated[0].context.domain).toBe("developer.mozilla.org");
    expect(migrated[0].workspaceId).toBeNull(); // assigned to personal space
    expect(migrated[0].hlcTimestamp.millis).toBeGreaterThanOrEqual(1700000000000);
    // Semantic auto-title generated for snippet without title
    expect(migrated[0].title).toBe("Javascript add() function");
    expect(migrated[0].isAutoTitle).toBe(true);

    // Verify snippet 2
    expect(migrated[1].id).toBe("leg-2");
    expect(migrated[1].title).toBe("Custom React Hook"); // preserves existing custom title
    expect(migrated[1].isAutoTitle).toBe(false);
    expect(migrated[1].tags).toEqual([]);
    expect(migrated[1].version).toBe(1);
  });

  it("ensures monotonic causality is assigned to migrated records", () => {
    const s1: LegacySnippetV0 = { id: "1", code: "const a = 1;", created: 1000 };
    const s2: LegacySnippetV0 = { id: "2", code: "const b = 2;", created: 2000 };

    const m1 = migrateSnippetV0ToV1(s1, "dev-test");
    const m2 = migrateSnippetV0ToV1(s2, "dev-test");

    expect(HybridLogicalClock.compare(m2.hlcTimestamp, m1.hlcTimestamp)).toBeGreaterThan(0);
  });
});

