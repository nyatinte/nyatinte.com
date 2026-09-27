import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import {
  assetPathFor,
  createLocalWorkerEnv,
  createManifest,
  OUTPUT_RELATIVE_PATH,
  validatePng,
  validateSnapshot,
  writeAssetsAtomically,
} from "./build-assets.mjs";

function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    occurredAt: "2026-09-27",
    revision: 1,
    sample: "short",
    slug: "reading-log",
    summary: "積読を一冊読み終え、記録を残した。",
    tags: ["読書", "記録"],
    title: "読書記録を公開した",
    ...overrides,
  };
}

function makeSnapshot(records: unknown[]) {
  return { records, schemaVersion: 1 };
}

function makePng({
  height = 630,
  size = 1024,
  width = 1200,
}: {
  height?: number;
  size?: number;
  width?: number;
} = {}) {
  const bytes = new Uint8Array(size);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([0, 0, 0, 13, 73, 72, 68, 82], 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

test("maps every slug and revision to a versioned static PNG", () => {
  const snapshot = makeSnapshot([
    makeRecord(),
    makeRecord({ revision: 2, sample: "long" }),
  ]);

  expect(createManifest(snapshot)).toEqual({
    images: [
      { path: "/og/reading-log/r1.png", revision: 1, slug: "reading-log" },
      { path: "/og/reading-log/r2.png", revision: 2, slug: "reading-log" },
    ],
    version: 1,
  });
  expect(assetPathFor({ revision: 2, slug: "reading-log" })).toBe(
    "og/reading-log/r2.png"
  );
});

test("removes Cloudflare credentials from local renderer processes", () => {
  expect(
    createLocalWorkerEnv({
      APP_ENV: "test",
      CLOUDFLARE_ACCOUNT_ID: "local-test-account",
      CLOUDFLARE_API_KEY: "local-test-key",
      CLOUDFLARE_API_TOKEN: "local-test-token",
    })
  ).toEqual({ APP_ENV: "test", CI: "1" });
});

test.each(["../private", "a/b", ".", "UPPER", "-leading", "trailing-"])(
  "rejects unsafe slug %s",
  (slug) => {
    expect(() =>
      validateSnapshot(makeSnapshot([makeRecord({ slug })]))
    ).toThrow("Invalid OGP slug");
  }
);

test("rejects duplicate slug and revision pairs and invalid revision values", () => {
  expect(() =>
    validateSnapshot(
      makeSnapshot([makeRecord(), makeRecord({ sample: "long" })])
    )
  ).toThrow("Duplicate OGP slug and revision");

  expect(() =>
    validateSnapshot(makeSnapshot([makeRecord({ revision: 0 })]))
  ).toThrow("Invalid OGP revision");
});

test("validates the PNG signature, header, dimensions, and size", () => {
  expect(validatePng(makePng())).toEqual({ height: 630, width: 1200 });
  expect(() => validatePng(new Uint8Array(1024))).toThrow(
    "Invalid PNG signature"
  );
  expect(() => validatePng(makePng({ width: 1199 }))).toThrow(
    "Unexpected OGP PNG dimensions"
  );
  expect(() => validatePng(makePng({ size: 1023 }))).toThrow(
    "Invalid OGP PNG size"
  );
  expect(() => validatePng(makePng({ size: 5 * 1024 * 1024 + 1 }))).toThrow(
    "Invalid OGP PNG size"
  );
});

test("keeps old assets intact when rendering fails before promotion", async () => {
  const temporaryParent = join(process.cwd(), ".wrangler");
  await mkdir(temporaryParent, { recursive: true });
  const testDirectory = await mkdtemp(join(temporaryParent, "ogp-build-test-"));
  const outputDir = join(testDirectory, "og");
  await mkdir(outputDir);
  await writeFile(join(outputDir, "manifest.json"), "previous manifest");

  try {
    const snapshot = makeSnapshot([
      makeRecord(),
      makeRecord({ sample: "long", slug: "long-entry" }),
    ]);
    let renderCount = 0;
    await expect(
      writeAssetsAtomically(snapshot, outputDir, () => {
        renderCount += 1;
        return renderCount === 1 ? makePng() : makePng({ width: 1199 });
      })
    ).rejects.toThrow("Unexpected OGP PNG dimensions");

    expect(await readFile(join(outputDir, "manifest.json"), "utf8")).toBe(
      "previous manifest"
    );
    expect(await readdir(outputDir)).toEqual(["manifest.json"]);
    expect(await readdir(testDirectory)).toEqual(["og"]);
  } finally {
    await rm(testDirectory, { force: true, recursive: true });
  }
});

test("writes each PNG to the URL recorded in the manifest", async () => {
  const temporaryParent = join(process.cwd(), ".wrangler");
  await mkdir(temporaryParent, { recursive: true });
  const testDirectory = await mkdtemp(join(temporaryParent, "ogp-map-test-"));
  const outputDir = join(testDirectory, "assets");

  try {
    const snapshot = makeSnapshot([
      makeRecord(),
      makeRecord({ sample: "long", slug: "long-entry" }),
    ]);
    await writeAssetsAtomically(snapshot, outputDir, makePng);

    const manifest: { images: { path: string }[] } = JSON.parse(
      await readFile(join(outputDir, "manifest.json"), "utf8")
    );
    expect(manifest.images).toHaveLength(snapshot.records.length);
    const dimensions = await Promise.all(
      manifest.images.map(async (image) =>
        validatePng(await readFile(join(outputDir, image.path.slice(1))))
      )
    );
    expect(dimensions).toEqual(
      Array.from({ length: snapshot.records.length }, () => ({
        height: 630,
        width: 1200,
      }))
    );
  } finally {
    await rm(testDirectory, { force: true, recursive: true });
  }
});

test("keeps the fixture generator outside the app build and deploy scripts", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8")
  );

  expect(OUTPUT_RELATIVE_PATH).toBe(".wrangler/ogp-build-assets");
  expect(packageJson.scripts.build).not.toContain("poc:takumi:build-assets");
  expect(packageJson.scripts.deploy).not.toContain("poc:takumi:build-assets");
  expect(packageJson.scripts["poc:takumi:build-assets"]).toBe(
    "TAKUMI_POC_BUILD_ASSETS=1 pnpm run poc:takumi:test"
  );
});
