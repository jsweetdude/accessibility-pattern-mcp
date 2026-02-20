"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMcpServer = startMcpServer;
// src/mcp/server.ts
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const cache_1 = require("../repo/cache");
const config_1 = require("../config");
const listPatterns_1 = require("../tools/listPatterns");
const getPattern_1 = require("../tools/getPattern");
const getGlobalRules_1 = require("../tools/getGlobalRules");
async function startMcpServer() {
    const config = (0, config_1.getConfig)();
    const cache = (0, cache_1.createIndexCache)({
        patternRepoPath: config.patternRepoPath,
        cacheTtlSeconds: config.cacheTtlSeconds,
    });
    const server = new mcp_js_1.McpServer({ name: "accessibility-pattern-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
    // Tool: list_patterns
    server.registerTool("list_patterns", {
        description: "List accessible UI patterns for a given stack (optionally filtered by tags/query).",
        inputSchema: {
            stack: zod_1.z.string(),
            tags: zod_1.z.array(zod_1.z.string()).optional(),
            query: zod_1.z.string().optional(),
        },
    }, async (args) => {
        const stack = args.stack;
        const index = await cache.getIndex(stack);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify((0, listPatterns_1.listPatterns)(index, { stack, tags: args.tags, query: args.query }), null, 2),
                },
            ],
        };
    });
    // Tool: get_pattern
    server.registerTool("get_pattern", {
        description: "Get a single pattern by id for a given stack.",
        inputSchema: {
            stack: zod_1.z.string(),
            id: zod_1.z.string(),
        },
    }, async (args) => {
        const stack = args.stack;
        const index = await cache.getIndex(stack);
        const resp = await (0, getPattern_1.getPattern)(index, config.patternRepoPath, { stack, id: String(args.id) });
        return {
            content: [{ type: "text", text: JSON.stringify(resp, null, 2) }],
        };
    });
    // Tool: get_global_rules
    server.registerTool("get_global_rules", {
        description: "Get global baseline rules for a given stack.",
        inputSchema: {
            stack: zod_1.z.string(),
        },
    }, async (args) => {
        console.error("[MCP] get_global_rules called with args:", args);
        const stack = args.stack;
        const index = await cache.getIndex(stack);
        const resp = await (0, getGlobalRules_1.getGlobalRules)(index, config.patternRepoPath, { stack });
        console.error("[MCP] returning", resp.rules.items.length, "rules");
        return {
            content: [{ type: "text", text: JSON.stringify(resp, null, 2) }],
        };
    });
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    // Keep process alive (stdio transport)
    console.error("MCP server running on stdio ✅");
}
