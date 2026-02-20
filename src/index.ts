import { startMcpServer } from "./mcp/server";

startMcpServer().catch((err) => {
  console.error("Startup failed ❌");
  console.error(err);
  process.exit(1);
});