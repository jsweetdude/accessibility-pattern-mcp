"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
const node_path_1 = __importDefault(require("node:path"));
// Resolve a stable project root regardless of how the server is launched.
// Works for both `src/` (dev) and `dist/` (build) execution.
const PROJECT_ROOT = node_path_1.default.resolve(__dirname, "..");
/**
 * Reads configuration from environment variables.
 */
function getConfig() {
    // Default relative path (from MCP repo root)
    const repoPathFromEnv = process.env.PATTERN_REPO_PATH ??
        "../Accessibility_Pattern_API/accessibility-pattern-api";
    // If absolute path provided, use it directly.
    // Otherwise resolve relative to PROJECT_ROOT (not process.cwd()).
    const patternRepoPath = node_path_1.default.isAbsolute(repoPathFromEnv)
        ? repoPathFromEnv
        : node_path_1.default.resolve(PROJECT_ROOT, repoPathFromEnv);
    // Optional override from env
    const cacheTtlSeconds = process.env.CACHE_TTL_SECONDS
        ? Number(process.env.CACHE_TTL_SECONDS)
        : 60 * 60; // 1 hour default
    // Helpful startup debug (safe — goes to stderr)
    console.error("[config] patternRepoPath:", patternRepoPath);
    console.error("[config] cacheTtlSeconds:", cacheTtlSeconds);
    return { patternRepoPath, cacheTtlSeconds };
}
