import { parse } from "yaml";
import z from "zod/v4";

const datePattern = /^\d{4}-\d{2}-\d{2}$/u;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const lineBreakPattern = /[\r\n]/u;
const extensionPattern = /\.(md|svx)$/u;

function splitFrontmatter(source: string) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    return null;
  }
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) {
    return null;
  }
  const frontmatter = normalized.slice(4, end);
  const rest = normalized.slice(end + 4);
  const body = rest.startsWith("\n") ? rest.slice(1) : rest;
  if (!frontmatter) {
    return null;
  }
  return { body, frontmatter };
}

function isRealDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!(year && month && day)) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const singleLine = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !lineBreakPattern.test(value), {
    message: "Must be a single line",
  });

const isoDate = z
  .string()
  .regex(datePattern, "Use YYYY-MM-DD")
  .refine(isRealDate, "Use a real calendar date");

const imageReference = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (value.startsWith("/") && !value.startsWith("//")) {
      return true;
    }
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Use a site path or an http(s) URL");

export const articleFrontmatterSchema = z
  .object({
    date: isoDate,
    description: singleLine,
    image: imageReference.optional(),
    title: singleLine,
    updated: isoDate.optional(),
  })
  .strict();

export interface Article {
  body: string;
  date: string;
  description: string;
  image?: string;
  slug: string;
  source: string;
  title: string;
  updated?: string;
}

export function fileName(path: string) {
  const withoutQuery = path.split("?")[0] ?? path;
  const slash = Math.max(
    withoutQuery.lastIndexOf("/"),
    withoutQuery.lastIndexOf("\\")
  );
  return withoutQuery.slice(slash + 1);
}

export function parseArticleSource(filename: string, source: string): Article {
  const slug = filename.replace(extensionPattern, "");
  if (slug === filename || !slugPattern.test(slug)) {
    throw new Error(
      `${filename}: file name must be a slug with a .md or .svx extension`
    );
  }
  const split = splitFrontmatter(source);
  if (!split) {
    throw new Error(`${filename}: frontmatter must start and end with ---`);
  }
  let data: unknown;
  try {
    data = parse(split.frontmatter);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "invalid YAML";
    throw new Error(`${filename}: frontmatter YAML is invalid (${message})`, {
      cause,
    });
  }
  const parsed = articleFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => {
        const path = issue.path.join(".") || "frontmatter";
        return `${path}: ${issue.message}`;
      })
      .join("; ");
    throw new Error(`${filename}: invalid frontmatter (${details})`);
  }
  const article: Article = {
    body: split.body,
    date: parsed.data.date,
    description: parsed.data.description,
    slug,
    source,
    title: parsed.data.title,
  };
  if (parsed.data.image) {
    article.image = parsed.data.image;
  }
  if (parsed.data.updated) {
    article.updated = parsed.data.updated;
  }
  return article;
}

export function sortArticlesNewestFirst(articles: Article[]) {
  return [...articles].sort((left, right) => {
    const byDate = right.date.localeCompare(left.date);
    return byDate === 0 ? left.slug.localeCompare(right.slug) : byDate;
  });
}

export function articlesFromSources(sources: Record<string, string>) {
  const articles = Object.entries(sources).map(([path, source]) =>
    parseArticleSource(fileName(path), source)
  );
  const seen = new Set<string>();
  for (const article of articles) {
    if (seen.has(article.slug)) {
      throw new Error(`Duplicate article slug: ${article.slug}`);
    }
    seen.add(article.slug);
  }
  return sortArticlesNewestFirst(articles);
}
