import { describe, expect, it } from "vite-plus/test";
import {
  AUTO_BOUNCE_SPEED,
  BOOST_BOUNCE_MULTIPLIER,
  CHARGED_BOUNCE_SPEED,
  MAX_BOUNCE_SPEED,
} from "./constants";
import { computeBounce, computeContactDurationMs } from "./impulse";

describe("computeBounce", () => {
  it("auto-bounces on a clean tip landing without jump held", () => {
    const result = computeBounce({
      boostReady: false,
      impactSpeed: 0,
      jumpHeld: false,
    });
    expect(result.bounceSpeed).toBe(AUTO_BOUNCE_SPEED);
    expect(result.usedBoost).toBe(false);
  });

  it("bounces higher when jump is held and highest when boosted", () => {
    const auto = computeBounce({
      boostReady: false,
      impactSpeed: 0,
      jumpHeld: false,
    });
    const charged = computeBounce({
      boostReady: false,
      impactSpeed: 0,
      jumpHeld: true,
    });
    const boosted = computeBounce({
      boostReady: true,
      impactSpeed: 0,
      jumpHeld: true,
    });

    expect(charged.bounceSpeed).toBeGreaterThan(auto.bounceSpeed);
    expect(charged.usedBoost).toBe(false);
    expect(boosted.bounceSpeed).toBeGreaterThan(charged.bounceSpeed);
    expect(boosted.usedBoost).toBe(true);
    expect(boosted.bounceSpeed).toBeCloseTo(
      CHARGED_BOUNCE_SPEED * BOOST_BOUNCE_MULTIPLIER,
    );
  });

  it("does not trigger boost when jump is released before landing", () => {
    const charged = computeBounce({
      boostReady: false,
      impactSpeed: 4,
      jumpHeld: false,
    });
    const released = computeBounce({
      boostReady: true,
      impactSpeed: 4,
      jumpHeld: false,
    });

    expect(released.usedBoost).toBe(false);
    expect(released.bounceSpeed).toBe(charged.bounceSpeed);
  });

  it("adds recovery height only for falls deeper than the current hop", () => {
    const shallow = computeBounce({
      boostReady: false,
      impactSpeed: CHARGED_BOUNCE_SPEED * 0.5,
      jumpHeld: true,
    });
    const atHopHeight = computeBounce({
      boostReady: false,
      impactSpeed: CHARGED_BOUNCE_SPEED,
      jumpHeld: true,
    });
    const deep = computeBounce({
      boostReady: false,
      impactSpeed: CHARGED_BOUNCE_SPEED + 10,
      jumpHeld: true,
    });

    expect(shallow.bounceSpeed).toBe(CHARGED_BOUNCE_SPEED);
    expect(atHopHeight.bounceSpeed).toBe(CHARGED_BOUNCE_SPEED);
    expect(deep.bounceSpeed).toBeGreaterThan(CHARGED_BOUNCE_SPEED);
  });

  it("caps bounce speed at the boost speed", () => {
    const extreme = computeBounce({
      boostReady: true,
      impactSpeed: 1000,
      jumpHeld: true,
    });
    expect(extreme.bounceSpeed).toBe(MAX_BOUNCE_SPEED);
  });

  it("increases contact duration with impact speed", () => {
    expect(computeContactDurationMs(20)).toBeGreaterThan(
      computeContactDurationMs(5),
    );
  });
});
