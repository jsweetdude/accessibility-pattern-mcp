---
title: Choose Retrieval Mode
---

## What “retrieval mode” means
- Retrieval mode determines where the assistant fetches A11y Context best practices at runtime.

## Options
### Hybrid (recommended): MCP-first with RAG fallback
- MCP is attempted first for structured, deterministic retrieval.
- If MCP is unavailable, the assistant falls back to docs retrieval (typically via your index/RAG system).
- Requires:
  - MCP access
  - Indexing if you want fallback to actually work

### MCP-only
- Retrieves only via MCP tools.
- Requires:
  - MCP access
- Does not require indexing.

### RAG-only (docs-only)
- Retrieves only from documentation via indexing/RAG.
- Requires:
  - indexing + a retrievable docs base URL or retrieval endpoint

## Why some teams avoid MCP
- Network/security restrictions
- Tool limitations in certain IDEs
- Hosting/uptime concerns

## Why docs retrieval can be tricky
- Chunking that merges sections
- Missing headings in retrieved chunks
- Wrong-stack contamination
- Too many chunks retrieved

## Recommendation
- Use Hybrid by default when you can.
- Use MCP-only for simplest ops.
- Use RAG-only when MCP isn’t viable.

## Next step
- Continue to **Install the Kit**.
- If you want docs retrieval now, see **Indexing guidance** (Guides) and then return.