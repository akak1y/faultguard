import { createAbortError, type MaybeAsync } from './types';

export interface PoolOptions {
    concurrency?: number;
    signal?: AbortSignal;
}

export async function pool<T, R>(
    items: readonly T[],
    fn: (item: T, index: number) => MaybeAsync<R>,
    options: PoolOptions = {},
): Promise<R[]> {
    const { concurrency = 10, signal } = options;
    const limit = Math.max(1, Math.min(concurrency, items.length || 1));
    const results = new Array<R>(items.length);
    let nextIndex = 0;

    const runWorker = async (): Promise<void> => {
        while (nextIndex < items.length) {
            if (signal?.aborted) throw createAbortError(signal);
            const i = nextIndex++;
            results[i] = await fn(items[i]!, i);
        }
    };

    await Promise.all(Array.from({ length: limit }, () => runWorker()));
    return results;
}
