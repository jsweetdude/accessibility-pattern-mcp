import crypto from "node:crypto";

export type TelemetryEvent = {
  ts: string;
  trace_id: string;
  tool: string;
  stack?: string;
  ok: boolean;
  duration_ms: number;
  sizes: {
    args_bytes: number;
    response_bytes: number;
    response_chars: number;
    est_tokens_chars_div4: number;
  };
  result?: {
    count?: number;
    pattern_id?: string;
    rules_count?: number;
    cache_ttl_seconds?: number;
    catalog_revision?: string;
  };
  error?: {
    message: string;
  };
};

export function newTraceId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function estimateTokensFromChars(chars: number): number {
  // Crude but consistent estimate.
  return Math.ceil(chars / 4);
}

export function logTelemetry(evt: TelemetryEvent) {
  // Keep MCP stdio output clean by writing telemetry to stderr.
  console.error(JSON.stringify(evt));
}
