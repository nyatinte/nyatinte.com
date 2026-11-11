# AGENTS.md

このリポジトリでの作業ルール。エージェントは作業前に必ず読むこと。

## プロダクト

`nyatinte.com` の個人サイト。`/done` に「やったこと（実績）」を短く蓄積・公開する。

- 投稿者は本人 1 名のみ。投稿は MCP 経由
- MCP から登録した実績は保存後すぐ公開する。下書き状態を持たない
- 閲覧は誰でも、ログイン不要
- 実績はタイトルと一言だけで成立し、後から Markdown の詳細を足せる
- X に貼ったときの OGP を重視する

詳細は `plan-docs/plan.html`（実装計画書）。実績の保存・公開方法は本ファイルを優先する。

## 技術スタック

| 領域 | 採用 |
| --- | --- |
| フレームワーク | SvelteKit 3.0.0-next.27 + Svelte 5 |
| 言語 | TypeScript 6 |
| ツールチェーン | Vite+ (`vp`) |
| バリデーション | valibot |
| スタイル | Svelte の `<style>` ブロックとモダン CSS |
| 実行環境 | Cloudflare Workers (`adapter-cloudflare`) |
| 実績の保存 | Git 管理の Markdown。MCP が PR を作成し、マージ後に手動デプロイ |
| 環境変数 | varlock |
| 認証 | Cloudflare Access（`/mcp` のみ） |
| OGP 画像 | Static Assets から配信する共通の固定 PNG |
| テスト | Vitest |
| CI/CD | GitHub Actions + Wrangler (型生成) + Varlock Wrangler (deploy) |
| パッケージ管理 | pnpm |

## コマンド

実装が進んだら確定させる。現時点の想定:

```sh
pnpm dev      # 開発サーバー
pnpm check    # fmt + lint + typecheck
pnpm test     # Vitest
pnpm build    # ビルド
pnpm deploy   # ビルドしてデプロイ
```

## OGP の本番経路

- 実績と実績ごとの共有メタデータは D1 を正本とする。`static/og/done.png` は共通画像として配信し、実績データをビルド時に複製しない。
- Takumi のレンダリングとフォント検証は、参考用の PoC として `poc/takumi-workers/` に隔離し、本番のページ・画像配信には接続しない。実績ごとの PNG の生成・保存は行わない。

## Cloudflare CLI

- `wrangler.jsonc` を Worker 設定と型生成の正本にする。SvelteKit のビルドには Vite+、本番 deploy には Varlock Wrangler を使い、既存の変数とシークレットを保持する。
- Takumi PoC の Wrangler 設定は、各スクリプトが指定する。

## スキル

`.agents/skills/` に導入済み。該当作業では必ず先に読むこと。

| スキル | 使う場面 |
| --- | --- |
| `svelte-core-bestpractices` | Svelte のコンポーネント・モジュールを書く / 直す / 読むとき |
| `svelte-code-writer` | `.svelte` / `.svelte.ts` を作成・編集・解析するとき |
| `vite-plus` | Vite+ の初期化・移行・`vp` コマンド・チェック・テスト・CI の設定 |
| `varlock` | 環境変数・シークレット・`.env.schema` の読み書き |
| `cloudflare` | Cloudflare 製品の選定・構成の相談 |
| `workers-best-practices` | Workers を書く / レビューする / 設定するとき |
| `wrangler` | Varlock互換 deploy、Takumi PoC、D1テストでWranglerを使うとき |
| `cloudflare-one` | Cloudflare Access / Zero Trust の設定 |
| `mcp-builder` | MCP サーバーとツールの実装 |
| `vitest` | テストの作成・モック・カバレッジ |

## 規約

- コミットは Conventional Commits。本文は日本語。
- 作業は原則ブランチを切り、PR を出す。
- 破壊的な操作（削除・履歴改変・force push）は先に確認を取る。
- TypeScript は関数と値で構成し、class 宣言は使わない。
- Valibot の各項目に `description` と `examples` を付ける。
- 300行を超えるファイルは役割に沿って分割を検討する。
- 判断に迷ったら計画書と本ファイルの決定事項に戻る。無ければ勝手に決めず確認する。

## 守ること（権利まわり）

ゲームの実績 UI に寄せた見た目を採用しているが、以下は禁止。

- PlayStation、Xbox、Steam のロゴ、トロフィー画像、達成率バーの流用
- 実在ゲームの名称・アイコン・スクリーンショットの利用
- 特定プラットフォームの UI を 1 対 1 で再現すること

自作の図形とタイポグラフィだけで表現する。フォントは M PLUS 1p (OFL)、アイコンを使う場合は MIT または ISC のものに限る。

## やらないこと（MVP 外）

- プッシュ（匿名リアクション）、リアクション集計
- やる宣言（未達成フラグ）
- 下書き・非公開状態
- 階級（GOLD、SILVER、BRONZE）、レア度、達成率
- 投稿用 Web 管理画面
- 閲覧者アカウント、フォロー、コメント
- 全文検索、画像アップロード、RSS、sitemap

## 未検証の前提

着手前に PoC で確認するもの。壊れていたら計画書の代替案に切り替える。

- Cloudflare Access のサービス トークンを MCP クライアントが送れるか
- SvelteKit 3 の next prerelease と Vite+ beta が実用に耐えるか
