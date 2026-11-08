import { type AchievementRecord, parseRecord } from "./records";

const commitPattern = /^[a-f0-9]{40}$/u;
const owner = "nyatinte";
const repo = "nyatinte.com";
const directory = "src/lib/achievements";
const api = `https://api.github.com/repos/${owner}/${repo}`;

export function createGitHubStore(
  token: string,
  request: typeof fetch = fetch
) {
  async function call(url: string, init: RequestInit = {}): Promise<unknown> {
    const response = await request(url, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "nyatinte-com",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) {
      throw Object.assign(
        new Error(`GitHub request failed with status ${response.status}`),
        { status: response.status }
      );
    }
    return response.json();
  }

  async function list(): Promise<{ record: AchievementRecord; sha: string }[]> {
    const result = (await call("https://api.github.com/graphql", {
      body: JSON.stringify({
        query: `query($owner: String!, $repo: String!, $path: String!) {
          repository(owner: $owner, name: $repo) {
            object(expression: $path) { ... on Tree { entries { name type oid object { ... on Blob { text isBinary } } } } }
          }
        }`,
        variables: { owner, path: `main:${directory}`, repo },
      }),
      method: "POST",
    })) as {
      data?: {
        repository?: {
          object?: {
            entries?: {
              name: string;
              type: string;
              oid: string;
              object?: { text?: string | null; isBinary?: boolean };
            }[];
          } | null;
        };
      };
      errors?: unknown[];
    };
    if (
      result.errors?.length ||
      !result.data?.repository ||
      result.data.repository.object === undefined
    ) {
      throw new Error("GitHub returned an invalid achievement tree");
    }
    const tree = result.data.repository.object;
    if (tree !== null && !Array.isArray(tree.entries)) {
      throw new Error("GitHub returned an invalid achievement tree");
    }
    const entries = tree?.entries ?? [];
    return entries
      .filter((entry) => entry.type === "blob" && entry.name.endsWith(".md"))
      .map((entry) => {
        if (
          !entry.oid ||
          entry.object?.isBinary ||
          typeof entry.object?.text !== "string"
        ) {
          throw new Error("GitHub returned an invalid achievement document");
        }
        const record = parseRecord(entry.object.text);
        if (entry.name !== `${record.slug}.md`) {
          throw new Error("Achievement filename does not match its slug");
        }
        return { record, sha: entry.oid };
      });
  }

  async function propose(
    record: AchievementRecord,
    content: string,
    sha?: string
  ) {
    const base = (await call(`${api}/git/ref/heads/main`)) as {
      object?: { sha?: string };
    };
    if (!base.object?.sha) {
      throw new Error("GitHub returned an invalid base revision");
    }
    const branch = `achievement/${crypto.randomUUID()}`;
    await call(`${api}/git/refs`, {
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: base.object.sha,
      }),
      method: "POST",
    });
    const encoded = btoa(
      Array.from(new TextEncoder().encode(content), (byte) =>
        String.fromCharCode(byte)
      ).join("")
    );
    await call(
      `${api}/contents/${directory}/${encodeURIComponent(record.slug)}.md`,
      {
        body: JSON.stringify({
          branch,
          content: encoded,
          message: `content: ${record.title}`,
          ...(sha ? { sha } : {}),
        }),
        method: "PUT",
      }
    );
    const pr = (await call(`${api}/pulls`, {
      body: JSON.stringify({
        base: "main",
        body: "実績データの更新です。マージ後、手動デプロイで公開します。",
        head: branch,
        title: `content: ${record.title}`,
      }),
      method: "POST",
    })) as { html_url?: string };
    if (!pr.html_url?.startsWith(`https://github.com/${owner}/${repo}/pull/`)) {
      throw new Error("GitHub returned an invalid pull request URL");
    }
    return pr.html_url;
  }

  async function history(
    slug: string,
    currentChangeId: string
  ): Promise<AchievementRecord[]> {
    const path = `${directory}/${slug}.md`;
    const commits = await call(
      `${api}/commits?${new URLSearchParams({ path, per_page: "100", sha: "main" })}`
    );
    if (!Array.isArray(commits)) {
      throw new Error("GitHub returned invalid history");
    }
    for (const commit of commits) {
      if (typeof commit?.sha !== "string" || !commitPattern.test(commit.sha)) {
        throw new Error("GitHub returned an invalid commit");
      }
      // biome-ignore lint/performance/noAwaitInLoops: Stop after the first restorable revision.
      const file = (await call(
        `${api}/contents/${directory}/${encodeURIComponent(slug)}.md?ref=${commit.sha}`
      )) as { content?: string; encoding?: string };
      if (file.encoding !== "base64" || typeof file.content !== "string") {
        throw new Error("GitHub returned invalid historical content");
      }
      const bytes = Uint8Array.from(
        atob(file.content.replace(/\s/gu, "")),
        (character) => character.charCodeAt(0)
      );
      const record = parseRecord(new TextDecoder().decode(bytes));
      if (record.slug !== slug) {
        throw new Error("Historical achievement slug does not match");
      }
      if (record.changeId !== currentChangeId && !record.deletedAt) {
        return [record];
      }
    }
    return [];
  }

  return { history, list, propose };
}
