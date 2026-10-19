import { createAbortError } from './types';

export interface Semaphore {
    acquire(signal?: AbortSignal): Promise<void>;
    release(): void;
    readonly available: number;
    readonly pending: number;
}

interface QueueEntry {
    resolve: () => void;
    reject: (error: unknown) => void;
}

export function semaphore(limit: number): Semaphore {
    let available = Math.max(0, limit);
    const queue: QueueEntry[] = [];

    const acquire = (signal?: AbortSignal): Promise<void> =>
        new Promise<void>((resolve, reject) => {
            if (signal?.aborted) {
                reject(createAbortError(signal));
                return;
            }
            if (available > 0) {
                available--;
                resolve();
                return;
            }
            const entry: QueueEntry = { resolve, reject };
            queue.push(entry);
            signal?.addEventListener(
                'abort',
                () => {
                    const idx = queue.indexOf(entry);
                    if (idx !== -1) {
                        queue.splice(idx, 1);
                        reject(createAbortError(signal));
                    }
                },
                { once: true },
            );
        });

    const release = (): void => {
        const next = queue.shift();
        if (next) next.resolve();
        else available++;
    };

    return {
        acquire,
        release,
        get available() {
            return available;
        },
        get pending() {
            return queue.length;
        },
    };
}
