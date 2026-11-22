import { expect, test } from "vite-plus/test";
import { escapeXml } from "./xml";

test("escapes the five XML entities", () => {
  expect(escapeXml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &apos;");
});

test("keeps Japanese text and URLs unchanged", () => {
  const value = "わからなかったことを調べる https://nyatinte.com/log?a=1";
  expect(escapeXml(value)).toBe(value);
});
