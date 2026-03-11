---
title: Configure RAG
---

## When to do this
- Required if you selected **RAG-only**.
- Optional if you selected **Hybrid (MCP-first with fallback)**.
- Not needed if you selected **MCP-only**.

## What you need first
- A docs base URL or retrieval endpoint your assistant can use.
- Indexing completed (see **Indexing guidance** in Guides).

## Recommended wording (copy/paste)
- “If your organization has already indexed the A11y Context documentation and you have a retrieval endpoint or docs base URL available, you can enable docs retrieval with the command below.”

## Configure command (example)
- `npx @a11y-context config --docsBaseUrl=...` (TBD final flags)
- Optional: per-stack configuration if supported (TBD)

## What this updates
- Writes/updates `.a11y-context/config.json`
- Updates client instruction content as needed (idempotent)

## Next step
- Go to **Enable in Your Client**.