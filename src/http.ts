// src/http.ts
import "dotenv/config";
import express from "express";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer as createSharedMcpServer } from "./mcp/createServer.js";
import { getConfig, SERVER_NAME, SERVER_VERSION } from "./config.js";

function createHttpMcpServer() {
  // Use the same corpus resolution and identity as the stdio transport, so both
  // read the bundled package corpus and advertise the same server name/version.
  // The index itself is a process-level singleton (see repo/cache.ts), so making
  // a fresh server per request only re-registers tools — it does not re-read the
  // corpus.
  const config = getConfig();
  return createSharedMcpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    patternsRoot: config.patternRepoPath,
    cacheTtlSeconds: config.cacheTtlSeconds,
  });
}

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Express `trust proxy` setting. Default OFF (false) so `req.ip` is the
 * unspoofable socket address. Behind a single reverse proxy (e.g. Railway) set
 * TRUST_PROXY=1 to derive the real client IP from the proxy-appended
 * X-Forwarded-For; a hop count / subnet list is also accepted. Never `true`:
 * that trusts the entire client-supplied XFF chain, letting any client forge
 * `req.ip` and bypass the rate limiter.
 */
function parseTrustProxy(value: string | undefined): boolean | number | string {
  const v = (value ?? "").trim();
  if (v === "" || v === "false") return false;
  if (v === "true") return true; // discouraged; documented footgun
  const n = Number(v);
  if (Number.isInteger(n) && String(n) === v) return n;
  return v; // e.g. "loopback" or a comma-separated subnet list
}

/**
 * Minimal in-memory fixed-window rate limiter, keyed by client IP. The open
 * 0.0.0.0 endpoint would otherwise be unbounded. A periodic sweep (unref'd, so
 * it never keeps the process alive) evicts expired windows so the map can't grow
 * without bound.
 */
function rateLimiter(opts: { windowMs: number; max: number; maxKeys?: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const maxKeys = opts.maxKeys ?? 100_000;

  function sweepExpired(now: number) {
    for (const [key, entry] of hits) {
      if (now >= entry.resetAt) hits.delete(key);
    }
  }

  const sweep = setInterval(() => sweepExpired(Date.now()), opts.windowMs);
  sweep.unref();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      // Hard cap on distinct keys as defense-in-depth against a map-growth DoS
      // (also mitigated by trust-proxy defaulting off). Reclaim expired entries
      // before admitting a new key.
      if (!hits.has(key) && hits.size >= maxKeys) sweepExpired(now);
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > opts.max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({
        jsonrpc: "2.0",
        error: { code: -32029, message: "Too Many Requests" },
        id: null,
      });
      return;
    }
    next();
  };
}

async function main() {
  const app = express();
  app.set("trust proxy", parseTrustProxy(process.env.TRUST_PROXY));
  app.use(express.json({ limit: "2mb" }));

  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
  const maxPerWindow = Number(process.env.RATE_LIMIT_MAX) || 120;
  app.use(rateLimiter({ windowMs, max: maxPerWindow }));

  // Health endpoint for Railway and humans.
  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      name: SERVER_NAME,
      version: SERVER_VERSION,
      contract_version: process.env.CONTRACT_VERSION ?? "v1",
    });
  });

  // Host + Origin validation via the SDK's DNS-rebinding protection. Configure
  // ALLOWED_HOSTS / ALLOWED_ORIGINS (comma-separated) for the deployed endpoint;
  // Host validation is what SF17 asks for and it also blocks DNS-rebinding.
  // NOTE: these transport options are marked @deprecated in @modelcontextprotocol/sdk
  // 1.26 in favor of external middleware; a future round may migrate. They remain
  // fully functional today.
  const allowedHosts = parseList(process.env.ALLOWED_HOSTS);
  const allowedOrigins = parseList(process.env.ALLOWED_ORIGINS);
  const enableDnsRebindingProtection = allowedHosts.length > 0 || allowedOrigins.length > 0;
  if (!enableDnsRebindingProtection) {
    console.warn(
      "[http] ALLOWED_HOSTS/ALLOWED_ORIGINS unset — Host/Origin validation is OFF. " +
        "Set them for any publicly reachable deployment."
    );
  }

  // Stateless transport: a fresh server + transport per request, so there is no
  // in-memory session map to leak on abrupt client disconnects and no sticky
  // routing requirement. The corpus index is shared across requests via the
  // process-level cache, so per-request cost is just tool registration.
  app.post("/mcp", async (req, res) => {
    const server = createHttpMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableDnsRebindingProtection,
      allowedHosts,
      allowedOrigins,
    });

    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("[http] request handling failed:", err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  // Stateless mode has no sessions, so the SSE GET stream and session DELETE are
  // not supported.
  const methodNotAllowed = (_req: express.Request, res: express.Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed (stateless server)" },
      id: null,
    });
  };
  app.get("/mcp", methodNotAllowed);
  app.delete("/mcp", methodNotAllowed);

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`MCP HTTP server listening on :${port} at /mcp`);
  });
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
