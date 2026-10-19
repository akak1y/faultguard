[EN](../../README.md) | [RU](README_RU.md) | [ZH](README_ZH-CN.md) | ES | [JA](README_JA.md) | [PT-BR](README_PT-BR.md) | [FR](README_FR.md)

# 🛡️ faultguard

> Primitivos asíncronos tolerantes a fallos para JavaScript y TypeScript.

Hecho para todo lo que habla con el mundo exterior: clientes HTTP, workers,
consumidores de colas, acceso a base de datos. Todo servicio reintenta, impone
tiempos límite y limita la concurrencia — y cada desarrollador reescribe esos
bucles a mano, con errores sutiles. `faultguard` te da bloques probados y
componibles que simplemente funcionan. Nacido en producción.

## ✨ Características

- 🔁 `retry` con backoff exponencial / lineal / fijo, jitter, predicado `retryIf` y cancelación
- ⏱️ `timeout` que realmente cancela el trabajo vía `AbortController`
- 🔌 `circuitBreaker` (closed → open → half-open) para dejar de golpear un servicio caído
- 🧵 `pool` con concurrencia limitada y resultados en orden
- 🚦 `semaphore` para límites manuales sobre un recurso fijo
- 🧩 Soporte nativo de `AbortController` en todos los primitivos
- ⚡ Cero dependencias en runtime, < 5 KB, tree-shakeable
- 🟦 Tipos completos de TypeScript, ESM + CJS listos para usar
- 🌐 Node ≥ 18, Deno, Bun, navegadores y edge runtimes

## 📦 Instalación

```bash
npm install faultguard
```

Funciona como ESM o CJS:

```ts
import { retry, timeout } from 'faultguard'; // ESM
const { retry } = require('faultguard'); // CJS
```

## 🚀 Inicio rápido

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

## 📚 Documentación

- [Primeros pasos](../getting-started.md)
- [Referencia de API](../api-reference.md)
- [Patrones y recetas](../patterns.md)

## 🧪 Desarrollo

```bash
npm install
npm run dev      // build en modo watch
npm run test     // vitest en modo watch
npm run check    // lint + format + typecheck + test
npm run build    // build de producción (ESM + CJS + dts)
```

## 🛣️ Hoja de ruta

- `compose()` para apilar primitivos en un único wrapper reutilizable
- Jitter decorrelacionado y estrategias de backoff personalizadas
- `fallback` / `bulkhead` / limitador de tasa
- Peticiones hedged (corre N intentos, toma el primer éxito)

## 📄 Licencia

MIT © akak1y
