"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalRules = getGlobalRules;
const gray_matter_1 = __importDefault(require("gray-matter"));
const fs_1 = require("../utils/fs");
const paths_1 = require("../repo/paths");
async function getGlobalRules(index, patternRepoPath, args) {
    const { stack } = args;
    if (stack !== index.stack) {
        throw new Error(`Stack mismatch. Index=${index.stack}, requested=${stack}`);
    }
    const { baselinePath } = (0, paths_1.getRepoPaths)(patternRepoPath, stack);
    const fileText = await (0, fs_1.readTextFile)(baselinePath);
    const parsed = (0, gray_matter_1.default)(fileText);
    const data = parsed.data;
    // Parse frontmatter into meta (light validation for v1)
    const meta = {
        id: String(data.id ?? "").trim(),
        stack: String(data.stack ?? "").trim() || stack,
        rule_set: typeof data.rule_set === "string" ? data.rule_set : undefined,
        status: typeof data.status === "string" ? data.status : undefined,
        summary: typeof data.summary === "string" ? data.summary : undefined,
        cache_ttl_seconds: typeof data.cache_ttl_seconds === "number" ? data.cache_ttl_seconds : undefined,
        apply_policy: typeof data.apply_policy === "object" && data.apply_policy
            ? {
                instruction: typeof data.apply_policy.instruction === "string"
                    ? data.apply_policy.instruction
                    : undefined,
                scopes_in_order: Array.isArray(data.apply_policy.scopes_in_order)
                    ? data.apply_policy.scopes_in_order.map(String)
                    : undefined,
            }
            : undefined,
    };
    // If the file declares a stack, ensure it matches what we're serving
    if (meta.stack && meta.stack !== stack) {
        throw new Error(`Global rules meta.stack='${meta.stack}' does not match requested stack='${stack}'. File: ${baselinePath}`);
    }
    // IMPORTANT:
    // Override the TTL if the file declares one.
    // Keep catalog_revision from the index (fingerprint of repo state).
    const cache_ttl_seconds = meta.cache_ttl_seconds ?? index.cache.cache_ttl_seconds;
    return {
        contract_version: "1.0",
        stack,
        catalog_revision: index.cache.catalog_revision,
        cache_ttl_seconds,
        meta,
        rules: {},
    };
}
