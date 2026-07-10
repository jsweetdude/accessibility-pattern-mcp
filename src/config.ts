import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AppConfig = {
  /**
   * Absolute path to the corpus root the server reads patterns from.
   * Defaults to the bundled corpus shipped inside the package.
   */
  patternRepoPath: string;

  /**
   * Default cache TTL (seconds) we tell clients they can keep responses.
   */
  cacheTtlSeconds: number;
};

// Resolve the package root regardless of how the server is launched.
// ESM-safe (no `__dirname`, which is undefined under `type: module`).
// This file compiles to dist/config.js, so its dir is dist/ and the package
// root is one level up; in dev (ts-node on src/config.ts) it resolves the same.
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(MODULE_DIR, "..");

// Canonical server identity, read once from package.json so both transports
// (stdio and HTTP) advertise the same name and version in the MCP handshake.
const pkg = JSON.parse(
  readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8")
) as { name?: string; version?: string };
export const SERVER_NAME = pkg.name ?? "a11y-context-mcp";
export const SERVER_VERSION = pkg.version ?? "0.0.0";

/**
 * Reads configuration from environment variables.
 */
export function getConfig(): AppConfig {
  // The bundled corpus ships inside the package at <root>/corpus. Override with
  // PATTERN_REPO_PATH (absolute, or relative to the package root) to point at a
  // working corpus checkout during development.
  const repoPathFromEnv = process.env.PATTERN_REPO_PATH ?? "corpus";

  const patternRepoPath = path.isAbsolute(repoPathFromEnv)
    ? repoPathFromEnv
    : path.resolve(PACKAGE_ROOT, repoPathFromEnv);

  const cacheTtlSeconds = process.env.CACHE_TTL_SECONDS
    ? Number(process.env.CACHE_TTL_SECONDS)
    : 60 * 60; // 1 hour default

  // Startup debug is opt-in (goes to stderr, never stdout — safe for MCP).
  if (process.env.A11Y_MCP_DEBUG) {
    console.error("[config] patternRepoPath:", patternRepoPath);
    console.error("[config] cacheTtlSeconds:", cacheTtlSeconds);
  }

  return { patternRepoPath, cacheTtlSeconds };
}
