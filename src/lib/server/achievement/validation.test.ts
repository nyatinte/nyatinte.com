import { getDescription, getExamples, safeParse } from "valibot";
import { expect, test } from "vite-plus/test";
import { recordSchema } from "./records";
import {
  createAchievementInputSchema,
  normalizeTag,
  slugifyTitle,
  updateAchievementInputSchema,
} from "./validation";

test("documents every nested achievement schema field with a description and examples", () => {
  function visit(value: unknown): void {
    if (!value || typeof value !== "object") {
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }
    const object = value as Record<string, unknown>;
    if (object.entries && typeof object.entries === "object") {
      for (const field of Object.values(object.entries)) {
        const schema = field as Parameters<typeof getDescription>[0];
        expect(getDescription(schema)).toBeTruthy();
        expect(getExamples(schema)?.length).toBeGreaterThan(0);
      }
    }
    for (const child of Object.values(object)) {
      visit(child);
    }
  }
  visit(createAchievementInputSchema);
  visit(recordSchema);
});

test("accepts a minimal achievement with a real calendar date", () => {
  expect(
    safeParse(createAchievementInputSchema, {
      occurredAt: "2026-09-27",
      summary: "日本語のカードを表示できた。",
      title: "Workers の OGP を実装した",
    }).success
  ).toBe(true);
});

test("rejects invalid calendar dates and non-HTTP links", () => {
  expect(
    safeParse(createAchievementInputSchema, {
      links: [{ url: "javascript:alert(1)" }],
      occurredAt: "2026-02-30",
      summary: "Summary",
      title: "Title",
    }).success
  ).toBe(false);
});

test("normalizes tags by width, case, and whitespace", () => {
  expect(normalizeTag("  Ｃｌｏｕｄｆｌａｒｅ   Workers  ")).toBe(
    "cloudflare workers"
  );
});

test("creates an ASCII slug and has a Japanese-title fallback", () => {
  expect(slugifyTitle("Cloudflare Workers の OGP 画像を実装")).toBe(
    "cloudflare-workers-ogp"
  );
  expect(slugifyTitle("実績を公開した")).toBe("achievement");
});

test("does not allow the slug to change through the update schema", () => {
  expect(
    safeParse(updateAchievementInputSchema, { slug: "new-slug" }).success
  ).toBe(false);
});

test("requires at least one field in an update", () => {
  expect(safeParse(updateAchievementInputSchema, {}).success).toBe(false);
});

test("allows nullable content fields to be cleared by an update", () => {
  expect(
    safeParse(updateAchievementInputSchema, {
      bodyMarkdown: null,
      coverImageUrl: null,
    }).success
  ).toBe(true);
});
