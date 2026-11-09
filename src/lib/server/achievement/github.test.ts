import { expect, test, vi } from "vite-plus/test";
import { createGitHubStore } from "./github";
import { type AchievementRecord, serializeRecord } from "./records";

const record: AchievementRecord = {
  bodyMarkdown: "日本語の本文",
  changeId: "01998f36-8980-7a64-bd0d-70bb30c7d903",
  coverImageUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
  id: "01998f36-8980-7a64-bd0d-70bb30c7d901",
  links: [],
  occurredAt: "2026-01-01",
  revision: 1,
  slug: "example",
  summary: "概要",
  tags: [],
  title: "記録",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("reads records and proposes changes on a new branch rather than main", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const request = vi.fn((input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ init: init ?? {}, url });
    if (url.endsWith("/graphql")) {
      return Promise.resolve(
        Response.json({
          data: {
            repository: {
              object: {
                entries: [
                  {
                    name: "example.md",
                    object: { isBinary: false, text: serializeRecord(record) },
                    oid: "blob-sha",
                    type: "blob",
                  },
                ],
              },
            },
          },
        })
      );
    }
    if (url.endsWith("/git/ref/heads/main")) {
      return Promise.resolve(Response.json({ object: { sha: "base-sha" } }));
    }
    if (url.endsWith("/git/refs") || url.includes("/contents/")) {
      return Promise.resolve(Response.json({}));
    }
    if (url.endsWith("/pulls")) {
      return Promise.resolve(
        Response.json({
          html_url: "https://github.com/nyatinte/nyatinte.com/pull/123",
        })
      );
    }
    throw new Error("unexpected request");
  }) as typeof fetch;
  const store = createGitHubStore("test-token", request);
  await expect(store.list()).resolves.toEqual([{ record, sha: "blob-sha" }]);
  await expect(
    store.propose(record, serializeRecord(record), "blob-sha")
  ).resolves.toBe("https://github.com/nyatinte/nyatinte.com/pull/123");
  const put = calls.find((call) => call.init.method === "PUT");
  const payload = JSON.parse(String(put?.init.body)) as {
    branch: string;
    content: string;
    sha: string;
  };
  expect(payload.branch.startsWith("achievement/")).toBe(true);
  expect(payload.sha).toBe("blob-sha");
  expect(
    new TextDecoder().decode(
      Uint8Array.from(atob(payload.content), (character) =>
        character.charCodeAt(0)
      )
    )
  ).toBe(serializeRecord(record));
  const pull = JSON.parse(String(calls.at(-1)?.init.body)) as {
    base: string;
    head: string;
  };
  expect(pull).toMatchObject({ base: "main", head: payload.branch });
});

test("history skips duplicate commits containing the current version", async () => {
  const prior = {
    ...record,
    changeId: "01998f36-8980-7a64-bd0d-70bb30c7d904",
    summary: "以前",
  };
  const currentCommit = "a".repeat(40);
  const duplicateCommit = "b".repeat(40);
  const priorCommit = "c".repeat(40);
  const request = vi.fn((input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/commits?")) {
      expect(url).toContain("sha=main");
      return Promise.resolve(
        Response.json([
          { sha: currentCommit },
          { sha: duplicateCommit },
          { sha: priorCommit },
        ])
      );
    }
    const content = url.includes(priorCommit)
      ? serializeRecord(prior)
      : serializeRecord(record);
    const encoded = btoa(
      Array.from(new TextEncoder().encode(content), (byte) =>
        String.fromCharCode(byte)
      ).join("")
    );
    return Promise.resolve(
      Response.json({ content: encoded, encoding: "base64" })
    );
  }) as typeof fetch;
  await expect(
    createGitHubStore("test-token", request).history(
      record.slug,
      record.changeId
    )
  ).resolves.toEqual([prior]);
});

test("does not continue after a GitHub failure", async () => {
  const request = vi.fn(() =>
    Promise.resolve(new Response(null, { status: 403 }))
  ) as typeof fetch;
  await expect(
    createGitHubStore("test-token", request).propose(record, "content")
  ).rejects.toMatchObject({ status: 403 });
  expect(request).toHaveBeenCalledTimes(1);
});
