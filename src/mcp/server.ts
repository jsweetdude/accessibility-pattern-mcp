import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { getConfig } from "../config.js";
import { createMcpServer } from "./createServer.js";

export async function startMcpServer() {
  const config = getConfig();
  const server = createMcpServer({
    name: "accessibility-pattern-mcp",
    version: "1.0.0",
    patternsRoot: config.patternRepoPath,
    cacheTtlSeconds: config.cacheTtlSeconds,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep process alive (stdio transport)
}