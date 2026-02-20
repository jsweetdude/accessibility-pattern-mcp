"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
const node_path_1 = __importDefault(require("node:path"));
/**
 * Reads configuration from environment variables.
 * Beginner note: process.env is how Node reads env vars.
 */
function getConfig() {
    // You can set this in your terminal:
    // PATTERN_REPO_PATH=../accessibility-pattern-api npm run dev
    const repoPathFromEnv = process.env.PATTERN_REPO_PATH ?? "../../Accessibility_Pattern_API/accessibility-pattern-api";
    // Convert it to an absolute path so the rest of the app is consistent.
    const patternRepoPath = node_path_1.default.resolve(process.cwd(), repoPathFromEnv);
    // Keep this simple for v1.
    const cacheTtlSeconds = 60 * 60; // 1 hour
    return { patternRepoPath, cacheTtlSeconds };
}
