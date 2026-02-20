// src/tools/getPattern.ts
import matter from "gray-matter";
import { readTextFile } from "../utils/fs";
import { extractSections } from "../repo/sections";
import { makeRelativePath, PatternIndex } from "../repo/index";
import { StackRef, GetPatternResponse, PatternStatus, PatternDetail } from "../contracts/v1/types";

export type GetPatternArgs = {
  stack: StackRef;
  id: string;
};

export async function getPattern(
  index: PatternIndex,
  patternRepoPath: string,
  args: GetPatternArgs
): Promise<GetPatternResponse> {
  const { stack, id } = args;

  if (stack !== index.stack) {
    throw new Error(`Stack mismatch. Index=${index.stack}, requested=${stack}`);
  }

  const filePath = index.idToPath.get(id);
  if (!filePath) {
    throw new Error(`PATTERN_NOT_FOUND: No pattern with id '${id}' for stack '${stack}'`);
  }

  const raw = await readTextFile(filePath);

  console.error("[get_pattern] file path:", filePath);
console.error("[get_pattern] fileText length:", raw.length);
console.error("[get_pattern] has Golden Pattern heading:", raw.includes("## Golden Pattern"));
console.error("[get_pattern] has ToastProvider:", raw.includes("export function ToastProvider"));

  const parsed = matter(raw);

  const goldenLine = parsed.content
  .split("\n")
  .find((l) => /golden/i.test(l));
console.error("[get_pattern] line containing 'golden':", JSON.stringify(goldenLine));

  console.error("[get_pattern] parsed.content length:", parsed.content.length);
  console.error("[get_pattern] content has Golden Pattern heading:", parsed.content.includes("## Golden Pattern"));
  console.error("[get_pattern] content has Acceptance Checks heading:", parsed.content.includes("## Acceptance Checks"));
  console.error("[get_pattern] content has ToastProvider:", parsed.content.includes("export function ToastProvider"));
  
  
  const data = parsed.data as Record<string, unknown>;

  // Frontmatter fields (strict enough for v1)
  const patternId = String(data.id ?? "").trim();
  const status = String(data.status ?? "").trim() as PatternStatus;
  const summary = String(data.summary ?? "").trim();

  const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  const aliases = Array.isArray(data.aliases) ? data.aliases.map(String) : [];

  if (!patternId) throw new Error(`Pattern missing 'id' in frontmatter: ${filePath}`);
  if (patternId !== id) {
    throw new Error(`Pattern id mismatch. Requested '${id}', file declares '${patternId}' (${filePath})`);
  }

  // Optional but strongly recommended: validate declared stack matches folder stack
  const declaredStack = String(data.stack ?? "").trim();
  if (declaredStack && declaredStack !== stack) {
    throw new Error(
      `Pattern '${id}' declares stack='${declaredStack}' but is served under stack='${stack}'. File: ${filePath}`
    );
  }

  if (!summary) throw new Error(`Pattern missing 'summary' in frontmatter: ${filePath}`);

  const sections = extractSections(parsed.content);

  console.error("[get_pattern] extracted golden_pattern is null:", sections.golden_pattern === null);
console.error("[get_pattern] extracted golden_pattern length:", sections.golden_pattern?.length ?? 0);


  const detail: PatternDetail = {
    id,
    stack,
    status,
    summary,
    tags,
    aliases,
    sections,
    source: {
      relative_path: makeRelativePath(patternRepoPath, filePath),
    },
  };

  return {
    contract_version: "1.0",
    ...index.cache,
    pattern: detail,
  };
}