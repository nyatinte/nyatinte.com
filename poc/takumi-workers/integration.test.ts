import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";

const HOST = "127.0.0.1";
let PORT = 0;
let BASE_URL = "";
const READY_PATH = "/";
const READY_STATUS = 404;
const READY_BODY = "Takumi Workers PoC";
const POC_PATH = "/__poc/takumi";
const FIXTURE_NAMES = ["short", "long", "brackets", "fallback"] as const;
const CONFIG_FILE = "poc/takumi-workers/wrangler.jsonc";
const OUTPUT_DIR = ".wrangler/takumi-workers-poc";
const ROOT_DIR = fileURLToPath(new URL("../../", import.meta.url));
const IMAGE_OUTPUT_DIR = process.env.TAKUMI_POC_IMAGE_DIR;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const MIN_IMAGE_BYTES = 1024;

let workerProcess: ChildProcess | undefined;
let workerOutput = "";

async function getAvailablePort() {
  const server = createServer();

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, HOST, resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    throw new Error("Could not determine an available local port");
  }

  const { port } = address;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

function buildWorker() {
  execFileSync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "deploy",
      "--config",
      CONFIG_FILE,
      "--dry-run",
      "--outdir",
      OUTPUT_DIR,
    ],
    { cwd: ROOT_DIR, encoding: "utf8", stdio: "pipe" }
  );
}

function startWorker() {
  workerProcess = spawn(
    "pnpm",
    [
      "exec",
      "wrangler",
      "dev",
      "--config",
      CONFIG_FILE,
      "--local",
      "--ip",
      HOST,
      "--port",
      String(PORT),
    ],
    {
      cwd: ROOT_DIR,
      env: { ...process.env, CI: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  const capture = (chunk: Buffer) => {
    workerOutput = `${workerOutput}${chunk.toString()}`.slice(-4000);
  };
  workerProcess.stdout?.on("data", capture);
  workerProcess.stderr?.on("data", capture);
}

async function stopWorker() {
  if (!workerProcess || workerProcess.exitCode !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 3000);
    workerProcess?.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    workerProcess?.kill("SIGTERM");
  });
}

async function waitForWorker() {
  const deadline = Date.now() + 60_000;
  let lastError = "Worker did not respond";

  while (Date.now() < deadline) {
    if (workerProcess?.exitCode !== null) {
      throw new Error(`Worker exited before becoming ready.\n${workerOutput}`);
    }

    try {
      // biome-ignore lint/performance/noAwaitInLoops: readiness polling must remain sequential.
      const response = await fetch(`${BASE_URL}${READY_PATH}`, {
        signal: AbortSignal.timeout(5000),
      });
      const body = await response.text();
      if (response.status === READY_STATUS && body === READY_BODY) {
        return;
      }
      lastError = `Unexpected readiness response: ${response.status} ${JSON.stringify(body)}`;
    } catch (error) {
      lastError = String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`${lastError}\n${workerOutput}`);
}

function assertPng(bytes: Uint8Array) {
  expect(Array.from(bytes.subarray(0, PNG_SIGNATURE.length))).toEqual(
    PNG_SIGNATURE
  );
  expect(bytes.byteLength).toBeGreaterThan(MIN_IMAGE_BYTES);

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(view.getUint32(8)).toBe(13);
  expect(view.getUint32(16)).toBe(1200);
  expect(view.getUint32(20)).toBe(630);
}

describe("Takumi Workers PoC", () => {
  beforeAll(async () => {
    buildWorker();
    if (IMAGE_OUTPUT_DIR) {
      await mkdir(IMAGE_OUTPUT_DIR, { recursive: true });
    }
    PORT = await getAvailablePort();
    BASE_URL = `http://${HOST}:${PORT}`;
    startWorker();
    await waitForWorker();
  }, 90_000);

  afterAll(async () => {
    await stopWorker();
  }, 10_000);

  test.each(FIXTURE_NAMES)(
    "serves the %s 1200x630 PNG",
    async (sample) => {
      const response = await fetch(`${BASE_URL}${POC_PATH}?sample=${sample}`);
      if (response.status !== 200) {
        throw new Error(`${await response.text()}\n${workerOutput}`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/png");
      assertPng(bytes);
      if (IMAGE_OUTPUT_DIR) {
        await writeFile(join(IMAGE_OUTPUT_DIR, `takumi-${sample}.png`), bytes);
      }
    },
    30_000
  );

  test("does not accept arbitrary sample text", async () => {
    const response = await fetch(
      `${BASE_URL}${POC_PATH}?sample=%3Cscript%3Ealert(1)%3C%2Fscript%3E`
    );
    expect(response.status).toBe(404);
  });
});
