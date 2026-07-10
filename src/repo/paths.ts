import path from "node:path";
import { StackRef } from "../contracts/v1/types.js";

export type RepoPaths = {
  baselinePath: string;
  catalogPath: string;
  componentsGlob: string;
};

/**
 * Maps a stack name to actual file locations in the content repo.
 */
export function getRepoPaths(patternRepoPath: string, stack: StackRef): RepoPaths {
  // Turns "web/react" into ["web", "react"], etc.
  const parts = stack.split("/");

  // Defensive check (helpful for beginners)
  if (parts.length !== 2) {
    throw new Error(`Invalid stack format: ${stack}. Expected "group/name" like "web/react".`);
  }

  // Corpus structure (bundled at <package>/corpus, or an override root):
  //   <root>/web/react/global/global_rules.md
  //   <root>/web/react/components/*.md
  //   <root>/web/react/patterns.json
  //   <root>/android/compose/...   (when populated)

  const root = path.join(patternRepoPath, ...parts);

  return {
    baselinePath: path.join(root, "global", "global_rules.md"),
    catalogPath: path.join(root, "patterns.json"),

    // IMPORTANT: make it recursive so nested folders work
    // and include mdx/markdown if you ever use them.
    componentsGlob: path.join(root, "components", "**", "*.{md,mdx,markdown}"),
  };
}
