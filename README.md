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
| `pnpm check` | `cf workers types`、Ultracite/Biome、Svelte lint、Vite+ の型チェック、Svelte の型チェック |
| `pnpm run lint:svelte` | `eslint-plugin-svelte` による `.svelte` と runes module の lint |
| `pnpm run fix` | Ultracite/Biome による JS/TS/JSON/CSS/Svelte の修正 |
| `pnpm test` | HTTP テストを実行 |
| `pnpm build` | `cf workers types` を生成し、SvelteKit Worker を Vite+ でビルド |
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

デプロイ先は既存の Custom Domain `https://nyatinte.com` です。Custom Domain は `nyatinte-com` Worker に紐付いており、DNS 変更は必要ありません。`pnpm deploy` は `varlock-wrangler` を通じて既存 Worker を更新します。互換設定 `wrangler.varlock.jsonc` の `keep_vars: true` は、既存の Cloudflare vars を保持します。Varlock が渡す secrets は追加扱いで、既存の secrets は削除されません。`workers.dev` と Preview URL は使用しません。

`cloudflare.config.ts` は `cf` の Worker 設定と型生成に使います。

現行の SvelteKit + `adapter-cloudflare` 構成では `cf build` は SvelteKit の `vite build` を実行しますが、`.cloudflare/output` を生成せず、bundler を選ぶオプションもありません。Wrangler 4.147.0 の隠し実験フラグ `wrangler build --experimental-new-config --experimental-cf-build-output` で同形式の出力を生成できることは確認しましたが、通常のビルド・deploy 経路には採用していません。また、Varlock は `cf deploy` をサポートしておらず、`cf` に `keep_vars` 相当の機能もありません。そのため、本番 deploy は `varlock-wrangler` 経由のままです。

Cloudflare 上の既存変数を棚卸しし、SvelteKit 対応のビルド経路と Varlock 連携を検証した後に、`cf build` または `cf deploy` への切り替えを検討します。

GitHub Actions は pull request と `main` への push で検証を実行します。`main` から手動で Deploy を選んだ場合だけ、検証成功後に `varlock-wrangler deploy` を実行し、`https://nyatinte.com` への HTTP smoke test を行います。Actions には `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` の Secrets が必要です。

Worker 名は `nyatinte-com` です。

## MCP 管理 API

`/mcp` は Streamable HTTP の管理用エンドポイントです。有効化する前に、Cloudflare Access で `nyatinte.com/mcp` を保護し、サービス トークンを許可するポリシーを設定します。Worker も `Cf-Access-Jwt-Assertion` の署名、Issuer、Audience を検証します。

Worker の変数には Access のチームドメイン（例: `https://<team>.cloudflareaccess.com`）とアプリケーションの Audience Tag を `ACCESS_TEAM_DOMAIN`、`ACCESS_AUDIENCE` として設定します。どちらも公開情報です。MCP クライアントには `CF-Access-Client-Id` と `CF-Access-Client-Secret` をヘッダーとして登録し、Client Secret はリポジトリに保存しないでください。

管理 API の利用には Worker の `DB` バインディングも必要です。ローカルの D1 結合テストは `pnpm test:d1` で実行できます。本番 D1 の作成・適用や Cloudflare Access の実環境での認証確認は、このリポジトリのテスト対象外です。

Ultracite/Biome が JS/TS/JSON/CSS と Svelte の format と lint を担当します。Svelte 対応は公式 preset が有効にする Biome の実験的機能です。ESLint は Biome にない Svelte 固有ルールを補完します。`vp check --no-fmt --no-lint` は Vite+ の TypeScript 型チェックだけを残すために使い、Oxfmt/Oxlint は現時点の品質チェックでは実行しません。

## 構成

- `src/routes/+page.svelte`: Hello World ページ
- `src/routes/hello-world.test.ts`: 実際の Worker に対する HTTP テスト
- `cloudflare.config.ts`: `cf` 用の Worker、route、asset、Observability 設定
- `wrangler.config.ts`: Wrangler の隠し実験フラグによる Build Output 生成設定（通常のビルドでは未使用）
- `wrangler.varlock.jsonc`: SvelteKit adapter と Varlock deploy の互換設定
- `.env.schema`: Varlock の環境変数スキーマ
