import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";

const root = fileURLToPath(new URL("../../", import.meta.url));
const assets = join(root, ".wrangler/ogp-static-assets");
let worker: ChildProcess | undefined;
let output = "";
let baseUrl = "";
let manifest: Record<string, string>;

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("No available port");
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return address.port;
}

describe("prebuilt OGP assets", () => {
  beforeAll(async () => {
    execFileSync("pnpm", ["run", "poc:ogp-static:generate"], {
      cwd: root,
      stdio: "pipe",
    });
    manifest = JSON.parse(
      await readFile(join(assets, "manifest.json"), "utf8")
    );
    baseUrl = `http://127.0.0.1:${await availablePort()}`;
    worker = spawn(
      "pnpm",
      [
        "exec",
        "wrangler",
        "dev",
        "--config",
        "poc/ogp-static/wrangler.jsonc",
        "--local",
        "--ip",
        "127.0.0.1",
        "--port",
        new URL(baseUrl).port,
      ],
      {
        cwd: root,
        env: { ...process.env, CI: "1" },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    const capture = (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-4000);
    };
    worker.stdout?.on("data", capture);
    worker.stderr?.on("data", capture);

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (worker.exitCode !== null) {
        throw new Error(`Static Worker exited.\n${output}`);
      }
      try {
        // biome-ignore lint/performance/noAwaitInLoops: readiness polling is sequential.
        const response = await fetch(`${baseUrl}/manifest.json`, {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          return;
        }
      } catch {
        // Wait for the local server to start.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Static Worker did not start.\n${output}`);
  }, 120_000);

  afterAll(async () => {
    if (worker?.exitCode === null) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 3000);
        worker?.once("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
        worker?.kill("SIGTERM");
      });
    }
  });

  test.each(["short", "long", "brackets", "fallback"])(
    "serves %s without a rendering Worker",
    async (sample) => {
      const path = manifest[sample];
      expect(path).toMatch(new RegExp(`^/og/${sample}-[a-f0-9]{64}\\.png$`));
      const response = await fetch(`${baseUrl}${path}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
      const bytes = Buffer.from(await response.arrayBuffer());
      expect(bytes).toEqual(await readFile(join(assets, path.slice(1))));
      expect(path).toContain(createHash("sha256").update(bytes).digest("hex"));
    },
    30_000
  );

  test("does not render unknown or arbitrary text", async () => {
    expect((await fetch(`${baseUrl}/__poc/takumi?sample=short`)).status).toBe(
      404
    );
    expect((await fetch(`${baseUrl}/og/unknown.png`)).status).toBe(404);
  });

  test("cannot deploy on a public route from the checked-in config", async () => {
    const config = JSON.parse(
      await readFile(join(root, "poc/ogp-static/wrangler.jsonc"), "utf8")
    );
    expect(config.name).toBe("nyatinte-ogp-static-poc");
    expect(config.workers_dev).toBe(false);
    expect(config.preview_urls).toBe(false);
    expect(config.main).toBeUndefined();
    expect(config.routes).toBeUndefined();
    expect(config.d1_databases).toBeUndefined();
  });
});
