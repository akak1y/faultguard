import { TimeoutError } from './errors';
import type { MaybeAsync } from './types';

export interface TimeoutOptions {
    message?: string;
    signal?: AbortSignal;
}

export async function timeout<T>(
    operation: Promise<T> | ((signal: AbortSignal) => MaybeAsync<T>),
    ms: number,
    options: TimeoutOptions = {},
): Promise<T> {
    const { message, signal: external } = options;

    if (external?.aborted) {
        throw external.reason instanceof Error ? external.reason : new TimeoutError(ms, message);
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onExternalAbort = () => controller.abort(external?.reason);
    if (external) {
        external.addEventListener('abort', onExternalAbort, { once: true });
    }

    const work = typeof operation === 'function' ? operation(controller.signal) : operation;

    const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => controller.abort(new TimeoutError(ms, message)), ms);
        controller.signal.addEventListener(
            'abort',
            () => {
                const reason = controller.signal.reason;
                reject(reason instanceof Error ? reason : new TimeoutError(ms, message));
            },
            { once: true },
        );
    });

    try {
        return await Promise.race([Promise.resolve(work), deadline]);
    } finally {
        if (timer) clearTimeout(timer);
        if (external) external.removeEventListener('abort', onExternalAbort);
    }
}
