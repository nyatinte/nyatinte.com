# Takumi Workers PoC

Takumi の WASM レンダラを、本体の SvelteKit Worker から分離した Cloudflare Worker で検証する最小構成です。

## 実行

```sh
pnpm run poc:takumi:build
pnpm run poc:takumi:test
pnpm run poc:takumi:dev
```

`poc:takumi:dev` は `http://127.0.0.1:8788/__poc/takumi` で待ち受けます。
設定は `workers_dev: true`、`preview_urls: false` です。`poc:takumi:build` は dry-run のみを実行します。デプロイは `pnpm exec wrangler deploy --config poc/takumi-workers/wrangler.jsonc --strict` で行います。

## 構成

- 入力: 固定 HTML。外部画像・外部フォント・ユーザー入力は使わない
- フォント: 英字のみのため Takumi 組み込み Geist（Latin）を使用。偽フォントは同梱しない
- 出力: 1200×630 PNG
- 画像ルート: `GET /__poc/takumi`。`GET /` は起動確認用の 404 marker を返す
- 配置: 専用 workers.dev URL のみ（Version URLs は無効。本番ドメインへの route は設定しない）
- データベース、Cache API、Service Binding: 使用しない

## 判定

ローカルの workerd と Cloudflare Workers Free 上で、Takumi WASM による画像生成を確認しました。

- Cloudflare 上の公開 URL を 2 回個別に確認し、どちらも `200 image/png` を返した
- Cloudflare 上の応答は 11,994 bytes、1200×630 PNG
- ローカル workerd の HTTP テストでは PNG signature・IHDR・寸法と 2 件の並列リクエストを確認
- エンドポイントは認証なしで公開されており、アクセスによりアカウントで共有する Workers Free 枠を消費する。有料プランへの変更はしていない
- Cloudflare 上の CPU 使用量は未計測。Free プランの CPU 上限（10 ms）に対する実測も未完了で、メモリと実行時間は未検証
- M PLUS 1p のフォントサブセットのサイズ・収録範囲は未検証（P4 で確認する）

## ローカル実測（2026-09-25）

- `takumi-js`: 2.14.0
- `wrangler`: 4.135.0
- `wrangler deploy --dry-run` の upload 集計: 3811.75 KiB/gzip 1619.90 KiB
- 生成された upload module: `index.js` 83,380 bytes + `takumi_wasm_bg.wasm` 3,819,847 bytes = 3,903,227 bytes（連結して `node:zlib.gzipSync` で 1,657,623 bytes）
- Takumi の WASM 原本 `takumi_wasm_bg.wasm`: 3,819,847 bytes（`gzip -n -6` で 1,621,043 bytes）
- 生成画像: 11,994 bytes、1200×630 PNG
- workerd の HTTP テスト: 1 件成功（2 リクエスト）
- Cloudflare 上の実 Worker: `https://nyatinte-takumi-poc.nyatinte.workers.dev` にデプロイ済み。Wrangler のデプロイ出力にある Worker 起動時間は 5 ms（CPU 使用時間やコールドリクエストの計測値ではない）
- Cloudflare のデプロイ version ID: `7d3ea612-7e49-46b5-b3d0-0d9350363309`

実際のフォント同梱、BudouX、日本語の改行、OGP 本番ルートはこの PoC の後段で検証します。
