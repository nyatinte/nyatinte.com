import { getTableConfig } from "drizzle-orm/sqlite-core";
import { expect, test } from "vite-plus/test";
import {
  achievement,
  achievementRevision,
  achievementTag,
  link,
  tag,
} from "./schema";

test("stores the planned achievement fields and lookup indexes", () => {
  const table = getTableConfig(achievement);

  expect(table.name).toBe("achievement");
  expect(table.columns.map((column) => column.name)).toEqual(
    expect.arrayContaining([
      "id",
      "slug",
      "title",
      "summary",
      "body_markdown",
      "cover_image_url",
      "occurred_at",
      "published_at",
      "created_at",
      "updated_at",
      "deleted_at",
      "revision",
    ])
  );
  expect(table.indexes.map(({ config }) => config.name)).toEqual(
    expect.arrayContaining(["idx_achievement_slug", "idx_achievement_alive"])
  );
});

test("normalizes tags through a unique key and joins them by a composite key", () => {
  const tags = getTableConfig(tag);
  const joins = getTableConfig(achievementTag);

  expect(tags.indexes.map(({ config }) => config.name)).toContain(
    "tag_normalized_unique"
  );
  expect(joins.primaryKeys).toHaveLength(1);
  expect(joins.foreignKeys).toHaveLength(2);
});

test("keeps links and prior revision snapshots attached to an achievement", () => {
  expect(getTableConfig(link).foreignKeys).toHaveLength(1);
  expect(getTableConfig(achievementRevision).foreignKeys).toHaveLength(1);
  expect(
    getTableConfig(achievementRevision).columns.map(({ name }) => name)
  ).toEqual(
    expect.arrayContaining([
      "achievement_id",
      "revision",
      "snapshot_json",
      "source",
      "created_at",
    ])
  );
});
