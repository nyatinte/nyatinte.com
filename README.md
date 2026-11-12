# nyatinte.com

[nyatinte.com](https://nyatinte.com) の個人サイトです。トップページとログを公開しています。ログはわからなかったことを調べて書く場所です。

## 開発

Node.js と pnpm はリポジトリの指定バージョンを使います。

```sh
pnpm install
pnpm dev
```

`pnpm install` は SvelteKit の同期と Vite+ の Git hook の設定も行い、pre-commit hook はステージ済みファイルを検査します。pre-push hook は CI の Verify と同じ `pnpm check:ci`（check、build、ビルド済み Worker への HTTP テスト）を走らせ、修正は `pnpm run fix` で行えます。一時的に pre-push を飛ばす方法は `git push --no-verify` です。hook 自体を無効にする場合は `pnpm exec vp hooks disable` を実行してください。

| コマンド | 内容 |
| --- | --- |
| `pnpm check` | 型生成、format・lint・型チェック |
| `pnpm check:ci` | CI の Verify と同じ品質チェック（check、build、HTTP テスト） |
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

## ログ

`/log` は記事の一覧、`/log/<slug>` は記事です。どちらもログイン不要で閲覧できます。記事は `src/content/log/` の `.md` と `.svx` で、公開ページはビルド時にそのファイルを読みます。一覧は日付の新しい順です。同じ日付の記事はスラッグの昇順です。

frontmatter の `title`、`description`、`date` は必須です。`updated` と `image` は任意です。日付は `YYYY-MM-DD` です。`image` は `/` で始まるサイト内のパスか、http または https の URL です。frontmatter が不正な記事があると、ビルドは失敗します。雛形は `src/content/log/template.md` です。ファイル名がスラッグになり、使える文字は小文字の英数字とハイフンです。

`/done` と `/done/` 以下は `/log` へ 301 で転送します。

## MCP

`/mcp` は Cloudflare Access のサービス トークンで保護し、Worker でも Access JWT の署名・Issuer・Audience を検証します。MCP クライアントには `CF-Access-Client-Id` と `CF-Access-Client-Secret` を設定してください。サーバーにツールはまだありません。ブログ用のツールはあとから追加できます。

GitHub トークンは実績の PR 作成にだけ使っていました。使う箇所がなくなったため、`.env.schema` とデプロイ設定から外しています。Actions の Secret `ACHIEVEMENT_GITHUB_TOKEN` と、Cloudflare に同名で残っているシークレットは、削除できます。

## デプロイ

GitHub Actions の `CI` は PR と `main` への push で検証します。本番デプロイは `main` からワークフローを手動実行し、`production_deploy` に `deploy` を選択します。検証のあと、デプロイと HTTP smoke test を行います。ローカルからは `pnpm run deploy` でも実行可能です。

本番環境の必須変数は `.env.schema` を参照してください。Actions には `ACCESS_TEAM_DOMAIN` と `ACCESS_AUDIENCE` の Variables、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` の Secrets が必要です。Access の設定と認証情報は別途用意します。

`pnpm run deploy` はビルド後、Varlock Wrangler の `versions upload --keep-vars=true` で既存の vars と secrets を保ったままバージョンをアップロードし、そのバージョンをデプロイします。ルートなどのトリガー設定を変える場合は別途適用が必要です。`wrangler.jsonc` は Worker 設定と型生成の正本です。

## OGP と配信

トップページ、ログの一覧、記事は、frontmatter の `image` がなければ `src/routes/og.png` を共通画像に使います。`image` がある記事はそのパスか URL を OGP 画像にします。タイトルなどのメタデータは公開ページから生成します。記事ごとの画像を画像生成 AI で作る方針は [docs/adr/0001-ogp-image-generation.md](docs/adr/0001-ogp-image-generation.md) にあります。費用がかかるため、今は実装していません。

`/llms.txt` は、トップ、ログ、RSS、サイトマップ、各記事へのリンクを返します。HTML を返すページは `Link` ヘッダーに `rel=alternate` と `type=text/markdown` を付け、`Accept: text/markdown` では Markdown を返します。記事ページの「MDXをクリップボードにコピー」は、frontmatter を含む元のファイルをコピーします。RSS は `/log/rss.xml`、サイトマップは `/sitemap.xml` です。

一覧から記事を開くとき、ブラウザが View Transition API に対応し、利用者が `prefers-reduced-motion: reduce` を選んでいなければ、view transition を使います。記事から一覧へ戻るときは使いません。
