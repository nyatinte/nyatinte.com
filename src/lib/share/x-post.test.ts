import { describe, expect, it } from "vitest";
import { createXIntentUrl, createXPostDraft } from "./x-post";

describe("X post draft", () => {
  const post = {
    summary: "一言に & URL を含めても読みやすい。",
    title: "実績をひとつ公開した",
    url: "https://nyatinte.com/done/one-record?from=x&lang=ja",
  };

  it("combines the D1 title, summary, and canonical URL as a post draft", () => {
    expect(createXPostDraft(post)).toBe(
      "実績をひとつ公開した\n\n一言に & URL を含めても読みやすい。\n\nhttps://nyatinte.com/done/one-record?from=x&lang=ja"
    );
  });

  it("opens X's composer with the complete draft encoded as text", () => {
    const draft = createXPostDraft(post);
    const intent = new URL(createXIntentUrl(draft));

    expect(intent.origin + intent.pathname).toBe(
      "https://twitter.com/intent/tweet"
    );
    expect(intent.searchParams.get("text")).toBe(draft);
  });
});
