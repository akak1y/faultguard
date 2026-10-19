# faultguard

Fault-tolerant async primitives for JavaScript. Retry, timeout, circuit breaker, concurrency pool, semaphore — all in one tiny, zero-dependency package.

- **Zero dependencies** — nothing to audit, nothing to break
- **< 5 KB** — tree-shakeable, ESM + CJS
- **TypeScript-first** — full generics, strict types
- **Runtime-agnostic** — Node ≥ 18, Deno, Bun, browsers, edge runtimes
- **AbortController-native** — cancel anything, anytime

## Install

```bash
npm install faultguard
```

## Quick start

```ts
import { retry } from 'faultguard';

const data = await retry(
    async ({ signal }) => {
        const res = await fetch('https://api.example.com/data', { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },
    {
        retries: 5,
        delay: 500,
        backoff: 'exponential',
        retryIf: (err) => (err as Error).message !== 'HTTP 404',
        onRetry: (err, n) => console.warn(`Retry #${n}:`, (err as Error).message),
    },
);
```

## API

### `retry(fn, options?)`

Retries a function with configurable backoff and abort support. `fn` receives `{ attempt, signal }`.

| Option     | Type                                   | Default         | Description                            |
| ---------- | -------------------------------------- | --------------- | -------------------------------------- |
| `retries`  | `number`                               | `3`             | Retries after the first attempt        |
| `delay`    | `number`                               | `1000`          | Base delay in ms                       |
| `backoff`  | `'fixed' \| 'linear' \| 'exponential'` | `'exponential'` | Delay strategy                         |
| `maxDelay` | `number`                               | `Infinity`      | Delay cap in ms                        |
| `factor`   | `number`                               | `2`             | Exponential multiplier                 |
| `jitter`   | `boolean`                              | `true`          | Randomize delay (anti thundering-herd) |
| `retryIf`  | `(err) => boolean`                     | always retry    | Stop retrying when it returns false    |
| `onRetry`  | `(err, n) => void`                     | —               | Called before each retry               |
| `signal`   | `AbortSignal`                          | —               | Cancel pending retries                 |

### `timeout(operation, ms, options?)`

Wraps a promise or a `(signal) => promise` factory with a deadline. On timeout the internal `AbortController` fires, so cancellable work (like `fetch`) is actually cancelled.

```ts
import { timeout } from 'faultguard';

const result = await timeout((signal) => fetch(url, { signal }).then((r) => r.json()), 5000, {
    message: 'API too slow',
});
```

Rejects with `TimeoutError`. Pass `options.signal` to also honor an external abort.

### `pool(items, fn, options?)`

Runs `fn` over `items` with bounded concurrency, preserving result order.

```ts
import { pool } from 'faultguard';

const results = await pool(urls, (url) => fetch(url).then((r) => r.json()), {
    concurrency: 10,
});
```

### `semaphore(limit)`

Manual acquire/release for a fixed number of permits.

```ts
import { semaphore } from 'faultguard';

const sem = semaphore(5);
await sem.acquire();
try {
    await db.query('SELECT 1');
} finally {
    sem.release();
}
```

Exposes `available` and `pending`. `acquire(signal?)` is cancellable.

### `circuitBreaker(fn, options?)`

Stops hammering a failing service. States: `closed → open → half-open → closed`.

```ts
import { circuitBreaker } from 'faultguard';

const breaker = circuitBreaker(callExternalApi, {
    failureThreshold: 5,
    resetTimeout: 30_000,
    halfOpenRequests: 2,
    onStateChange: (state) => console.log('breaker:', state),
});

const data = await breaker(payload); // throws CircuitOpenError while open
```

### Utilities

`sleep(ms, signal?)`, `computeDelay(retryNumber, config)`, `createAbortError(signal?)`, `isAbortError(error)`, classes `TimeoutError`, `CircuitOpenError`.

## Development

```bash
npm install
npm run dev          # watch build
npm run test         # tests in watch mode
npm run check        # lint + format:check + typecheck + test:run
npm run build        # production build
```

## License

[MIT](./LICENSE)
