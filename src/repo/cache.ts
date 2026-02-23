// src/repo/cache.ts
import { StackRef } from "../contracts/v1/types.js";
import { buildPatternIndex, PatternIndex } from "./index.js";

export type IndexCache = {
  getIndex(stack: StackRef): Promise<PatternIndex>;
  clear(stack?: StackRef): void;
};

export function createIndexCache(params: {
  patternRepoPath: string;
  cacheTtlSeconds: number;
}): IndexCache {
  const { patternRepoPath, cacheTtlSeconds } = params;

  const store = new Map<StackRef, { index: PatternIndex; builtAtMs: number }>();

  async function getIndex(stack: StackRef): Promise<PatternIndex> {
    const now = Date.now();
    const cached = store.get(stack);

    // If we have it and it's fresh enough, reuse it.
    if (cached) {
      const ageSeconds = (now - cached.builtAtMs) / 1000;
      if (ageSeconds < cacheTtlSeconds) {
        return cached.index;
      }
    }

    // Otherwise rebuild
    const index = await buildPatternIndex(patternRepoPath, stack, cacheTtlSeconds);
    store.set(stack, { index, builtAtMs: now });
    return index;
  }

  function clear(stack?: StackRef) {
    if (stack) store.delete(stack);
    else store.clear();
  }

  return { getIndex, clear };
}