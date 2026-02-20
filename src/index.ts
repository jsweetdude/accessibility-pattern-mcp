import { getConfig } from "./config";
import { buildPatternIndex } from "./repo/index";
import { StackRef } from "./contracts/v1/types";
import { listPatterns } from "./tools/listPatterns";

async function main() {
  const config = getConfig();

  // v1 stack
  const stack: StackRef = "web/react";

  console.log("Starting Accessibility Pattern MCP Server (dev smoke test)...");
  console.log("Pattern repo path:", config.patternRepoPath);

  const index = await buildPatternIndex(config.patternRepoPath, stack, config.cacheTtlSeconds);

  console.log("Index built successfully ✅");
  console.log("catalog_revision:", index.cache.catalog_revision);
  console.log("patterns indexed:", index.all.length);

  // Print first 3 pattern IDs as a sanity check
  console.log("first patterns:", index.all.slice(0, 3).map(p => p.id));

  const response = listPatterns(index, { stack, tags: ["accordion"] });
  console.log("list_patterns (accordion) count:", response.count);
  console.log("example:", response.patterns[0]);
}

main().catch((err) => {
  console.error("Startup failed ❌");
  console.error(err);
  process.exit(1);
});
