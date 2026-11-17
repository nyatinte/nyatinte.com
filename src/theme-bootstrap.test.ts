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

const rootRule = tokens.match(/:root\s*\{([^}]*)\}/u)?.[1];
const backgroundToken = /--home-background\s*:/u;

test("Given 共通テーマトークン、When ページごとの class が変わっても、Then トークンは独立している", () => {
  expect(tokens).not.toContain(":has(");
  expect(rootRule).toMatch(backgroundToken);
});

test("Given 保存済みのテーマ設定、When color scheme を宣言すると、Then 値を明示する", () => {
  for (const [theme, scheme] of [
    ["light", "light"],
    ["dark", "dark"],
  ]) {
    const rule = tokens.match(
      new RegExp(`html\\[data-home-theme="${theme}"\\]\\s*\\{([^}]*)\\}`, "u")
    )?.[1];
    expect(rule).toMatch(new RegExp(`color-scheme:\\s*${scheme};`, "u"));
  }
});

test("Given full と Latin のフォント subset、When unicode range を定義すると、Then 範囲は重複しない", () => {
  expect(layout.match(/unicode-range:\s*U\+0100-10FFFF;/gu)).toHaveLength(2);
  expect(
    layout.match(/font-display:\s*optional;\s*unicode-range:\s*U\+0000-00FF;/gu)
  ).toHaveLength(2);
});

test.each([
  [
    "getItem",
    {
      getItem: () => {
        throw new Error("Storage blocked");
      },
    },
  ],
  ["the storage getter", undefined],
])("renders normally when %s is unavailable", (_name, storage) => {
  expect(bootstrap).toBeDefined();
  const context = { document: { documentElement: { dataset: {} } } };
  if (storage) {
    Object.assign(context, { localStorage: storage });
  } else {
    Object.defineProperty(context, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
  }
  expect(() => runInNewContext(bootstrap as string, context)).not.toThrow();
});
