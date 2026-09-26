import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const assets = join(root, ".wrangler/ogp-static-assets");
const samples = ["short", "long", "brackets", "fallback"];
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
await mkdir(join(root, ".wrangler"), { recursive: true });
const temporary = await mkdtemp(join(root, ".wrangler/ogp-static-"));

try {
  // The existing integration test renders with local workerd and verifies each PNG.
  // No Cloudflare account, D1 binding, or production Worker is involved.
  execFileSync("pnpm", ["run", "poc:takumi:test"], {
    cwd: root,
    env: { ...process.env, TAKUMI_POC_IMAGE_DIR: temporary },
    stdio: "inherit",
  });

  const generated = await Promise.all(
    samples.map(async (sample) => {
      const source = join(temporary, `takumi-${sample}.png`);
      const bytes = await readFile(source);
      if (
        bytes.length < 1024 ||
        !bytes.subarray(0, 8).equals(signature) ||
        bytes.readUInt32BE(16) !== 1200 ||
        bytes.readUInt32BE(20) !== 630
      ) {
        throw new Error(`Invalid PNG: ${sample}`);
      }
      const hash = createHash("sha256").update(bytes).digest("hex");
      return { bytes, path: `/og/${sample}-${hash}.png`, sample, source };
    })
  );

  await mkdir(join(assets, "og"), { recursive: true });
  await Promise.all(
    generated.map(async (image) => {
      const destination = join(assets, image.path.slice(1));
      try {
        await copyFile(image.source, destination, constants.COPYFILE_EXCL);
      } catch (error) {
        if (error?.code !== "EEXIST") {
          throw error;
        }
        if (!(await readFile(destination)).equals(image.bytes)) {
          throw new Error(`Hash collision or modified asset: ${image.path}`, {
            cause: error,
          });
        }
      }
    })
  );

  const manifest = Object.fromEntries(
    generated.map(({ sample, path }) => [sample, path])
  );
  await writeFile(
    join(assets, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  console.log(`Generated ${generated.length} content-addressed PNG assets.`);
  console.log(manifest);
} finally {
  // The temporary directory is owned by this invocation, never by the repository.
  await rm(temporary, { force: true, recursive: true });
}
