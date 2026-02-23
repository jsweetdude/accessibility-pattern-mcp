import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = process.argv[2];
if (!url) throw new Error("Usage: node dist/smoke-remote-mcp.js https://host/mcp");

const client = new Client({ name: "smoke-test", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL(url));

await client.connect(transport);

function assertHasStructuredContent(result: unknown, toolName: string): asserts result is {
  structuredContent: Record<string, unknown>;
} {
  if (
    !result ||
    typeof result !== "object" ||
    !("structuredContent" in result) ||
    !result.structuredContent ||
    typeof result.structuredContent !== "object"
  ) {
    throw new Error(`${toolName} missing structuredContent in tool response.`);
  }
}

// Just verifying the protocol handshake and tool listing works
const tools = await client.listTools();
console.log("Connected. Tool count:", tools.tools?.length ?? 0);
console.log("Tool names:", (tools.tools ?? []).map((t) => t.name));

const listPatternsResult = await client.callTool({
  name: "list_patterns",
  arguments: { stack: "web/react" },
});

assertHasStructuredContent(listPatternsResult, "list_patterns");
const listPayload = listPatternsResult.structuredContent as {
  patterns?: Array<{ id?: string }>;
};
const firstPatternId = listPayload.patterns?.[0]?.id;
if (!firstPatternId) {
  throw new Error("list_patterns returned no patterns; cannot run get_pattern smoke check.");
}

const getGlobalRulesResult = await client.callTool({
  name: "get_global_rules",
  arguments: { stack: "web/react" },
});
assertHasStructuredContent(getGlobalRulesResult, "get_global_rules");

const getPatternResult = await client.callTool({
  name: "get_pattern",
  arguments: { stack: "web/react", id: firstPatternId },
});
assertHasStructuredContent(getPatternResult, "get_pattern");

console.log("list_patterns result keys:", Object.keys(listPatternsResult));
console.log("get_global_rules result keys:", Object.keys(getGlobalRulesResult));
console.log("get_pattern result keys:", Object.keys(getPatternResult));
console.log(
  "structuredContent checks passed:",
  JSON.stringify(
    {
      list_patterns: true,
      get_global_rules: true,
      get_pattern: true,
      get_pattern_id: firstPatternId,
    },
    null,
    2
  )
);

process.exit(0);