import { describe, expect, it } from "vite-plus/test";
import {
  BOOST_COMPRESSION_PX,
  CHARGED_COMPRESSION_PX,
  CHARGE_FULL_MS,
  GROUND_CONTACT_BASE_MS,
  GROUND_CONTACT_MAX_MS,
  JUMP_PRE_LANDING_BUFFER_MS,
  UNCHARGED_COMPRESSION_PX,
} from "./constants";
import {
  computeChargeLevel,
  computeCompressionPx,
  computeContactChargeMs,
  computeContactDurationMs,
} from "./charge";

describe("computeContactDurationMs", () => {
  it("uses the base window when the impact speed is zero", () => {
    expect(computeContactDurationMs(0)).toBe(GROUND_CONTACT_BASE_MS);
  });

  it("extends the window for a deeper fall", () => {
    expect(computeContactDurationMs(800)).toBeGreaterThan(
      computeContactDurationMs(200),
    );
    expect(computeContactDurationMs(100_000)).toBe(GROUND_CONTACT_MAX_MS);
  });
});

describe("computeContactChargeMs", () => {
  const contactStart = 1000;

  it("credits a press that started before contact and is still held", () => {
    expect(
      computeContactChargeMs(
        {
          held: true,
          pressStartedAtMs: contactStart - 60,
          releasedAtMs: null,
        },
        contactStart,
      ),
    ).toBe(60);
  });

  it("keeps a press released inside the pre-landing buffer", () => {
    expect(
      computeContactChargeMs(
        {
          held: false,
          pressStartedAtMs: contactStart - 100,
          releasedAtMs: contactStart - 40,
        },
        contactStart,
      ),
    ).toBe(60);
  });

  it("ignores a press released before the buffer window", () => {
    expect(
      computeContactChargeMs(
        {
          held: false,
          pressStartedAtMs: contactStart - 400,
          releasedAtMs: contactStart - JUMP_PRE_LANDING_BUFFER_MS - 1,
        },
        contactStart,
      ),
    ).toBe(0);
  });

  it("returns nothing when the jump was never pressed", () => {
    expect(
      computeContactChargeMs(
        { held: false, pressStartedAtMs: null, releasedAtMs: null },
        contactStart,
      ),
    ).toBe(0);
  });
});

describe("charge level", () => {
  it("fills over CHARGE_FULL_MS and clamps", () => {
    expect(computeChargeLevel(0)).toBe(0);
    expect(computeChargeLevel(CHARGE_FULL_MS / 2)).toBeCloseTo(0.5, 9);
    expect(computeChargeLevel(CHARGE_FULL_MS * 2)).toBe(1);
    expect(computeChargeLevel(-10)).toBe(0);
  });

  it("moves the compression from the auto-bounce to the charged target", () => {
    expect(computeCompressionPx(0, false)).toBe(UNCHARGED_COMPRESSION_PX);
    expect(computeCompressionPx(1, false)).toBe(CHARGED_COMPRESSION_PX);
    expect(computeCompressionPx(0.5, false)).toBeCloseTo(
      (UNCHARGED_COMPRESSION_PX + CHARGED_COMPRESSION_PX) / 2,
      9,
    );
    expect(computeCompressionPx(0, true)).toBe(BOOST_COMPRESSION_PX);
  });
});
