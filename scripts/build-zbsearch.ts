import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildZbSearchIndex } from "../src/lib/search/zb-build";

const output = ".svelte-kit/cloudflare/zbsearch/index.zbsb";

function main() {
  const startedAt = performance.now();
  rmSync(dirname(output), { force: true, recursive: true });
  mkdirSync(dirname(output), { recursive: true });
  const indexStart = performance.now();
  const { bytes, recordCount } = buildZbSearchIndex("src/content/log");
  const extractAndIndexMs = performance.now() - indexStart;
  writeFileSync(output, bytes);
  if (process.env.SEARCH_BUILD_TIMING === "1") {
    console.log(
      JSON.stringify({
        byteLength: bytes.byteLength,
        extractAndIndexMs: Math.round(extractAndIndexMs),
        recordCount,
        totalMs: Math.round(performance.now() - startedAt),
      })
    );
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
