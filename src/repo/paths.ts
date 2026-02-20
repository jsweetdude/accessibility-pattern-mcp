import path from "node:path";
import { StackRef } from "../contracts/v1/types";

export type RepoPaths = {
  baselinePath: string;
  catalogPath: string;
  componentsGlob: string;
};

/**
 * Maps a stack name to actual file locations in the content repo.
 */
export function getRepoPaths(patternRepoPath: string, stack: StackRef): RepoPaths {
  // v1: only web/react
  if (stack !== "web/react") {
    throw new Error(`Unsupported stack: ${stack}`);
  }

  // Your content repo structure:
  // patterns/web/react/global/global_rules.md
  // patterns/web/react/components/*.md
  // patterns/web/react/patterns.json
  const root = path.join(patternRepoPath, "patterns", "web", "react");

  return {
    baselinePath: path.join(root, "global", "global_rules.md"),
    catalogPath: path.join(root, "patterns.json"),
    componentsGlob: path.join(root, "components", "*.md"),
  };
}
