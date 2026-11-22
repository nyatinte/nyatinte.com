import { expect, test } from "vite-plus/test";
import { type ClipboardWriter, copyFeedback, copyText } from "./clipboard";

test("クリップボードへ書き込めたら成功を知らせる", async () => {
  const written: string[] = [];
  const message = await copyText("https://nyatinte.com/log/a", (text) => {
    written.push(text);
    return Promise.resolve();
  });

  expect(written).toEqual(["https://nyatinte.com/log/a"]);
  expect(message).toBe(copyFeedback.success);
});

test("書き込みが拒否されたら失敗を知らせる", async () => {
  const write: ClipboardWriter = () =>
    Promise.reject(new Error("permission denied"));

  await expect(copyText("https://nyatinte.com/log/a", write)).resolves.toBe(
    copyFeedback.failure
  );
});

test("クリップボードが使えない環境でも失敗を知らせる", async () => {
  const write: ClipboardWriter = () => {
    throw new Error("clipboard is unavailable");
  };

  await expect(copyText("https://nyatinte.com/log/a", write)).resolves.toBe(
    copyFeedback.failure
  );
});
