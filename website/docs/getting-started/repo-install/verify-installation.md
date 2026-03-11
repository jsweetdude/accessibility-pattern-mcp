---
title: Verify Installation
---

## Goal
- Confirm end-to-end behavior:
  - retrieval happens before code output
  - the correct pattern is selected
  - Must Haves / Golden Pattern guidance is applied
  - stack boundaries are respected

## Universal “Doctor” prompt
- “Implement a Toast component for this stack. Before writing code, retrieve A11y Context guidance and apply Must Haves and Golden Pattern. Use only one pattern.”

## Mode-specific checks
### MCP-only
- Confirm the assistant retrieves via MCP before coding
- Confirm it references key sections and applies them

### RAG-only
- Confirm retrieved chunks preserve headings
- Confirm it uses 1–3 chunks (not 10+)
- Confirm it retrieves within the correct stack

### Hybrid (MCP-first with fallback)
- Confirm MCP path works normally
- Optional: simulate MCP failure and confirm docs fallback works

## Pass criteria
- Retrieval happens before code output
- One pattern (unless implementing multiple distinct components)
- Correct stack
- Must Haves + Golden Pattern applied

## If it fails
- Check Enablement page first (instructions loaded?)
- If MCP: check endpoint reachability + client MCP configuration
- If RAG: check indexing/chunking + docs URL configuration
- See: Troubleshooting