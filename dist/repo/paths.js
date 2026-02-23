import path from "node:path";
/**
 * Maps a stack name to actual file locations in the content repo.
 */
export function getRepoPaths(patternRepoPath, stack) {
    // Turns "web/react" into ["web", "react"], etc.
    const parts = stack.split("/");
    // Defensive check (helpful for beginners)
    if (parts.length !== 2) {
        throw new Error(`Invalid stack format: ${stack}. Expected "group/name" like "web/react".`);
    }
    // Content repo structure examples:
    // patterns/web/react/global/global_rules.md
    // patterns/web/react/components/*.md
    // patterns/web/react/patterns.json
    //
    // patterns/android/compose/global/global_rules.md
    // patterns/android/compose/components/*.md
    // patterns/android/compose/patterns.json
    const root = path.join(patternRepoPath, "patterns", ...parts);
    return {
        baselinePath: path.join(root, "global", "global_rules.md"),
        catalogPath: path.join(root, "patterns.json"),
        // IMPORTANT: make it recursive so nested folders work
        // and include mdx/markdown if you ever use them.
        componentsGlob: path.join(root, "components", "**", "*.{md,mdx,markdown}"),
    };
}
