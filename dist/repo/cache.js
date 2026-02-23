import { buildPatternIndex } from "./index.js";
export function createIndexCache(params) {
    const { patternRepoPath, cacheTtlSeconds } = params;
    const store = new Map();
    async function getIndex(stack) {
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
    function clear(stack) {
        if (stack)
            store.delete(stack);
        else
            store.clear();
    }
    return { getIndex, clear };
}
