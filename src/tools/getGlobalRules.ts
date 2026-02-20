import { readTextFile } from "../utils/fs";
import { getRepoPaths } from "../repo/paths";
import { PatternIndex } from "../repo/index";
import { GetGlobalRulesResponse, StackRef } from "../contracts/v1/types";
import { parseGlobalRulesMarkdown } from "../repo/globalRules";

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

  console.error("[get_global_rules] stack:", stack);
console.error("[get_global_rules] baseline path:", baselinePath);

  const parsed = parseGlobalRulesMarkdown(fileText, stack);

  console.error("[get_global_rules] parsed meta.id:", parsed.meta.id);
console.error("[get_global_rules] total rules parsed:", parsed.rules.length);

console.error("[get_global_rules] parsed rules:", parsed.rules.length);
if (parsed.rules[0]) {
  console.error("[get_global_rules] first rule:", parsed.rules[0].id, parsed.rules[0].scope);
}

  // Override response TTL if the file declares it
  const cache_ttl_seconds = parsed.meta.cache_ttl_seconds ?? index.cache.cache_ttl_seconds;

  console.error("[get_global_rules] returning items length ======>", parsed.rules.length);

  return {
    contract_version: "1.0",
    stack,
    catalog_revision: index.cache.catalog_revision,
    cache_ttl_seconds,
    meta: parsed.meta,
    rules: {
      items: parsed.rules,
    },
  };
}