import { describe, expect, it } from "vite-plus/test";
import { TIP_PIVOT_MAX_FORCE_N, TIP_PIVOT_MAX_SLOPE_DEG } from "./constants";
import { evaluateTipPivot, estimatePivotLateralForceN } from "./pivot";

describe("evaluateTipPivot", () => {
  it("locks a grounded tip on a shallow slope", () => {
    expect(
      evaluateTipPivot({ grounded: true, lateralForceN: 10, slopeDeg: 20 }),
    ).toEqual({ lock: true, releaseReason: "none" });
  });

  it("releases once airborne", () => {
    expect(
      evaluateTipPivot({ grounded: false, lateralForceN: 0, slopeDeg: 0 }),
    ).toEqual({ lock: false, releaseReason: "airborne" });
  });

  it("releases on a slope steeper than the limit", () => {
    expect(
      evaluateTipPivot({
        grounded: true,
        lateralForceN: 0,
        slopeDeg: TIP_PIVOT_MAX_SLOPE_DEG + 0.1,
      }),
    ).toEqual({ lock: false, releaseReason: "steep-slope" });
  });

  it("releases when the lateral load passes the limit", () => {
    expect(
      evaluateTipPivot({
        grounded: true,
        lateralForceN: TIP_PIVOT_MAX_FORCE_N + 0.1,
        slopeDeg: 0,
      }),
    ).toEqual({ lock: false, releaseReason: "over-force" });
  });
});

describe("estimatePivotLateralForceN", () => {
  const base = {
    angularAccelRadPerSec2: 0,
    centerOfMassDistanceM: 0.4,
    gravityMPerSec2: 16,
    slopeRad: 0,
    totalMassKg: 1.15,
  };

  it("is zero on flat ground without rotation", () => {
    expect(estimatePivotLateralForceN(base)).toBeCloseTo(0, 9);
  });

  it("grows with the slope and with commanded rotation", () => {
    const flat = estimatePivotLateralForceN(base);
    const sloped = estimatePivotLateralForceN({
      ...base,
      slopeRad: Math.PI / 4,
    });
    const rotating = estimatePivotLateralForceN({
      ...base,
      angularAccelRadPerSec2: 83.8,
    });
    expect(sloped).toBeGreaterThan(flat);
    expect(rotating).toBeCloseTo(1.15 * 83.8 * 0.4, 6);
  });
});
