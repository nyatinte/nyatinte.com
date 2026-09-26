export function uuidv7(timestamp = Date.now()): string {
  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp < 0 ||
    timestamp > 0xff_ff_ff_ff_ff_ff
  ) {
    throw new RangeError(
      "UUIDv7 timestamp must fit in an unsigned 48-bit integer"
    );
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const timestampHex = timestamp.toString(16).padStart(12, "0");

  for (let index = 0; index < 6; index += 1) {
    bytes[index] = Number.parseInt(
      timestampHex.slice(index * 2, index * 2 + 2),
      16
    );
  }
  bytes[6] = (bytes[6] % 16) + 0x70;
  bytes[8] = (bytes[8] % 64) + 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
