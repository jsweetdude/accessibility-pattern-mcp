// src/http.ts
import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer as createSharedMcpServer } from "./mcp/createServer.js";

function resolvePatternsRoot() {
  // Key fix for prod: avoid machine-specific absolute paths.
  // Make prod deterministic: patterns live in the repo, so resolve from cwd.
  const rel = process.env.PATTERNS_DIR ?? "patterns";
  return path.resolve(process.cwd(), rel);
}

function createHttpMcpServer() {
  return createSharedMcpServer({
    name: "accessibility-context-mcp",
    version: process.env.CONTRACT_VERSION ?? "v1",
    patternsRoot: resolvePatternsRoot(),
    cacheTtlSeconds: process.env.CACHE_TTL_SECONDS
      ? Number(process.env.CACHE_TTL_SECONDS)
      : 60 * 60,
  });
}

function originGuard() {
  // MCP spec warns about Origin validation for HTTP transports. In practice,
  // Cursor/Claude Code are not browsers and often send no Origin header.
  // So: only enforce when Origin is present.
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const origin = req.headers.origin as string | undefined;
    if (!origin) return next();
    if (allowed.length === 0) return res.status(403).send("Origin not allowed");
    if (!allowed.includes(origin)) return res.status(403).send("Origin not allowed");
    next();
  };
}

async function main() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(originGuard());

  // Health endpoint for Railway and humans
  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      contract_version: process.env.CONTRACT_VERSION ?? "v1",
      patterns_dir: process.env.PATTERNS_DIR ?? "patterns",
    });
  });

  // Map transports by session ID (official SDK approach).
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    let transport: StreamableHTTPServerTransport | undefined;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports[id] = transport!;
        },
      });

      transport.onclose = () => {
        if (transport?.sessionId) delete transports[transport.sessionId];
      };

      const server = createHttpMcpServer();
      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID provided" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  };

  // GET for server-to-client notifications via SSE (part of Streamable HTTP behavior)
  app.get("/mcp", handleSessionRequest);

  // DELETE to end a session
  app.delete("/mcp", handleSessionRequest);

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`MCP HTTP server listening on :${port} at /mcp`);
  });
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
