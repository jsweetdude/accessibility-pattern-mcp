---
title: Troubleshooting
---

## Common issues
- Instructions not being loaded by the client
- MCP endpoint unreachable or not enabled
- RAG retrieval returns wrong stack
- Retrieved chunks missing headings or too large
- Too many chunks returned

## Quick fixes
- Reload workspace / restart IDE
- Confirm you’re running the client from the repo root
- Confirm kit files exist and are committed
- Validate MCP endpoint connectivity (if applicable)
- Validate docs base URL configuration and indexing freshness

## What to collect for support
- Client name + version
- Mode (MCP-only, RAG-only, Hybrid)
- Stack (web/react, android/compose, etc.)
- The verification prompt you used
- What you observed (retrieval happened? which source? headings present?)