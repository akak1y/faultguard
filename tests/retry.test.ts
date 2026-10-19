import { describe, it, expect, vi } from 'vitest';
import { retry } from '../src/retry';

describe('retry', () => {
    it('returns on first success', async () => {
        const fn = vi.fn().mockResolvedValue('ok');
        expect(await retry(fn, { retries: 3, delay: 1 })).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries until success', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('e1'))
            .mockRejectedValueOnce(new Error('e2'))
            .mockResolvedValue('ok');
        expect(await retry(fn, { retries: 5, delay: 1 })).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('works with sync fn', async () => {
        let n = 0;
        const result = await retry(
            () => {
                n++;
                if (n < 3) throw new Error('nope');
                return 42;
            },
            { retries: 5, delay: 1 },
        );
        expect(result).toBe(42);
    });

    it('throws last error when exhausted', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('always'));
        await expect(retry(fn, { retries: 2, delay: 1 })).rejects.toThrow('always');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('stops early when retryIf returns false', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('temp'))
            .mockRejectedValueOnce(new Error('fatal'));
        await expect(
            retry(fn, {
                retries: 10,
                delay: 1,
                retryIf: (e) => (e as Error).message !== 'fatal',
            }),
        ).rejects.toThrow('fatal');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('supports async retryIf', async () => {
        const fn = vi.fn().mockRejectedValueOnce(new Error('t')).mockResolvedValue('ok');
        expect(await retry(fn, { retries: 3, delay: 1, retryIf: async () => true })).toBe('ok');
    });

    it('calls onRetry with retry numbers', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('a'))
            .mockRejectedValueOnce(new Error('b'))
            .mockResolvedValue('ok');
        const onRetry = vi.fn();
        await retry(fn, { retries: 5, delay: 1, onRetry });
        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(onRetry.mock.calls[0]![1]).toBe(1);
        expect(onRetry.mock.calls[1]![1]).toBe(2);
    });

    it('rejects immediately if signal already aborted', async () => {
        const c = new AbortController();
        c.abort();
        const fn = vi.fn();
        await expect(retry(fn, { retries: 5, signal: c.signal })).rejects.toThrow('aborted');
        expect(fn).not.toHaveBeenCalled();
    });

    it('cancels mid-flight on abort', async () => {
        const c = new AbortController();
        const fn = vi.fn().mockRejectedValue(new Error('fail'));
        const p = retry(fn, { retries: 100, delay: 20, signal: c.signal });
        setTimeout(() => c.abort(), 50);
        await expect(p).rejects.toThrow('aborted');
        expect(fn.mock.calls.length).toBeLessThan(20);
    });

    it('passes attempt and signal in context', async () => {
        const c = new AbortController();
        const attempts: number[] = [];
        let seenSignal: AbortSignal | undefined;
        await retry(
            ({ attempt, signal }) => {
                attempts.push(attempt);
                seenSignal = signal;
                if (attempt < 2) throw new Error('x');
                return 'done';
            },
            { retries: 5, delay: 1, signal: c.signal },
        );
        expect(attempts).toEqual([0, 1, 2]);
        expect(seenSignal).toBe(c.signal);
    });

    it('applies increasing delays with exponential backoff', async () => {
        const ts: number[] = [];
        const fn = vi.fn(async () => {
            ts.push(Date.now());
            if (ts.length < 4) throw new Error('fail');
            return 'ok';
        });
        await retry(fn, { retries: 5, delay: 40, backoff: 'exponential', jitter: false });
        expect(ts[1]! - ts[0]!).toBeGreaterThanOrEqual(25);
        expect(ts[2]! - ts[1]!).toBeGreaterThan(ts[1]! - ts[0]!);
    });
});
