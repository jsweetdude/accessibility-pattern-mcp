import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = process.argv[2];
if (!url) throw new Error("Usage: node dist/smoke-remote-mcp.js https://host/mcp");

const client = new Client({ name: "smoke-test", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL(url));

await client.connect(transport);

// Just verifying the protocol handshake and tool listing works
const tools = await client.listTools();
console.log("Connected. Tool count:", tools.tools?.length ?? 0);
console.log("Tool names:", (tools.tools ?? []).map((t) => t.name));

const result = await client.callTool({
  name: "list_patterns",
  arguments: { stack: "web/react" },
});

console.log("list_patterns result keys:", Object.keys(result));
console.log("list_patterns raw:", JSON.stringify(result, null, 2));

process.exit(0);