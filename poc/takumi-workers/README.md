# Takumi Workers PoC

Takumi の WASM レンダラを本体の SvelteKit Worker から分離し、固定データの日本語 OGP をローカルで試す構成です。

> Cloudflare 上の PoC Worker は 2026-09-26 に削除済みです。ローカル検証には `127.0.0.1:8788` を使います。

## 実行

```sh
pnpm run poc:takumi:build
pnpm run poc:takumi:test
pnpm run poc:takumi:dev
```

画像は `http://127.0.0.1:8788/__poc/takumi` で確認できます。`poc:takumi:build` は Wrangler の dry-run のみです。

## 構成

- 入力はソースに固定したダミー実績で、実際の `/done`、D1、Cache API には接続しません。
- 左端の縦線、サイト名、日付、タイトル、一言、最大 3 個のタグ、ハンドルを配置した 1200×630 PNG です。
- フォントは M PLUS 1p 700 の固定文言サブセットを同梱します。外部画像・外部フォント・ユーザー入力は使いません。
- `GET /` は起動確認用の 404 marker、画像は `GET /__poc/takumi` です。
- `workers_dev: false` で、workers.dev、Version URLs、本番ドメインへの route は設定しません。
- 本番用 Worker の設定、ルート、リソースには触れません。

## フォントの出典とサブセット

M PLUS 1p Bold は Google Fonts の公式リポジトリから取得しました。[`METADATA.pb`](https://github.com/google/fonts/blob/a24c920263576ec723d64c1b26f8afabb841601d/ofl/mplus1p/METADATA.pb)にはファミリーが M PLUS 1p、weight 700、ライセンスが OFL と記載されています。

- フォント: [MPLUS1p-Bold.ttf](https://github.com/google/fonts/blob/a24c920263576ec723d64c1b26f8afabb841601d/ofl/mplus1p/MPLUS1p-Bold.ttf)（version 1.062、取得元 SHA-256 `76eb077b0a31ca33ca40238e47da5a17e2786741607cec09678d7d2e5ab1afc1`）
- ライセンス: [OFL.txt](https://github.com/google/fonts/blob/a24c920263576ec723d64c1b26f8afabb841601d/ofl/mplus1p/OFL.txt)、このディレクトリにも同梱
- サブセット作成: fontTools 4.65.0 の `pyftsubset` で weight 700 の TTF に、カード内で使う文字だけを `--text` 指定して WOFF2 化
- 収録範囲: 固定カードの 52 個のコードポイント。日本語の実データ全般や JIS 第 1 水準を収録するサブセットではありません。
- 同梱 WOFF2: 4,960 bytes、`gzip -n -6` で 4,983 bytes
- 同梱 WOFF2 の SHA-256: `a18ddd2472c3fa7af61a440822cf9186d01d640dda5f8a58ba784cd401cc6409`

再生成するときは、上記の TTF を保存して次のコマンドを実行します。

```sh
pyftsubset MPLUS1p-Bold.ttf --text='nyatinte.com/done 2026/09/26 日本語の実績カードを描画した 固定データから Takumi で PNG を生成。 Workers OGP 日本語 @nyatinte' --flavor=woff2 --output-file=MPLUS1p-700-fixture.woff2
```

Cloudflare の現行[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)（2026-09-05 更新）は Free を含む Worker の非圧縮サイズ上限を 64 MiB とし、gzip サイズ上限は設けていません。計画書にある gzip 3 MiB は現行ドキュメントの上限ではありません。

## ローカル実測（2026-09-26）

- `takumi-js`: 2.14.0、`wrangler`: 4.135.0
- ローカル workerd の HTTP テストで `200 image/png`、PNG signature、IHDR、1200×630 を確認
- 生成した日本語カード: 43,139 bytes、1200×630 PNG
- Worker 全体の Wrangler dry-run: 3,818.78 KiB、gzip 1,625.30 KiB
- Cloudflare 上の CPU 使用量、メモリ、本番環境での OGP 動作は未検証

## 以前の PoC 記録

以下は今回の日本語カードとは別の、削除前の英字サンプルと Cloudflare 上の PoC Worker の記録です。

- 削除前、Cloudflare 上の Worker へ 2 回個別にリクエストし、どちらも `200 image/png` を確認
- 旧サンプルの生成画像と Cloudflare 上の応答は 11,994 bytes、1200×630 PNG
- 削除前の Worker は認証なしでアクセス可能で、アカウント共有の Workers Free 枠で検証。有料プランへの変更なし
- Cloudflare 上の CPU 使用量は未計測。Free プランの CPU 上限（10 ms）に対する実測も未完了で、メモリと実行時間も未検証
- 旧サンプルの Worker bundle: 3,811.75 KiB/gzip 1,619.90 KiB
- 生成された upload module: `index.js` 83,380 bytes + `takumi_wasm_bg.wasm` 3,819,847 bytes = 3,903,227 bytes（連結して `node:zlib.gzipSync` で 1,657,623 bytes）
- Takumi の WASM 原本 `takumi_wasm_bg.wasm`: 3,819,847 bytes（`gzip -n -6` で 1,621,043 bytes）
- workerd の HTTP テストは 1 件成功（2 リクエスト）
- Cloudflare 上の PoC Worker は削除済み。削除前の認証なし URL は、テスト後に削除し HTTP 404 を確認
- 削除後に Cloudflare API で Worker が存在しないことを確認。旧 URL へのリクエストは HTTP 404
- 削除前の Cloudflare デプロイ version ID: `7d3ea612-7e49-46b5-b3d0-0d9350363309`。Wrangler 出力の起動時間は 5 ms（CPU 使用時間やコールドリクエストの計測値ではない）
