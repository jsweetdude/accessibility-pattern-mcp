"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPatternIndex = buildPatternIndex;
exports.makeRelativePath = makeRelativePath;
const fast_glob_1 = __importDefault(require("fast-glob"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const node_path_1 = __importDefault(require("node:path"));
const paths_1 = require("./paths");
const fs_1 = require("../utils/fs");
const hash_1 = require("../utils/hash");
function normalizeBullet(s, maxLen) {
    if (typeof s !== "string")
        return null;
    const cleaned = s.replace(/\s+/g, " ").trim();
    if (!cleaned)
        return null;
    return cleaned.length > maxLen ? cleaned.slice(0, maxLen).trimEnd() : cleaned;
}
function normalizeBulletList(value, maxItems, maxLen) {
    if (!Array.isArray(value))
        return [];
    const out = [];
    for (const item of value) {
        const b = normalizeBullet(item, maxLen);
        if (b)
            out.push(b);
        if (out.length >= maxItems)
            break;
    }
    return out;
}
function parseSelectionExcerpt(value) {
    if (!value || typeof value !== "object")
        return undefined;
    const v = value;
    const use_when = normalizeBulletList(v.use_when, 3, 140);
    const do_not_use_when = normalizeBulletList(v.do_not_use_when, 3, 140);
    if (use_when.length === 0 && do_not_use_when.length === 0)
        return undefined;
    return { use_when, do_not_use_when };
}
function uniqSorted(values) {
    const cleaned = values.map((s) => String(s).trim()).filter(Boolean);
    return Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b));
}
/**
 * patterns.json supported shapes:
 *  - { patterns: [...] }
 *  - { items: [...] }
 *  - [...] (array)
 */
function buildCatalogSelectionMap(catalogText) {
    const map = new Map();
    let parsed;
    try {
        parsed = JSON.parse(catalogText);
    }
    catch {
        throw new Error("patterns.json is not valid JSON.");
    }
    const parsedObj = parsed;
    const arr = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsedObj?.patterns)
            ? parsedObj.patterns
            : Array.isArray(parsedObj?.items)
                ? parsedObj.items
                : null;
    if (!arr)
        return map;
    for (const entry of arr) {
        if (!entry || typeof entry !== "object")
            continue;
        const entryObj = entry;
        const id = typeof entryObj.id === "string" ? entryObj.id.trim() : "";
        if (!id)
            continue;
        const excerpt = parseSelectionExcerpt(entryObj.selection_excerpt);
        if (excerpt)
            map.set(id, excerpt);
    }
    return map;
}
/**
 * Reads + indexes the content repo once.
 * After this, list_patterns is very fast.
 */
async function buildPatternIndex(patternRepoPath, stack, cacheTtlSeconds) {
    const { baselinePath, catalogPath, componentsGlob } = (0, paths_1.getRepoPaths)(patternRepoPath, stack);
    if (!(await (0, fs_1.fileExists)(baselinePath))) {
        throw new Error(`Missing baseline file: ${baselinePath}`);
    }
    if (!(await (0, fs_1.fileExists)(catalogPath))) {
        throw new Error(`Missing catalog file: ${catalogPath}`);
    }
    // Deterministic ordering: sort file paths before reading/hashing/parsing
    const componentPaths = (await (0, fast_glob_1.default)(componentsGlob, { onlyFiles: true, unique: true }))
        .map(fs_1.toPosixPath)
        .sort((a, b) => a.localeCompare(b));
    const baselineText = await (0, fs_1.readTextFile)(baselinePath);
    const catalogText = await (0, fs_1.readTextFile)(catalogPath);
    const selectionById = buildCatalogSelectionMap(catalogText);
    // Read each component once; reuse both for hashing and parsing
    const fileTextByPath = new Map();
    for (const p of componentPaths) {
        // NOTE: componentPaths are POSIX normalized; ensure readTextFile can handle them on Windows.
        // If not, store original paths separately. (If you're not targeting Windows right now, you're fine.)
        fileTextByPath.set(p, await (0, fs_1.readTextFile)(p));
    }
    // Deterministic fingerprint of repo state
    const catalog_revision = "sha256:" +
        (0, hash_1.sha256)([
            "stack:" + stack,
            "baseline:" + baselineText,
            "catalog:" + catalogText,
            ...componentPaths.map((p) => `component_path:${p}`),
            ...componentPaths.map((p) => `component_text:${fileTextByPath.get(p) ?? ""}`),
        ].join("\n\n"));
    const byId = new Map();
    const idToPath = new Map();
    const all = [];
    for (const filePath of componentPaths) {
        const raw = fileTextByPath.get(filePath);
        if (raw == null)
            throw new Error(`Internal error: missing cached text for ${filePath}`);
        const parsed = (0, gray_matter_1.default)(raw);
        const data = parsed.data;
        const id = String(data.id ?? "").trim();
        if (!id) {
            throw new Error(`Pattern missing 'id' in frontmatter: ${filePath}`);
        }
        const declaredStack = String(data.stack ?? "").trim();
        const status = String(data.status ?? "").trim();
        const summary = String(data.summary ?? "").trim();
        const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
        const aliases = Array.isArray(data.aliases) ? data.aliases.map(String) : [];
        if (declaredStack && declaredStack !== stack) {
            throw new Error(`Pattern ${id} declares stack=${declaredStack} but is located under stack=${stack}`);
        }
        if (!summary) {
            throw new Error(`Pattern missing 'summary' in frontmatter: ${filePath}`);
        }
        const allowed = ["alpha", "beta", "stable", "deprecated"];
        if (!allowed.includes(status)) {
            throw new Error(`Invalid status '${status}' in ${filePath}. Allowed: ${allowed.join(", ")}`);
        }
        const selection_excerpt = selectionById.get(id);
        const pattern = {
            id,
            stack,
            status,
            summary,
            tags: uniqSorted(tags),
            aliases: uniqSorted(aliases),
            ...(selection_excerpt ? { selection_excerpt } : {}),
        };
        if (byId.has(id)) {
            throw new Error(`Duplicate pattern id '${id}' found. Second copy: ${filePath}`);
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
function makeRelativePath(patternRepoPath, filePath) {
    const rel = node_path_1.default.relative(patternRepoPath, filePath);
    return (0, fs_1.toPosixPath)(rel);
}
