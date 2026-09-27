import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import achievementSnapshot from "./achievements.snapshot.json";
import {
  createLocalWorkerEnv,
  OUTPUT_RELATIVE_PATH,
  validatePng,
  writeAssetsAtomically,
} from "./build-assets.mjs";

const HOST = "127.0.0.1";
let PORT = 0;
let BASE_URL = "";
const READY_PATH = "/";
const READY_STATUS = 404;
const READY_BODY = "Takumi Workers PoC";
const POC_PATH = "/__poc/takumi";
const FIXTURE_NAMES = achievementSnapshot.records.map(({ sample }) => sample);
const CONFIG_FILE = "poc/takumi-workers/wrangler.jsonc";
const OUTPUT_DIR = ".wrangler/takumi-workers-poc";
const ROOT_DIR = fileURLToPath(new URL("../../", import.meta.url));
const IMAGE_OUTPUT_DIR = process.env.TAKUMI_POC_IMAGE_DIR;
const BUILD_ASSETS = process.env.TAKUMI_POC_BUILD_ASSETS === "1";
const ASSET_OUTPUT_DIR = join(ROOT_DIR, OUTPUT_RELATIVE_PATH);
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
    {
      cwd: ROOT_DIR,
      encoding: "utf8",
      env: createLocalWorkerEnv(process.env),
      stdio: "pipe",
    }
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
      env: createLocalWorkerEnv(process.env),
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

  if (BUILD_ASSETS) {
    test("renders the snapshot and atomically writes isolated OGP assets", async () => {
      await writeAssetsAtomically(
        achievementSnapshot,
        ASSET_OUTPUT_DIR,
        async (record: (typeof achievementSnapshot.records)[number]) => {
          const response = await fetch(
            `${BASE_URL}${POC_PATH}?sample=${record.sample}`
          );
          if (response.status !== 200) {
            throw new Error(`${await response.text()}\n${workerOutput}`);
          }

          const bytes = new Uint8Array(await response.arrayBuffer());
          expect(response.headers.get("content-type")).toBe("image/png");
          expect(validatePng(bytes)).toEqual({ height: 630, width: 1200 });
          return bytes;
        }
      );
    }, 120_000);
  } else {
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
        expect(validatePng(bytes)).toEqual({ height: 630, width: 1200 });
        if (IMAGE_OUTPUT_DIR) {
          await writeFile(
            join(IMAGE_OUTPUT_DIR, `takumi-${sample}.png`),
            bytes
          );
        }
      },
      30_000
    );
  }

  test("does not accept arbitrary sample text", async () => {
    const response = await fetch(
      `${BASE_URL}${POC_PATH}?sample=%3Cscript%3Ealert(1)%3C%2Fscript%3E`
    );
    expect(response.status).toBe(404);
  });
});
