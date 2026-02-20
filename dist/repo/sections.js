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
    "donts": "donts",
    "golden pattern": "golden_pattern_markdown",
};
/**
 * Extract sections from markdown (content without frontmatter).
 */
function extractSections(markdownBody) {
    const normalized = markdownBody.replace(/\r\n/g, "\n");
    // We’ll build up sections as raw markdown chunks first.
    const rawByKey = {};
    // Default output
    const out = {
        use_when: [],
        do_not_use_when: [],
        must_haves: [],
        customizable: [],
        donts: [],
        golden_pattern_markdown: null,
        raw_markdown: normalized.trim(),
    };
    // Split by headings like: ## Something
    // We keep the heading text so we know where each chunk belongs.
    const parts = splitByH2(normalized);
    for (const part of parts) {
        const heading = part.heading?.trim().toLowerCase() ?? "";
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
    const golden = (rawByKey.golden_pattern_markdown ?? "").trim();
    out.golden_pattern_markdown = golden.length > 0 ? golden : null;
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
        const match = line.match(/^##\s+(.*)$/);
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
    const lines = sectionMarkdown.split("\n").map((l) => l.trim());
    const items = [];
    for (const line of lines) {
        // unordered bullets
        const dash = line.match(/^[-*]\s+(.*)$/);
        if (dash) {
            items.push(dash[1].trim());
            continue;
        }
        // numbered list
        const num = line.match(/^\d+\.\s+(.*)$/);
        if (num) {
            items.push(num[1].trim());
            continue;
        }
    }
    return items;
}
