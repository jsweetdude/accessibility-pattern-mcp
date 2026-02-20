"use strict";
// src/repo/sections.ts
/**
 * Goal:
 * Turn a markdown body into deterministic sections for AI consumption.
 *
 * This is intentionally "good enough" for v1:
 * - It relies on headings (## Heading)
 * - It extracts bullet lists into string arrays
 * - It preserves Golden Pattern as markdown (often contains code blocks)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSections = extractSections;
// Headings we recognize, mapped to keys in ParsedSections.
// Add more later without changing the rest of the parser.
const HEADING_TO_KEY = {
    "use when": "use_when",
    "do not use when": "do_not_use_when",
    "must haves": "must_haves",
    "customizable": "customizable",
    "don'ts": "donts",
    "don’ts": "donts",
    "donts": "donts",
    "golden pattern": "golden_pattern",
};
/**
 * Extract sections from markdown (content without frontmatter).
 */
function extractSections(markdownBody) {
    const normalized = markdownBody
        .replace(/\r\n/g, "\n")
        // normalize non-breaking spaces to regular spaces
        .replace(/\u00A0/g, " ")
        // normalize curly apostrophes to ASCII apostrophe
        .replace(/[’‘]/g, "'");
    // We’ll build up sections as raw markdown chunks first.
    const rawByKey = {};
    // Default output
    const out = {
        use_when: [],
        do_not_use_when: [],
        must_haves: [],
        customizable: [],
        donts: [],
        golden_pattern: null,
    };
    // Split by headings like: ## Something
    // We keep the heading text so we know where each chunk belongs.
    const parts = splitByH2(normalized);
    for (const part of parts) {
        const heading = (part.heading ?? "")
            .replace(/\u00A0/g, " ")
            .replace(/[’‘]/g, "'")
            .trim()
            .toLowerCase()
            .replace(/[:.]+$/, ""); // tolerate "Golden Pattern:" style
        const key = HEADING_TO_KEY[heading];
        if (!key)
            continue;
        rawByKey[key] = (part.body ?? "").trim();
    }
    // Convert list-like sections to arrays
    out.use_when = toBulletArray(rawByKey.use_when);
    out.do_not_use_when = toBulletArray(rawByKey.do_not_use_when);
    out.must_haves = toBulletArray(rawByKey.must_haves);
    out.customizable = toBulletArray(rawByKey.customizable);
    out.donts = toBulletArray(rawByKey.donts);
    // Golden Pattern is special: keep markdown as-is (often code fences)
    const golden = (rawByKey.golden_pattern ?? "").trim();
    out.golden_pattern = golden.length > 0 ? golden : null;
    return out;
}
/**
 * Splits markdown by "##" headings.
 * Returns an array like:
 * - { heading: "Use when", body: "..." }
 * - { heading: "Must haves", body: "..." }
 */
function splitByH2(markdown) {
    const lines = markdown.split("\n");
    const result = [];
    let currentHeading = null;
    let currentBody = [];
    function pushCurrent() {
        // Don’t push empty preamble
        if (currentHeading === null && currentBody.join("\n").trim() === "")
            return;
        result.push({ heading: currentHeading, body: currentBody.join("\n") });
    }
    for (const line of lines) {
        const match = line.match(/^##[ \t\u00A0]+(.*)$/);
        if (match) {
            // New section begins
            pushCurrent();
            currentHeading = match[1].trim();
            currentBody = [];
        }
        else {
            currentBody.push(line);
        }
    }
    pushCurrent();
    return result;
}
/**
 * Converts a markdown chunk into a list of bullet strings.
 * Supports:
 * - "- item"
 * - "* item"
 * - "1. item" (simple numbered lists)
 *
 * If the section isn't a list, we return [] (v1 simplicity).
 */
function toBulletArray(sectionMarkdown) {
    if (!sectionMarkdown)
        return [];
    const lines = sectionMarkdown.replace(/\r\n/g, "\n").split("\n");
    const items = [];
    let current = null;
    let nested = [];
    function flushCurrent() {
        if (!current)
            return;
        if (nested.length > 0) {
            items.push(`${current}\n${nested.map((n) => `  - ${n}`).join("\n")}`);
        }
        else {
            items.push(current);
        }
        current = null;
        nested = [];
    }
    for (const rawLine of lines) {
        const line = rawLine.replace(/\t/g, "  ");
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        // One-level nested bullets must be handled before top-level matching.
        const nestedMatch = line.match(/^\s{2,}[-*]\s+(.*)$/);
        if (nestedMatch && current) {
            nested.push(nestedMatch[1].trim());
            continue;
        }
        // Top-level bullets start at column 0.
        const topDash = line.match(/^[-*]\s+(.*)$/);
        const topNum = line.match(/^\d+\.\s+(.*)$/);
        if (topDash || topNum) {
            flushCurrent();
            current = (topDash?.[1] ?? topNum?.[1] ?? "").trim();
            continue;
        }
        // Wrapped text continues the active top-level bullet.
        if (current) {
            current = `${current} ${trimmed}`.trim();
        }
    }
    flushCurrent();
    return items;
}
