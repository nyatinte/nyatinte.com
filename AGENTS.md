# AGENTS.md

## プロダクト

`nyatinte.com` の個人サイト。`/log` で、わからなかったことを調べて書いた記事を公開する。閲覧はログイン不要。記事はエージェントとの会話を Markdown か MDX に書き出し、`src/content/log/<slug>.md` または `.svx` に置く。X での OGP を重視する。

記事の frontmatter は Zod で検証する。必須は `title`、`description`、`date`。任意は `updated` と `image`。不正な frontmatter はビルドを失敗させる。下書きは設けない。公開ページはビルド時のファイルを読む。一覧は日付の新しい順で、同じ日付ではスラッグの昇順である。

`/done` と `/done/` 以下は `/log` へ 301 で移す。トップページのナビゲーションからも `/log` へ移れる。

`/mcp` と、Worker での Cloudflare Access JWT の検証は残す。ツールは登録しない。ブログ用のツールはあとから足す。GitHub トークンは実績の PR 作成にだけ使っていた。使う箇所がなくなったので、設定から外してある。Actions の Secret と Cloudflare のシークレットが残っていれば、運用で削除できる。

開発・デプロイ方法は [README.md](README.md) を参照する。

## 実装上の決定

- SvelteKit + Svelte 5、TypeScript、Vite+、pnpm、Cloudflare Workers を使う。バージョンとコマンドは `package.json` を参照する。記事は mdsvex で `.md` と `.svx` を扱う。
- `/mcp` は Cloudflare Access で保護し、Worker でも Access JWT を検証する。
- OGP は、frontmatter の `image` がなければ `src/routes/og.png` を共通画像に使う。記事のメタデータは公開ページから生成する。記事ごとの画像を画像生成 AI で作り、プロンプトをスキルにして記事を置く作業に組み込む方針は [docs/adr/0001-ogp-image-generation.md](docs/adr/0001-ogp-image-generation.md) に書く。費用がかかるため、今は実装しない。
- `wrangler.jsonc` を Worker 設定と型生成の正本とする。本番デプロイは Varlock Wrangler で既存の変数とシークレットを保持する。
- ホームとログの間、ログ一覧と記事の間（どちらの向きも）の移動では、ルートレイアウトの `onNavigate` が `document.startViewTransition` を呼ぶ。API がないときと `prefers-reduced-motion: reduce` のときは呼ばない。`/log` 以下のドキュメント間遷移はログレイアウトの `@view-transition` で有効にする。これも `prefers-reduced-motion: no-preference` のときだけで、一覧と記事の間以外の移動はガードでスキップする。`::view-transition` の CSS はルートレイアウトにまとめる。
- `/llms.txt`、`Accept: text/markdown`、`Link` の `rel=alternate` は記事向けに残す。RSS は `/log/rss.xml`。サイトマップは `/sitemap.xml`。

## スキル

該当する作業では `.agents/skills/` のスキルを先に読む。

| スキル | 使う場面 |
| --- | --- |
| `svelte-core-bestpractices` | Svelte のコンポーネント・モジュールの作成・編集・解析 |
| `svelte-code-writer` | `.svelte` / `.svelte.ts` の作成・編集・解析 |
| `vite-plus` | Vite+ の設定・コマンド・チェック・テスト・CI |
| `varlock` | 環境変数・シークレット・`.env.schema` |
| `cloudflare` | Cloudflare 製品の選定・構成 |
| `workers-best-practices` | Workers の実装・レビュー・設定 |
| `wrangler` | Wrangler の利用・設定 |
| `cloudflare-one` | Cloudflare Access / Zero Trust の設定 |
| `mcp-builder` | MCP サーバーとツールの実装 |
| `vitest` | テストの作成・モック・カバレッジ |
| `yomiyasu` | 日本語ドキュメントの推敲 |
| `pr` | PR の作成・説明文・as-is/to-be 画像の添付・Stacked PRs・マージ |

日本語の README や AGENTS.md、CLAUDE.md などを書く・直すときは、`yomiyasu` スキルに従って推敲する。

## 規約

- コミットは Conventional Commits。本文は日本語。
- Issue と PR のタイトル・本文、レビューコメント、返信は日本語で書く。コード・識別子・コマンドは原文のまま。
- pullfrog およびこのリポジトリで動く AI レビュー・エージェントは、レビュー本文、インラインコメント、PR・Issue へのコメントをすべて日本語で書く。
- 作業は原則ブランチを切り、PR を出す。PR は `pr` スキルに従う。
- PR はマージコミットでマージする（squash・rebase は使わない）。Stack は `gh stack merge --yes --merge`、単体は `gh pr merge --merge`。
- push 前に、Vite+ の pre-push hook が `pnpm check:ci`（check、build、ビルド済み Worker への HTTP テスト）を走らせる。変更がルートの `README.md`・`AGENTS.md`・`CLAUDE.md` と `docs/**`・`.agents/**` だけのときは hook がスキップする。飛ばす場合は `git push --no-verify` を使う。GitHub Actions の Verify をこの処理に揃える作業は #114。
- 破壊的な操作（削除・履歴改変・force push）は先に確認を取る。
- TypeScript は関数と値で構成し、class 宣言は使わない。
- Valibot の各項目に `description` と `examples` を付ける。
- 300 行を超えるファイルは役割に沿って分割を検討する。
- 全ページに共通する処理・スタイル（テーマのトークンと切り替えの transition、Reduce Motion の扱い、ヘッダー・ナビ、`theme-color` などの head、View Transition の設定）は、ルートレイアウトか共有の場所（`src/lib/styles/`、`src/lib/components/` など）に置き、ページやレイアウトごとにコピーしない。テーマ切り替えのフェードは `src/lib/styles/theme-transition.css` が `.site` 配下の背景色・枠線色と、`.site` 直下の面の文字色に自動で付ける。ページやコンポーネントでテーマ色の transition を書かない。グローバル CSS が届かないところだけ例外として個別に書く。`.site` の外にある `html`/`body` の背景（ログレイアウト）と、継承されるため全要素には付けられない `fill`/`stroke`、シーン固有の回転や透明度（氷山シーン）がそれにあたる。例外でも長さとイージングは `--home-theme-duration` と `--home-theme-easing` を使う。`color` の transition は入れ子にしない（Chrome で子孫側の変化が遅れる）。
- 判断に迷ったら本ファイルの決定事項を確認し、決定がなければ相談する。

## 権利と MVP の範囲

フォントは M PLUS 1p (OFL)。アイコンを使う場合は MIT または ISC のものに限る。

ログには下書き・非公開状態、投稿用 Web 管理画面、閲覧者アカウント・フォロー・コメント、全文検索、画像アップロード、タグを含めない。RSS は `/log/rss.xml`、サイトマップは `/sitemap.xml` で公開する。
