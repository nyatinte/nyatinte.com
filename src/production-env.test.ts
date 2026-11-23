import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, test } from "vite-plus/test";

type AccessConfig = {
  ACCESS_AUDIENCE: string;
  ACCESS_TEAM_DOMAIN: string;
};

test("production deployment requires Access configuration", () => {
  const cwd = mkdtempSync(join(tmpdir(), "dotcom-env-"));
  copyFileSync(resolve(".env.schema"), join(cwd, ".env.schema"));
  const executable = resolve("node_modules/.bin/varlock");
  const env = {
    APP_ENV: "production",
    HOME: process.env.HOME,
    PATH: process.env.PATH,
  };
  const load = (additional: Partial<AccessConfig>) =>
    execFileSync(executable, ["load", "--agent"], {
      cwd,
      env: { ...env, ...additional },
      stdio: "pipe",
    });
  try {
    expect(() => load({})).toThrow();
    const complete: AccessConfig = {
      ACCESS_AUDIENCE: "example",
      ACCESS_TEAM_DOMAIN: "https://example.cloudflareaccess.com",
    };
    for (const key of Object.keys(complete) as Array<keyof AccessConfig>) {
      const partial: Partial<AccessConfig> = { ...complete };
      delete partial[key];
      expect(() => load(partial)).toThrow();
    }
    expect(() => load(complete)).not.toThrow();
  } finally {
    rmSync(cwd, { force: true, recursive: true });
  }
});
