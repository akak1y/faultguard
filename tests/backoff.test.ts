import { describe, it, expect } from 'vitest';
import { computeDelay } from '../src/backoff';

describe('computeDelay', () => {
    it('fixed returns constant delay', () => {
        const c = { strategy: 'fixed' as const, baseDelay: 100 };
        expect(computeDelay(1, c)).toBe(100);
        expect(computeDelay(9, c)).toBe(100);
    });

    it('linear grows linearly', () => {
        const c = { strategy: 'linear' as const, baseDelay: 100 };
        expect(computeDelay(1, c)).toBe(100);
        expect(computeDelay(3, c)).toBe(300);
    });

    it('exponential grows with factor 2', () => {
        const c = { strategy: 'exponential' as const, baseDelay: 100 };
        expect(computeDelay(1, c)).toBe(100);
        expect(computeDelay(2, c)).toBe(200);
        expect(computeDelay(4, c)).toBe(800);
    });

    it('exponential respects custom factor', () => {
        const c = { strategy: 'exponential' as const, baseDelay: 100, factor: 3 };
        expect(computeDelay(3, c)).toBe(900);
    });

    it('caps at maxDelay', () => {
        const c = { strategy: 'exponential' as const, baseDelay: 100, maxDelay: 500 };
        expect(computeDelay(10, c)).toBe(500);
    });

    it('jitter stays within [0, computed]', () => {
        const c = { strategy: 'exponential' as const, baseDelay: 100, jitter: true };
        for (let i = 0; i < 100; i++) {
            const d = computeDelay(3, c);
            expect(d).toBeGreaterThanOrEqual(0);
            expect(d).toBeLessThanOrEqual(400);
        }
    });
});
