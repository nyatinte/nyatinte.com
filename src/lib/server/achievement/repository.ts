import { and, asc, desc, eq, isNull, or, type SQL, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { type AnyD1Database, drizzle } from "drizzle-orm/d1";
import { parse } from "valibot";
import { uuidv7 } from "../db/id";
import {
  type Achievement,
  type AchievementSnapshot,
  achievement,
  achievementRevision,
  achievementTag,
  link,
  tag,
} from "../db/schema";
import {
  type CreateAchievementInput,
  createAchievementInputSchema,
  normalizeTag,
  slugifyTitle,
  type UpdateAchievementInput,
  updateAchievementInputSchema,
} from "./validation";

const TRAILING_HYPHENS = /-+$/u;

export interface AchievementRecord extends Achievement {
  links: { id: string; url: string; label: string | null; position: number }[];
  tags: { name: string; normalized: string }[];
}

export interface AchievementListOptions {
  cursor?: string;
  includeDeleted?: boolean;
  limit?: number;
  tags?: string[];
}

export class AchievementNotFoundError extends Error {
  constructor() {
    super("Achievement not found");
    this.name = "AchievementNotFoundError";
  }
}

export class RevisionConflictError extends Error {
  constructor(options?: ErrorOptions) {
    super("Achievement revision has changed", options);
    this.name = "RevisionConflictError";
  }
}

function toSnapshot(record: AchievementRecord): AchievementSnapshot {
  return {
    achievement: {
      bodyMarkdown: record.bodyMarkdown,
      coverImageUrl: record.coverImageUrl,
      createdAt: record.createdAt,
      deletedAt: record.deletedAt,
      id: record.id,
      occurredAt: record.occurredAt,
      publishedAt: record.publishedAt,
      revision: record.revision,
      slug: record.slug,
      summary: record.summary,
      title: record.title,
      updatedAt: record.updatedAt,
    },
    links: record.links,
    tags: record.tags,
  };
}

function uniqueTags(names: string[]) {
  const tags = new Map<string, string>();
  for (const name of names) {
    const displayName = name.normalize("NFKC").trim();
    const normalized = normalizeTag(displayName);
    if (!tags.has(normalized)) {
      tags.set(normalized, displayName);
    }
  }
  return [...tags];
}

function changesForUpdate(
  input: UpdateAchievementInput,
  revision: number,
  updatedAt: string
): Partial<Achievement> {
  return {
    ...(input.bodyMarkdown !== undefined && {
      bodyMarkdown: input.bodyMarkdown,
    }),
    ...(input.coverImageUrl !== undefined && {
      coverImageUrl: input.coverImageUrl,
    }),
    ...(input.occurredAt !== undefined && { occurredAt: input.occurredAt }),
    ...(input.summary !== undefined && { summary: input.summary }),
    ...(input.title !== undefined && { title: input.title }),
    revision,
    updatedAt,
  };
}

function cursorFilter(cursor: string): SQL {
  const [occurredAt, id, extra] = cursor.split("~");
  if (!(occurredAt && id) || extra !== undefined) {
    throw new TypeError("Invalid achievement cursor");
  }
  return sql`(
    ${achievement.occurredAt} < ${occurredAt}
    OR (${achievement.occurredAt} = ${occurredAt} AND ${achievement.id} > ${id})
  )`;
}

export function createAchievementRepository(client: AnyD1Database) {
  const db = drizzle(client, {
    schema: { achievement, achievementRevision, achievementTag, link, tag },
  });

  function batch(queries: BatchItem<"sqlite">[]) {
    return db.batch(queries as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  }

  function tagQueries(id: string, names: string[], createdAt?: string) {
    const values = uniqueTags(names);
    const queries: BatchItem<"sqlite">[] = [];
    if (values.length === 0) {
      return queries;
    }

    queries.push(
      db
        .insert(tag)
        .values(
          values.map(([normalized, name]) => ({
            createdAt: createdAt ?? new Date().toISOString(),
            id: uuidv7(),
            name,
            normalized,
          }))
        )
        .onConflictDoNothing()
    );
    for (const [normalized] of values) {
      queries.push(
        db.insert(achievementTag).values({
          achievementId: id,
          tagId: sql<string>`(SELECT id FROM tag WHERE normalized = ${normalized})`,
        })
      );
    }
    return queries;
  }

  function linkQueries(id: string, links: CreateAchievementInput["links"]) {
    if (!links?.length) {
      return [];
    }
    return [
      db.insert(link).values(
        links.map(({ url, label }, position) => ({
          achievementId: id,
          id: uuidv7(),
          label: label ?? null,
          position,
          url,
        }))
      ),
    ];
  }

  async function get(
    key: string,
    options: { includeDeleted?: boolean } = {}
  ): Promise<AchievementRecord | null> {
    const [row] = await db
      .select()
      .from(achievement)
      .where(
        and(
          or(eq(achievement.id, key), eq(achievement.slug, key)),
          ...(options.includeDeleted ? [] : [isNull(achievement.deletedAt)])
        )
      )
      .limit(1);
    if (!row) {
      return null;
    }

    const [tags, links] = await Promise.all([
      db
        .select({ name: tag.name, normalized: tag.normalized })
        .from(achievementTag)
        .innerJoin(tag, eq(tag.id, achievementTag.tagId))
        .where(eq(achievementTag.achievementId, row.id))
        .orderBy(asc(tag.normalized)),
      db
        .select({
          id: link.id,
          label: link.label,
          position: link.position,
          url: link.url,
        })
        .from(link)
        .where(eq(link.achievementId, row.id))
        .orderBy(asc(link.position)),
    ]);
    return { ...row, links, tags };
  }

  async function create(
    rawInput: CreateAchievementInput
  ): Promise<AchievementRecord> {
    const input = parse(createAchievementInputSchema, rawInput);
    const now = new Date();
    const timestamp = now.toISOString();
    const id = uuidv7(now.getTime());
    const slug =
      input.slug ??
      `${slugifyTitle(input.title).slice(0, 100).replace(TRAILING_HYPHENS, "")}-${id.slice(-8)}`;
    const record = {
      bodyMarkdown: input.bodyMarkdown ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      createdAt: timestamp,
      id,
      occurredAt:
        input.occurredAt ??
        new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10),
      publishedAt: timestamp,
      revision: 1,
      slug,
      summary: input.summary,
      title: input.title,
      updatedAt: timestamp,
    };
    const queries: BatchItem<"sqlite">[] = [
      db.insert(achievement).values(record),
      ...tagQueries(id, input.tags ?? [], timestamp),
      ...linkQueries(id, input.links),
    ];
    await batch(queries);

    const created = await get(id);
    if (!created) {
      throw new Error("Created achievement was not found");
    }
    return created;
  }

  async function list(options: AchievementListOptions = {}) {
    const requestedLimit = options.limit ?? 20;
    if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {
      throw new RangeError("List limit must be a positive integer");
    }
    const limit = Math.min(requestedLimit, 100);
    const filters: SQL[] = [];
    if (!options.includeDeleted) {
      filters.push(isNull(achievement.deletedAt));
    }
    for (const normalized of new Set(
      (options.tags ?? []).map(normalizeTag).filter(Boolean)
    )) {
      filters.push(sql`EXISTS (
        SELECT 1 FROM ${achievementTag}
        INNER JOIN ${tag} ON ${tag.id} = ${achievementTag.tagId}
        WHERE ${achievementTag.achievementId} = ${achievement.id}
          AND ${tag.normalized} = ${normalized}
      )`);
    }
    if (options.cursor) {
      filters.push(cursorFilter(options.cursor));
    }

    const rows = await db
      .select()
      .from(achievement)
      .where(and(...filters))
      .orderBy(desc(achievement.occurredAt), asc(achievement.id))
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const items = await Promise.all(
      page.map(({ id }) => get(id, { includeDeleted: options.includeDeleted }))
    );
    const last = page.at(-1);
    return {
      items: items.filter((item): item is AchievementRecord => item !== null),
      nextCursor: hasMore && last ? `${last.occurredAt}~${last.id}` : null,
    };
  }

  async function commitChange(
    current: AchievementRecord,
    changes: Partial<Achievement>,
    source: "mcp" | "system" | "restore",
    additionalQueries: BatchItem<"sqlite">[] = []
  ): Promise<AchievementRecord> {
    const now = changes.updatedAt ?? new Date().toISOString();
    const queries: BatchItem<"sqlite">[] = [
      db.insert(achievementRevision).values({
        achievementId: current.id,
        createdAt: now,
        revision: current.revision,
        snapshotJson: toSnapshot(current),
        source,
      }),
      db
        .update(achievement)
        .set(changes)
        .where(
          and(
            eq(achievement.id, current.id),
            eq(achievement.revision, current.revision),
            current.deletedAt === null
              ? isNull(achievement.deletedAt)
              : eq(achievement.deletedAt, current.deletedAt)
          )
        ),
      ...additionalQueries,
    ];

    try {
      await batch(queries);
    } catch (error) {
      const latest = await get(current.id, { includeDeleted: true });
      if (!latest) {
        throw error;
      }
      if (latest.revision !== current.revision) {
        // biome-ignore lint/style/useErrorCause: The cause is passed to the domain error.
        throw new RevisionConflictError({ cause: error });
      }
      throw error;
    }
    const updated = await get(current.id, { includeDeleted: true });
    if (!updated) {
      throw new AchievementNotFoundError();
    }
    return updated;
  }

  async function update(
    id: string,
    expectedRevision: number,
    rawInput: UpdateAchievementInput,
    source: "mcp" | "system" = "mcp"
  ): Promise<AchievementRecord> {
    const input = parse(updateAchievementInputSchema, rawInput);
    const current = await get(id);
    if (!current) {
      throw new AchievementNotFoundError();
    }
    if (current.revision !== expectedRevision) {
      throw new RevisionConflictError();
    }

    const now = new Date().toISOString();
    const additionalQueries: BatchItem<"sqlite">[] = [];
    if (input.tags !== undefined) {
      additionalQueries.push(
        db.delete(achievementTag).where(eq(achievementTag.achievementId, id)),
        ...tagQueries(id, input.tags, now)
      );
    }
    if (input.links !== undefined) {
      additionalQueries.push(
        db.delete(link).where(eq(link.achievementId, id)),
        ...linkQueries(id, input.links)
      );
    }

    return commitChange(
      current,
      changesForUpdate(input, current.revision + 1, now),
      source,
      additionalQueries
    );
  }

  async function remove(
    id: string,
    expectedRevision: number,
    source: "mcp" | "system" = "mcp"
  ): Promise<AchievementRecord> {
    const current = await get(id);
    if (!current) {
      throw new AchievementNotFoundError();
    }
    if (current.revision !== expectedRevision) {
      throw new RevisionConflictError();
    }
    const now = new Date().toISOString();
    return commitChange(
      current,
      { deletedAt: now, revision: current.revision + 1, updatedAt: now },
      source
    );
  }

  async function restore(id: string): Promise<AchievementRecord> {
    const current = await get(id, { includeDeleted: true });
    if (!current) {
      throw new AchievementNotFoundError();
    }
    const history = await db
      .select({ snapshotJson: achievementRevision.snapshotJson })
      .from(achievementRevision)
      .where(eq(achievementRevision.achievementId, id))
      .orderBy(desc(achievementRevision.revision));
    const snapshot = history
      .map(({ snapshotJson }) => snapshotJson)
      .find(({ achievement: previous }) => previous.deletedAt === null);
    if (!snapshot) {
      throw new Error("No previous achievement revision to restore");
    }

    const now = new Date().toISOString();
    const restored = snapshot.achievement;
    const additionalQueries: BatchItem<"sqlite">[] = [
      db.delete(achievementTag).where(eq(achievementTag.achievementId, id)),
      ...tagQueries(
        id,
        snapshot.tags.map(({ name }) => name),
        now
      ),
      db.delete(link).where(eq(link.achievementId, id)),
      ...linkQueries(
        id,
        snapshot.links.map(({ url, label }) => ({
          url,
          ...(label !== null && { label }),
        }))
      ),
    ];
    return commitChange(
      current,
      {
        bodyMarkdown: restored.bodyMarkdown,
        coverImageUrl: restored.coverImageUrl,
        deletedAt: null,
        occurredAt: restored.occurredAt,
        revision: current.revision + 1,
        summary: restored.summary,
        title: restored.title,
        updatedAt: now,
      },
      "restore",
      additionalQueries
    );
  }

  return { create, delete: remove, get, list, restore, update };
}
