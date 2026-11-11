# nyatinte.com

[nyatinte.com](https://nyatinte.com) の個人サイトです。トップページと、実績の一覧・詳細を公開しています。

## 開発

Node.js と pnpm はリポジトリの指定バージョンを使用します。

```sh
pnpm install
pnpm dev
```

`pnpm install` は SvelteKit の同期と Vite+ の pre-commit hook の設定も行います。hook はステージ済みファイルを検査します。修正は `pnpm run fix` で行い、hook を無効化する場合は `pnpm exec vp hooks disable` を実行します。

| コマンド | 内容 |
| --- | --- |
| `pnpm check` | 型生成、format・lint・型チェック、Takumi PoC の型チェック |
| `pnpm run fix` | Ultracite/Biome による修正 |
| `pnpm build` | SvelteKit Worker のビルド |
| `pnpm dev:worker` | ビルド済み Worker をローカルの `:8787` で起動 |
| `pnpm preview` | ビルド済み Worker を `:4173` で確認 |
| `pnpm test` | Vitest の単体・HTTP テスト |

HTTP テストには起動中の Worker が必要です。別々のターミナルで実行します。

```sh
pnpm build
pnpm dev:worker
```

```sh
pnpm test
```

HTTP テストの接続先は `VITE_HELLO_WORLD_URL` で変更できます。その他のスクリプトとバージョンは `package.json` を参照してください。

## 実績と MCP

`/done` と `/done/[slug]` はログイン不要で閲覧できます。実績は `src/lib/achievements/` の Markdown で Git 管理し、公開ページはビルド時のデータを読み込みます。

投稿者は `/mcp` の Streamable HTTP API を使い、実績の作成・更新・削除・復元を PR として提案します。**PR のマージ後、手動デプロイして初めて公開ページに反映されます。** MCP の一覧・取得は GitHub の現在のデータを参照するため、マージ後でもデプロイ前は公開ページと異なる場合があります。更新・削除には競合防止のため現在の revision が必要です。

`/mcp` は Cloudflare Access のサービス トークンで保護し、Worker でも Access JWT の署名・Issuer・Audience を検証します。MCP クライアントに `CF-Access-Client-Id` と `CF-Access-Client-Secret` を設定してください。GitHub の `ACHIEVEMENT_GITHUB_TOKEN` には対象リポジトリの Contents と Pull requests の必要最小限の権限を付与します。シークレットはリポジトリに保存しません。

## デプロイ

GitHub Actions の `CI` は PR と `main` への push で検証します。本番デプロイは `main` からワークフローを手動実行し、`production_deploy` に `deploy` を選択します。検証後にデプロイと HTTP smoke test が実行されます。ローカルからは `pnpm run deploy` でも実行できます。

本番環境の必須変数は `.env.schema` を参照してください。Actions には `ACCESS_TEAM_DOMAIN` と `ACCESS_AUDIENCE` の Variables、`ACHIEVEMENT_GITHUB_TOKEN`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` の Secrets が必要です。Access の設定と認証情報は別途用意します。

`pnpm run deploy` はビルド後、Varlock Wrangler で `versions upload --keep-vars=true` を使って既存の vars と secrets を保持し、アップロードしたバージョンをデプロイします。ルートなどのトリガー設定の変更は別途適用が必要です。`cloudflare.config.ts` は `cf` の設定と型生成、`wrangler.varlock.jsonc` は adapter と Varlock の互換設定です。

## OGP

トップページは `static/og/home.png`、実績一覧・詳細は共通の `static/og/done.png` を使用します。実績ごとのタイトルなどのメタデータは公開ページから生成します。動的画像生成の検証は本番から独立した [Takumi PoC](poc/takumi-workers/README.md) にあります。
