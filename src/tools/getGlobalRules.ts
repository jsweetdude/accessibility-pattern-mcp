import { readTextFile } from "../utils/fs";
import { getRepoPaths } from "../repo/paths";
import { PatternIndex } from "../repo/index";
import { GetGlobalRulesResponse, StackRef, RuleScope } from "../contracts/v1/types";
import { parseGlobalRulesMarkdown } from "../repo/globalRules";

export type GetGlobalRulesArgs = {
  stack: StackRef;
  scope?: RuleScope | RuleScope[];
};

function normalizeScope(scope?: RuleScope | RuleScope[]): RuleScope[] | null {
  if (!scope) return null;
  return Array.isArray(scope) ? scope : [scope];
}

export async function getGlobalRules(
  index: PatternIndex,
  patternRepoPath: string,
  args: GetGlobalRulesArgs
): Promise<GetGlobalRulesResponse> {
  const { stack } = args;

  if (stack !== index.stack) {
    throw new Error(`Stack mismatch. Index=${index.stack}, requested=${stack}`);
  }

  const scopeFilter = normalizeScope(args.scope);

  const { baselinePath } = getRepoPaths(patternRepoPath, stack);
  const fileText = await readTextFile(baselinePath);

  const parsed = parseGlobalRulesMarkdown(fileText, stack);

  const cache_ttl_seconds = parsed.meta.cache_ttl_seconds ?? index.cache.cache_ttl_seconds;

  const items = scopeFilter
    ? parsed.rules.filter((r) => r.scope.some((s) => scopeFilter.includes(s)))
    : parsed.rules;

  return {
    contract_version: "1.0",
    stack,
    catalog_revision: index.cache.catalog_revision,
    cache_ttl_seconds,
    meta: parsed.meta,
    rules: {
      scope_filter: scopeFilter, // additive
      items,
    },
  };
}