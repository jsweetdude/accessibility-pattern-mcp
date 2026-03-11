---
title: Enable in Your Client
---

## Goal
- Confirm your AI client:
  1) loads the repo instructions added by the kit, and
  2) can retrieve best practices (MCP and/or docs) before it writes code.

## Optional: should we ship a “doctor” script?
- Consider providing:
  - `npx @a11y-context doctor`
  - Checks config + presence of expected files
  - Optionally tests MCP endpoint connectivity
- Still keep human verification prompts because enforcement behavior is client-dependent.

## Claude Code
- Confirm you are in repo root
- Confirm instruction file exists (example: `CLAUDE.md`)
- If using MCP: confirm tool access (prompt-based test)

## Cursor
- Confirm repo rules file exists under `.cursor/rules/`
- Confirm rules load in workspace
- If using MCP: confirm MCP server enabled and reachable

## GitHub Copilot (VS Code / JetBrains / Xcode)
- Confirm `.github/copilot-instructions.md` exists
- Reload workspace/restart IDE to avoid caching
- Run prompt-based verification

## Android Studio Gemini
- Confirm `AGENTS.md` exists
- Ensure you’re running Gemini within the project context
- Confirm retrieval behavior using a short prompt

## Gemini CLI
- Confirm `GEMINI.md` exists
- Run from repo root so project context loads
- Confirm retrieval behavior using a short prompt

## Quick verification prompt (works across clients)
- “Implement a Toast component for this stack. Before writing code, retrieve A11y Context guidance and apply Must Haves and Golden Pattern. Use only one pattern.”

## Next step
- Go to **Verify Installation**.