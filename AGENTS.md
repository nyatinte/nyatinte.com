# AGENTS.md

## プロダクト

`nyatinte.com` の個人サイト。`/done` で本人の実績を公開する。閲覧はログイン不要。実績はタイトルと一言で成立し、Markdown の詳細を後から追加できる。X での OGP を重視する。

実績は `src/lib/achievements/` の Markdown を正本とする。MCP は変更の PR を作成し、マージ後の手動デプロイで公開ページに反映する。下書きは設けない。公開ページはビルド時のデータを読み、MCP は GitHub の現行データを読む。

開発・デプロイ方法は [README.md](README.md) を参照。

## 実装上の決定

- SvelteKit + Svelte 5、TypeScript、Vite+、pnpm、Cloudflare Workers を使う。バージョンとコマンドは `package.json` を参照する。
- `/mcp` は Cloudflare Access で保護し、Worker でも Access JWT を検証する。
- OGP は `src/routes/og.png` を共通画像に使う。実績ごとのメタデータは公開ページから生成する。
- `wrangler.jsonc` を Worker 設定と型生成の正本とする。本番デプロイは Varlock Wrangler で既存の変数とシークレットを保持する。

## スキル

該当する作業では `.agents/skills/` のスキルを先に読む。各 `SKILL.md` の `description` が自動選択の正本。下表はこのリポジトリ向けの補足。

| スキル | 使う場面 |
| --- | --- |
| `svelte-core-bestpractices` | Svelte コンポーネント・モジュールの実装・レビュー（反応性・イベント等） |
| `svelte-code-writer` | `@sveltejs/mcp` で公式ドキュメント参照や解析が必要なときのみ（毎回の編集ではない） |
| `vite-plus` | Vite+ / `vite.config.ts`、チェック・テスト・フック。CI は workflow 編集や `vp` 系ジョブの修正時（`references/ci-cd.md`） |
| `varlock` | `.env.schema`、Varlock 連携、シークレット・デプロイ用 env |
| `cloudflare` | 製品選定・アーキテクチャ検討（既存スタック内の通常実装では読まない） |
| `workers-best-practices` | Worker ランタイムコード・バインディングの実装・レビュー |
| `wrangler` | Wrangler CLI・`wrangler.jsonc`（パイプラインの wrangler シークレット設定を除き CI 全体には使わない） |
| `cloudflare-one` | Access / Zero Trust のポリシー・IdP 設定（Worker 内 JWT 検証だけでは不要） |
| `mcp-builder` | MCP サーバー・ツールの新規実装・設計 |
| `vitest` | テストコード・モック・カバレッジ・Vitest 設定（workflow 失敗だけでは読まない） |

### CI とスキル

専用の「CI スキル」はない。解釈は次のとおり。

- **Workflow 定義**（`.github/workflows/`、`pnpm check` / `vp` / verify ジョブ）→ `vite-plus`（`references/ci-cd.md`）
- **落ちたテストの中身** → `vitest` またはアプリコード（workflow  YAML だけでは `vitest` を開かない）
- **デプロイ job・Cloudflare 認証情報** → `wrangler` / `varlock`（Vite+ の verify 以外）

## 規約

- コミットは Conventional Commits。本文は日本語。
- 作業は原則ブランチを切り、PR を出す。
- 破壊的な操作（削除・履歴改変・force push）は先に確認を取る。
- TypeScript は関数と値で構成し、class 宣言は使わない。
- Valibot の各項目に `description` と `examples` を付ける。
- 300 行を超えるファイルは役割に沿って分割を検討する。
- 判断に迷ったら本ファイルの決定事項を確認し、決定がなければ相談する。

## 権利と MVP の範囲

ゲームの実績 UI を参考にする場合も、自作の図形とタイポグラフィで表現する。PlayStation、Xbox、Steam のロゴ・トロフィー画像・達成率バー、実在ゲームの名称・アイコン・スクリーンショット、特定プラットフォーム UI の 1 対 1 の再現は禁止。フォントは M PLUS 1p (OFL)、アイコンを使う場合は MIT または ISC のものに限る。

MVP には匿名リアクション・集計、やる宣言、下書き・非公開状態、階級・レア度・達成率、投稿用 Web 管理画面、閲覧者アカウント・フォロー・コメント、全文検索、画像アップロード、RSS、sitemap を含めない。
