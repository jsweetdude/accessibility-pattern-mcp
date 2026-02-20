import path from "node:path";
import { fileURLToPath } from "node:url";

export type AppConfig = {
  /**
   * Absolute path to the patterns content repo on disk.
   * Example: /Users/john/code/accessibility-pattern-api
   */
  patternRepoPath: string;

  /**
   * Default cache TTL (seconds) we tell clients they can keep responses.
   */
  cacheTtlSeconds: number;
};

// Resolve a stable project root regardless of how the server is launched.
// Works for both `src/` (dev) and `dist/` (build) execution.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * Reads configuration from environment variables.
 */
export function getConfig(): AppConfig {
  // Default relative path (from MCP repo root)
  const repoPathFromEnv =
    process.env.PATTERN_REPO_PATH ??
    "../Accessibility_Pattern_API/accessibility-pattern-api";

  // If absolute path provided, use it directly.
  // Otherwise resolve relative to PROJECT_ROOT (not process.cwd()).
  const patternRepoPath = path.isAbsolute(repoPathFromEnv)
    ? repoPathFromEnv
    : path.resolve(PROJECT_ROOT, repoPathFromEnv);

  // Optional override from env
  const cacheTtlSeconds =
    process.env.CACHE_TTL_SECONDS
      ? Number(process.env.CACHE_TTL_SECONDS)
      : 60 * 60; // 1 hour default

  // Helpful startup debug (safe — goes to stderr)
  console.error("[config] patternRepoPath:", patternRepoPath);
  console.error("[config] cacheTtlSeconds:", cacheTtlSeconds);

  return { patternRepoPath, cacheTtlSeconds };
}