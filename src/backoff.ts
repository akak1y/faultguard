export type BackoffStrategy = 'fixed' | 'linear' | 'exponential';

export interface BackoffConfig {
    strategy: BackoffStrategy;
    baseDelay: number;
    maxDelay?: number;
    factor?: number;
    jitter?: boolean;
}

export function computeDelay(retryNumber: number, config: BackoffConfig): number {
    const {
        strategy,
        baseDelay,
        maxDelay = Number.POSITIVE_INFINITY,
        factor = 2,
        jitter = false,
    } = config;

    let delay: number;

    switch (strategy) {
        case 'fixed':
            delay = baseDelay;
            break;
        case 'linear':
            delay = baseDelay * retryNumber;
            break;
        case 'exponential':
            delay = baseDelay * Math.pow(factor, retryNumber - 1);
            break;
        default: {
            const exhaustive: never = strategy;
            void exhaustive;
            delay = baseDelay;
            break;
        }
    }

    delay = Math.min(delay, maxDelay);
    if (jitter) delay = Math.random() * delay;

    return Math.max(0, Math.round(delay));
}
