import type { TelemetryEvent } from "./telemetry.js";
import { estimateTokensFromChars, logTelemetry, newTraceId, nowIso } from "./telemetry.js";

export async function withTelemetry<TArgs extends object, TResult extends object>(params: {
  tool: string;
  stack?: string;
  args: TArgs;
  handler: () => Promise<TResult>;
  summarizeResult?: (result: TResult) => TelemetryEvent["result"];
}): Promise<TResult> {
  const traceId = newTraceId();
  const startMs = Date.now();

  try {
    const result = await params.handler();
    const durationMs = Date.now() - startMs;
    const argsJson = JSON.stringify(params.args ?? {});
    const responseJson = JSON.stringify(result ?? {});

    logTelemetry({
      ts: nowIso(),
      trace_id: traceId,
      tool: params.tool,
      stack: params.stack,
      ok: true,
      duration_ms: durationMs,
      sizes: {
        args_bytes: Buffer.byteLength(argsJson, "utf8"),
        response_bytes: Buffer.byteLength(responseJson, "utf8"),
        response_chars: responseJson.length,
        est_tokens_chars_div4: estimateTokensFromChars(responseJson.length),
      },
      result: params.summarizeResult?.(result),
    });

    return result;
  } catch (error: unknown) {
    const durationMs = Date.now() - startMs;
    const argsJson = JSON.stringify(params.args ?? {});
    const message = error instanceof Error ? error.message : String(error);

    logTelemetry({
      ts: nowIso(),
      trace_id: traceId,
      tool: params.tool,
      stack: params.stack,
      ok: false,
      duration_ms: durationMs,
      sizes: {
        args_bytes: Buffer.byteLength(argsJson, "utf8"),
        response_bytes: 0,
        response_chars: 0,
        est_tokens_chars_div4: 0,
      },
      error: { message },
    });

    throw error;
  }
}
