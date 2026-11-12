import { expect, test } from "vite-plus/test";
import { resolveArticleImage } from "./og-image";

const shared = "https://nyatinte.com/og.png";

test("uses the shared image when an article has no image", () => {
  expect(resolveArticleImage({ sharedUrl: shared })).toMatchObject({
    height: "630",
    type: "image/png",
    url: shared,
    width: "1200",
  });
});

test("uses a root-relative frontmatter image as an absolute URL", () => {
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
