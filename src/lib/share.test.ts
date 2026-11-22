import { expect, test } from "vite-plus/test";
import { xShareText, xShareUrl } from "./share";

test("X シェアのテキストに記事タイトルとサイト名を入れる", () => {
  expect(xShareText("Svelte 5 の runes")).toBe(
    "Svelte 5 の runes | nyatinte.com"
  );
});

test("X シェア URL にタイトルと記事の URL をエンコードして載せる", () => {
  const href = xShareUrl({
    title: "A & B #1",
    url: "https://nyatinte.com/log/a-and-b",
  });
  const shareUrl = new URL(href);

  expect(`${shareUrl.origin}${shareUrl.pathname}`).toBe(
    "https://x.com/intent/post"
  );
  expect(shareUrl.searchParams.get("text")).toBe("A & B #1 | nyatinte.com");
  expect(shareUrl.searchParams.get("url")).toBe(
    "https://nyatinte.com/log/a-and-b"
  );
  expect(href).toContain("%26");
  expect(href).not.toContain(" ");
});
