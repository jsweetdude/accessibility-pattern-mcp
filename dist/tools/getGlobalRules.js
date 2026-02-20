"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalRules = getGlobalRules;
// src/tools/getGlobalRules.ts
const fs_1 = require("../utils/fs");
const paths_1 = require("../repo/paths");
async function getGlobalRules(index, patternRepoPath, args) {
    const { stack } = args;
    if (stack !== index.stack) {
        throw new Error(`Stack mismatch. Index=${index.stack}, requested=${stack}`);
    }
    const { baselinePath } = (0, paths_1.getRepoPaths)(patternRepoPath, stack);
    const raw_markdown = await (0, fs_1.readTextFile)(baselinePath);
    return {
        contract_version: "1.0",
        stack,
        ...index.cache,
        rules: { raw_markdown },
    };
}
