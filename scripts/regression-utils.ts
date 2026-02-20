/* scripts/regression-utils.ts */
import fs from "node:fs";

export function loadJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

// Stable stringify for snapshots
export function stableStringify(value: any): string {
  return JSON.stringify(value, null, 2);
}

// Deep-sort object keys (does NOT reorder arrays)
export function deepSortObjectKeys(input: any): any {
  if (Array.isArray(input)) return input.map(deepSortObjectKeys);
  if (input && typeof input === "object") {
    const keys = Object.keys(input).sort();
    const out: any = {};
    for (const k of keys) out[k] = deepSortObjectKeys(input[k]);
    return out;
  }
  return input;
}

// Strip volatile fields and enforce a few deterministic normalizations
export function normalizeForSnapshot(
  input: any,
  opts: { ignoreCacheTtl: boolean }
): any {
  return walk(input);

  function walk(v: any): any {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out: any = {};
      for (const [k, val] of Object.entries(v)) {
        if (k === "catalog_revision") continue;
        if (opts.ignoreCacheTtl && k === "cache_ttl_seconds") continue;
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  }
}

/**
 * Minimal shape validation (kept intentionally light).
 * Once I see types.ts, I can tighten this to match your exact contracts.
 */
export function validateToolResponseShape(
  tool: "list_patterns" | "get_pattern" | "get_global_rules",
  resp: any
) {
  if (!resp || typeof resp !== "object") {
    throw new Error(`Tool response is not an object for ${tool}`);
  }

  // Common contract fields that exist today (based on your description)
  if (!("stack" in resp)) throw new Error(`Missing 'stack' in ${tool} response`);

  switch (tool) {
    case "list_patterns":
      if (!Array.isArray(resp.patterns)) {
        throw new Error(`list_patterns: missing/invalid 'patterns' array`);
      }
      // Require stable minimal keys in each PatternSummary
      for (const p of resp.patterns) {
        for (const key of ["id", "title", "tags"] as const) {
          if (!(key in p)) throw new Error(`list_patterns: pattern missing '${key}'`);
        }
        if (!Array.isArray(p.tags)) throw new Error(`list_patterns: tags must be array`);
      }
      break;

    case "get_pattern":
      for (const key of [
        "id",
        "use_when",
        "do_not_use_when",
        "must_haves",
        "customizable",
        "donts",
        "golden_pattern",
      ] as const) {
        if (!(key in resp)) throw new Error(`get_pattern: missing '${key}'`);
      }
      if (!Array.isArray(resp.customizable)) {
        throw new Error(`get_pattern: customizable must be array (even if empty)`);
      }
      break;

    case "get_global_rules":
      if (!resp.meta || typeof resp.meta !== "object") {
        throw new Error(`get_global_rules: missing 'meta' object`);
      }
      if (!resp.rules || typeof resp.rules !== "object") {
        throw new Error(`get_global_rules: missing 'rules' object`);
      }
      if (!Array.isArray(resp.rules.items)) {
        throw new Error(`get_global_rules: rules.items must be array`);
      }
      break;
  }
}