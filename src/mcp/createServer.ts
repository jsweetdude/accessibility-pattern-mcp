import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { RuleScope, StackRef } from "../contracts/v1/types.js";
import { PACKAGE_ROOT } from "../config.js";
import { getIndexCache } from "../repo/cache.js";
import { getGlobalRules } from "../tools/getGlobalRules.js";
import { getPattern } from "../tools/getPattern.js";
import { listPatterns } from "../tools/listPatterns.js";
import { withTelemetry } from "../telemetryWrap.js";
import { jsonResult } from "./response.js";
import { toErrorResult } from "./errors.js";

type CreateMcpServerOptions = {
  name: string;
  version: string;
  patternsRoot: string;
  cacheTtlSeconds: number;
};

function registerTools(server: McpServer, opts: Pick<CreateMcpServerOptions, "patternsRoot" | "cacheTtlSeconds">) {
  const cache = getIndexCache({
    patternRepoPath: opts.patternsRoot,
    cacheTtlSeconds: opts.cacheTtlSeconds,
  });

  // Absolute roots whose prefixes must never leak in a client-facing error.
  // Any throw inside a handler is converted to a structured, client-safe error
  // result ({ error_code, message }, isError: true) via toErrorResult(err, scrubRoots)
  // instead of an SDK error carrying a raw message with absolute host paths.
  const scrubRoots = [opts.patternsRoot, PACKAGE_ROOT];

  server.registerTool(
    "list_patterns",
    {
      description:
        "List the accessible UI component patterns available for a stack. Call this FIRST whenever you are about to build or modify any UI, to choose which patterns apply. Each entry has an `id`, `summary`, `tags`, `aliases`, and a `selection_excerpt` (its `use_when` / `do_not_use_when` bullets) — use the selection_excerpt to decide which patterns match the components in your task, then call get_pattern for each. Optionally narrow with `tags` or a free-text `query`.",
      inputSchema: {
        stack: z
          .enum(["web/react", "android/compose"])
          .default("web/react")
          .describe(
            "Target platform and framework. Currently only 'web/react' is populated; defaults to 'web/react'."
          ),
        tags: z.array(z.string()).optional(),
        query: z.string().optional(),
      },
    },
    async (args) => {
      try {
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
      } catch (err) {
        return toErrorResult(err, scrubRoots);
      }
    }
  );

  server.registerTool(
    "get_pattern",
    {
      description:
        "Get the full accessibility specification for one pattern by `id` (ids come from list_patterns). Returns the pattern's sections: `must_haves` (non-negotiable WCAG 2.2 AA requirements — implement all of them), `donts` (anti-patterns — never produce), `golden_pattern` (a reference implementation to model), `customizable` (allowed variations), and `acceptance_checks` (observable pass/fail behaviors). Call this for each pattern you selected before writing UI code.",
      inputSchema: {
        stack: z
          .enum(["web/react", "android/compose"])
          .default("web/react")
          .describe(
            "Target platform and framework. Currently only 'web/react' is populated; defaults to 'web/react'."
          ),
        id: z.string(),
      },
    },
    async (args) => {
      try {
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
      } catch (err) {
        return toErrorResult(err, scrubRoots);
      }
    }
  );

  server.registerTool(
    "get_foundations",
    {
      description:
        "Get the cross-cutting Foundations rules for a stack — accessibility requirements not tied to a single component: focus states, landmarks, headings, contrast, page structure, use of color. Retrieve these on every UI task, not just page-level work: each rule carries a `scope` (utility, style, component, layout, page) that determines whether it applies to the current change. Optionally pass `scope` to return only rules matching one or more of those buckets.",
      inputSchema: {
        stack: z
          .enum(["web/react", "android/compose"])
          .default("web/react")
          .describe(
            "Target platform and framework. Currently only 'web/react' is populated; defaults to 'web/react'."
          ),
        scope: z
          .array(z.enum(["utility", "style", "component", "layout", "page"]))
          .optional()
          .describe(
            "Optional. Return only rules whose `scope` includes at least one of these buckets. Omit to get all rules."
          ),
      },
    },
    async (args) => {
      try {
        const stack = args.stack as StackRef;
        const scope = args.scope as RuleScope[] | undefined;
        const toolArgs = {
          stack,
          scope,
        };
        const payload = await withTelemetry({
          tool: "get_foundations",
          stack,
          args: toolArgs,
          handler: async () => {
            const index = await cache.getIndex(stack);
            return getGlobalRules(index, opts.patternsRoot, { stack, scope });
          },
          summarizeResult: (result) => ({
            rules_count: Array.isArray(result.rules.items) ? result.rules.items.length : 0,
            cache_ttl_seconds: result.cache_ttl_seconds,
            catalog_revision: result.catalog_revision,
          }),
        });
        return jsonResult(payload);
      } catch (err) {
        return toErrorResult(err, scrubRoots);
      }
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
