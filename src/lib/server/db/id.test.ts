import { expect, test } from "vite-plus/test";
import { uuidv7 } from "./id";

const UUIDV7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test("encodes the supplied millisecond timestamp and UUIDv7 variant", () => {
  const timestamp = 1_758_000_123_456;
  const id = uuidv7(timestamp);
  const hex = id.replaceAll("-", "");

  expect(id).toMatch(UUIDV7_PATTERN);
  expect(Number.parseInt(hex.slice(0, 12), 16)).toBe(timestamp);
});

test("creates distinct IDs for the same millisecond", () => {
  expect(uuidv7(1_758_000_123_456)).not.toBe(uuidv7(1_758_000_123_456));
});
