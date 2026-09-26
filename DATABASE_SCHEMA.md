# データベーススキーマ

Cloudflare D1（SQLite）に実績、タグ、リンク、変更前のリビジョンを保存する。

## テーブル

| テーブル | 主な列 | 制約・用途 |
| --- | --- | --- |
| `achievement` | `id`, `slug`, `title`, `summary`, `body_markdown`, `cover_image_url`, `occurred_at`, `published_at`, `created_at`, `updated_at`, `deleted_at`, `revision` | `slug` は一意。`revision` は1から始まる。削除は `deleted_at` に日時を記録する。 |
| `tag` | `id`, `name`, `normalized`, `created_at` | `normalized` は一意。表示名と照合用の正規化値を分けて保持する。 |
| `achievement_tag` | `achievement_id`, `tag_id` | 2列を複合主キーとし、実績とタグを多対多で結ぶ。 |
| `link` | `id`, `achievement_id`, `url`, `label`, `position` | 実績に付属するリンクと表示順。 |
| `achievement_revision` | `id`, `achievement_id`, `revision`, `snapshot_json`, `source`, `created_at` | 更新直前の実績・タグ・リンクを JSON で保存する。 |

すべての外部キーは親レコードの物理削除時にカスケードする。通常の削除操作はソフトデリートを使う。

## インデックス

- `idx_achievement_slug`: 実績 URL の一意性。
- `idx_achievement_alive`: 削除状態と実施日の降順で一覧を読み、ID で同日の順序を安定させる。
- `tag_normalized_unique`: 正規化タグの重複を防ぐ。
- `achievement_tag_tag`: タグから実績を絞り込む。
- `link_achievement_position`: 実績内のリンクを表示順に読む。
- `achievement_revision_version_unique`: 実績ごとにリビジョン番号を一意にする。

## 型と値

- ID は UUIDv7 文字列。
- 実施日は `YYYY-MM-DD`、その他の日時は ISO 8601 文字列。
- 真偽値や日時型は専用列にせず、必要な場合は SQLite の `INTEGER` または `TEXT` で保存する。
- `snapshot_json` の `source` は `mcp`、`system`、`restore` のいずれか。

## マイグレーション

スキーマは `src/lib/server/db/schema.ts`、生成 SQL は `drizzle/` に置く。変更後は `pnpm db:generate` を実行し、SQL とスナップショットを確認する。リモート D1 への適用は、対象 DB の確認と別途承認が済むまで行わない。
