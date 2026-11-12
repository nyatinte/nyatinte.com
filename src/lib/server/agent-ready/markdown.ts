import type { AchievementRecord } from "../achievement/records";
import { createAchievementRepository } from "../achievement/repository";
import { normalizeTag } from "../achievement/validation";
import { canonicalSiteUrl, siteIdentity } from "./constants";
import type { AgentRoute } from "./routes";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "long",
  timeZone: "UTC",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

function linkLine(label: string, href: string) {
  return `- [${label}](${href})`;
}

function renderHomeMarkdown(): string {
  return [
    "# nyatinte",
    "",
    siteIdentity.description,
    "",
    linkLine("やったこと", canonicalSiteUrl("/done")),
    linkLine("サイトマップ", canonicalSiteUrl("/sitemap.xml")),
  ].join("\n");
}

function renderAchievementItem(item: AchievementRecord): string {
  const detailUrl = canonicalSiteUrl(`/done/${item.slug}`);
  return [
    `## [${item.title}](${detailUrl})`,
    "",
    item.summary,
    "",
    `日付: ${formatDate(item.occurredAt)}`,
    item.tags.length > 0
      ? `タグ: ${item.tags.map((tag) => tag.name).join(", ")}`
      : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function renderDoneListMarkdown(options: {
  items: AchievementRecord[];
  nextCursor: string | null;
  selectedTags: string[];
}): string {
  const lines = [
    "# やったこと",
    "",
    "小さな前進を、日付と一緒に記録しています。",
    "",
  ];
  if (options.selectedTags.length > 0) {
    lines.push(
      `タグ: ${options.selectedTags.join(", ")}`,
      "",
      linkLine("絞り込みを解除", canonicalSiteUrl("/done")),
      ""
    );
  }
  if (options.items.length === 0) {
    lines.push(
      options.selectedTags.length > 0
        ? "条件に合う記録はありません。"
        : "実績はまだありません。"
    );
  } else {
    lines.push(...options.items.map((item) => renderAchievementItem(item)));
  }
  if (options.nextCursor) {
    const params = new URLSearchParams();
    for (const tag of options.selectedTags) {
      params.append("tag", tag);
    }
    params.set("cursor", options.nextCursor);
    lines.push(
      "",
      linkLine("もっと見る", canonicalSiteUrl(`/done?${params.toString()}`))
    );
  }
  return lines.join("\n");
}

function renderAchievementMarkdown(entry: AchievementRecord): string {
  const lines = [
    `# ${entry.title}`,
    "",
    entry.summary,
    "",
    `日付: ${formatDate(entry.occurredAt)}`,
    `作成日: ${formatDate(entry.createdAt.slice(0, 10))}`,
  ];
  if (entry.tags.length > 0) {
    lines.push("", "タグ:");
    for (const tag of entry.tags) {
      const params = new URLSearchParams({ tag: tag.normalized });
      lines.push(
        linkLine(tag.name, canonicalSiteUrl(`/done?${params.toString()}`))
      );
    }
  }
  if (entry.links.length > 0) {
    lines.push("", "関連リンク:");
    for (const link of entry.links) {
      const label = link.label ?? link.url;
      lines.push(`- [${label}](${link.url})`);
    }
  }
  if (entry.bodyMarkdown) {
    lines.push("", entry.bodyMarkdown.trimEnd());
  }
  lines.push(
    "",
    linkLine("実績一覧へ", canonicalSiteUrl("/done")),
    linkLine("ホーム", canonicalSiteUrl("/"))
  );
  return lines.join("\n");
}

function renderNotFoundMarkdown(message: string): string {
  return [
    "# ページが見つかりません",
    "",
    message,
    "",
    linkLine("ホーム", canonicalSiteUrl("/")),
    linkLine("やったこと", canonicalSiteUrl("/done")),
    linkLine("サイトマップ", canonicalSiteUrl("/sitemap.xml")),
  ].join("\n");
}

function renderGoneMarkdown(message: string): string {
  return [
    "# この実績は削除されています",
    "",
    message,
    "",
    linkLine("実績一覧へ", canonicalSiteUrl("/done")),
    linkLine("ホーム", canonicalSiteUrl("/")),
  ].join("\n");
}

export interface MarkdownRenderResult {
  body: string;
  canonicalUrl: string;
  status: number;
}

export async function renderAgentMarkdown(
  route: AgentRoute,
  searchParams: URLSearchParams
): Promise<MarkdownRenderResult> {
  const canonicalUrl = canonicalSiteUrl(route.canonicalPath);
  if (route.kind === "home") {
    return { body: renderHomeMarkdown(), canonicalUrl, status: 200 };
  }
  if (route.kind === "not-found") {
    return {
      body: renderNotFoundMarkdown("ページが見つかりません。"),
      canonicalUrl,
      status: 404,
    };
  }

  const repository = createAchievementRepository();
  if (route.kind === "done-list") {
    const selectedTags = [
      ...new Set(searchParams.getAll("tag").map(normalizeTag).filter(Boolean)),
    ].slice(0, 20);
    try {
      const page = await repository.list({
        cursor: searchParams.get("cursor") ?? undefined,
        limit: 20,
        tags: selectedTags,
      });
      return {
        body: renderDoneListMarkdown({
          items: page.items,
          nextCursor: page.nextCursor,
          selectedTags,
        }),
        canonicalUrl,
        status: 200,
      };
    } catch (cause) {
      if (cause instanceof TypeError || cause instanceof RangeError) {
        return {
          body: renderNotFoundMarkdown("一覧の指定が正しくありません。"),
          canonicalUrl,
          status: 400,
        };
      }
      throw cause;
    }
  }

  const entry = await repository.get(route.slug, { includeDeleted: true });
  if (!entry) {
    return {
      body: renderNotFoundMarkdown("実績が見つかりません。"),
      canonicalUrl,
      status: 404,
    };
  }
  if (entry.deletedAt) {
    return {
      body: renderGoneMarkdown("この実績は削除されています。"),
      canonicalUrl,
      status: 410,
    };
  }
  return {
    body: renderAchievementMarkdown(entry),
    canonicalUrl,
    status: 200,
  };
}
