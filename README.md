# faultguard

> ⚠️ **This package is under active development.** This is a placeholder release to reserve the name.

Fault-tolerant async primitives for JavaScript: `retry`, `timeout`, `circuit breaker`, `pool`, `semaphore`. Zero dependencies.

## Status

🚧 In development. Follow progress on [GitHub](https://github.com/akak1y/faultguard).

## Planned features

- `retry(fn, options)` — retry with exponential backoff and jitter
- `timeout(promise, ms)` — wrap any async operation with a deadline
- `circuitBreaker(fn, options)` — stop hammering failing services
- `pool(items, fn, options)` — concurrent task execution with limits
- `semaphore(n)` — manual concurrency control
- `compose(...wrappers)` — combine all of the above

## License

MIT