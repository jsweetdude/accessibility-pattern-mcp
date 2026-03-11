---
title: Getting Started
---

## Purpose
- Improve accessibility quality of AI-generated code by enforcing retrieval and application of proven best practices (patterns + global rules).

## What you’ll get
- More consistent accessible UI code from AI assistants
- Fewer accessibility regressions and “audit surprises”
- A repeatable workflow across teams and repos

## How it works
- **User request** → **Enforcement** → **Retrieval** → **Best practices applied** → Accessible code output
- Key parts:
  - **User request:** developer asks for UI code or changes
  - **Enforcement:** instructions require retrieval before code output
  - **Retrieval:** MCP and/or docs (RAG) provide the relevant guidance
  - **Best practices:** stack-specific patterns + global rules

## Prerequisites
- Write access to the repo(s) you want to enable
- Supported AI client(s) (Cursor, Claude Code, Copilot, Android Studio Gemini, Gemini CLI, etc.)
- Optional:
  - MCP endpoint allowed by your network/security posture
  - Docs indexing/retrieval capability if you want RAG fallback or docs-only mode

## Recommended defaults
- **Enforcement:** repo-scoped kit (portable, predictable)
- **Retrieval:** MCP-first with docs fallback (best balance of determinism + resilience)

## Next step
- Go to **Choose Setup Path**.