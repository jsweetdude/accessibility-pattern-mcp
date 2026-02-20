import { getConfig } from "./config";
import { buildPatternIndex } from "./repo/index";
import { StackRef } from "./contracts/v1/types";
import { listPatterns } from "./tools/listPatterns";

async function main() {
  const config = getConfig();

  // MVP stacks: web/react and android/compose
  const stacks: StackRef[] = ["web/react", "android/compose"];

  console.log("Starting Accessibility Pattern MCP Server (dev smoke test)...");
  console.log("Pattern repo path:", config.patternRepoPath);

  for (const stack of stacks) {
    console.log(`\n--- Testing stack: ${stack} ---`);
    
    try {
      const index = await buildPatternIndex(config.patternRepoPath, stack, config.cacheTtlSeconds);

      console.log("Index built successfully ✅");
      console.log("catalog_revision:", index.cache.catalog_revision);
      console.log("patterns indexed:", index.all.length);

      // Print first 3 pattern IDs as a sanity check
      if (index.all.length > 0) {
        console.log("first patterns:", index.all.slice(0, 3).map(p => p.id));

        const response = listPatterns(index, { stack });
        console.log("list_patterns count:", response.count);
        console.log("example:", response.patterns[0]);
        if (response.patterns.length > 0) {
          console.log("example:", response.patterns[0]);
        }
      } else {
        console.log("No patterns found for this stack");
      }
    } catch (error) {
      console.error(`Failed to process stack ${stack}:`, error);
    }
  }
}

main().catch((err) => {
  console.error("Startup failed ❌");
  console.error(err);
  process.exit(1);
});
