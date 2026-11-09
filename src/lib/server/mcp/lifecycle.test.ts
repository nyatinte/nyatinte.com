import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { expect, test, vi } from "vite-plus/test";
import { type AchievementRecord, parseRecord } from "../achievement/records";
import { createAchievementRepository } from "../achievement/repository";
import { createAchievementMcpHandler } from "./server";

test("MCP reads merged records and proposes update, deletion and restoration", async () => {
  let current: AchievementRecord | undefined;
  let proposal: AchievementRecord | undefined;
  let prior: AchievementRecord | undefined;
  const store = {
    history: vi.fn(() => Promise.resolve(prior ? [prior] : [])),
    list: vi.fn(() =>
      Promise.resolve(current ? [{ record: current, sha: "main-sha" }] : [])
    ),
    propose: vi.fn((_record: AchievementRecord, content: string) => {
      proposal = parseRecord(content);
      return Promise.resolve(
        "https://github.com/nyatinte/nyatinte.com/pull/123"
      );
    }),
  };
  function merge() {
    prior = current;
    current = proposal;
    proposal = undefined;
  }
  const handler = createAchievementMcpHandler(
    createAchievementRepository({ store })
  );
  const transport = new StreamableHTTPClientTransport(
    new URL("https://nyatinte.com/mcp"),
    {
      fetch: (url, init) =>
        handler.fetch(new Request(url, init), {
          authInfo: { clientId: "test", scopes: [], token: "test" },
        }),
    }
  );
  const client = new Client(
    { name: "test", version: "1.0.0" },
    { versionNegotiation: { mode: "auto" } }
  );
  try {
    await client.connect(transport);
    const call = (name: string, args: Record<string, unknown>) =>
      client.callTool({ arguments: args, name });
    const created = await call("create_achievement", {
      slug: "example",
      summary: "概要",
      title: "記録",
    });
    expect(created.isError).not.toBe(true);
    const id = (created.structuredContent as { id?: unknown } | undefined)?.id;
    expect(typeof id).toBe("string");
    expect(
      (await call("list_achievements", {})).structuredContent
    ).toMatchObject({ items: [] });
    merge();
    expect(
      (await call("get_achievement", { slug: "example" })).structuredContent
    ).toMatchObject({ id, revision: 1, summary: "概要" });
    expect(
      (await call("list_achievements", {})).structuredContent
    ).toMatchObject({ items: [{ id }] });
    const updated = await call("update_achievement", {
      expected_revision: 1,
      id,
      summary: "変更",
    });
    expect(updated.structuredContent).toMatchObject({
      id,
      pull_request_url: expect.stringContaining("/pull/"),
      revision: 2,
    });
    expect(
      (await call("get_achievement", { id })).structuredContent
    ).toMatchObject({ revision: 1, summary: "概要" });
    merge();
    expect(
      (
        await call("update_achievement", {
          expected_revision: 1,
          id,
          summary: "競合",
        })
      ).structuredContent
    ).toMatchObject({ error: { code: "revision_conflict" } });
    expect(
      (await call("delete_achievement", { expected_revision: 2, id }))
        .structuredContent
    ).toMatchObject({ revision: 3 });
    merge();
    expect(
      (await call("list_achievements", {})).structuredContent
    ).toMatchObject({ items: [] });
    expect(
      (await call("get_achievement", { id })).structuredContent
    ).toMatchObject({ deleted_at: expect.any(String), revision: 3 });
    expect(
      (await call("restore_achievement", { id })).structuredContent
    ).toMatchObject({ revision: 4 });
    merge();
    expect(
      (await call("get_achievement", { id })).structuredContent
    ).toMatchObject({ deleted_at: null, revision: 4, summary: "変更" });
  } finally {
    await client.close();
    await handler.close();
  }
});
