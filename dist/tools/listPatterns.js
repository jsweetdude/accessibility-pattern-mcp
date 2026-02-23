"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPatterns = listPatterns;
function listPatterns(index, args) {
    const { stack, tags, query } = args;
    if (stack !== index.stack) {
        throw new Error(`Stack mismatch. Index=${index.stack}, requested=${stack}`);
    }
    let results = index.all;
    // Filter by tags (OR logic): match if pattern has ANY of the requested tags.
    if (tags && tags.length > 0) {
        const wanted = new Set(tags.map((t) => t.toLowerCase()));
        results = results.filter((p) => p.tags.some((t) => wanted.has(t.toLowerCase())));
    }
    // Simple query search across id, summary, aliases
    if (query && query.trim()) {
        const q = query.toLowerCase();
        results = results.filter((p) => {
            if (p.id.toLowerCase().includes(q))
                return true;
            if (p.summary.toLowerCase().includes(q))
                return true;
            if (p.aliases.some((a) => a.toLowerCase().includes(q)))
                return true;
            return false;
        });
    }
    results = [...results].sort((a, b) => a.id.localeCompare(b.id));
    return {
        contract_version: "1.0",
        stack,
        ...index.cache,
        count: results.length,
        patterns: results,
    };
}
