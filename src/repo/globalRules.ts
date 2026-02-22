import matter from "gray-matter";
import {
  GlobalRule,
  GlobalRulesMeta,
  PatternStatus,
  StackRef,
  RuleScope,
  CodeSnippet,
  ApplyPolicy,
} from "../contracts/v1/types";

type ParseGlobalRulesResult = {
  meta: GlobalRulesMeta;
  rules: GlobalRule[];
};

// Keep allowed values centralized and deterministic.
const ALLOWED_SCOPES: RuleScope[] = ["utility", "style", "component", "layout", "page"];

function normalizeScopeToken(raw: string): string {
  return raw.trim().toLowerCase();
}

function assertIsRuleScope(value: string, ctx: string): RuleScope {
  const v = normalizeScopeToken(value) as RuleScope;
  if (!ALLOWED_SCOPES.includes(v)) {
    throw new Error(`${ctx}: invalid scope '${value}'. Allowed: ${ALLOWED_SCOPES.join(", ")}`);
  }
  return v;
}

function toRuleScopeArray(raw: string[], ctx: string): RuleScope[] {
  const out: RuleScope[] = [];
  for (const s of raw) out.push(assertIsRuleScope(s, ctx));
  // de-dupe + deterministic ordering
  return Array.from(new Set(out)).sort((a, b) => a.localeCompare(b));
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const arr = value.map(String).map((s) => s.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

function parseApplyPolicy(value: unknown, ctx: string): ApplyPolicy | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as any;

  const instruction = typeof v.instruction === "string" ? v.instruction : undefined;

  const rawScopes = parseStringArray(v.scopes_in_order);
  const scopes_in_order = rawScopes
    ? toRuleScopeArray(rawScopes, `${ctx}: apply_policy.scopes_in_order`)
    : undefined;

  const policy: ApplyPolicy = {};
  if (instruction) policy.instruction = instruction;
  if (scopes_in_order) policy.scopes_in_order = scopes_in_order;

  return Object.keys(policy).length ? policy : undefined;
}

export function parseGlobalRulesMarkdown(
  fileText: string,
  expectedStack: StackRef
): ParseGlobalRulesResult {
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
    cache_ttl_seconds:
      typeof data.cache_ttl_seconds === "number" ? data.cache_ttl_seconds : undefined,
    apply_policy: parseApplyPolicy(data.apply_policy, "global rules frontmatter"),
  };

  if (!meta.id) {
    throw new Error("Global rules file missing frontmatter 'id'.");
  }
  if (meta.stack !== expectedStack) {
    throw new Error(
      `Global rules frontmatter stack='${meta.stack}' does not match requested stack='${expectedStack}'.`
    );
  }

  // Optional: validate status if present (keeps v1 strict-ish)
  if (meta.status) {
    const allowed: PatternStatus[] = ["alpha", "beta", "stable", "deprecated"];
    if (!allowed.includes(meta.status)) {
      throw new Error(
        `Global rules frontmatter has invalid status='${meta.status}'. Allowed: ${allowed.join(", ")}`
      );
    }
  }

  // ---- Parse rules ----
  const ruleBlocks = splitByH2Rule(body);
  const rules: GlobalRule[] = ruleBlocks.map((block) => parseOneRule(block));

  // Deterministic ordering: by id
  rules.sort((a, b) => a.id.localeCompare(b.id));

  // Optional: enforce no duplicate rule ids
  const seen = new Set<string>();
  for (const r of rules) {
    if (seen.has(r.id)) {
      throw new Error(`Duplicate global rule id '${r.id}' found.`);
    }
    seen.add(r.id);
  }

  return { meta, rules };
}

/**
 * Splits the markdown content into rule blocks based on "## Rule: ..."
 * Slightly forgiving: allows extra spaces and different casing.
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
    const match = line.match(/^##\s+Rule:\s*(.*)\s*$/i);
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
    throw new Error(
      `Rule '${title}' is missing a \`\`\`yaml fenced block with 'id' and 'scope'.`
    );
  }

  const { id, scope } = parseRuleYaml(yamlFence.code, `Rule '${title}'`);
  if (!id) throw new Error(`Rule '${title}' yaml block is missing 'id'.`);
  if (!scope.length) throw new Error(`Rule '${title}' yaml block is missing 'scope'.`);

  // 2) Extract sections by "### Heading"
  const sections = splitByH3(body);

  const must_haves = toBullets(sections["must haves"]);
  const donts = toBullets(sections["don'ts"] ?? sections["donts"]);
  const acceptance_checks = toBullets(sections["acceptance checks"]);

  // 3) Snippets: collect *all* fenced blocks under "### Snippets"
  const snippetsMarkdown = sections["snippets"] ?? "";
  const snippets: CodeSnippet[] = allFencedBlocks(snippetsMarkdown)
    .map((b) => ({ language: b.language, code: b.code }))
    // Deterministic ordering: language then code
    .sort((a, b) => (a.language + "\n" + a.code).localeCompare(b.language + "\n" + b.code));

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
    const match = line.match(/^###\s+(.*)\s*$/);
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
 * Also supports basic one-level nesting.
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

    // Nested bullet (2+ spaces then -/*)
    const nestedMatch = line.match(/^\s{2,}[-*]\s+(.*)$/);
    if (nestedMatch && current) {
      nested.push(nestedMatch[1].trim());
      continue;
    }

    // Top-level bullets at column 0
    const topDash = line.match(/^[-*]\s+(.*)$/);
    const topNum = line.match(/^\d+\.\s+(.*)$/);
    if (topDash || topNum) {
      flushCurrent();
      current = (topDash?.[1] ?? topNum?.[1] ?? "").trim();
      continue;
    }

    // Wrapped text continues current bullet
    if (current) {
      current = `${current} ${trimmed}`.trim();
    }
  }

  flushCurrent();
  return items;
}

/**
 * Finds the first fenced block of a given language, e.g. ```yaml ... ```
 * More forgiving: allows optional whitespace after language and tolerates missing trailing newline.
 */
function firstFencedBlock(
  markdown: string,
  language: string
): { language: string; code: string } | null {
  const re = new RegExp(
    "```" + language + "\\s*\\n([\\s\\S]*?)\\n?```",
    "i"
  );
  const m = markdown.match(re);
  if (!m) return null;
  return { language: language.toLowerCase(), code: m[1].trim() };
}

/**
 * Collect all fenced code blocks inside a chunk (any language).
 */
function allFencedBlocks(markdown: string): Array<{ language: string; code: string }> {
  const re = /```([a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)\n?```/g;
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
 * Minimal YAML parsing for the fields you use:
 * - id: something
 * - scope: [a, b]
 * - OR scope:
 *     - a
 *     - b
 *
 * We keep MVP simple, but robust against common YAML patterns.
 */
function parseRuleYaml(
  yamlText: string,
  ctx: string
): { id: string; scope: RuleScope[] } {
  // id: value
  const idMatch = yamlText.match(/^\s*id:\s*(.+)\s*$/m);
  const id = idMatch ? idMatch[1].trim() : "";

  // scope: [a, b]
  const scopeInline = yamlText.match(/^\s*scope:\s*\[(.*)\]\s*$/m);
  if (scopeInline) {
    const raw = scopeInline[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return { id, scope: toRuleScopeArray(raw, `${ctx}: scope`) };
  }

  // scope:
  //   - a
  //   - b
  const scopeBlock = yamlText.match(/^\s*scope:\s*$(?:\r?\n([\s\S]*))?/m);
  if (scopeBlock) {
    const after = yamlText.split(/\r?\n/);
    const startIndex = after.findIndex((l) => /^\s*scope:\s*$/.test(l));
    const raw: string[] = [];

    if (startIndex >= 0) {
      for (let i = startIndex + 1; i < after.length; i++) {
        const line = after[i];
        // stop when a new top-level key begins (e.g. "title:" etc.)
        if (/^\S+\s*:/.test(line)) break;
        const m = line.match(/^\s*-\s*(.+)\s*$/);
        if (m) raw.push(m[1].trim());
      }
    }

    return { id, scope: toRuleScopeArray(raw, `${ctx}: scope`) };
  }

  // No scope found
  return { id, scope: [] };
}