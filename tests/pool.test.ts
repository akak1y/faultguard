import { describe, it, expect } from 'vitest';
import { pool } from '../src/pool';
import { sleep } from '../src/sleep';

describe('pool', () => {
    it('preserves result order', async () => {
        const items = [1, 2, 3, 4, 5];
        const res = await pool(items, async (x) => x * 2, { concurrency: 2 });
        expect(res).toEqual([2, 4, 6, 8, 10]);
    });

    it('limits concurrency', async () => {
        let active = 0;
        let max = 0;
        const items = Array.from({ length: 12 }, (_, i) => i);
        await pool(
            items,
            async () => {
                active++;
                max = Math.max(max, active);
                await sleep(10);
                active--;
            },
            { concurrency: 3 },
        );
        expect(max).toBeLessThanOrEqual(3);
    });

    it('handles empty input', async () => {
        expect(await pool([], async () => 1)).toEqual([]);
    });

    it('rejects on abort', async () => {
        const c = new AbortController();
        c.abort();
        await expect(pool([1, 2, 3], async () => 1, { signal: c.signal })).rejects.toThrow(
            'aborted',
        );
    });
});
