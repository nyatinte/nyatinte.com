# nyatinte.com

最小構成の SvelteKit 3 + Cloudflare Workers アプリです。`GET /` が `200` と `Hello World` を返します。

## 開発

Node.js と pnpm はリポジトリの指定バージョンを使用します。

```sh
pnpm install
pnpm dev
```

主なコマンド:

| コマンド | 内容 |
| --- | --- |
| `pnpm check` | Wrangler 型生成、整形、lint、型チェック |
| `pnpm test` | HTTP テストを実行 |
| `pnpm build` | Cloudflare Workers 用にビルド |
| `pnpm preview` | ビルド済み Worker を `:4173` で確認 |
| `pnpm dev:worker` | ビルド済み Worker を `:8787` で起動 |

### ローカル Worker の HTTP テスト

ビルド済み Worker を 2 つのターミナルで確認します。`wrangler dev` ではなく `varlock-wrangler dev` を使うのは、Varlock のランタイム初期化に必要なためです。

ターミナル 1:
```sh
pnpm build
pnpm dev:worker
```

ターミナル 2:
```sh
pnpm test
```

テスト対象 URL を変更する場合は `VITE_HELLO_WORLD_URL` を指定できます。

## デプロイ

デプロイ先は既存の Custom Domain `https://nyatinte.com` です。Custom Domain は `nyatinte-com` Worker に紐付いており、DNS 変更は必要ありません。デプロイすると、現在の Next.js/OpenNext の応答を Hello World に置き換えます。`wrangler.jsonc` の `keep_vars: true` により、既存の Cloudflare vars を保持したまま、`.env.schema` に定義した vars を更新します。Varlock が渡す secrets は追加扱いで、既存の secrets は削除されません。`workers.dev` と Preview URL は使用しません。

GitHub Actions は pull request と `main` への push で検証を実行します。`main` への push のみ、検証成功後に `varlock-wrangler deploy` を実行し、`https://nyatinte.com` への HTTP smoke test を行います。`main` の新しい実行が始まると古い実行はキャンセルされます。Actions には `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` の Secrets が必要です。

Worker 名は `nyatinte-com` です。

## 構成

- `src/routes/+page.svelte`: Hello World ページ
- `src/routes/hello-world.test.ts`: 実際の Worker に対する HTTP テスト
- `wrangler.jsonc`: Worker、静的アセット、Observability の設定
- `.env.schema`: Varlock の環境変数スキーマ
