import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { getConfig, SERVER_NAME, SERVER_VERSION } from "../config.js";
import { createMcpServer } from "./createServer.js";

export async function startMcpServer() {
  const config = getConfig();
  const server = createMcpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    patternsRoot: config.patternRepoPath,
    cacheTtlSeconds: config.cacheTtlSeconds,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep process alive (stdio transport)
}