import { describe, expect, it } from "vite-plus/test";
import {
  AUTO_BOUNCE_SPEED,
  BOOST_BOUNCE_MULTIPLIER,
  CHARGED_BOUNCE_SPEED,
  MAX_BOUNCE_SPEED,
  OUCH_BOUNCE_SCALE,
  TIP_ALIGN_MAX_ANGLE_DEG,
} from "./constants";
import {
  classifyLanding,
  computeBounce,
  computeContactDurationMs,
} from "./impulse";

describe("classifyLanding", () => {
  it("classifies body contact as ouch regardless of angle", () => {
    expect(classifyLanding("body", 0)).toBe("ouch");
    expect(classifyLanding("body", 15)).toBe("ouch");
  });

  it("classifies tip contact within alignment threshold as clean", () => {
    expect(classifyLanding("tip", 0)).toBe("clean");
    expect(classifyLanding("tip", TIP_ALIGN_MAX_ANGLE_DEG)).toBe("clean");
    expect(classifyLanding("tip", -TIP_ALIGN_MAX_ANGLE_DEG)).toBe("clean");
  });

  it("classifies tip contact beyond alignment threshold as glancing", () => {
    expect(classifyLanding("tip", TIP_ALIGN_MAX_ANGLE_DEG + 0.1)).toBe(
      "glancing",
    );
    expect(classifyLanding("tip", -TIP_ALIGN_MAX_ANGLE_DEG - 10)).toBe(
      "glancing",
    );
  });
});

describe("computeBounce", () => {
  it("auto-bounces on clean tip landing without jump held", () => {
    const result = computeBounce({
      alignmentAngleDeg: 0,
      boostReady: false,
      contactPart: "tip",
      impactSpeed: 0,
      jumpHeld: false,
    });
    expect(result.outcome).toBe("clean");
    expect(result.bounceSpeed).toBe(AUTO_BOUNCE_SPEED);
    expect(result.usedBoost).toBe(false);
  });

  it("bounces higher when jump is held and highest when boosted", () => {
    const auto = computeBounce({
      alignmentAngleDeg: 5,
      boostReady: false,
      contactPart: "tip",
      impactSpeed: 10,
      jumpHeld: false,
    });
    const charged = computeBounce({
      alignmentAngleDeg: 5,
      boostReady: false,
      contactPart: "tip",
      impactSpeed: 10,
      jumpHeld: true,
    });
    const boosted = computeBounce({
      alignmentAngleDeg: 5,
      boostReady: true,
      contactPart: "tip",
      impactSpeed: 10,
      jumpHeld: true,
    });

    expect(charged.bounceSpeed).toBeGreaterThan(auto.bounceSpeed);
    expect(charged.usedBoost).toBe(false);
    expect(boosted.bounceSpeed).toBeGreaterThan(charged.bounceSpeed);
    expect(boosted.usedBoost).toBe(true);
    expect(
      computeBounce({
        alignmentAngleDeg: 0,
        boostReady: true,
        contactPart: "tip",
        impactSpeed: 0,
        jumpHeld: true,
      }).bounceSpeed,
    ).toBeCloseTo(CHARGED_BOUNCE_SPEED * BOOST_BOUNCE_MULTIPLIER);
  });

  it("does not trigger boost when jump is released before landing", () => {
    const result = computeBounce({
      alignmentAngleDeg: 0,
      boostReady: true,
      contactPart: "tip",
      impactSpeed: 4,
      jumpHeld: false,
    });
    const auto = computeBounce({
      alignmentAngleDeg: 0,
      boostReady: false,
      contactPart: "tip",
      impactSpeed: 4,
      jumpHeld: false,
    });
    expect(result.usedBoost).toBe(false);
    expect(result.bounceSpeed).toBe(auto.bounceSpeed);
  });

  it("scales bounce speed and contact duration with impact speed and caps at MAX_BOUNCE_SPEED", () => {
    const low = computeBounce({
      alignmentAngleDeg: 0,
      boostReady: false,
      contactPart: "tip",
      impactSpeed: 5,
      jumpHeld: true,
    });
    const high = computeBounce({
      alignmentAngleDeg: 0,
      boostReady: false,
      contactPart: "tip",
      impactSpeed: 20,
      jumpHeld: true,
    });
    const extreme = computeBounce({
      alignmentAngleDeg: 0,
      boostReady: true,
      contactPart: "tip",
      impactSpeed: 200,
      jumpHeld: true,
    });

    expect(high.bounceSpeed).toBeGreaterThan(low.bounceSpeed);
    expect(high.contactDurationMs).toBeGreaterThan(low.contactDurationMs);
    expect(computeContactDurationMs(20)).toBeGreaterThan(
      computeContactDurationMs(5),
    );
    expect(extreme.bounceSpeed).toBe(MAX_BOUNCE_SPEED);
  });

  it("reduces rebound and zeroes contact duration on glancing or body landings", () => {
    const glancing = computeBounce({
      alignmentAngleDeg: TIP_ALIGN_MAX_ANGLE_DEG + 15,
      boostReady: true,
      contactPart: "tip",
      impactSpeed: 20,
      jumpHeld: true,
    });
    const ouch = computeBounce({
      alignmentAngleDeg: 0,
      boostReady: true,
      contactPart: "body",
      impactSpeed: 20,
      jumpHeld: true,
    });

    expect(glancing.outcome).toBe("glancing");
    expect(glancing.usedBoost).toBe(false);
    expect(glancing.contactDurationMs).toBe(0);
    expect(glancing.bounceSpeed).toBeCloseTo(20 * OUCH_BOUNCE_SCALE);

    expect(ouch.outcome).toBe("ouch");
    expect(ouch.usedBoost).toBe(false);
    expect(ouch.contactDurationMs).toBe(0);
    expect(ouch.bounceSpeed).toBeCloseTo(20 * OUCH_BOUNCE_SCALE);
  });
});
