"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPattern = getPattern;
// src/tools/getPattern.ts
const gray_matter_1 = __importDefault(require("gray-matter"));
const fs_1 = require("../utils/fs");
const sections_1 = require("../repo/sections");
const index_1 = require("../repo/index");
async function getPattern(index, patternRepoPath, args) {
    const { stack, id } = args;
    if (stack !== index.stack) {
        throw new Error(`Stack mismatch. Index=${index.stack}, requested=${stack}`);
    }
    const filePath = index.idToPath.get(id);
    if (!filePath) {
        throw new Error(`PATTERN_NOT_FOUND: No pattern with id '${id}' for stack '${stack}'`);
    }
    const raw = await (0, fs_1.readTextFile)(filePath);
    const parsed = (0, gray_matter_1.default)(raw);
    const data = parsed.data;
    // Frontmatter fields (strict enough for v1)
    const patternId = String(data.id ?? "").trim();
    const status = String(data.status ?? "").trim();
    const summary = String(data.summary ?? "").trim();
    const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    const aliases = Array.isArray(data.aliases) ? data.aliases.map(String) : [];
    if (!patternId)
        throw new Error(`Pattern missing 'id' in frontmatter: ${filePath}`);
    if (patternId !== id) {
        throw new Error(`Pattern id mismatch. Requested '${id}', file declares '${patternId}' (${filePath})`);
    }
    // Optional but strongly recommended: validate declared stack matches folder stack
    const declaredStack = String(data.stack ?? "").trim();
    if (declaredStack && declaredStack !== stack) {
        throw new Error(`Pattern '${id}' declares stack='${declaredStack}' but is served under stack='${stack}'. File: ${filePath}`);
    }
    if (!summary)
        throw new Error(`Pattern missing 'summary' in frontmatter: ${filePath}`);
    const sections = (0, sections_1.extractSections)(parsed.content);
    const detail = {
        id,
        stack,
        status,
        summary,
        tags,
        aliases,
        sections,
        source: {
            relative_path: (0, index_1.makeRelativePath)(patternRepoPath, filePath),
        },
    };
    return {
        contract_version: "1.0",
        ...index.cache,
        pattern: detail,
    };
}
