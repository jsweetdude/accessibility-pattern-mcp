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
/**
 * Reads + indexes the content repo once.
 * After this, list_patterns is very fast.
 */
async function buildPatternIndex(patternRepoPath, stack, cacheTtlSeconds) {
    const { baselinePath, catalogPath, componentsGlob } = (0, paths_1.getRepoPaths)(patternRepoPath, stack);
    // Validate required files exist (helpful beginner-friendly errors)
    if (!(await (0, fs_1.fileExists)(baselinePath))) {
        throw new Error(`Missing baseline file: ${baselinePath}`);
    }
    if (!(await (0, fs_1.fileExists)(catalogPath))) {
        throw new Error(`Missing catalog file: ${catalogPath}`);
    }
    const componentPaths = await (0, fast_glob_1.default)(componentsGlob, { onlyFiles: true, unique: true });
    // Read important files for revision hashing
    const baselineText = await (0, fs_1.readTextFile)(baselinePath);
    const catalogText = await (0, fs_1.readTextFile)(catalogPath);
    // Read all component file text
    const componentTexts = [];
    for (const p of componentPaths) {
        componentTexts.push(await (0, fs_1.readTextFile)(p));
    }
    // Create a deterministic "fingerprint" of the repo state.
    const catalog_revision = "sha256:" + (0, hash_1.sha256)([
        "stack:" + stack,
        "baseline:" + baselineText,
        "catalog:" + catalogText,
        // Include all components text so edits change revision.
        ...componentTexts.map((t, i) => `component_${i}:${t}`),
    ].join("\n\n"));
    const byId = new Map();
    const idToPath = new Map();
    const all = [];
    // Parse each component markdown file's frontmatter into PatternSummary
    for (const filePath of componentPaths) {
        const raw = await (0, fs_1.readTextFile)(filePath);
        const parsed = (0, gray_matter_1.default)(raw);
        // gray-matter returns frontmatter as a plain object
        const data = parsed.data;
        const id = String(data.id ?? "").trim();
        const declaredStack = String(data.stack ?? "").trim();
        const status = String(data.status ?? "").trim();
        const summary = String(data.summary ?? "").trim();
        const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
        const aliases = Array.isArray(data.aliases) ? data.aliases.map(String) : [];
        if (!id) {
            throw new Error(`Pattern missing 'id' in frontmatter: ${filePath}`);
        }
        if (declaredStack && declaredStack !== stack) {
            throw new Error(`Pattern ${id} declares stack=${declaredStack} but is located under stack=${stack}`);
        }
        if (!summary) {
            throw new Error(`Pattern missing 'summary' in frontmatter: ${filePath}`);
        }
        // Minimal status validation (keep v1 strict)
        const allowed = ["alpha", "beta", "stable", "deprecated"];
        if (!allowed.includes(status)) {
            throw new Error(`Invalid status '${status}' in ${filePath}. Allowed: ${allowed.join(", ")}`);
        }
        const pattern = {
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
function makeRelativePath(patternRepoPath, filePath) {
    const rel = node_path_1.default.relative(patternRepoPath, filePath);
    return (0, fs_1.toPosixPath)(rel);
}
