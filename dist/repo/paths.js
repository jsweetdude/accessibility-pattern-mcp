"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepoPaths = getRepoPaths;
const node_path_1 = __importDefault(require("node:path"));
/**
 * Maps a stack name to actual file locations in the content repo.
 */
function getRepoPaths(patternRepoPath, stack) {
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
    const root = node_path_1.default.join(patternRepoPath, "patterns", ...parts);
    return {
        baselinePath: node_path_1.default.join(root, "global", "global_rules.md"),
        catalogPath: node_path_1.default.join(root, "patterns.json"),
        // IMPORTANT: make it recursive so nested folders work
        // and include mdx/markdown if you ever use them.
        componentsGlob: node_path_1.default.join(root, "components", "**", "*.{md,mdx,markdown}"),
    };
}
