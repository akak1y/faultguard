[EN](../../README.md) | RU | [ZH](README_ZH-CN.md) | [ES](README_ES.md) | [JA](README_JA.md) | [PT-BR](README_PT-BR.md) | [FR](README_FR.md)

# 🛡️ faultguard

> Отказоустойчивые примитивы для асинхронного JavaScript и TypeScript.

Создан для всего, что общается с внешним миром: HTTP-клиенты, воркеры,
потребители очередей, доступ к базе данных. Любой сервис делает повторы,
ограничивает время и конкурентность — и каждый разработчик переписывает эти
циклы вручную, с незаметными багами. `faultguard` даёт проверенные,
комментируемые блоки, которые просто складываются вместе. Рождён в проде.

## ✨ Возможности

- 🔁 `retry` с экспоненциальной / линейной / фиксированной задержкой, jitter, предикатом `retryIf` и отменой
- ⏱️ `timeout`, который реально отменяет работу через `AbortController`
- 🔌 `circuitBreaker` (closed → open → half-open), чтобы не добивать мёртвый сервис
- 🧵 `pool` с ограниченной конкурентностью и сохранением порядка результатов
- 🚦 `semaphore` для ручного лимита на фиксированный ресурс
- 🧩 Поддержка `AbortController` во всех примитивах
- ⚡ Ноль runtime-зависимостей, < 5 КБ, tree-shakeable
- 🟦 Полные типы TypeScript, ESM + CJS из коробки
- 🌐 Node ≥ 18, Deno, Bun, браузеры и edge-рантаймы

## 📦 Установка

```bash
npm install faultguard
```

Работает как ESM, так и CJS:

```ts
import { retry, timeout } from 'faultguard'; // ESM
const { retry } = require('faultguard'); // CJS
```

## 🚀 Быстрый старт

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

## 📚 Документация

- [Начало работы](../getting-started.md)
- [Справочник API](../api-reference.md)
- [Паттерны и рецепты](../patterns.md)

## 🧪 Разработка

```bash
npm install
npm run dev      # сборка в watch-режиме
npm run test     # vitest в watch-режиме
npm run check    # lint + format + typecheck + test
npm run build    # продакшн-сборка (ESM + CJS + dts)
```

## 🛣️ Дорожная карта

- `compose()` для сборки примитивов в один переиспользуемый слой
- Decorrelated jitter и кастомные стратегии backoff
- `fallback` / `bulkhead` / rate limiter
- Геджированные запросы (гонка N попыток, берётся первый успех)

## 📄 Лицензия

MIT © akak1y
