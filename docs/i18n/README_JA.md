[EN](../../README.md) | [RU](README_RU.md) | [ZH](README_ZH-CN.md) | [ES](README_ES.md) | JA | [PT-BR](README_PT-BR.md) | [FR](README_FR.md)

# 🛡️ faultguard

> JavaScript・TypeScript 向けの障害耐性を持つ非同期プリミティブ。

外部とやり取りするすべてのものに向けて設計されました：HTTP クライアント、ワーカー、
キューコンシューマ、データベースアクセス。あらゆるサービスがリトライ・タイムアウト・
並行制限を行いますが、開発者はそのループを毎回手書きし、気づきにくいバグを抱え込みます。
`faultguard` は実戦で検証され、組み合わせ可能なブロックを提供します。本番環境から生まれました。

## ✨ 特徴

- 🔁 `retry`：指数／線形／固定のバックオフ、ジッター、`retryIf` 述語、キャンセル対応
- ⏱️ `timeout`：`AbortController` により処理を実際にキャンセル
- 🔌 `circuitBreaker`（closed → open → half-open）：落ちたサービスを叩き続けない
- 🧵 `pool`：並行数を制限しつつ結果の順序を保持
- 🚦 `semaphore`：固定リソースに対する手動の上限管理
- 🧩 すべてのプリミティブで `AbortController` をネイティブサポート
- ⚡ ランタイム依存ゼロ、< 5 KB、tree-shakeable
- 🟦 完全な TypeScript 型、ESM + CJS を標準サポート
- 🌐 Node ≥ 18、Deno、Bun、ブラウザ、エッジランタイム

## 📦 インストール

```bash
npm install faultguard
```

ESM・CJS の両方で動作します：

```ts
import { retry, timeout } from 'faultguard'; // ESM
const { retry } = require('faultguard'); // CJS
```

## 🚀 クイックスタート

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

## 📚 ドキュメント

- [はじめに](../getting-started.md)
- [API リファレンス](../api-reference.md)
- [パターンとレシピ](../patterns.md)

## 🧪 開発

```bash
npm install
npm run dev      // watch ビルド
npm run test     // vitest watch モード
npm run check    // lint + format + typecheck + test
npm run build    // 本番ビルド（ESM + CJS + dts）
```

## 🛣️ ロードマップ

- `compose()`：プリミティブを重ねて単一の再利用可能なラッパーにする
- 非相関ジッターとカスタムバックオフ戦略
- `fallback` / `bulkhead` / レートリミッタ
- ヘッジリクエスト（N 試行を競わせ、最初の成功を採用）

## 📄 ライセンス

MIT © akak1y
