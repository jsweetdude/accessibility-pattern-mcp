import fg from "fast-glob";
import matter from "gray-matter";
import path from "node:path";

import { getRepoPaths } from "./paths.js";
import { readTextFile, fileExists, toPosixPath } from "../utils/fs.js";
import { ToolFailure, ERROR_CODES } from "../mcp/errors.js";
import {
  CacheMeta,
  PatternStatus,
  PatternSummary,
  StackRef,
  SelectionExcerpt,
} from "../contracts/v1/types.js";

type PatternIndex = {
  stack: StackRef;
  cache: CacheMeta;

  byId: Map<string, PatternSummary>;
  idToPath: Map<string, string>;
  all: PatternSummary[];
};

function normalizeBullet(s: unknown, maxLen: number): string | null {
  if (typeof s !== "string") return null;
  const cleaned = s.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen).trimEnd() : cleaned;
}

function normalizeBulletList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    const b = normalizeBullet(item, maxLen);
    if (b) out.push(b);
    if (out.length >= maxItems) break;
  }
  return out;
}

function parseSelectionExcerpt(value: unknown): SelectionExcerpt | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;

  const use_when = normalizeBulletList(v.use_when, 3, 140);
  const do_not_use_when = normalizeBulletList(v.do_not_use_when, 3, 140);

  if (use_when.length === 0 && do_not_use_when.length === 0) return undefined;
  return { use_when, do_not_use_when };
}

function uniqSorted(values: string[]): string[] {
  const cleaned = values.map((s) => String(s).trim()).filter(Boolean);
  return Array.from(new Set<string>(cleaned)).sort((a: string, b: string) =>
    a.localeCompare(b)
  );
}

/**
 * patterns.json supported shapes:
 *  - { patterns: [...] }
 *  - { items: [...] }
 *  - [...] (array)
 */
function buildCatalogSelectionMap(catalogText: string): Map<string, SelectionExcerpt> {
  const map = new Map<string, SelectionExcerpt>();

  let parsed: unknown;
  try {
    parsed = JSON.parse(catalogText);
  } catch {
    throw new ToolFailure(ERROR_CODES.CORPUS_UNAVAILABLE, "patterns.json is not valid JSON.");
  }

  const parsedObj = parsed as { patterns?: unknown; items?: unknown } | null;

  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsedObj?.patterns)
      ? parsedObj.patterns
      : Array.isArray(parsedObj?.items)
        ? parsedObj.items
        : null;

  if (!arr) return map;

  for (const entry of arr) {
    if (!entry || typeof entry !== "object") continue;
    const entryObj = entry as { id?: unknown; selection_excerpt?: unknown };

    const id = typeof entryObj.id === "string" ? entryObj.id.trim() : "";
    if (!id) continue;

    const excerpt = parseSelectionExcerpt(entryObj.selection_excerpt);
    if (excerpt) map.set(id, excerpt);
  }

  return map;
}

/**
 * Reads + indexes the content repo once.
 * After this, list_patterns is very fast.
 */
export async function buildPatternIndex(
  patternRepoPath: string,
  stack: StackRef,
  cacheTtlSeconds: number
): Promise<PatternIndex> {
  const { baselinePath, catalogPath, componentsGlob } = getRepoPaths(patternRepoPath, stack);

  if (!(await fileExists(baselinePath))) {
    throw new ToolFailure(
      ERROR_CODES.CORPUS_UNAVAILABLE,
      `Missing baseline file for stack '${stack}': ${makeRelativePath(patternRepoPath, baselinePath)}`
    );
  }
  if (!(await fileExists(catalogPath))) {
    throw new ToolFailure(
      ERROR_CODES.CORPUS_UNAVAILABLE,
      `Missing catalog file for stack '${stack}': ${makeRelativePath(patternRepoPath, catalogPath)}`
    );
  }

  // Deterministic ordering: sort file paths before reading/parsing
  const componentPaths = (await fg(componentsGlob, { onlyFiles: true, unique: true }))
    .map(toPosixPath)
    .sort((a: string, b: string) => a.localeCompare(b));

  const baselineText = await readTextFile(baselinePath);
  const catalogText = await readTextFile(catalogPath);
  const selectionById = buildCatalogSelectionMap(catalogText);

  // Read each component once, then parse from the cached text.
  const fileTextByPath = new Map<string, string>();
  for (const p of componentPaths) {
    // NOTE: componentPaths are POSIX normalized; ensure readTextFile can handle them on Windows.
    // If not, store original paths separately. (If you're not targeting Windows right now, you're fine.)
    fileTextByPath.set(p, await readTextFile(p));
  }

  // The corpus's own semantic version (from patterns.json), surfaced to clients
  // so they see e.g. "0.5.2" rather than an opaque content hash.
  let catalog_revision = "unknown";
  try {
    const parsedCatalog = JSON.parse(catalogText) as { catalog_revision?: unknown };
    if (typeof parsedCatalog.catalog_revision === "string") {
      catalog_revision = parsedCatalog.catalog_revision;
    }
  } catch {
    // leave as "unknown" if the catalog isn't valid JSON
  }

  const byId = new Map<string, PatternSummary>();
  const idToPath = new Map<string, string>();
  const all: PatternSummary[] = [];

  for (const filePath of componentPaths) {
    const relPath = makeRelativePath(patternRepoPath, filePath);
    const raw = fileTextByPath.get(filePath);
    if (raw == null) throw new Error(`Internal error: missing cached text for ${relPath}`);

    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;

    const id = String(data.id ?? "").trim();
    if (!id) {
      throw new ToolFailure(
        ERROR_CODES.CORPUS_UNAVAILABLE,
        `Pattern missing 'id' in frontmatter: ${relPath}`
      );
    }

    const declaredStack = String(data.stack ?? "").trim();
    const status = String(data.status ?? "").trim() as PatternStatus;
    const summary = String(data.summary ?? "").trim();

    const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    const aliases = Array.isArray(data.aliases) ? data.aliases.map(String) : [];

    if (declaredStack && declaredStack !== stack) {
      throw new ToolFailure(
        ERROR_CODES.CORPUS_UNAVAILABLE,
        `Pattern '${id}' declares stack='${declaredStack}' but is located under stack='${stack}' (${relPath}).`
      );
    }
    if (!summary) {
      throw new ToolFailure(
        ERROR_CODES.CORPUS_UNAVAILABLE,
        `Pattern missing 'summary' in frontmatter: ${relPath}`
      );
    }

    const allowed: PatternStatus[] = ["alpha", "beta", "stable", "deprecated"];
    if (!allowed.includes(status)) {
      throw new ToolFailure(
        ERROR_CODES.CORPUS_UNAVAILABLE,
        `Invalid status '${status}' in ${relPath}. Allowed: ${allowed.join(", ")}`
      );
    }

    const selection_excerpt = selectionById.get(id);

    const pattern: PatternSummary = {
      id,
      stack,
      status,
      summary,
      tags: uniqSorted(tags),
      aliases: uniqSorted(aliases),
      ...(selection_excerpt ? { selection_excerpt } : {}),
    };

    if (byId.has(id)) {
      throw new ToolFailure(
        ERROR_CODES.CORPUS_UNAVAILABLE,
        `Duplicate pattern id '${id}' found. Second copy: ${relPath}`
      );
    }

    byId.set(id, pattern);
    idToPath.set(id, filePath);
    all.push(pattern);
  }

  // Already stable by filePath sort, but keep this as a last-line guarantee
  all.sort((a, b) => a.id.localeCompare(b.id));

  return {
    stack,
    cache: { catalog_revision, cache_ttl_seconds: cacheTtlSeconds },
    byId,
    idToPath,
    all,
  };
}

/**
 * Helper to make debug info safe and consistent for output.
 */
export function makeRelativePath(patternRepoPath: string, filePath: string): string {
  const rel = path.relative(patternRepoPath, filePath);
  return toPosixPath(rel);
}

export type { PatternIndex };