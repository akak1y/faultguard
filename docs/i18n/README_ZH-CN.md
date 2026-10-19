[EN](../../README.md) | [RU](README_RU.md) | ZH | [ES](README_ES.md) | [JA](README_JA.md) | [PT-BR](README_PT-BR.md) | [FR](README_FR.md)

# 🛡️ faultguard

> 面向 JavaScript 与 TypeScript 的容错异步原语。

为一切需要与外部世界通信的场景而生：HTTP 客户端、worker、队列消费者、数据库访问。
每个服务都要重试、设超时、限并发——而每个开发者都在徒手重写这些循环，
并带着不易察觉的 bug。`faultguard` 提供经过实战检验、可组合的积木，开箱即用。
诞生于生产环境。

## ✨ 特性

- 🔁 `retry`：指数 / 线性 / 固定退避，含 jitter、`retryIf` 谓词与取消支持
- ⏱️ `timeout`：通过 `AbortController` 真正取消操作
- 🔌 `circuitBreaker`（closed → open → half-open），停止冲击已宕机的服务
- 🧵 `pool`：受限并发，结果保持原始顺序
- 🚦 `semaphore`：对固定资源的手动限额
- 🧩 所有原语原生支持 `AbortController`
- ⚡ 零运行时依赖，< 5 KB，tree-shakeable
- 🟦 完整 TypeScript 类型，开箱支持 ESM + CJS
- 🌐 Node ≥ 18、Deno、Bun、浏览器与 edge 运行时

## 📦 安装

```bash
npm install faultguard
```

同时支持 ESM 与 CJS：

```ts
import { retry, timeout } from 'faultguard'; // ESM
const { retry } = require('faultguard'); // CJS
```

## 🚀 快速开始

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

## 📚 文档

- [入门指南](../getting-started.md)
- [API 参考](../api-reference.md)
- [模式与配方](../patterns.md)

## 🧪 开发

```bash
npm install
npm run dev      # watch 构建
npm run test     # vitest watch 模式
npm run check    # lint + format + typecheck + test
npm run build    # 生产构建（ESM + CJS + dts）
```

## 🛣️ 路线图

- `compose()`：将原语叠加为单一可复用包装器
- Decorrelated jitter 与自定义退避策略
- `fallback` / `bulkhead` / 限流器
- 对冲请求（并发 N 次尝试，取最先成功者）

## 📄 许可证

MIT © akak1y
