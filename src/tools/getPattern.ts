// src/tools/getPattern.ts
import matter from "gray-matter";
import { readTextFile } from "../utils/fs.js";
import { extractSections } from "../repo/sections.js";
import { makeRelativePath, PatternIndex } from "../repo/index.js";
import { StackRef, GetPatternResponse, PatternStatus, PatternDetail } from "../contracts/v1/types.js";

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

  const parsed = matter(raw);

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