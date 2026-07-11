// src/repo/cache.ts
import { StackRef } from "../contracts/v1/types.js";
import { buildPatternIndex, PatternIndex } from "./index.js";

export type IndexCache = {
  getIndex(stack: StackRef): Promise<PatternIndex>;
  clear(stack?: StackRef): void;
};

/**
 * Lazy singleton index cache, keyed by stack.
 *
 * The bundled corpus is static for the life of the process, so once a stack's
 * index is built we keep it — no TTL, no periodic re-glob/re-parse. We memoize
 * the in-flight Promise (not just the resolved value) so concurrent first-hits
 * dedupe onto a single build instead of racing several.
 */
export function createIndexCache(params: {
  patternRepoPath: string;
  cacheTtlSeconds: number;
}): IndexCache {
  const { patternRepoPath, cacheTtlSeconds } = params;

  const store = new Map<StackRef, Promise<PatternIndex>>();

  function getIndex(stack: StackRef): Promise<PatternIndex> {
    let inflight = store.get(stack);
    if (!inflight) {
      inflight = buildPatternIndex(patternRepoPath, stack, cacheTtlSeconds);
      // If the build rejects (e.g. an unpopulated stack), evict so a later call
      // can retry rather than caching the rejection for the whole process life.
      inflight.catch(() => store.delete(stack));
      store.set(stack, inflight);
    }
    return inflight;
  }

  function clear(stack?: StackRef) {
    if (stack) store.delete(stack);
    else store.clear();
  }

  return { getIndex, clear };
}

// Process-level memoization keyed by corpus path, so every server instance
// (the single stdio server, or a per-request HTTP server) shares one cache.
// The index is built at most once per process per stack — not once per server
// or per HTTP session.
const sharedCaches = new Map<string, IndexCache>();

export function getIndexCache(params: {
  patternRepoPath: string;
  cacheTtlSeconds: number;
}): IndexCache {
  const key = params.patternRepoPath;
  let cache = sharedCaches.get(key);
  if (!cache) {
    cache = createIndexCache(params);
    sharedCaches.set(key, cache);
  }
  return cache;
}
