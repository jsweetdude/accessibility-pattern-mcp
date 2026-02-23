"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalRules = getGlobalRules;
const fs_1 = require("../utils/fs");
const paths_1 = require("../repo/paths");
const globalRules_1 = require("../repo/globalRules");
function normalizeScope(scope) {
    if (!scope)
        return null;
    return Array.isArray(scope) ? scope : [scope];
}
async function getGlobalRules(index, patternRepoPath, args) {
    const { stack } = args;
    if (stack !== index.stack) {
        throw new Error(`Stack mismatch. Index=${index.stack}, requested=${stack}`);
    }
    const scopeFilter = normalizeScope(args.scope);
    const { baselinePath } = (0, paths_1.getRepoPaths)(patternRepoPath, stack);
    const fileText = await (0, fs_1.readTextFile)(baselinePath);
    const parsed = (0, globalRules_1.parseGlobalRulesMarkdown)(fileText, stack);
    const cache_ttl_seconds = parsed.meta.cache_ttl_seconds ?? index.cache.cache_ttl_seconds;
    const items = scopeFilter
        ? parsed.rules.filter((r) => r.scope.some((s) => scopeFilter.includes(s)))
        : parsed.rules;
    return {
        contract_version: "1.0",
        stack,
        catalog_revision: index.cache.catalog_revision,
        cache_ttl_seconds,
        meta: parsed.meta,
        rules: {
            scope_filter: scopeFilter, // additive
            items,
        },
    };
}
