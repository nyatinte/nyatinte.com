# Takumi Workers PoC

Takumi 2.14.0 と BudouX で、日本語実績カードの動的な文字組みをローカル検証します。実績データは固定スナップショット JSON のみです。実際の `/done`、D1、Cache API には接続しません。

以前 Cloudflare 上で検証した PoC Worker は 2026-09-26 に削除済みです。現在はローカルのみで検証します。

## 実行

```sh
pnpm run poc:takumi:build # Wrangler dry-run のみ
pnpm run poc:takumi:test
pnpm run poc:takumi:dev
```

ローカル画像は `http://127.0.0.1:8788/__poc/takumi` です。`sample=short|long|brackets|fallback` で 4 種の固定サンプルを選べます。任意のタイトル文字列は URL から受け取りません。`GET /` と未知のサンプルは 404 です。

複数画像を保存する場合は、リポジトリ外の出力先を指定して統合テストを実行します。

```sh
TAKUMI_POC_IMAGE_DIR=/private/var/folders/vs/3pykyjj16qz9vv433tys3z680000gn/T/opencode pnpm run poc:takumi:test
```

## 組版

- BudouX の `Parser(jaModel).parse(text)` で文節候補を得ます。
- 開き括弧で行が終わる分割と、閉じ括弧で行が始まる分割をまとめます。
- Takumi の `Renderer.measure()` で各文節・文字の幅を測ります。候補行の幅から二乗誤差が最小の 1〜3 行を選び、入らなければタイトルを 76/68/58/48/40px の順に縮小します。
- 最小サイズでも長い場合は、長い文節を文字単位で分割し、3 行に収まるよう末尾を `…` で省略します。一言は 26px・最大 2 行です。
- 表示するタグは最大 3 個です。4 個以上なら先頭 2 個と `+N` を表示します。
- フォントにない Unicode コードポイントは `□` に置換します。絵文字もこの扱いです。

Takumi の計測仕様は[公式 measure API](https://takumi.kane.tw/docs/measure-api)、BudouX の JavaScript API は[公式 README](https://github.com/google/budoux/blob/main/javascript/README.md)を参照しています。どちらも現在の固定フィクスチャのみで使い、Worker を公開・デプロイしません。

## フォント

M PLUS 1p Bold は[Google Fonts の公式リポジトリ](https://github.com/google/fonts/tree/a24c920263576ec723d64c1b26f8afabb841601d/ofl/mplus1p)から取得しました。`METADATA.pb` は weight 700、license OFL を記載しています。ライセンスは[`fonts/OFL.txt`](fonts/OFL.txt)に同梱しています。BudouX 0.9.2 は Apache-2.0 です。

- 元フォント: `MPLUS1p-Bold.ttf`、SHA-256 `76eb077b0a31ca33ca40238e47da5a17e2786741607cec09678d7d2e5ab1afc1`
- 収録文字: JIS X 0208 の行 1〜8（かな・記号）と行 16〜47（第 1 水準漢字）、印字可能 ASCII、欠字代替の `□`、省略記号 `…`。合計 3,584 コードポイント
- 実フォントの cmap と照合し、定義した 3,584 字の欠落がないことを確認済み
- `MPLUS1p-700-jis1.woff2`: 382,296 bytes（`gzip -n -6`: 382,434 bytes）、SHA-256 `e528be16702746e8150d33d3b7d89f3834132038e9f6347e2c23703565167491`
- 第 2 水準漢字全般、絵文字、任意の Unicode を収録したものではありません。未収録文字は `□` に置き換え、未対応グリフを黙って表示しません。

サブセットを再生成するには、上記の固定コミットから元フォントを取得し、fontTools 4.65.0 で実行します。

```sh
curl --location https://raw.githubusercontent.com/google/fonts/a24c920263576ec723d64c1b26f8afabb841601d/ofl/mplus1p/MPLUS1p-Bold.ttf --output /path/to/MPLUS1p-Bold.ttf
python3 poc/takumi-workers/fonts/subset_mplus.py /path/to/MPLUS1p-Bold.ttf
```

スクリプトはフォントと `src/font-coverage.json` を同じ文字集合から生成します。

## 構成・検証範囲

- `workers_dev: false`。本番ドメイン、route、D1、Cache API は設定しません。`poc:takumi:build` は `wrangler deploy --dry-run` だけです。
- 現在の[Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)は Worker の非圧縮サイズ 64 MiB、gzip サイズ上限なしです。計画書の gzip 3 MiB は現行上限ではありません。
- Wrangler 4.135.0 の dry-run: Total Upload は 4,255.72 KiB/gzip: 2,018.51 KiB
- `pnpm run poc:takumi:test` はローカル workerd で 4 種を生成し、PNG signature、IHDR、1200×630 を検証します。保存した複数サンプルも目視確認します。
- 動的レイアウト・禁則・2 行省略・タグ上限・欠字置換の単体テストは `src/layout.test.ts` にあります。
- Workers 上の CPU 時間、本番環境の生成時間、実 `/done` との接続、Cache API は未検証です。

## PoC 用の静的画像生成

`pnpm run poc:takumi:build-assets` は固定スナップショット `achievements.snapshot.json` の各 slug／revision を、`wrangler dev --local` の Takumi Worker で PNG にし、`.wrangler/ogp-build-assets/og/<slug>/r<revision>.png` と `manifest.json` に出力します。生成時は `127.0.0.1` のみで待ち受け、Cloudflare の認証情報を子プロセスに渡さず、D1 やリモート Worker には接続しません。PNG の signature、IHDR、サイズ、1200×630 の寸法を検査し、全件成功した場合だけ生成先を置き換えます。

これは PoC 専用コマンドです。CI Verify job では単独の検証として実行しますが、通常の `pnpm build`、`pnpm deploy`、CI Deploy job からは呼び出しません。出力先も Wrangler の Static Assets ディレクトリ外に置き、Deploy job へ渡しません。コマンドが失敗した場合はエラー終了し、ステージング中の PNG で既存の PoC 出力を置き換えません。

このスナップショットは合成フィクスチャで、ローカル D1 の取得処理ではありません。manifest はまだページの OGP URL から参照されず、実績ページへの接続、公開ゲート、自動トリガー、デプロイ順序の保証もありません。本番データを用いた生成・公開の仕組みとしては扱いません。
