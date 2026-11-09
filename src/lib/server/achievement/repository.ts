import { parse } from "valibot";
import { createGitHubStore } from "./github";
import {
  type AchievementListOptions,
  type AchievementRecord,
  listRecords,
  parseRecord,
  serializeRecord,
} from "./records";
import {
  type CreateAchievementInput,
  createAchievementInputSchema,
  normalizeTag,
  slugifyTitle,
  type UpdateAchievementInput,
  updateAchievementInputSchema,
} from "./validation";

export type { AchievementListOptions, AchievementRecord } from "./records";

const documents = import.meta.glob<string>("../../achievements/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});
const trailingHyphens = /-+$/u;

function domainError(name: string, message: string) {
  return Object.assign(new Error(message), { name });
}

function tagsFor(names: string[]) {
  const tags = new Map<string, string>();
  for (const name of names) {
    const display = name.normalize("NFKC").trim();
    const normalized = normalizeTag(display);
    if (!tags.has(normalized)) {
      tags.set(normalized, display);
    }
  }
  return [...tags]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([normalized, name]) => ({ name, normalized }));
}

function linksFor(links: NonNullable<CreateAchievementInput["links"]>) {
  return links.map(({ url, label }, position) => ({
    id: crypto.randomUUID(),
    label: label ?? null,
    position,
    url,
  }));
}

export function createAchievementRepository(
  options: { token?: string; store?: ReturnType<typeof createGitHubStore> } = {}
) {
  const store =
    options.store ??
    (options.token ? createGitHubStore(options.token) : undefined);

  function entries() {
    return store
      ? store.list()
      : Promise.resolve(
          Object.values(documents).map((document) => ({
            record: parseRecord(document),
            sha: "",
          }))
        );
  }

  async function get(key: string, settings: { includeDeleted?: boolean } = {}) {
    const found = (await entries()).find(
      ({ record }) =>
        (record.id === key || record.slug === key) &&
        (settings.includeDeleted || !record.deletedAt)
    );
    return found?.record ?? null;
  }

  async function list(settings: AchievementListOptions = {}) {
    return listRecords(
      (await entries()).map(({ record }) => record),
      settings
    );
  }

  async function listTags() {
    const tags = new Map<string, { name: string; normalized: string }>();
    for (const { record } of await entries()) {
      if (!record.deletedAt) {
        for (const tag of record.tags) {
          tags.set(tag.normalized, tag);
        }
      }
    }
    return [...tags.values()].sort((a, b) =>
      a.normalized.localeCompare(b.normalized)
    );
  }

  async function getAdjacent(id: string) {
    const ordered = (await entries())
      .map(({ record }) => record)
      .filter((record) => !record.deletedAt)
      .sort(
        (a, b) =>
          b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id)
      );
    const index = ordered.findIndex((record) => record.id === id);
    return {
      next: index < 0 ? null : (ordered[index + 1] ?? null),
      previous: index < 0 ? null : (ordered[index - 1] ?? null),
    };
  }

  async function propose(record: AchievementRecord, sha?: string) {
    if (!store) {
      throw new Error("GitHub is not configured");
    }
    const pullRequestUrl = await store.propose(
      record,
      serializeRecord(record),
      sha
    );
    return { ...record, pullRequestUrl };
  }

  async function create(rawInput: CreateAchievementInput) {
    const input = parse(createAchievementInputSchema, rawInput);
    const now = new Date();
    const timestamp = now.toISOString();
    const id = crypto.randomUUID();
    const slug =
      input.slug ??
      `${slugifyTitle(input.title).slice(0, 100).replace(trailingHyphens, "")}-${id.slice(-8)}`;
    if ((await entries()).some(({ record }) => record.slug === slug)) {
      throw domainError(
        "RevisionConflictError",
        "Achievement slug already exists"
      );
    }
    return propose({
      bodyMarkdown: input.bodyMarkdown ?? null,
      changeId: crypto.randomUUID(),
      coverImageUrl: input.coverImageUrl ?? null,
      createdAt: timestamp,
      deletedAt: null,
      id,
      links: linksFor(input.links ?? []),
      occurredAt:
        input.occurredAt ??
        new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10),
      revision: 1,
      slug,
      summary: input.summary,
      tags: tagsFor(input.tags ?? []),
      title: input.title,
      updatedAt: timestamp,
    });
  }

  async function current(
    id: string,
    expectedRevision?: number,
    includeDeleted = false
  ) {
    const found = (await entries()).find(
      ({ record }) => record.id === id && (includeDeleted || !record.deletedAt)
    );
    if (!found) {
      throw domainError("AchievementNotFoundError", "Achievement not found");
    }
    if (
      expectedRevision !== undefined &&
      found.record.revision !== expectedRevision
    ) {
      throw domainError(
        "RevisionConflictError",
        "Achievement revision has changed"
      );
    }
    return found;
  }

  async function update(
    id: string,
    expectedRevision: number,
    rawInput: UpdateAchievementInput
  ) {
    const { tags, links, ...fields } = parse(
      updateAchievementInputSchema,
      rawInput
    );
    const { record, sha } = await current(id, expectedRevision);
    const updated = {
      ...record,
      ...fields,
      changeId: crypto.randomUUID(),
      ...(tags !== undefined && { tags: tagsFor(tags) }),
      ...(links !== undefined && { links: linksFor(links) }),
      revision: record.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    return propose(updated, sha);
  }

  async function remove(id: string, expectedRevision: number) {
    const { record, sha } = await current(id, expectedRevision);
    const now = new Date().toISOString();
    return propose(
      {
        ...record,
        changeId: crypto.randomUUID(),
        deletedAt: now,
        revision: record.revision + 1,
        updatedAt: now,
      },
      sha
    );
  }

  async function restore(id: string) {
    const { record, sha } = await current(id, undefined, true);
    if (!store) {
      throw new Error("GitHub is not configured");
    }
    const previous = (await store.history(record.slug, record.changeId)).find(
      (item) => !item.deletedAt
    );
    if (!previous) {
      throw new Error("No previous achievement revision to restore");
    }
    if (previous.id !== record.id) {
      throw new Error("Historical achievement ID does not match");
    }
    return propose(
      {
        ...previous,
        changeId: crypto.randomUUID(),
        revision: record.revision + 1,
        updatedAt: new Date().toISOString(),
      },
      sha
    );
  }

  return {
    create,
    delete: remove,
    get,
    getAdjacent,
    list,
    listTags,
    restore,
    update,
  };
}
