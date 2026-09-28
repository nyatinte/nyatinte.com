import { desc, relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { uuidv7 } from "./id";

export interface AchievementSnapshot {
  achievement: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    bodyMarkdown: string | null;
    coverImageUrl: string | null;
    occurredAt: string;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    revision: number;
  };
  links: { id: string; url: string; label: string | null; position: number }[];
  tags: { name: string; normalized: string }[];
}

export const achievement = sqliteTable(
  "achievement",
  {
    bodyMarkdown: text("body_markdown"),
    coverImageUrl: text("cover_image_url"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    deletedAt: text("deleted_at"),
    id: text("id").primaryKey().$defaultFn(uuidv7),
    occurredAt: text("occurred_at").notNull(),
    publishedAt: text("published_at").notNull(),
    revision: integer("revision").notNull().default(1),
    slug: text("slug").notNull(),
    summary: text("summary").notNull(),
    title: text("title").notNull(),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    alive: index("idx_achievement_alive").on(
      table.deletedAt,
      desc(table.occurredAt),
      table.id
    ),
    slugUnique: uniqueIndex("idx_achievement_slug").on(table.slug),
  })
);

export const tag = sqliteTable(
  "tag",
  {
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    id: text("id").primaryKey().$defaultFn(uuidv7),
    name: text("name").notNull(),
    normalized: text("normalized").notNull(),
  },
  (table) => ({
    normalizedUnique: uniqueIndex("tag_normalized_unique").on(table.normalized),
  })
);

export const achievementTag = sqliteTable(
  "achievement_tag",
  {
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievement.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.achievementId, table.tagId] }),
    tagIdx: index("achievement_tag_tag").on(table.tagId, table.achievementId),
  })
);

export const link = sqliteTable(
  "link",
  {
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievement.id, { onDelete: "cascade" }),
    id: text("id").primaryKey().$defaultFn(uuidv7),
    label: text("label"),
    position: integer("position").notNull(),
    url: text("url").notNull(),
  },
  (table) => ({
    achievementPosition: index("link_achievement_position").on(
      table.achievementId,
      table.position
    ),
  })
);

export const achievementRevision = sqliteTable(
  "achievement_revision",
  {
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievement.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    id: text("id").primaryKey().$defaultFn(uuidv7),
    revision: integer("revision").notNull(),
    snapshotJson: text("snapshot_json", { mode: "json" })
      .$type<AchievementSnapshot>()
      .notNull(),
    source: text("source", { enum: ["mcp", "system", "restore"] }).notNull(),
  },
  (table) => ({
    versionUnique: uniqueIndex("achievement_revision_version_unique").on(
      table.achievementId,
      table.revision
    ),
  })
);

export const achievementRelations = relations(achievement, ({ many }) => ({
  links: many(link),
  revisions: many(achievementRevision),
  tags: many(achievementTag),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  achievements: many(achievementTag),
}));

export const achievementTagRelations = relations(achievementTag, ({ one }) => ({
  achievement: one(achievement, {
    fields: [achievementTag.achievementId],
    references: [achievement.id],
  }),
  tag: one(tag, { fields: [achievementTag.tagId], references: [tag.id] }),
}));

export const linkRelations = relations(link, ({ one }) => ({
  achievement: one(achievement, {
    fields: [link.achievementId],
    references: [achievement.id],
  }),
}));

export const achievementRevisionRelations = relations(
  achievementRevision,
  ({ one }) => ({
    achievement: one(achievement, {
      fields: [achievementRevision.achievementId],
      references: [achievement.id],
    }),
  })
);

export type Achievement = typeof achievement.$inferSelect;
export type NewAchievement = typeof achievement.$inferInsert;
export type Tag = typeof tag.$inferSelect;
export type AchievementTag = typeof achievementTag.$inferSelect;
export type Link = typeof link.$inferSelect;
export type AchievementRevision = typeof achievementRevision.$inferSelect;
