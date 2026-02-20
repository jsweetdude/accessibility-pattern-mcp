import matter from "gray-matter";
import { GlobalRule, GlobalRulesMeta, PatternStatus, StackRef } from "../contracts/v1/types";

type ParseGlobalRulesResult = {
  meta: GlobalRulesMeta;
  rules: GlobalRule[];
};

export function parseGlobalRulesMarkdown(fileText: string, expectedStack: StackRef): ParseGlobalRulesResult {
  const parsed = matter(fileText);
  const data = parsed.data as Record<string, unknown>;
  const body = parsed.content.replace(/\r\n/g, "\n").trim();

  // ---- Frontmatter -> meta (light validation) ----
  const meta: GlobalRulesMeta = {
    id: String(data.id ?? "").trim(),
    stack: (String(data.stack ?? "").trim() as StackRef) || expectedStack,
    rule_set: typeof data.rule_set === "string" ? data.rule_set : undefined,
    status: typeof data.status === "string" ? (data.status as PatternStatus) : undefined,
    summary: typeof data.summary === "string" ? data.summary : undefined,
    cache_ttl_seconds: typeof data.cache_ttl_seconds === "number" ? data.cache_ttl_seconds : undefined,
    apply_policy:
      typeof data.apply_policy === "object" && data.apply_policy
        ? {
            instruction:
              typeof (data.apply_policy as any).instruction === "string"
                ? (data.apply_policy as any).instruction
                : undefined,
            scopes_in_order: Array.isArray((data.apply_policy as any).scopes_in_order)
              ? (data.apply_policy as any).scopes_in_order.map(String)
              : undefined,
          }
        : undefined,
  };

  if (!meta.id) {
    throw new Error("Global rules file missing frontmatter 'id'.");
  }
  if (meta.stack !== expectedStack) {
    throw new Error(`Global rules frontmatter stack='${meta.stack}' does not match requested stack='${expectedStack}'.`);
  }

  // ---- Parse rules ----
  // Your format uses: "## Rule: XYZ" ... then a fenced yaml block with id + scope ... then ### sections.
  const ruleBlocks = splitByH2Rule(body);

  const rules: GlobalRule[] = ruleBlocks.map((block) => parseOneRule(block));

  // Deterministic ordering: by id
  rules.sort((a, b) => a.id.localeCompare(b.id));

  return { meta, rules };
}

/**
 * Splits the markdown content into rule blocks based on "## Rule: ..."
 */
function splitByH2Rule(markdown: string): Array<{ title: string; body: string }> {
  const lines = markdown.split("\n");

  const blocks: Array<{ title: string; body: string }> = [];
  let currentTitle: string | null = null;
  let currentBody: string[] = [];

  function push() {
    if (!currentTitle) return;
    blocks.push({ title: currentTitle, body: currentBody.join("\n").trim() });
  }

  for (const line of lines) {
    const match = line.match(/^##\s+Rule:\s+(.*)$/i);
    if (match) {
      push();
      currentTitle = match[1].trim();
      currentBody = [];
    } else {
      if (currentTitle) currentBody.push(line);
    }
  }

  push();
  return blocks;
}

/**
 * Parse a single rule block into a deterministic GlobalRule object.
 */
function parseOneRule(block: { title: string; body: string }): GlobalRule {
  const { title, body } = block;

  // 1) Extract the first fenced yaml block: ```yaml ... ```
  const yamlFence = firstFencedBlock(body, "yaml");
  if (!yamlFence) {
    throw new Error(`Rule '${title}' is missing a \`\`\`yaml fenced block with id + scope.`);
  }

  const { id, scope } = parseRuleYaml(yamlFence.code);
  if (!id) throw new Error(`Rule '${title}' yaml block is missing 'id'.`);
  if (!scope || scope.length === 0) throw new Error(`Rule '${title}' yaml block is missing 'scope'.`);

  // 2) Extract sections by "### Heading"
  const sections = splitByH3(body);

  const must_haves = toBullets(sections["must haves"]);
  const donts = toBullets(sections["don'ts"] ?? sections["donts"]);
  const acceptance_checks = toBullets(sections["acceptance checks"]);

  // 3) Snippets: collect *all* fenced blocks under "### Snippets"
  const snippetsMarkdown = sections["snippets"] ?? "";
  const snippets = allFencedBlocks(snippetsMarkdown).map((b) => ({
    language: b.language,
    code: b.code,
  }));

  return {
    id,
    title,
    scope,
    must_haves,
    donts,
    acceptance_checks,
    snippets,
  };
}

/**
 * Splits a markdown chunk into a map of H3 sections:
 * "### Must Haves" -> "...", "### Don'ts" -> "..."
 */
function splitByH3(markdown: string): Record<string, string> {
  const lines = markdown.split("\n");

  const out: Record<string, string> = {};
  let currentKey: string | null = null;
  let currentBody: string[] = [];

  function push() {
    if (!currentKey) return;
    out[currentKey] = currentBody.join("\n").trim();
  }

  for (const line of lines) {
    const match = line.match(/^###\s+(.*)$/);
    if (match) {
      push();
      currentKey = match[1].trim().toLowerCase();
      currentBody = [];
    } else {
      if (currentKey) currentBody.push(line);
    }
  }

  push();
  return out;
}

/**
 * Convert a section's markdown to bullet array.
 * Supports:
 * - "- item"
 * - "* item"
 * - "1. item"
 */
function toBullets(sectionMarkdown?: string): string[] {
  if (!sectionMarkdown) return [];
  const lines = sectionMarkdown.replace(/\r\n/g, "\n").split("\n");
  const items: string[] = [];

  let current: string | null = null;
  let nested: string[] = [];

  function flushCurrent() {
    if (!current) return;
    if (nested.length > 0) {
      items.push(`${current}\n${nested.map((n) => `  - ${n}`).join("\n")}`);
    } else {
      items.push(current);
    }
    current = null;
    nested = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "  ");
    const trimmed = line.trim();
    if (!trimmed) continue;

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

/**
 * Finds the first fenced block of a given language, e.g. ```yaml ... ```
 */
function firstFencedBlock(markdown: string, language: string): { language: string; code: string } | null {
  const re = new RegExp("```" + language + "\\s*\\n([\\s\\S]*?)\\n```", "i");
  const m = markdown.match(re);
  if (!m) return null;
  return { language: language.toLowerCase(), code: m[1].trim() };
}

/**
 * Collect all fenced code blocks inside a chunk (any language).
 */
function allFencedBlocks(markdown: string): Array<{ language: string; code: string }> {
  const re = /```([a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)\n```/g;
  const blocks: Array<{ language: string; code: string }> = [];

  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const language = (m[1] ?? "").trim().toLowerCase() || "text";
    const code = (m[2] ?? "").trim();
    blocks.push({ language, code });
  }

  return blocks;
}

/**
 * Minimal YAML parsing for the two fields you use:
 * id: something
 * scope: [a, b]
 *
 * (We avoid full YAML libs for MVP.)
 */
function parseRuleYaml(yamlText: string): { id: string; scope: string[] } {
  const idMatch = yamlText.match(/^\s*id:\s*(.+)\s*$/m);
  const scopeMatch = yamlText.match(/^\s*scope:\s*\[(.*)\]\s*$/m);

  const id = idMatch ? idMatch[1].trim() : "";
  const scope =
    scopeMatch && scopeMatch[1]
      ? scopeMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  return { id, scope };
}