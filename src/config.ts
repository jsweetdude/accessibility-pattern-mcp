import path from "node:path";

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

/**
 * Reads configuration from environment variables.
 * Beginner note: process.env is how Node reads env vars.
 */
export function getConfig(): AppConfig {
  // You can set this in your terminal:
  // PATTERN_REPO_PATH=../accessibility-pattern-api npm run dev
  const repoPathFromEnv = process.env.PATTERN_REPO_PATH ?? "../../Accessibility_Pattern_API/accessibility-pattern-api";

  // Convert it to an absolute path so the rest of the app is consistent.
  const patternRepoPath = path.resolve(process.cwd(), repoPathFromEnv);

  // Keep this simple for v1.
  const cacheTtlSeconds = 60 * 60; // 1 hour

  return { patternRepoPath, cacheTtlSeconds };
}
