import fg from "fast-glob";
import matter from "gray-matter";
import path from "node:path";

import { getRepoPaths } from "./paths";
import { readTextFile, fileExists, toPosixPath } from "../utils/fs";
import { sha256 } from "../utils/hash";
import {
    CacheMeta,
    PatternStatus,
    PatternSummary,
    StackRef,
} from "../contracts/v1/types";

type PatternIndex = {
    stack: StackRef;
    cache: CacheMeta;

    // Fast lookups:
    byId: Map<string, PatternSummary>;
    idToPath: Map<string, string>;

    // Useful if you want later:
    all: PatternSummary[];
};

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

    console.log("[debug] baselinePath:", baselinePath);
    console.log("[debug] catalogPath:", catalogPath);
    console.log("[debug] componentsGlob:", componentsGlob);

    console.log("[debug] fileExists(baselinePath):", await fileExists(baselinePath));
    console.log("[debug] fileExists(catalogPath):", await fileExists(catalogPath));

    // Validate required files exist (helpful beginner-friendly errors)
    if (!(await fileExists(baselinePath))) {
        throw new Error(`Missing baseline file: ${baselinePath}`);
    }
    if (!(await fileExists(catalogPath))) {
        throw new Error(`Missing catalog file: ${catalogPath}`);
    }

    const componentPaths = await fg(componentsGlob, { onlyFiles: true, unique: true });
    console.log("[debug] componentPaths found:", componentPaths.length);
    if (componentPaths.length > 0) {
        console.log("[debug] first component path:", componentPaths[0]);
    }

    // Read important files for revision hashing
    const baselineText = await readTextFile(baselinePath);
    const catalogText = await readTextFile(catalogPath);

    // Read all component file text
    const componentTexts: string[] = [];
    for (const p of componentPaths) {
        componentTexts.push(await readTextFile(p));
    }

    // Create a deterministic "fingerprint" of the repo state.
    const catalog_revision = "sha256:" + sha256(
        [
            "stack:" + stack,
            "baseline:" + baselineText,
            "catalog:" + catalogText,
            // Include all components text so edits change revision.
            ...componentTexts.map((t, i) => `component_${i}:${t}`),
        ].join("\n\n")
    );

    const byId = new Map<string, PatternSummary>();
    const idToPath = new Map<string, string>();

    const all: PatternSummary[] = [];

    // Parse each component markdown file's frontmatter into PatternSummary
    for (const filePath of componentPaths) {
        const raw = await readTextFile(filePath);
        const parsed = matter(raw);

        // gray-matter returns frontmatter as a plain object
        const data = parsed.data as Record<string, unknown>;

        const id = String(data.id ?? "").trim();
        const status = String(data.status ?? "").trim() as PatternStatus;
        const summary = String(data.summary ?? "").trim();

        const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
        const aliases = Array.isArray(data.aliases) ? data.aliases.map(String) : [];

        if (!id) {
            throw new Error(`Pattern missing 'id' in frontmatter: ${filePath}`);
        }
        if (!summary) {
            throw new Error(`Pattern missing 'summary' in frontmatter: ${filePath}`);
        }

        // Minimal status validation (keep v1 strict)
        const allowed: PatternStatus[] = ["alpha", "beta", "stable", "deprecated"];
        if (!allowed.includes(status)) {
            throw new Error(
                `Invalid status '${status}' in ${filePath}. Allowed: ${allowed.join(", ")}`
            );
        }

        const pattern: PatternSummary = {
            id,
            stack,
            status,
            summary,
            tags,
            aliases,
        };

        if (byId.has(id)) {
            throw new Error(`Duplicate pattern id '${id}' found. Second copy: ${filePath}`);
        }

        byId.set(id, pattern);
        idToPath.set(id, filePath);
        all.push(pattern);
    }

    // Sort deterministically so list_patterns is stable across runs
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
