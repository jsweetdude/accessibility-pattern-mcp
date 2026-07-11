# @a11y-context/mcp-server

A [Model Context Protocol](https://modelcontextprotocol.io) server that serves the [A11y Context](https://a11y-context-project.vercel.app) accessibility-pattern corpus — WCAG 2.2 AA component patterns and cross-cutting Foundations rules — to AI coding agents.

The server is the **retrieval mechanism**. Pair it with the A11y Context **MCP skill** (the brain that selects which patterns a task needs); the skill calls these tools. See the [setup guide](https://a11y-context-project.vercel.app/getting-started/ai-coding-agents/install/mcp-server).

## Install

**Claude Code:**

```bash
claude mcp add a11y-context -- npx -y @a11y-context/mcp-server
```

Or add it to your MCP client config (`.mcp.json`, `.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "a11y-context": {
      "command": "npx",
      "args": ["-y", "@a11y-context/mcp-server"]
    }
  }
}
```

Then run `/mcp` (in Claude Code) to confirm it's connected.

## Tools

| Tool | Purpose |
|---|---|
| `list_patterns` | List the available component patterns for a stack. Call first to select which patterns a task needs (via each entry's `selection_excerpt`). |
| `get_pattern` | Get the full spec for one pattern by `id`: `must_haves`, `donts`, `golden_pattern`, `customizable`, `acceptance_checks`. |
| `get_foundations` | Get the cross-cutting Foundations rules (focus, landmarks, headings, contrast, page structure). Retrieve on every UI task; each rule's `scope` decides where it applies. |

All tools take a `stack` argument (defaults to `web/react`, the only fully populated stack today).

## Corpus

The server ships a bundled snapshot of the corpus at `corpus/<stack>/`, refreshed per release. Retrieval is deterministic ID-based selection — no vector database, no embeddings.

## Transports

- **stdio** (default, via `npx`) — runs locally in your MCP client.
- **HTTP** — `npm run start` serves the same tools over HTTP for clients that connect by URL. The HTTP endpoint is stateless (no session state to leak) and rate-limited. For any publicly reachable deployment, set `ALLOWED_HOSTS` and/or `ALLOWED_ORIGINS` (comma-separated) to enable Host/Origin validation (DNS-rebinding protection); it stays off with a warning until configured.

  | Env var | Default | Purpose |
  |---|---|---|
  | `PORT` | `3000` | HTTP listen port. |
  | `ALLOWED_HOSTS` | *(unset)* | Comma-separated allowlist of `Host` header values. |
  | `ALLOWED_ORIGINS` | *(unset)* | Comma-separated allowlist of `Origin` header values. |
  | `TRUST_PROXY` | `false` | Express `trust proxy`. Set to `1` (hop count) behind a single reverse proxy (e.g. Railway) so per-IP rate limiting uses the real client IP. Leave off when directly exposed; never `true`. |
  | `RATE_LIMIT_MAX` | `120` | Max requests per IP per window. |
  | `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window in ms. |

## Development

```bash
npm install
npm run build
npm run dev          # stdio, ts-node
npm run inspector    # MCP Inspector
```

Override the corpus location with `PATTERN_REPO_PATH` (absolute, or relative to the package root) to develop against a live corpus checkout.

### Refreshing the bundled corpus

The package ships a snapshot of the corpus under `corpus/<stack>/`. Refresh it from a checkout of the corpus repo with:

```bash
npm run sync-corpus -- --source /path/to/accessibility-pattern-api
# options: --stack web/react (default), --dry-run
# or set A11Y_CORPUS_SOURCE instead of --source
```

It copies only the published read-slice — `patterns.json`, `global/global_rules.md`, and the components listed in `patterns.json` — into `corpus/<stack>/`. Membership is driven by `patterns.json`, so `status: draft` and `status: deprecated` components are excluded (a draft/deprecated member aborts the sync). The copied `patterns.json` records the source `catalog_revision`. Commit the resulting `corpus/` changes as part of the release.

## License

[Apache-2.0](./LICENSE). The bundled corpus content is also Apache-2.0.
