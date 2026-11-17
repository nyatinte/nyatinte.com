import { expect, test } from "vite-plus/test";
import { resolveArticleImage } from "./og-image";

const shared = "https://nyatinte.com/og.png";

test("Given 記事に画像がないとき、When OGP 画像を解決すると、Then 共通画像を使う", () => {
  expect(resolveArticleImage({ sharedUrl: shared })).toMatchObject({
    height: "630",
    type: "image/png",
    url: shared,
    width: "1200",
  });
});

test("Given frontmatter にルート相対画像があるとき、When OGP 画像を解決すると、Then 絶対 URL にする", () => {
  expect(
    resolveArticleImage({
      image: "/images/generated.png",
      sharedUrl: shared,
      title: "題",
    })
  ).toEqual({
    alt: "題",
    url: "https://nyatinte.com/images/generated.png",
  });
});
