# Takumi Workers PoC

Takumi の WASM レンダラを、本体の SvelteKit Worker から分離した Cloudflare Worker で検証する最小構成です。

## 実行

```sh
pnpm run poc:takumi:build
pnpm run poc:takumi:test
pnpm run poc:takumi:dev
```

`poc:takumi:dev` は `http://127.0.0.1:8788/__poc/takumi` で待ち受けます。
設定は `workers_dev: false` のローカル専用です。`poc:takumi:build` は dry-run のみで、remote deploy コマンドは用意していません。

## 構成

- 入力: 固定HTML。外部画像・外部フォント・ユーザー入力は使わない
- フォント: 英字のみのため Takumi 組み込み Geist（Latin）を使用。偽フォントは同梱しない
- 出力: 1200×630 PNG
- 画像ルート: `GET /__poc/takumi`。`GET /` は起動確認用の 404 marker を返す
- 配置: ローカル専用（workers.dev・本番ドメインには接続しない）
- データベース、Cache API、Service Binding: 使用しない

## 判定

この PoC で確認できるのは、ローカルの workerd 上で Takumi WASM が画像を生成できることです。

- `/__poc/takumi` が 200 と `image/png` を返す
- PNG の signature・IHDR・寸法（1200×630）が正しい
- 2 件の並列リクエストが成功する
- Cloudflare 上の CPU・メモリ・起動時間・実行時間制限については未検証（リモートへはデプロイしていない）
- M PLUS 1p のフォントサブセットのサイズ・収録範囲は未検証（P4 で確認する）

## ローカル実測（2026-09-25）

- `takumi-js`: 2.14.0
- `wrangler`: 4.135.0
- `wrangler deploy --dry-run` の upload 集計: 3811.75 KiB / gzip 1619.90 KiB
- 生成された upload module: `index.js` 83,380 bytes + `takumi_wasm_bg.wasm` 3,819,847 bytes = 3,903,227 bytes（連結して `node:zlib.gzipSync` で 1,657,623 bytes）
- Takumi の WASM 原本 `takumi_wasm_bg.wasm`: 3,819,847 bytes（`gzip -n -6` で 1,621,043 bytes）
- 生成画像: 11,994 bytes、1200×630 PNG
- workerd HTTPテスト: 1 test passed（2リクエスト）
- Cloudflare上の実Worker: 未デプロイ

実際のフォント同梱、BudouX、日本語の改行、OGP本番ルートはこのPoCの後段で検証します。
