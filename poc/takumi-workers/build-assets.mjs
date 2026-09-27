import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const OUTPUT_RELATIVE_PATH = ".wrangler/ogp-build-assets";
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const MIN_PNG_BYTES = 1024;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SAMPLE_PATTERN = /^[a-z][a-z0-9-]{0,31}$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const CLOUDFLARE_CREDENTIALS = new Set([
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_KEY",
  "CLOUDFLARE_API_TOKEN",
]);
export const MAX_PNG_BYTES = 5 * 1024 * 1024;

export function createLocalWorkerEnv(source) {
  const env = Object.fromEntries(
    Object.entries(source).filter(([key]) => !CLOUDFLARE_CREDENTIALS.has(key))
  );
  env.CI = "1";
  return env;
}

function validateSlug(slug) {
  if (
    typeof slug !== "string" ||
    slug.length > 120 ||
    !SLUG_PATTERN.test(slug)
  ) {
    throw new TypeError("Invalid OGP slug");
  }
}

function validateRevision(revision) {
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new TypeError("Invalid OGP revision");
  }
}

function validateDate(occurredAt) {
  if (typeof occurredAt !== "string" || !DATE_PATTERN.test(occurredAt)) {
    throw new TypeError("Invalid OGP achievement date");
  }
  const date = new Date(`${occurredAt}T00:00:00.000Z`);
  if (
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== occurredAt
  ) {
    throw new TypeError("Invalid OGP achievement date");
  }
}

function validateRecordContent({ summary, tags, title }) {
  if (
    typeof title !== "string" ||
    title.length === 0 ||
    title.length > 120 ||
    typeof summary !== "string" ||
    summary.length === 0 ||
    summary.length > 200 ||
    !Array.isArray(tags) ||
    tags.some((tag) => typeof tag !== "string")
  ) {
    throw new TypeError("Invalid OGP achievement content");
  }
}

function validateRecord(record, samples, versions) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new TypeError("Invalid OGP snapshot record");
  }

  const { occurredAt, revision, sample, slug } = record;
  validateSlug(slug);
  validateRevision(revision);
  validateDate(occurredAt);
  validateRecordContent(record);

  if (
    typeof sample !== "string" ||
    !SAMPLE_PATTERN.test(sample) ||
    samples.has(sample)
  ) {
    throw new TypeError("Invalid or duplicate OGP sample");
  }

  const version = `${slug}/${revision}`;
  if (versions.has(version)) {
    throw new TypeError("Duplicate OGP slug and revision");
  }
  samples.add(sample);
  versions.add(version);
}

export function validateSnapshot(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.records) ||
    value.records.length === 0
  ) {
    throw new TypeError("Invalid OGP snapshot");
  }

  const samples = new Set();
  const versions = new Set();
  for (const record of value.records) {
    validateRecord(record, samples, versions);
  }
  return value.records;
}

export function assetPathFor({ revision, slug }) {
  validateSlug(slug);
  validateRevision(revision);
  return `og/${slug}/r${revision}.png`;
}

export function createManifest(snapshot) {
  const records = validateSnapshot(snapshot);
  return {
    images: records.map(({ revision, slug }) => ({
      path: `/${assetPathFor({ revision, slug })}`,
      revision,
      slug,
    })),
    version: 1,
  };
}

export function validatePng(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("Invalid OGP PNG bytes");
  }
  if (bytes.byteLength < MIN_PNG_BYTES || bytes.byteLength > MAX_PNG_BYTES) {
    throw new RangeError("Invalid OGP PNG size");
  }
  if (!PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) {
    throw new TypeError("Invalid PNG signature");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    view.getUint32(8) !== 13 ||
    String.fromCharCode(...bytes.subarray(12, 16)) !== "IHDR"
  ) {
    throw new TypeError("Invalid PNG IHDR");
  }

  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width !== 1200 || height !== 630) {
    throw new RangeError("Unexpected OGP PNG dimensions");
  }
  return { height, width };
}

export async function writeAssetsAtomically(snapshot, outputDir, renderImage) {
  const records = validateSnapshot(snapshot);
  const manifest = createManifest(snapshot);
  await mkdir(dirname(outputDir), { recursive: true });
  const stagingDir = await mkdtemp(join(dirname(outputDir), ".ogp-build-"));

  try {
    for (const record of records) {
      // biome-ignore lint/performance/noAwaitInLoops: one shared renderer handles one image at a time.
      const bytes = await renderImage(record);
      validatePng(bytes);
      const imageFile = join(stagingDir, assetPathFor(record));
      await mkdir(dirname(imageFile), { recursive: true });
      await writeFile(imageFile, bytes, { flag: "wx" });
    }

    await writeFile(
      join(stagingDir, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      {
        flag: "wx",
      }
    );
    await rm(outputDir, { force: true, recursive: true });
    await rename(stagingDir, outputDir);
  } finally {
    await rm(stagingDir, { force: true, recursive: true });
  }
}
