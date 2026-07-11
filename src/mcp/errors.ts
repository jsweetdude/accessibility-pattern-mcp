// src/mcp/errors.ts
//
// Structured, client-safe tool errors.
//
// Tools throw `ToolFailure` with a stable `error_code` (never a raw path in the
// message). At the MCP boundary, `toErrorResult` turns any throw into a
// `jsonResult({ error_code, message }, { isError: true })` so clients get a
// predictable shape and never see absolute host filesystem paths.

import { jsonResult } from "./response.js";

/**
 * Stable, client-facing error codes. Clients can branch on these instead of
 * string-matching messages. New codes are additive.
 */
export const ERROR_CODES = {
  /** Requested pattern id is not in the catalog for the given stack. */
  PATTERN_NOT_FOUND: "PATTERN_NOT_FOUND",
  /** Requested stack is not usable (e.g. index built for a different stack). */
  STACK_INVALID: "STACK_INVALID",
  /** The corpus for the requested stack could not be loaded or parsed. */
  CORPUS_UNAVAILABLE: "CORPUS_UNAVAILABLE",
  /** Catch-all for unexpected failures (message is scrubbed of host paths). */
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * A tool failure whose message is already safe to return to a client.
 * Throw this from tool/repo code for known, enumerated conditions.
 */
export class ToolFailure extends Error {
  readonly error_code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(error_code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ToolFailure";
    this.error_code = error_code;
    this.details = details;
  }
}

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Remove absolute host paths from a message so nothing client-reachable leaks
 * the server's filesystem layout. Known corpus/package roots are turned into
 * their relative tail; any remaining home-dir absolute prefix is collapsed.
 *
 * Throw sites already compose messages with relative paths — this is a
 * defense-in-depth backstop for unexpected errors.
 */
export function scrubPaths(message: string, roots: string[] = []): string {
  // Work on a slash-normalized copy so a native (backslash) root reliably
  // matches a message whose paths may be POSIX-normalized (fast-glob / toPosix
  // store forward slashes even on Windows) or native. These error messages are
  // path/id-centric, so normalizing stray backslashes is harmless.
  let out = message.replace(/\\/g, "/");

  for (const root of roots) {
    if (!root) continue;
    const normalized = root.replace(/\\/g, "/").replace(/\/+$/, "");
    if (!normalized) continue;
    // "<root>/a/b" -> "a/b", bare "<root>" -> ""
    out = out.replace(new RegExp(escapeForRegex(normalized) + "/?", "g"), "");
  }

  // Backstop: collapse any lingering absolute home path not under a known root.
  // Covers posix (/Users, /home) and Windows drive paths, which are forward-slash
  // after the normalization above (e.g. "C:/Users/john/").
  out = out
    .replace(/[A-Za-z]:\/Users\/[^/\s"']+\//g, "~/")
    .replace(/\/Users\/[^/\s"']+\//g, "~/")
    .replace(/\/home\/[^/\s"']+\//g, "~/");
  return out;
}

/**
 * Convert any thrown value into a structured, client-safe error result.
 * Known `ToolFailure`s keep their code; anything else becomes INTERNAL_ERROR.
 */
export function toErrorResult(err: unknown, roots: string[] = []) {
  if (err instanceof ToolFailure) {
    return jsonResult(
      {
        error_code: err.error_code,
        message: scrubPaths(err.message, roots),
        ...(err.details ? { details: err.details } : {}),
      },
      { isError: true }
    );
  }

  const rawMessage = err instanceof Error ? err.message : String(err);
  return jsonResult(
    { error_code: ERROR_CODES.INTERNAL_ERROR, message: scrubPaths(rawMessage, roots) },
    { isError: true }
  );
}
