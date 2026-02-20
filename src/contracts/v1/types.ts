
/**
 * QUESTIONS
 *
 
 */


/**
 * contracts/v1/types.ts
 *
 * These are TypeScript "types" that describe the exact JSON shapes
 * your MCP tools will return.
 *
 * Types do NOT run at runtime. They help your editor catch mistakes.
 */

/**
 * MVP supports two stacks: "web/react" and "android/compose".
 * This type ensures we don't accidentally pass "web/raect" (typo) etc.
 *
 * Later, you can expand this to: "ios/swiftui" | ...
 */
export type StackRef = "web/react" | "android/compose";

/**
 * Common caching metadata added to every response.
 * - catalog_revision: a fingerprint (hash) of the repo state
 * - cache_ttl_seconds: how long clients can cache this response
 */
export type CacheMeta = {
  catalog_revision: string;
  cache_ttl_seconds: number;
};

/**
 * The allowed values for pattern status.
 * If a file says "betaa", TypeScript will complain (good!).
 */
export type PatternStatus = "alpha" | "beta" | "stable" | "deprecated";

/**
 * Optional execution guidance for clients consuming global rules.
 * - instruction: natural-language direction for how to apply the rules
 * - scopes_in_order: preferred precedence order for rule scopes
 */
export type ApplyPolicy = {
  instruction?: string;
  scopes_in_order?: string[];
};

/**
 * Metadata for get_global_rules() responses.
 * This describes the rule set identity, lifecycle status, and caching/apply hints.
 */
export type GlobalRulesMeta = {
  id: string;
  stack: StackRef;
  rule_set?: string;
  status?: PatternStatus;
  summary?: string;
  cache_ttl_seconds?: number;
  apply_policy?: ApplyPolicy;
};

/**
 * This is the SMALL pattern object returned from list_patterns().
 * It's intentionally tiny so the assistant can scan many patterns quickly.
 */
export type PatternSummary = {
  id: string;
  stack: StackRef;
  status: PatternStatus;
  summary: string;
  tags: string[];
  aliases: string[];
};

/**
 * These are the structured sections we want to extract from each .md file.
 * This makes the content deterministic for AI consumption.
 */
export type PatternSections = {
    use_when: string[];
    do_not_use_when: string[];
    must_haves: string[];
    customizable: string[];
    donts: string[];
    golden_pattern: string | null;
    raw_markdown?: string;
};

/**
 * The FULL pattern object returned from get_pattern(id).
 * It includes everything from PatternSummary plus the sections.
 */
export type PatternDetail = PatternSummary & {
  sections: PatternSections;

  /**
   * Optional: helpful debug info.
   * We can include this now or add it later—your call.
   */
  source?: {
    relative_path: string;
  };
};

/**
 * Each MCP tool response includes:
 * - contract_version: helps you evolve the API later (v2, v3...)
 * - stack (where applicable)
 * - CacheMeta
 *
 * These 3 types represent the EXACT JSON returned by each tool.
 */

export type GetGlobalRulesResponse = CacheMeta & {
  contract_version: "1.0";
  stack: StackRef;
  meta: GlobalRulesMeta;
  rules: {
    raw_markdown?: string;
  };
};

export type ListPatternsResponse = CacheMeta & {
  contract_version: "1.0";
  stack: StackRef;
  count: number;
  patterns: PatternSummary[];
};

export type GetPatternResponse = CacheMeta & {
  contract_version: "1.0";
  pattern: PatternDetail;
};

/**
 * Standard error shape (optional but recommended).
 * If something goes wrong, return this in a consistent format.
 */
export type ToolError = {
  code: string; // e.g. "PATTERN_NOT_FOUND"
  message: string;
  details?: Record<string, unknown>;
};
