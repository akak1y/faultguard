[EN](../../README.md) | [RU](README_RU.md) | [ZH](README_ZH-CN.md) | [ES](README_ES.md) | [JA](README_JA.md) | [PT-BR](README_PT-BR.md) | FR

# 🛡️ faultguard

> Primitives asynchrones tolérants aux pannes pour JavaScript et TypeScript.

Conçu pour tout ce qui communique avec l'extérieur : clients HTTP, workers,
consommateurs de files, accès base de données. Chaque service réessaie, impose
des délais et limite la concurrence — et chaque développeur réécrit ces boucles
à la main, avec des bugs subtils. `faultguard` fournit des blocs éprouvés et
composables qui fonctionnent simplement. Né en production.

## ✨ Fonctionnalités

- 🔁 `retry` avec backoff exponentiel / linéaire / fixe, jitter, prédicat `retryIf` et annulation
- ⏱️ `timeout` qui annelle réellement le travail via `AbortController`
- 🔌 `circuitBreaker` (closed → open → half-open) pour cesser de solliciter un service en panne
- 🧵 `pool` avec concurrence bornée et ordre des résultats préservé
- 🚦 `semaphore` pour une limite manuelle sur une ressource fixe
- 🧩 Prise en charge native d'`AbortController` dans tous les primitives
- ⚡ Zéro dépendance runtime, < 5 KB, tree-shakeable
- 🟦 Types TypeScript complets, ESM + CJS prêts à l'emploi
- 🌐 Node ≥ 18, Deno, Bun, navigateurs et edge runtimes

## 📦 Installation

```bash
npm install faultguard
```

Fonctionne en ESM ou en CJS :

```ts
import { retry, timeout } from 'faultguard'; // ESM
const { retry } = require('faultguard'); // CJS
```

## 🚀 Démarrage rapide

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

## 📚 Documentation

- [Premiers pas](../getting-started.md)
- [Référence API](../api-reference.md)
- [Motifs et recettes](../patterns.md)

## 🧪 Développement

```bash
npm install
npm run dev      // build en mode watch
npm run test     // vitest en mode watch
npm run check    // lint + format + typecheck + test
npm run build    // build de production (ESM + CJS + dts)
```

## 🛣️ Feuille de route

- `compose()` pour empiler les primitives en un seul wrapper réutilisable
- Jitter décorrélé et stratégies de backoff personnalisées
- `fallback` / `bulkhead` / limiteur de débit
- Requêtes hedged (lance N tentatives, prend le premier succès)

## 📄 Licence

MIT © akak1y
