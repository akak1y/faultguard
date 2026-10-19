# 📚 API Reference

Complete reference for every export. Conventions used throughout:

- **`MaybeAsync<T>`** = `T | Promise<T>`. Every primitive accepts both sync and
  async functions.
- **Attempt numbering.** The function context `attempt` is **0-based** (0 = the
  first call). The `onRetry` callback and `computeDelay` receive a **1-based**
  retry number (1 = the first retry). This matches how humans count retries.
- **Abort semantics.** When a `signal` is aborted, primitives reject with the
  signal's `reason` if it is an `Error`, otherwise a standard `AbortError`.
  Aborted work is cancelled, not ignored.

---

## `retry(fn, options?)`

Calls `fn` until it succeeds or the retry budget is exhausted.

```ts
function retry<T>(fn: (ctx: RetryContext) => MaybeAsync<T>, options?: RetryOptions): Promise<T>;
```

**`RetryContext`**

| Field     | Type                       | Meaning                                                       |
| --------- | -------------------------- | ------------------------------------------------------------- |
| `attempt` | `number`                   | 0-based index of the current call                             |
| `signal`  | `AbortSignal \| undefined` | the signal from `options.signal`, pass it to cancellable work |

**`RetryOptions`**

| Option     | Type                                   | Default         | Description                                                       |
| ---------- | -------------------------------------- | --------------- | ----------------------------------------------------------------- |
| `retries`  | `number`                               | `3`             | Max retries after the first attempt (total calls = `retries + 1`) |
| `delay`    | `number`                               | `1000`          | Base delay in ms                                                  |
| `backoff`  | `'exponential' \| 'linear' \| 'fixed'` | `'exponential'` | How the delay grows                                               |
| `maxDelay` | `number`                               | `Infinity`      | Hard cap on any single delay                                      |
| `factor`   | `number`                               | `2`             | Multiplier for `exponential`                                      |
| `jitter`   | `boolean`                              | `true`          | Randomize each delay into `[0, computed]`                         |
| `retryIf`  | `(err) => MaybeAsync<boolean>`         | always retry    | Return `false` to stop immediately and throw                      |
| `onRetry`  | `(err, retryNumber) => void`           | —               | Fired before each wait; `retryNumber` is 1-based                  |
| `signal`   | `AbortSignal`                          | —               | Cancels pending retries and the in-flight call                    |

Throws the **last error** from `fn` when exhausted, or an abort error if
cancelled. `retryIf` is awaited, so it may be async.

---

## `timeout(operation, ms, options?)`

Bounds an operation by a deadline and cancels it on expiry.

```ts
function timeout<T>(
    operation: Promise<T> | ((signal: AbortSignal) => MaybeAsync<T>),
    ms: number,
    options?: TimeoutOptions,
): Promise<T>;
```

| Param             | Type                                      | Description                                                    |
| ----------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `operation`       | `Promise<T> \| (signal) => MaybeAsync<T>` | Prefer the function form so the work can be aborted            |
| `ms`              | `number`                                  | Deadline in milliseconds                                       |
| `options.message` | `string`                                  | Custom message for the thrown `TimeoutError`                   |
| `options.signal`  | `AbortSignal`                             | An external signal to also honour (combined with the deadline) |

Rejects with **`TimeoutError`** on expiry. If `options.signal` is already
aborted, rejects immediately without starting the operation. If it aborts
mid-flight, that abort reason is propagated.

---

## `pool(items, fn, options?)`

Runs `fn` over `items` with bounded concurrency, preserving order.

```ts
function pool<T, R>(
    items: readonly T[],
    fn: (item: T, index: number) => MaybeAsync<R>,
    options?: PoolOptions,
): Promise<R[]>;
```

| Option        | Type          | Default | Description                                                        |
| ------------- | ------------- | ------- | ------------------------------------------------------------------ |
| `concurrency` | `number`      | `10`    | Max tasks running at once                                          |
| `signal`      | `AbortSignal` | —       | Cancels remaining work; already-started tasks are not force-killed |

Returns an array aligned with `items`. If any task rejects, the whole `pool`
rejects with that error (use a `try/catch` inside `fn` if you want per-item
error results).

---

## `semaphore(limit)`

Creates a counting semaphore for a fixed resource budget.

```ts
function semaphore(limit: number): Semaphore;
```

**`Semaphore`**

| Member             | Type                  | Description                                    |
| ------------------ | --------------------- | ---------------------------------------------- |
| `acquire(signal?)` | `() => Promise<void>` | Waits for a permit; cancellable via `signal`   |
| `release()`        | `() => void`          | Returns a permit; wakes the next waiter if any |
| `available`        | `number` (getter)     | Free permits right now                         |
| `pending`          | `number` (getter)     | Waiters currently queued                       |

Always `release()` in a `finally` block. A cancelled `acquire` removes itself
from the queue and never consumes a permit.

---

## `circuitBreaker(fn, options?)`

Wraps `fn` with a state machine that fails fast while the dependency is down.

```ts
function circuitBreaker<TArgs extends unknown[], R>(
    fn: (...args: TArgs) => MaybeAsync<R>,
    options?: CircuitBreakerOptions,
): (...args: TArgs) => Promise<R>;
```

| Option             | Type              | Default | Description                                |
| ------------------ | ----------------- | ------- | ------------------------------------------ |
| `failureThreshold` | `number`          | `5`     | Consecutive failures that open the circuit |
| `resetTimeout`     | `number`          | `30000` | Ms to wait in `open` before probing        |
| `halfOpenRequests` | `number`          | `1`     | Trial calls allowed while `half-open`      |
| `onStateChange`    | `(state) => void` | —       | Notified on every transition               |

**States (`CircuitState`):** `closed` (normal) → `open` (fail fast) →
`half-open` (probe) → `closed` on success, or back to `open` on failure.

While `open`, calls reject immediately with **`CircuitOpenError`** (carrying
`retryAfterMs`) without invoking `fn`. The wrapped function keeps its original
arguments and return type.

---

## Utilities

### `sleep(ms, signal?)`

```ts
function sleep(ms: number, signal?: AbortSignal): Promise<void>;
```

Cancellable pause. Rejects with an abort error if `signal` fires (or is already
aborted). Cleans up its listener on completion.

### `computeDelay(retryNumber, config)`

```ts
function computeDelay(retryNumber: number, config: BackoffConfig): number;
```

Pure helper that returns the backoff delay (ms) for a 1-based retry number.
`BackoffConfig` mirrors the retry backoff fields: `strategy`, `baseDelay`,
optional `maxDelay`, `factor` (default `2`), `jitter` (default `false`).
Useful when building custom loops.

### `createAbortError(signal?)` / `isAbortError(error)`

```ts
function createAbortError(signal?: AbortSignal): Error;
function isAbortError(error: unknown): boolean;
```

`createAbortError` builds a standard `AbortError`, reusing `signal.reason` when
it is an `Error`. `isAbortError` checks `error.name === 'AbortError'`.

---

## Errors

| Class              | Thrown by        | Notes                   |
| ------------------ | ---------------- | ----------------------- |
| `TimeoutError`     | `timeout`        | Has `ms` (the deadline) |
| `CircuitOpenError` | `circuitBreaker` | Has `retryAfterMs`      |

Both extend `Error` and set a stable `name`, so `instanceof` and name checks
both work.

---

## Exported types

`MaybeAsync`, `RetryContext`, `RetryOptions`, `TimeoutOptions`, `PoolOptions`,
`Semaphore`, `CircuitBreakerOptions`, `CircuitState`, `BackoffStrategy`,
`BackoffConfig`. Import them with `import type { ... } from 'faultguard'`.
