/* scripts/regression-utils.ts */
import fs from "node:fs";

export function loadJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

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
 * Contract-ish validation (kept minimal, but aligned to your v1 types).
 */
export function validateToolResponseShape(
  tool: "list_patterns" | "get_pattern" | "get_global_rules",
  resp: any
) {
  if (!resp || typeof resp !== "object") {
    throw new Error(`Tool response is not an object for ${tool}`);
  }

  if (resp.contract_version !== "1.0") {
    throw new Error(`${tool}: missing/invalid contract_version (expected "1.0")`);
  }

  // Cache meta present on all responses in your design
  if (typeof resp.cache_ttl_seconds !== "number") {
    throw new Error(`${tool}: missing/invalid cache_ttl_seconds`);
  }
  if (typeof resp.catalog_revision !== "string") {
    throw new Error(`${tool}: missing/invalid catalog_revision`);
  }

  switch (tool) {
    case "list_patterns": {
      if (!("stack" in resp)) throw new Error(`list_patterns: missing 'stack'`);
      if (!Array.isArray(resp.patterns)) throw new Error(`list_patterns: patterns must be array`);
      if (typeof resp.count !== "number") throw new Error(`list_patterns: count must be number`);

      // Minimal PatternSummary keys
      for (const p of resp.patterns) {
        for (const key of ["id", "stack", "status", "summary", "tags", "aliases"] as const) {
          if (!(key in p)) throw new Error(`list_patterns: pattern missing '${key}'`);
        }
        if (!Array.isArray(p.tags)) throw new Error(`list_patterns: tags must be array`);
        if (!Array.isArray(p.aliases)) throw new Error(`list_patterns: aliases must be array`);
      }
      break;
    }

    case "get_pattern": {
      if (!resp.pattern || typeof resp.pattern !== "object") {
        throw new Error(`get_pattern: missing 'pattern' object`);
      }
      const p = resp.pattern;
      for (const key of ["id", "stack", "status", "summary", "tags", "aliases", "sections"] as const) {
        if (!(key in p)) throw new Error(`get_pattern: pattern missing '${key}'`);
      }
      const s = p.sections;
      for (const key of [
        "use_when",
        "do_not_use_when",
        "must_haves",
        "customizable",
        "donts",
        "golden_pattern",
      ] as const) {
        if (!(key in s)) throw new Error(`get_pattern: sections missing '${key}'`);
      }
      if (!Array.isArray(s.customizable)) throw new Error(`get_pattern: customizable must be array`);
      break;
    }

    case "get_global_rules": {
      if (!("stack" in resp)) throw new Error(`get_global_rules: missing 'stack'`);
      if (!resp.meta || typeof resp.meta !== "object") throw new Error(`get_global_rules: missing meta`);
      if (!resp.rules || typeof resp.rules !== "object") throw new Error(`get_global_rules: missing rules`);
      if (!Array.isArray(resp.rules.items)) throw new Error(`get_global_rules: rules.items must be array`);
      break;
    }
  }
}