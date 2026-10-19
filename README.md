[EN](README.md) | [RU](docs/i18n/README_RU.md) | [ZH](docs/i18n/README_ZH-CN.md) | [ES](docs/i18n/README_ES.md) | [JA](docs/i18n/README_JA.md) | [PT-BR](docs/i18n/README_PT-BR.md) | [FR](docs/i18n/README_FR.md)

# 🛡️ faultguard

[![npm](https://img.shields.io/npm/v/faultguard.svg)](https://www.npmjs.com/package/faultguard)
[![npm downloads](https://img.shields.io/npm/dm/faultguard.svg)](https://www.npmjs.com/package/faultguard)
[![CI](https://github.com/akak1y/faultguard/actions/workflows/ci.yml/badge.svg)](https://github.com/akak1y/faultguard/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/badge/bundle%20size-2.1%20kB%20gzip-06d6a0)](https://www.npmjs.com/package/faultguard)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/faultguard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Fault-tolerant async primitives for JavaScript & TypeScript.

Built for anything that talks to the outside world: API clients, workers,
queue consumers, database access. Every service retries, times out and
rate-limits — and every developer rewrites those loops by hand, with subtle
bugs. `faultguard` gives you battle-tested, composable blocks that just work.
Born from production pain.

## ✨ Features

- 🔁 `retry` with exponential / linear / fixed backoff, jitter, `retryIf` and abort
- ⏱️ `timeout` that actually cancels the work via `AbortController`
- 🔌 `circuitBreaker` (closed → open → half-open) to stop hammering dead services
- 🧵 `pool` with bounded concurrency and order-preserving results
- 🚦 `semaphore` for manual, fixed-size resource limits
- 🧩 AbortController-native across every primitive
- ⚡ Zero runtime dependencies, < 5 KB, tree-shakeable
- 🟦 Full TypeScript types, ESM + CJS out of the box
- 🌐 Node ≥ 18, Deno, Bun, browsers and edge runtimes

## 📦 Install

```bash
npm install faultguard
```

Works as ESM or CJS:

```ts
import { retry, timeout } from 'faultguard'; // ESM
const { retry } = require('faultguard'); // CJS
```

## 🚀 Quick start

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
        jitter: true,
        retryIf: (err) => (err as Error).message !== 'HTTP 404',
        onRetry: (err, n) => console.warn(`Retry #${n}:`, (err as Error).message),
    },
);
```

## 📚 Docs

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Patterns & Recipes](docs/patterns.md)

## 🧪 Development

```bash
npm install
npm run dev      # watch build
npm run test     # vitest watch mode
npm run check    # lint + format + typecheck + test
npm run build    # production build (ESM + CJS + dts)
```

## 🛣️ Roadmap

- `compose()` to stack primitives into a single reusable wrapper
- Decorrelated jitter and custom backoff strategies
- `fallback` / `bulkhead` / rate limiter
- Hedged requests (race N attempts, take the first success)

## 📄 License

MIT © akak1y
