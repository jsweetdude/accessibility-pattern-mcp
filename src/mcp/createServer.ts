import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { StackRef } from "../contracts/v1/types.js";
import { createIndexCache } from "../repo/cache.js";
import { getGlobalRules } from "../tools/getGlobalRules.js";
import { getPattern } from "../tools/getPattern.js";
import { listPatterns } from "../tools/listPatterns.js";
import { withTelemetry } from "../telemetryWrap.js";
import { jsonResult } from "./response.js";

type CreateMcpServerOptions = {
  name: string;
  version: string;
  patternsRoot: string;
  cacheTtlSeconds: number;
};

function registerTools(server: McpServer, opts: Pick<CreateMcpServerOptions, "patternsRoot" | "cacheTtlSeconds">) {
  const cache = createIndexCache({
    patternRepoPath: opts.patternsRoot,
    cacheTtlSeconds: opts.cacheTtlSeconds,
  });

  server.registerTool(
    "list_patterns",
    {
      description: "List accessible UI patterns for a given stack (optionally filtered by tags/query).",
      inputSchema: {
        stack: z.string(),
        tags: z.array(z.string()).optional(),
        query: z.string().optional(),
      },
    },
    async (args) => {
      const stack = args.stack as StackRef;
      const toolArgs = {
        stack,
        tags: args.tags as string[] | undefined,
        query: args.query as string | undefined,
      };
      const payload = await withTelemetry({
        tool: "list_patterns",
        stack,
        args: toolArgs,
        handler: async () => {
          const index = await cache.getIndex(stack);
          return listPatterns(index, {
            stack,
            tags: args.tags as string[] | undefined,
            query: args.query as string | undefined,
          });
        },
        summarizeResult: (result) => ({
          count: result.count,
          cache_ttl_seconds: result.cache_ttl_seconds,
          catalog_revision: result.catalog_revision,
        }),
      });
      return jsonResult(payload);
    }
  );

  server.registerTool(
    "get_pattern",
    {
      description: "Get a single pattern by id for a given stack.",
      inputSchema: {
        stack: z.string(),
        id: z.string(),
      },
    },
    async (args) => {
      const stack = args.stack as StackRef;
      const toolArgs = {
        stack,
        id: String(args.id),
      };
      const payload = await withTelemetry({
        tool: "get_pattern",
        stack,
        args: toolArgs,
        handler: async () => {
          const index = await cache.getIndex(stack);
          return getPattern(index, opts.patternsRoot, {
            stack,
            id: String(args.id),
          });
        },
        summarizeResult: (result) => ({
          pattern_id: result.pattern.id,
          cache_ttl_seconds: result.cache_ttl_seconds,
          catalog_revision: result.catalog_revision,
        }),
      });
      return jsonResult(payload);
    }
  );

  server.registerTool(
    "get_global_rules",
    {
      description: "Get global baseline rules for a given stack.",
      inputSchema: {
        stack: z.string(),
      },
    },
    async (args) => {
      const stack = args.stack as StackRef;
      const toolArgs = {
        stack,
      };
      const payload = await withTelemetry({
        tool: "get_global_rules",
        stack,
        args: toolArgs,
        handler: async () => {
          const index = await cache.getIndex(stack);
          return getGlobalRules(index, opts.patternsRoot, { stack });
        },
        summarizeResult: (result) => ({
          rules_count: Array.isArray(result.rules.items) ? result.rules.items.length : 0,
          cache_ttl_seconds: result.cache_ttl_seconds,
          catalog_revision: result.catalog_revision,
        }),
      });
      return jsonResult(payload);
    }
  );
}

export function createMcpServer(opts: CreateMcpServerOptions) {
  const server = new McpServer(
    { name: opts.name, version: opts.version },
    { capabilities: { tools: {} } }
  );

  registerTools(server, {
    patternsRoot: opts.patternsRoot,
    cacheTtlSeconds: opts.cacheTtlSeconds,
  });

  return server;
}
