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
])("有効な保存済みテーマだけを復元する: %s", (saved, expected) => {
  // Given: 保存されたテーマ値と期待する値
  expect(bootstrap).toBeDefined();
  const dataset: { homeTheme?: string } = {};
  // When: bootstrap script を実行する
  runInNewContext(bootstrap as string, {
    document: { documentElement: { dataset } },
    localStorage: { getItem: () => saved },
  });
  // Then: 有効なテーマだけが復元される
  expect(dataset.homeTheme).toBe(expected);
});

const rootRule = tokens.match(/:root\s*\{([^}]*)\}/u)?.[1];
const backgroundToken = /--home-background\s*:/u;

test("共通テーマトークンの場合にトークンは独立している", () => {
  // Given: 共通テーマトークン
  // When: ページごとの class が変わっても
  // Then
  expect(tokens).not.toContain(":has(");
  expect(rootRule).toMatch(backgroundToken);
});

test("保存済みのテーマ設定の場合に値を明示する", () => {
  // Given: 保存済みのテーマ設定
  // When: color scheme を宣言すると
  for (const [theme, scheme] of [
    ["light", "light"],
    ["dark", "dark"],
  ]) {
    const rule = tokens.match(
      new RegExp(`html\\[data-home-theme="${theme}"\\]\\s*\\{([^}]*)\\}`, "u")
    )?.[1];
    // Then
    expect(rule).toMatch(new RegExp(`color-scheme:\\s*${scheme};`, "u"));
  }
});

test("full と Latin のフォント subsetの場合に範囲は重複しない", () => {
  // Given: full と Latin のフォント subset
  // When: unicode range を定義すると
  // Then
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
])("Storage API の種類にかかわらず初期化を続ける: %s", (_name, storage) => {
  // Given: localStorage が利用できない
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
  // When: localStorage を使えない状態で bootstrap script を実行する
  // Then: 初期化処理は例外を投げない
  expect(() => runInNewContext(bootstrap as string, context)).not.toThrow();
});
