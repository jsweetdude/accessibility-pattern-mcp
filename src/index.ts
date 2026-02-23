import "dotenv/config";
import { startMcpServer } from "./mcp/server.js";

startMcpServer().catch((err: unknown) => {
  console.error("Startup failed ❌");
  console.error(err);
  process.exit(1);
});