import { describe, it, expect, vi } from 'vitest';
import { sleep } from '../src/sleep';

describe('sleep', () => {
    it('resolves after duration', async () => {
        const start = Date.now();
        await sleep(40);
        expect(Date.now() - start).toBeGreaterThanOrEqual(30);
    });

    it('rejects immediately if already aborted', async () => {
        const c = new AbortController();
        c.abort();
        await expect(sleep(5000, c.signal)).rejects.toThrow('aborted');
    });

    it('rejects when aborted mid-flight', async () => {
        const c = new AbortController();
        const p = sleep(10_000, c.signal);
        setTimeout(() => c.abort(), 30);
        const start = Date.now();
        await expect(p).rejects.toThrow('aborted');
        expect(Date.now() - start).toBeLessThan(2000);
    });

    it('uses custom abort reason', async () => {
        const c = new AbortController();
        c.abort(new Error('custom reason'));
        await expect(sleep(5000, c.signal)).rejects.toThrow('custom reason');
    });

    it('cleans up listener after completion', async () => {
        const c = new AbortController();
        const spy = vi.spyOn(c.signal, 'removeEventListener');
        await sleep(10, c.signal);
        expect(spy).toHaveBeenCalledWith('abort', expect.any(Function));
        spy.mockRestore();
    });
});
