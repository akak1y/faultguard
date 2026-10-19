import type { MaybeAsync } from './types';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeout?: number;
    halfOpenRequests?: number;
    onStateChange?: (state: CircuitState) => void;
}

export class CircuitOpenError extends Error {
    constructor(readonly retryAfterMs: number) {
        super(`Circuit is open. Retry after ${retryAfterMs}ms.`);
        this.name = 'CircuitOpenError';
    }
}

export function circuitBreaker<TArgs extends unknown[], R>(
    fn: (...args: TArgs) => MaybeAsync<R>,
    options: CircuitBreakerOptions = {},
): (...args: TArgs) => Promise<R> {
    const {
        failureThreshold = 5,
        resetTimeout = 30_000,
        halfOpenRequests = 1,
        onStateChange,
    } = options;

    let state: CircuitState = 'closed';
    let failures = 0;
    let openedAt = 0;
    let halfOpenInFlight = 0;

    const setState = (next: CircuitState): void => {
        state = next;
        onStateChange?.(next);
    };

    return async (...args: TArgs): Promise<R> => {
        if (state === 'open') {
            const elapsed = Date.now() - openedAt;
            if (elapsed >= resetTimeout) {
                setState('half-open');
                halfOpenInFlight = 0;
            } else {
                throw new CircuitOpenError(resetTimeout - elapsed);
            }
        }

        if (state === 'half-open') {
            if (halfOpenInFlight >= halfOpenRequests) throw new CircuitOpenError(resetTimeout);
            halfOpenInFlight++;
        }

        try {
            const result = await fn(...args);
            if (state === 'half-open') {
                setState('closed');
                halfOpenInFlight = 0;
            }
            failures = 0;
            return result;
        } catch (error) {
            if (state === 'half-open') {
                halfOpenInFlight = 0;
                setState('open');
                openedAt = Date.now();
            } else {
                failures++;
                if (failures >= failureThreshold) {
                    setState('open');
                    openedAt = Date.now();
                }
            }
            throw error;
        }
    };
}
