# 🚀 Getting Started

This guide takes you from install to a working resilient call in five minutes.
For the full option-by-option reference see [API Reference](api-reference.md);
for real-world combinations see [Patterns & Recipes](patterns.md).

## 📦 Install

```bash
# npm
npm install faultguard

# pnpm
pnpm add faultguard

# yarn
yarn add faultguard

# bun
bun add faultguard
```

The package ships ESM and CJS with bundled TypeScript types. No peer
dependencies, no postinstall scripts, nothing to audit.

## 🧠 The mental model

Every `faultguard` primitive is a **wrapper around your own async function**.
You do not change how your code works — you wrap it, and the wrapper adds a
behaviour: repeat on failure, give up after a deadline, stop calling a dead
service, limit how many run at once.

Three rules hold across the whole library:

1. **You pass a function (or a promise), you get a result back.** The primitive
   either resolves with your value or rejects with your error.
2. **Cancellation is real.** Anything cancellable (`fetch`, `fs.promises`,
   sockets) accepts an `AbortSignal`. `faultguard` creates and propagates that
   signal for you — a timeout does not just ignore a slow call, it aborts it.
3. **Errors are yours.** When a primitive gives up, it re-throws the _last_
   error from your function, not a generic wrapper error. Your `try/catch`
   logic keeps working unchanged.

## 🔁 Your first resilient call

Wrap a `fetch` in `retry`. The function receives a context object with the
current `attempt` (0-based) and a `signal` you should pass down to cancellable
work:

```ts
import { retry } from 'faultguard';

const user = await retry(
    async ({ signal }) => {
        const res = await fetch('https://api.example.com/users/1', { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    },
    {
        retries: 4, // up to 4 retries after the first attempt
        delay: 300, // base delay in ms
        backoff: 'exponential', // 300 → 600 → 1200 → 2400 ...
        jitter: true, // randomize to avoid thundering herd
        retryIf: (err) => (err as Error).message !== 'HTTP 404', // never retry 404
        onRetry: (err, n) => console.warn(`retry #${n}:`, (err as Error).message),
    },
);
```

If you do not need the signal, ignore the argument entirely — `retry(() =>
doWork())` is valid too. The context is always passed; you just choose whether
to read it.

## ⏱️ A timeout that actually cancels

The naive `Promise.race([work, sleep(ms)])` leaves the slow work running in the
background. `timeout` instead hands your function an `AbortSignal` and fires it
when the deadline hits:

```ts
import { timeout, TimeoutError } from 'faultguard';

try {
    const data = await timeout((signal) => fetch(url, { signal }).then((r) => r.json()), 5000, {
        message: 'upstream too slow',
    });
} catch (err) {
    if (err instanceof TimeoutError) {
        // the fetch was genuinely aborted here, not orphaned
    }
}
```

You can also pass an already-built promise as the first argument — but then
there is nothing to abort, so prefer the function form whenever the work is
cancellable.

## 🧵 Bounding concurrency

Downloading 1000 URLs at once melts the target and your socket pool. `pool`
runs at most `concurrency` tasks in parallel and returns results in the
original input order:

```ts
import { pool } from 'faultguard';

const pages = await pool(urls, (url) => fetch(url).then((r) => r.text()), { concurrency: 8 });
// pages[0] corresponds to urls[0], regardless of finish order
```

## 🚦 A fixed resource budget

When the limit is about a shared resource (a DB connection pool, a single
hardware device) rather than a list of items, use `semaphore`:

```ts
import { semaphore } from 'faultguard';

const db = semaphore(5); // at most 5 queries in flight

async function query(sql: string) {
    await db.acquire();
    try {
        return await pool.query(sql);
    } finally {
        db.release(); // always release, even on throw
    }
}
```

## 🔌 Protecting a failing dependency

A `circuitBreaker` stops sending traffic to a service that is already down,
giving it room to recover and protecting your own resources:

```ts
import { circuitBreaker, CircuitOpenError } from 'faultguard';

const callBilling = circuitBreaker(billingRequest, {
    failureThreshold: 5, // open after 5 consecutive failures
    resetTimeout: 30_000, // wait 30s before probing again
    halfOpenRequests: 2, // let 2 trial calls through when probing
});

try {
    await callBilling(payload);
} catch (err) {
    if (err instanceof CircuitOpenError) {
        // fail fast without hitting the network; err.retryAfterMs tells you when
    }
}
```

## 🌐 Where it runs

`faultguard` is runtime-agnostic. It uses only `Promise`, `AbortController`,
`setTimeout` and `Math.random`, so it works in:

- Node.js ≥ 18
- Deno and Bun
- Modern browsers
- Edge runtimes (Cloudflare Workers, Vercel Edge, Netlify Edge)

ESM and CJS are both supported out of the box.

## ➡️ Next

- [API Reference](api-reference.md) — every option, default and thrown error.
- [Patterns & Recipes](patterns.md) — combining primitives for real services.
