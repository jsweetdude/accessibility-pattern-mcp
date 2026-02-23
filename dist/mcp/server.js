// src/mcp/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createIndexCache } from "../repo/cache.js";
import { getConfig } from "../config.js";
import { listPatterns } from "../tools/listPatterns.js";
import { getPattern } from "../tools/getPattern.js";
import { getGlobalRules } from "../tools/getGlobalRules.js";
export async function startMcpServer() {
    const config = getConfig();
    const cache = createIndexCache({
        patternRepoPath: config.patternRepoPath,
        cacheTtlSeconds: config.cacheTtlSeconds,
    });
    const server = new McpServer({ name: "accessibility-pattern-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
    // Tool: list_patterns
    server.registerTool("list_patterns", {
        description: "List accessible UI patterns for a given stack (optionally filtered by tags/query).",
        inputSchema: {
            stack: z.string(),
            tags: z.array(z.string()).optional(),
            query: z.string().optional(),
        },
    }, async (args) => {
        const stack = args.stack;
        const index = await cache.getIndex(stack);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(listPatterns(index, { stack, tags: args.tags, query: args.query }), null, 2),
                },
            ],
        };
    });
    // Tool: get_pattern
    server.registerTool("get_pattern", {
        description: "Get a single pattern by id for a given stack.",
        inputSchema: {
            stack: z.string(),
            id: z.string(),
        },
    }, async (args) => {
        const stack = args.stack;
        const index = await cache.getIndex(stack);
        const resp = await getPattern(index, config.patternRepoPath, { stack, id: String(args.id) });
        return {
            content: [{ type: "text", text: JSON.stringify(resp, null, 2) }],
        };
    });
    // Tool: get_global_rules
    server.registerTool("get_global_rules", {
        description: "Get global baseline rules for a given stack.",
        inputSchema: {
            stack: z.string(),
        },
    }, async (args) => {
        const stack = args.stack;
        const index = await cache.getIndex(stack);
        const resp = await getGlobalRules(index, config.patternRepoPath, { stack });
        return {
            content: [{ type: "text", text: JSON.stringify(resp, null, 2) }],
        };
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Keep process alive (stdio transport)
}
