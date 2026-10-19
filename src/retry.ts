import { computeDelay, type BackoffStrategy } from './backoff';
import { sleep } from './sleep';
import { createAbortError, type MaybeAsync } from './types';

export interface RetryContext {
    attempt: number;
    signal?: AbortSignal;
}

export interface RetryOptions {
    retries?: number;
    delay?: number;
    backoff?: BackoffStrategy;
    maxDelay?: number;
    factor?: number;
    jitter?: boolean;
    retryIf?: (error: unknown) => MaybeAsync<boolean>;
    onRetry?: (error: unknown, retryNumber: number) => void;
    signal?: AbortSignal;
}

export async function retry<T>(
    fn: (context: RetryContext) => MaybeAsync<T>,
    options: RetryOptions = {},
): Promise<T> {
    const {
        retries = 3,
        delay = 1000,
        backoff = 'exponential',
        maxDelay,
        factor = 2,
        jitter = true,
        retryIf,
        onRetry,
        signal,
    } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        if (signal?.aborted) throw createAbortError(signal);

        try {
            return await fn({ attempt, signal });
        } catch (error) {
            lastError = error;

            if (attempt >= retries) break;

            if (retryIf) {
                const shouldRetry = await retryIf(error);
                if (!shouldRetry) break;
            }

            if (signal?.aborted) throw createAbortError(signal);

            onRetry?.(error, attempt + 1);

            const waitMs = computeDelay(attempt + 1, {
                strategy: backoff,
                baseDelay: delay,
                maxDelay,
                factor,
                jitter,
            });

            if (waitMs > 0) await sleep(waitMs, signal);
        }
    }

    throw lastError;
}
