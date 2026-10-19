# 🧩 Patterns & Recipes

Primitives are designed to combine. Since `compose()` is still on the roadmap,
these recipes nest wrappers by hand — which is explicit and easy to reason
about. Each recipe answers one question you will actually face in production.

---

## 1. A resilient HTTP client (retry + timeout)

Goal: every attempt has its own deadline, and the whole thing is cancellable.
Put `retry` **outside** and `timeout` **inside** each attempt, so a slow
response is aborted and then retried, rather than one global deadline cutting
off all retries.

```ts
import { retry, timeout } from 'faultguard';

export function makeResilientFetch(defaults = {}) {
    return function resilientFetch(input: string, init: RequestInit = {}) {
        return retry(
            ({ signal }) =>
                timeout(
                    (timeoutSignal) =>
                        // combine: abort the fetch if EITHER signal fires
                        fetch(input, { ...init, signal: timeoutSignal }),
                    defaults.timeoutMs ?? 5000,
                    { signal }, // honour the caller's outer signal too
                ),
            {
                retries: defaults.retries ?? 3,
                delay: defaults.delay ?? 500,
                backoff: 'exponential',
                retryIf: (err) => !isFatal(err),
                ...defaults.retry,
            },
        );
    };
}

function isFatal(err: unknown) {
    const m = (err as Error).message ?? '';
    return m.includes('HTTP 4') && !m.includes('429'); // 4xx (except 429) won't heal
}
```

The `signal` flows top-down: caller → `retry` context → `timeout` external
signal → `fetch`. One abort cancels everything cleanly.

---

## 2. Circuit breaker with a fallback

Goal: when a dependency is down, serve stale cache or a default instead of
erroring to the user. Catch `CircuitOpenError` specifically.

```ts
import { circuitBreaker, CircuitOpenError } from 'faultguard';

const getPrice = circuitBreaker(fetchPriceFromService, {
    failureThreshold: 4,
    resetTimeout: 20_000,
});

export async function getPriceSafe(sku: string): Promise<number> {
    try {
        const price = await getPrice(sku);
        cache.set(sku, price); // remember the last good value
        return price;
    } catch (err) {
        if (err instanceof CircuitOpenError) {
            return cache.get(sku) ?? DEFAULT_PRICE; // fail soft
        }
        throw err; // real errors still propagate
    }
}
```

`err.retryAfterMs` tells you how long the circuit stays open — useful for
`Retry-After` headers on your own endpoints.

---

## 3. Retry inside pool (NOT the other way around)

Goal: process 1000 jobs, each independently retried, with bounded parallelism.
The order matters: **`retry` goes inside the pool's worker**, so a single
failing job retries on its own without restarting the batch.

```ts
import { pool, retry } from 'faultguard';

// ✅ correct: per-job retry, global concurrency cap
const results = await pool(
    jobs,
    (job) =>
        retry(() => processJob(job), {
            retries: 3,
            delay: 200,
            backoff: 'exponential',
        }),
    { concurrency: 16 },
);

// ❌ wrong: retries the ENTIRE batch of 1000 on any failure
// await retry(() => pool(jobs, processJob), { retries: 3 });
```

Rule of thumb: the **outer** primitive controls _scale_ (pool, semaphore), the
**inner** one controls _per-unit reliability_ (retry, timeout).

---

## 4. Guarding a database connection pool

Goal: never exceed N simultaneous queries, even under burst load. `semaphore`
matches a fixed resource budget exactly.

```ts
import { semaphore } from 'faultguard';

const gate = semaphore(10); // matches your DB pool size

export async function runQuery<T>(sql: string, params: unknown[]) {
    await gate.acquire();
    try {
        return await db.query<T>(sql, params);
    } finally {
        gate.release(); // mandatory — a leaked permit deadlocks the gate
    }
}
```

Unlike `pool`, the semaphore is long-lived and shared across all callers, which
is exactly what a connection budget requires.

---

## 5. Graceful shutdown with one shared signal

Goal: on `SIGTERM`, stop accepting work and cancel in-flight resilient calls so
the process can exit. Create one `AbortController` and thread its signal into
every primitive.

```ts
import { retry } from 'faultguard';

const shutdown = new AbortController();

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => shutdown.abort(new Error(`received ${sig}`)));
}

async function handle(req: Request) {
    return retry(
        async ({ signal }) => {
            // signal is the shutdown signal; fetch aborts on shutdown
            const res = await fetch(upstream(req), { signal });
            return res.json();
        },
        { signal: shutdown.signal, retries: 2, delay: 100 },
    );
}
```

Because `retry` checks the signal before each attempt and passes it down, an
abort mid-retry stops the loop instantly instead of burning the remaining
attempts.

---

## 6. Honoring rate limits (429)

Goal: when upstream returns 429, retry — but never retry other 4xx, and back off
harder. Use `retryIf` to classify, and rely on exponential backoff for spacing.

```ts
import { retry } from 'faultguard';

const data = await retry(
    async ({ signal }) => {
        const res = await fetch(apiUrl, { signal });
        if (res.status === 429) throw Object.assign(new Error('HTTP 429'), { status: 429 });
        if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
        return res.json();
    },
    {
        retries: 6,
        delay: 1000,
        backoff: 'exponential',
        maxDelay: 30_000,
        // retry ONLY 429 and 5xx; give up on every other 4xx
        retryIf: (err) => {
            const status = (err as { status?: number }).status;
            return status === 429 || (status !== undefined && status >= 500);
        },
    },
);
```

> Note: this approximates the server's `Retry-After` via exponential backoff.
> Exact `Retry-After` support arrives with custom backoff strategies on the
> roadmap; until then, exponential + `maxDelay` is a safe approximation.

---

## 🧭 Choosing the right primitive

| Situation                               | Use                      |
| --------------------------------------- | ------------------------ |
| Operation may fail transiently          | `retry`                  |
| Operation may hang                      | `timeout`                |
| Dependency is down, stop calling it     | `circuitBreaker`         |
| Many independent items, cap parallelism | `pool`                   |
| Fixed shared resource budget            | `semaphore`              |
| Need all of the above together          | nest them (recipes 1, 3) |
