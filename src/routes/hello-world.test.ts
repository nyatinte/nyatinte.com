import { expect, test } from "vite-plus/test";

const targetUrl = import.meta.env.VITE_HELLO_WORLD_URL ?? "http://127.0.0.1:8787";

test("GET / returns 200 and Hello World", async () => {
  const response = await fetch(new URL("/", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(body).toContain("Hello World");
});
