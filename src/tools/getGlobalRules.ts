import matter from "gray-matter";
import { readTextFile } from "../utils/fs";
import { getRepoPaths } from "../repo/paths";
import { PatternIndex } from "../repo/index";
import {
  GetGlobalRulesResponse,
  GlobalRulesMeta,
  PatternStatus,
  StackRef,
} from "../contracts/v1/types";

export type GetGlobalRulesArgs = {
  stack: StackRef;
};

export async function getGlobalRules(
  index: PatternIndex,
  patternRepoPath: string,
  args: GetGlobalRulesArgs
): Promise<GetGlobalRulesResponse> {
  const { stack } = args;

  if (stack !== index.stack) {
    throw new Error(`Stack mismatch. Index=${index.stack}, requested=${stack}`);
  }

  const { baselinePath } = getRepoPaths(patternRepoPath, stack);
  const fileText = await readTextFile(baselinePath);

  const parsed = matter(fileText);
  const data = parsed.data as Record<string, unknown>;

  // Parse frontmatter into meta (light validation for v1)
  const meta: GlobalRulesMeta = {
    id: String(data.id ?? "").trim(),
    stack: (String(data.stack ?? "").trim() as StackRef) || stack,
    rule_set: typeof data.rule_set === "string" ? data.rule_set : undefined,
    status: typeof data.status === "string" ? (data.status as PatternStatus) : undefined,
    summary: typeof data.summary === "string" ? data.summary : undefined,
    cache_ttl_seconds:
      typeof data.cache_ttl_seconds === "number" ? data.cache_ttl_seconds : undefined,
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

  // If the file declares a stack, ensure it matches what we're serving
  if (meta.stack && meta.stack !== stack) {
    throw new Error(
      `Global rules meta.stack='${meta.stack}' does not match requested stack='${stack}'. File: ${baselinePath}`
    );
  }

  // IMPORTANT:
  // Override the TTL if the file declares one.
  // Keep catalog_revision from the index (fingerprint of repo state).
  const cache_ttl_seconds = meta.cache_ttl_seconds ?? index.cache.cache_ttl_seconds;

  return {
    contract_version: "1.0",
    stack,
    catalog_revision: index.cache.catalog_revision,
    cache_ttl_seconds,
    meta,
    rules: {},
  };
}