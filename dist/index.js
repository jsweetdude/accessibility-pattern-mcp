"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const server_1 = require("./mcp/server");
(0, server_1.startMcpServer)().catch((err) => {
    console.error("Startup failed ❌");
    console.error(err);
    process.exit(1);
});
