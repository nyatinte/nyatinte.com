import { describe, expect, it } from "vite-plus/test";
import {
  AUTO_BOUNCE_SPEED,
  BOOST_APEX_PX,
  BOOST_BOUNCE_MULTIPLIER,
  CHARGED_APEX_PX,
  CHARGED_BOUNCE_SPEED,
  FIXED_STEP_MS,
  GRAVITY_Y,
  MATTER_BASE_DELTA_MS,
  MATTER_GRAVITY_SCALE,
  PLAYER_HEIGHT,
  UNCHARGED_APEX_PX,
} from "./constants";
import {
  computeBounceSpeedForApexPx,
  computeJumpApexPx,
  type JumpModel,
} from "./jump";

const MODEL: JumpModel = {
  baseDeltaMs: MATTER_BASE_DELTA_MS,
  gravityScale: MATTER_GRAVITY_SCALE,
  gravityY: GRAVITY_Y,
  stepMs: FIXED_STEP_MS,
};

describe("bounce apex", () => {
  it("matches the body-height targets from the community measurements", () => {
    expect(UNCHARGED_APEX_PX / PLAYER_HEIGHT).toBe(2);
    expect(CHARGED_APEX_PX / PLAYER_HEIGHT).toBeCloseTo(5 / 1.5, 6);
    expect(BOOST_APEX_PX / PLAYER_HEIGHT).toBeCloseTo(7 / 1.5, 6);

    expect(computeJumpApexPx(AUTO_BOUNCE_SPEED, MODEL)).toBeCloseTo(
      UNCHARGED_APEX_PX,
      4,
    );
    expect(computeJumpApexPx(CHARGED_BOUNCE_SPEED, MODEL)).toBeCloseTo(
      CHARGED_APEX_PX,
      4,
    );
    expect(
      computeJumpApexPx(CHARGED_BOUNCE_SPEED * BOOST_BOUNCE_MULTIPLIER, MODEL),
    ).toBeCloseTo(BOOST_APEX_PX, 4);
  });

  it("round trips between apex height and bounce speed", () => {
    for (const apexPx of [88, 146.6667, 205.3333]) {
      const speed = computeBounceSpeedForApexPx(apexPx, MODEL);
      expect(computeJumpApexPx(speed, MODEL)).toBeCloseTo(apexPx, 4);
    }
  });

  it("clears the first ledge with a charged hop but not the high ledge with one boost", () => {
    expect(CHARGED_APEX_PX).toBeGreaterThan(90);
    expect(BOOST_APEX_PX).toBeLessThan(440);
  });
});
