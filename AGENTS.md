# AGENTS.md

## プロダクト

`nyatinte.com` の個人サイト。`/done` で本人の実績を公開する。閲覧はログイン不要。実績はタイトルと一言で成立し、Markdown の詳細を後から追加できる。X での OGP を重視する。

実績は `src/lib/achievements/` の Markdown を正本とする。MCP は変更を PR として作成し、マージ後の手動デプロイで公開ページに反映する。下書きは設けない。公開ページはビルド時のデータを読み、MCP の一覧・取得は GitHub 上の現行データを参照する。

開発・デプロイ方法は [README.md](README.md) を参照。

## 実装上の決定

- SvelteKit + Svelte 5、TypeScript、Vite+、pnpm、Cloudflare Workers を使う。バージョンとコマンドは `package.json` を参照する。
- `/mcp` は Cloudflare Access で保護し、Worker でも Access JWT を検証する。
- OGP は `src/routes/og.png` を共通画像に使う。実績ごとのメタデータは公開ページから生成する。
- `wrangler.jsonc` を Worker 設定と型生成の正本とする。本番デプロイは Varlock Wrangler で既存の変数とシークレットを保持する。

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

日本語の README や AGENTS.md、CLAUDE.md などを書く・直すときは、`yomiyasu` スキルに従って推敲する。

## 規約

- コミットは Conventional Commits。本文は日本語。
- Issue と PR のタイトル・本文、レビューコメント、返信は日本語で書く。コード・識別子・コマンドは原文のまま。
- pullfrog およびこのリポジトリで動く AI レビュー・エージェントは、レビュー本文、インラインコメント、PR・Issue へのコメントをすべて日本語で書く。
- 作業は原則ブランチを切り、PR を出す。
- 破壊的な操作（削除・履歴改変・force push）は先に確認を取る。
- TypeScript は関数と値で構成し、class 宣言は使わない。
- Valibot の各項目に `description` と `examples` を付ける。
- 300 行を超えるファイルは役割に沿って分割を検討する。
- 判断に迷ったら本ファイルの決定事項を確認し、決定がなければ相談する。

## 権利と MVP の範囲

ゲームの実績 UI を参考にする場合も、自作の図形とタイポグラフィで表現する。PlayStation、Xbox、Steam のロゴ・トロフィー画像・達成率バー、実在ゲームの名称・アイコン・スクリーンショット、特定プラットフォーム UI の 1 対 1 の再現は禁止。フォントは M PLUS 1p (OFL)、アイコンを使う場合は MIT または ISC のものに限る。

MVP には匿名リアクション・集計、やる宣言、下書き・非公開状態、階級・レア度・達成率、投稿用 Web 管理画面、閲覧者アカウント・フォロー・コメント、全文検索、画像アップロード、RSS、sitemap を含めない。
