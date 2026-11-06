import { describe, expect, it } from "vitest";
import { generateReadableTitle } from "../src/shared/auto-title";
import { detectLanguage } from "../src/shared/cleaner";
import { formatExactTime, formatTimestampTooltip } from "../src/shared/date-formatter";

export const PROSE_SAMPLES = [
  // 1. Defect D4 Zstandard sentence
  "Created by Facebook, Zstandard is designed to scale dynamically from fast real-time streaming to deep archival storage (offering 22 compression levels).",
  // 2-6. News text
  "European markets rallied this morning following the central bank announcement regarding inflation forecasts.",
  "Scientists at CERN announced new findings from their latest particle collision experiments yesterday.",
  "Global supply chains showed signs of stabilization after months of shipping delays across Pacific ports.",
  "The space agency confirmed that the weather forecast remains favorable for the planned rocket launch tonight.",
  "Local authorities advised residents to remain indoors during the severe thunderstorm warning issued on Tuesday.",
  // 7-11. README paragraphs
  "This repository contains an open-source library for building modern web applications with reusable design systems.",
  "Welcome to our project documentation. Please refer to the contributing guidelines before submitting a pull request.",
  "Our goal is to provide developers with a fast, zero-dependency alternative to traditional utility toolkits.",
  "Getting started is simple. Clone the repository, install dependencies with your favorite package manager, and run tests.",
  "Special thanks to all contributors who helped improve the documentation and report edge case issues.",
  // 12-16. Emails
  "Hi Alex, please review the attached quarterly roadmap document and share your feedback before our sync.",
  "Thanks for reaching out! We received your support ticket and our engineering team is actively investigating.",
  "Just following up on our discussion yesterday regarding the deployment schedule for next month.",
  "Please note that our office will be closed on Monday in observance of the upcoming national holiday.",
  "Looking forward to catching up at the conference next week. Let me know if you want to grab lunch!",
  // 17-21. Markdown / prose
  "# Meeting Notes\n\nWe agreed on the architecture principles and decided to finalize the sprint goals tomorrow.",
  "## Summary of Accomplishments\n\nAll tasks were completed ahead of schedule with full test coverage.",
  "Here is a quick overview of why we decided to migrate our infrastructure to edge computing.",
  "Important reminder: ensure all team members have completed security awareness training before Friday.",
  "The quarterly report highlights a twenty percent increase in user satisfaction over the previous cycle.",
  // 22-26. URLs / references
  "Check out the official documentation at https://example.com/docs/getting-started for full tutorials.",
  "You can read the entire whitepaper on database replication at https://research.google.com/pubs/archive.html",
  "For more information on typography tokens and accessibility, visit https://www.w3.org/WAI/WCAG21/quickref/",
  "The API changelog is available at https://github.com/org/repo/releases for all historical versions.",
  "See the tutorial video on YouTube: https://www.youtube.com/watch?v=dQw4w9WgXcQ for a visual walkthrough.",
  // 27-31. Log lines / diagnostics prose
  "System startup completed successfully in 320 milliseconds with zero critical warnings.",
  "Backup procedure finished without any errors. Total archival volume: 4.2 gigabytes.",
  "Network latency to primary database cluster measured at 12ms during normal operating hours.",
  "Scheduled maintenance window will begin at midnight UTC and last approximately thirty minutes.",
  "Cache invalidation event dispatched to all edge nodes after content publication.",
  // 32-41. Additional mixed prose
  "Designed with developers in mind, the new keyboard navigation system enables instant access to all actions.",
  "A single click copies the exact snippet text to your clipboard without any extra formatting or junk.",
  "Workspaces allow you to separate personal bookmarks from professional team snippets securely.",
  "Please ensure that your device clock is synchronized with network time to avoid timestamp skew.",
  "The quick code generator creates a temporary four-digit PIN that expires automatically after fifteen minutes.",
  "We tested the layout across multiple display resolutions ranging from mobile screens to ultra-wide monitors.",
  "No personal data or browsing history is ever transmitted to third-party tracking services or analytics.",
  "Compression ratio benchmarks demonstrate significant savings when storing large JSON payloads.",
  "To create a new workspace, click the switcher menu in the top header and enter a descriptive name.",
  "The quick share feature lets you send short-lived codes to teammates on the same local network.",
];

describe("Defect D4: Prose labeled 'sql' and shown as code", () => {
  it("Zstandard prose sentence must not be classified as SQL or any code language", () => {
    const text = PROSE_SAMPLES[0];
    const detected = detectLanguage(null, text);
    // Failing assertion on baseline: currently returns "sql"
    expect(detected).toBe("text");
  });

  it("Prose misclassified as code across 41 samples must be under 2%", () => {
    let misclassified = 0;
    const details: Array<{ text: string; detected: string }> = [];

    for (const sample of PROSE_SAMPLES) {
      const detected = detectLanguage(null, sample);
      if (detected !== "text" && detected !== "markdown") {
        misclassified++;
        details.push({ text: sample.slice(0, 40), detected });
      }
    }

    const rate = misclassified / PROSE_SAMPLES.length;
    // Target: rate < 0.02 (at most 0 misclassified out of 41)
    expect(rate, `Misclassified ${misclassified}/${PROSE_SAMPLES.length}: ${JSON.stringify(details)}`).toBeLessThan(0.02);
  });
});

describe("Defect D3: Duplicate title and preview", () => {
  it("one-word item 'Feature' without custom title must not repeat 'Feature' as both title and code", () => {
    const code = "Feature";
    // Title generator should recognize this is single-word / prose without syntax structure
    const titleInfo = generateReadableTitle(code, "text");

    // D3 rule: If there is no user title and auto-title would repeat content,
    // do not generate a duplicate title; titleInfo should indicate no separate title needed or empty title
    expect(titleInfo.title).not.toBe("Feature");
    expect(titleInfo.title).not.toBe("Text: Feature");
  });
});

describe("Defect D10: Exact time and metadata context formatting", () => {
  it("formats today timestamp as '3:42 PM' style", () => {
    const now = new Date();
    now.setHours(15, 42, 0, 0);
    const formatted = formatExactTime(now.getTime());
    expect(formatted).toBe("3:42 PM");
  });

  it("formats yesterday timestamp as 'Yesterday 6:10 PM' style", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(18, 10, 0, 0);
    const formatted = formatExactTime(yesterday.getTime());
    expect(formatted).toBe("Yesterday 6:10 PM");
  });

  it("formats earlier date timestamp as 'D MMM, h:mm A' style", () => {
    const past = new Date(new Date().getFullYear(), 10, 3, 15, 42, 0, 0); // 3 Nov (3 days ago)
    const formatted = formatExactTime(past.getTime());
    expect(formatted).toContain("3 Nov");
    expect(formatted).toContain("3:42 PM");
  });

  it("generates full tooltip with timezone and capturing device", () => {
    const ts = Date.now();
    const tooltip = formatTimestampTooltip(ts, "MacBook Pro");
    expect(tooltip).toContain("Device: MacBook Pro");
    expect(tooltip).toContain("at");
  });
});
