# nyatinte.com

最小構成の SvelteKit 3 + Cloudflare Workers アプリです。`GET /` が `200` と `Hello World` を返します。

## 開発

Node.js と pnpm はリポジトリの指定バージョンを使用します。

```sh
pnpm install
pnpm dev
```

`pnpm install` は SvelteKit の同期と Vite+ の pre-commit hook の設定も行います。手元の hook を無効化する場合は `pnpm exec vp hooks disable` を実行してください。hook はステージ済みファイルを Biome と ESLint で検査します。ファイルの修正は `pnpm run fix` で明示的に行います。

主なコマンド:

| コマンド | 内容 |
| --- | --- |
| `pnpm check` | `wrangler types`、Ultracite/Biome、Svelte lint、Vite+ の型チェック、Svelte の型チェック |
| `pnpm run lint:svelte` | `eslint-plugin-svelte` による `.svelte` と runes module の lint |
| `pnpm run fix` | Ultracite/Biome による JS/TS/JSON/CSS/Svelte の修正 |
| `pnpm test` | HTTP テストを実行 |
| `pnpm build` | `wrangler types` を生成し、SvelteKit Worker を Vite+ でビルド |
| `pnpm preview` | ビルド済み Worker を `:4173` で確認 |
| `pnpm dev:worker` | ビルド済み Worker を `:8787` で起動 |

### ローカル Worker の HTTP テスト

ビルド済み Worker を 2 つのターミナルで確認します。`varlock-wrangler dev` が `.env.schema` の値をローカル Worker に渡します。

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

デプロイ先は既存の Custom Domain `https://nyatinte.com` です。Custom Domain は `nyatinte-com` Worker に紐付いており、DNS 変更は必要ありません。`pnpm run deploy` は `varlock-wrangler versions upload --keep-vars=true` で既存の vars と secrets を保持して新しいバージョンをアップロードし、そのバージョンをデプロイします。ルートなどのトリガー設定を変更した場合は別途適用が必要です。`workers.dev` と Preview URL は使用しません。

`wrangler.jsonc` を Worker 設定と型生成の正本とし、SvelteKit adapter と Varlock のローカル開発・デプロイで共通に使います。

GitHub Actions は pull request と `main` への push で検証を実行します。`main` から手動で Deploy を選んだ場合だけ、検証成功後に `pnpm run deploy` を実行し、`https://nyatinte.com` への HTTP smoke test を行います。Actions の production environment には `ACCESS_TEAM_DOMAIN` と `ACCESS_AUDIENCE` の Variables、および `ACHIEVEMENT_GITHUB_TOKEN`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` の Secrets が必要です。

Worker 名は `nyatinte-com` です。

## MCP 管理 API

`/mcp` は Streamable HTTP の管理用エンドポイントです。有効化する前に、Cloudflare Access で `nyatinte.com/mcp` を保護し、サービス トークンを許可するポリシーを設定します。Worker も `Cf-Access-Jwt-Assertion` の署名、Issuer、Audience を検証します。

Worker の変数には Access のチームドメイン（例: `https://<team>.cloudflareaccess.com`）とアプリケーションの Audience Tag を `ACCESS_TEAM_DOMAIN`、`ACCESS_AUDIENCE` として設定します。どちらも公開情報です。MCP クライアントには `CF-Access-Client-Id` と `CF-Access-Client-Secret` をヘッダーとして登録し、Client Secret はリポジトリに保存しないでください。

実績は `src/lib/achievements/` の Markdown として Git で管理します。MCP は `ACHIEVEMENT_GITHUB_TOKEN` を使って実績変更の PR を作成し、マージ後に手動デプロイすると公開されます。GitHub トークンは対象リポジトリの Contents と Pull requests に必要な権限だけを付与し、シークレットとして設定してください。

Ultracite/Biome が JS/TS/JSON/CSS と Svelte の format と lint を担当します。Svelte 対応は公式 preset が有効にする Biome の実験的機能です。ESLint は Biome にない Svelte 固有ルールを補完します。`vp check --no-fmt --no-lint` は Vite+ の TypeScript 型チェックだけを残すために使い、Oxfmt/Oxlint は現時点の品質チェックでは実行しません。

## 構成

- `src/routes/+page.svelte`: トップページ
- `src/routes/hello-world.test.ts`: 実際の Worker に対する HTTP テスト
- `wrangler.jsonc`: SvelteKit adapter、型生成、ローカル開発、デプロイに共通の Worker 設定
- `.env.schema`: Varlock の環境変数スキーマ
