import { describe, it, expect } from 'vitest';
import { timeout } from '../src/timeout';
import { TimeoutError } from '../src/errors';
import { sleep } from '../src/sleep';

describe('timeout', () => {
    it('resolves when fast', async () => {
        expect(await timeout(Promise.resolve(42), 100)).toBe(42);
    });

    it('rejects with TimeoutError when slow', async () => {
        await expect(timeout(new Promise(() => {}), 30)).rejects.toBeInstanceOf(TimeoutError);
    });

    it('aborts the operation signal on timeout', async () => {
        let aborted = false;
        await expect(
            timeout(async (signal) => {
                try {
                    await sleep(5000, signal);
                } catch {
                    aborted = signal.aborted;
                    throw new Error('inner');
                }
                return 'never';
            }, 30),
        ).rejects.toBeInstanceOf(TimeoutError);
        expect(aborted).toBe(true);
    });

    it('propagates external abort reason', async () => {
        const c = new AbortController();
        const p = timeout(
            async (signal) => {
                await sleep(5000, signal);
                return 1;
            },
            5000,
            { signal: c.signal },
        );
        c.abort(new Error('user cancel'));
        await expect(p).rejects.toThrow('user cancel');
    });

    it('rejects immediately if external signal already aborted', async () => {
        const c = new AbortController();
        c.abort(new Error('pre-cancel'));
        await expect(timeout(async () => 1, 1000, { signal: c.signal })).rejects.toThrow(
            'pre-cancel',
        );
    });
});
