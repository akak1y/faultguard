[EN](../../README.md) | [RU](README_RU.md) | [ZH](README_ZH-CN.md) | [ES](README_ES.md) | [JA](README_JA.md) | PT-BR | [FR](README_FR.md)

# 🛡️ faultguard

> Primitivos assíncronos tolerantes a falhas para JavaScript e TypeScript.

Feito para tudo que conversa com o mundo externo: clientes HTTP, workers,
consumidores de fila, acesso a banco de dados. Todo serviço tenta de novo,
impõe prazos e limita concorrência — e todo desenvecedor reescreve esses loops
à mão, com bugs sutis. `faultguard` entrega blocos testados e componíveis que
simplesmente funcionam. Nasceu em produção.

## ✨ Recursos

- 🔁 `retry` com backoff exponencial / linear / fixo, jitter, predicado `retryIf` e cancelamento
- ⏱️ `timeout` que realmente cancela o trabalho via `AbortController`
- 🔌 `circuitBreaker` (closed → open → half-open) para parar de bater num serviço caído
- 🧵 `pool` com concorrência limitada e ordem dos resultados preservada
- 🚦 `semaphore` para limite manual sobre um recurso fixo
- 🧩 Suporte nativo a `AbortController` em todos os primitivos
- ⚡ Zero dependências de runtime, < 5 KB, tree-shakeable
- 🟦 Tipos completos de TypeScript, ESM + CJS prontos
- 🌐 Node ≥ 18, Deno, Bun, navegadores e edge runtimes

## 📦 Instalação

```bash
npm install faultguard
```

Funciona como ESM ou CJS:

```ts
import { retry, timeout } from 'faultguard'; // ESM
const { retry } = require('faultguard'); // CJS
```

## 🚀 Começo rápido

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

## 📚 Documentação

- [Primeiros passos](../getting-started.md)
- [Referência da API](../api-reference.md)
- [Padrões e receitas](../patterns.md)

## 🧪 Desenvolvimento

```bash
npm install
npm run dev      // build em watch
npm run test     // vitest em modo watch
npm run check    // lint + format + typecheck + test
npm run build    // build de produção (ESM + CJS + dts)
```

## 🛣️ Roadmap

- `compose()` para empilhar primitivos num único wrapper reutilizável
- Jitter decorrelacionado e estratégias de backoff customizadas
- `fallback` / `bulkhead` / limitador de taxa
- Requisições hedged (dispara N tentativas, pega o primeiro sucesso)

## 📄 Licença

MIT © akak1y
