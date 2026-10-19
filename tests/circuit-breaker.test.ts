import { describe, it, expect } from 'vitest';
import { circuitBreaker, CircuitOpenError } from '../src/circuit-breaker';
import { sleep } from '../src/sleep';
import type { CircuitState } from '../src/circuit-breaker';

describe('circuitBreaker', () => {
    it('opens after failure threshold', async () => {
        let calls = 0;
        const breaker = circuitBreaker(
            async () => {
                calls++;
                throw new Error('boom');
            },
            { failureThreshold: 2, resetTimeout: 10_000 },
        );
        await expect(breaker()).rejects.toThrow('boom');
        await expect(breaker()).rejects.toThrow('boom');
        await expect(breaker()).rejects.toBeInstanceOf(CircuitOpenError);
        expect(calls).toBe(2); // третий не дошёл до fn
    });

    it('transitions to half-open and closes on success', async () => {
        let fail = true;
        const states: CircuitState[] = [];
        const breaker = circuitBreaker(
            async () => {
                if (fail) throw new Error('down');
                return 'up';
            },
            {
                failureThreshold: 1,
                resetTimeout: 40,
                halfOpenRequests: 1,
                onStateChange: (s) => states.push(s),
            },
        );
        await expect(breaker()).rejects.toThrow('down'); // open
        await expect(breaker()).rejects.toBeInstanceOf(CircuitOpenError);
        await sleep(60); // wait reset
        fail = false;
        expect(await breaker()).toBe('up'); // half-open -> closed
        expect(states).toContain('open');
        expect(states).toContain('half-open');
        expect(states[states.length - 1]).toBe('closed');
    });

    it('re-opens on half-open failure', async () => {
        const breaker = circuitBreaker(async () => Promise.reject(new Error('still down')), {
            failureThreshold: 1,
            resetTimeout: 30,
            halfOpenRequests: 1,
        });
        await expect(breaker()).rejects.toThrow('still down');
        await sleep(50);
        await expect(breaker()).rejects.toThrow('still down'); // half-open probe fails
        await expect(breaker()).rejects.toBeInstanceOf(CircuitOpenError); // open again
    });
});
