import { describe, it, expect } from 'vitest';
import { semaphore } from '../src/semaphore';
import { sleep } from '../src/sleep';

describe('semaphore', () => {
    it('starts fully available', () => {
        const sem = semaphore(3);
        expect(sem.available).toBe(3);
        expect(sem.pending).toBe(0);
    });

    it('limits concurrent access', async () => {
        const sem = semaphore(2);
        let active = 0;
        let max = 0;
        const task = async () => {
            await sem.acquire();
            active++;
            max = Math.max(max, active);
            await sleep(15);
            active--;
            sem.release();
        };
        await Promise.all(Array.from({ length: 8 }, task));
        expect(max).toBeLessThanOrEqual(2);
        expect(sem.available).toBe(2);
        expect(sem.pending).toBe(0);
    });

    it('queues excess acquires', async () => {
        const sem = semaphore(1);
        await sem.acquire();
        const second = sem.acquire();
        expect(sem.pending).toBe(1);
        sem.release();
        await second;
        expect(sem.available).toBe(0);
        sem.release();
    });

    it('cancels a queued acquire on abort', async () => {
        const sem = semaphore(1);
        await sem.acquire();
        const c = new AbortController();
        const waiting = sem.acquire(c.signal);
        expect(sem.pending).toBe(1);
        c.abort();
        await expect(waiting).rejects.toThrow('aborted');
        sem.release();
        expect(sem.available).toBe(1);
    });
});
