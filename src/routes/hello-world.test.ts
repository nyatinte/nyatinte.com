import { expect, test } from "vite-plus/test";

const targetUrl =
  import.meta.env.VITE_HELLO_WORLD_URL ?? "http://127.0.0.1:8787";

test("GET / returns the personal home page", async () => {
  const response = await fetch(new URL("/", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(body).toContain("Hello");
  expect(body).toContain("I'm nyatinte");
  expect(body).toContain("nyatinte.com");
  expect(body).toContain("ライト・ダークを切り替え");
  expect(body).toContain("親ペンギン");
  expect(body).toContain("子ペンギン");
  expect(body).toContain("/images/adult-penguin.png");
  expect(body).toContain("/images/chick-penguin.png");
  expect(body).toContain("@nyatinte");
  expect(body).toContain('href="/"');
  expect(body).toContain('href="https://github.com/nyatinte"');
  expect(body).toContain('href="https://x.com/nyatinte"');
  expect(body).toContain("実績");
});
