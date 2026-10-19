import { createAbortError } from './types';

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
            reject(createAbortError(signal));
            return;
        }

        const onAbort = () => {
            clearTimeout(timer);
            reject(createAbortError(signal));
        };

        const timer = setTimeout(() => {
            if (signal) signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);

        if (signal) {
            signal.addEventListener('abort', onAbort, { once: true });
        }
    });
}
