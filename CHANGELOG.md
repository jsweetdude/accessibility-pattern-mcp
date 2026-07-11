# Changelog

## 0.1.1

Quality and robustness polish. No breaking changes to the published stdio tool contract; the three tools (`list_patterns`, `get_pattern`, `get_foundations`) and their success responses are byte-identical to 0.1.0.

### Tools

- **Structured, path-safe errors.** Tools now return `{ error_code, message }` with `isError: true` instead of throwing raw `Error`s. Stable codes: `PATTERN_NOT_FOUND`, `STACK_INVALID`, `CORPUS_UNAVAILABLE`, `INTERNAL_ERROR`. Absolute host filesystem paths are stripped from every client-reachable message.
- **`get_foundations` `scope` filter.** The `scope` argument is now declared on the tool and wired through, so `get_foundations({ scope: ["component"] })` returns only rules matching those scope buckets (it was previously accepted internally but never exposed).

### Server

- **Index built once per process.** The per-stack index is now a lazy, process-lifetime singleton (shared across the stdio server and per-request HTTP servers) instead of being rebuilt on a 1-hour TTL. `cache_ttl_seconds` remains a client-facing cache hint only.
- **HTTP transport hardening.** Runs stateless (no in-memory session map to leak), adds an in-memory per-IP rate limiter, and replaces the hand-rolled origin guard with the SDK's DNS-rebinding protection (`ALLOWED_HOSTS` / `ALLOWED_ORIGINS`) for Host/Origin validation.

### Tooling

- **`npm run sync-corpus`.** Refreshes the bundled `corpus/<stack>/` read-slice from a corpus-repo checkout, copying only published components (driven by `patterns.json` membership; `draft`/`deprecated` excluded).
- **Regression suite + CI.** Regenerated snapshot fixtures against the 0.5.2 corpus; the runner now validates the compiled `dist/` output. Added a GitHub Actions workflow running build + regression + a stdio handshake smoke as a pre-publish gate.
- Removed unused imports (`node:path` in `http.ts`, `sha256` in `repo/index.ts`).
