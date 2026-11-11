import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, test } from "vite-plus/test";

const html = readFileSync(new URL("./app.html", import.meta.url), "utf8");
const bootstrap = html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/u)?.[1];
const layout = readFileSync(
  new URL("./routes/+layout.svelte", import.meta.url),
  "utf8"
);
const tokens = readFileSync(
  new URL("./lib/styles/home-tokens.css", import.meta.url),
  "utf8"
);

test.each([
  ["light", "light"],
  ["dark", "dark"],
  ["invalid", undefined],
  [null, undefined],
])("restores only valid saved themes: %s", (saved, expected) => {
  expect(bootstrap).toBeDefined();
  const dataset: { homeTheme?: string } = {};
  runInNewContext(bootstrap as string, {
    document: { documentElement: { dataset } },
    localStorage: { getItem: () => saved },
  });
  expect(dataset.homeTheme).toBe(expected);
});

test("declares explicit color schemes for stored preferences", () => {
  expect(tokens).toContain(
    'html[data-home-theme="light"]:has(.home) {\n  color-scheme: light;'
  );
  expect(tokens).toContain(
    'html[data-home-theme="dark"]:has(.home) {\n  color-scheme: dark;'
  );
});

test("keeps the full and Latin font subsets from overlapping", () => {
  expect(layout.match(/unicode-range:\s*U\+0100-10FFFF;/gu)).toHaveLength(2);
  expect(
    layout.match(/font-display:\s*optional;\s*unicode-range:\s*U\+0000-00FF;/gu)
  ).toHaveLength(2);
});

test("renders normally when storage is unavailable", () => {
  expect(bootstrap).toBeDefined();
  expect(() =>
    runInNewContext(bootstrap as string, {
      document: { documentElement: { dataset: {} } },
      localStorage: {
        getItem: () => {
          throw new Error("Storage blocked");
        },
      },
    })
  ).not.toThrow();
});
