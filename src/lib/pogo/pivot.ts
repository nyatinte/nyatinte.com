import { TIP_PIVOT_MAX_FORCE_N, TIP_PIVOT_MAX_SLOPE_DEG } from "./constants";

export type TipPivotReleaseReason =
  | "none"
  | "airborne"
  | "steep-slope"
  | "over-force";

export type TipPivotInput = {
  readonly grounded: boolean;
  readonly lateralForceN: number;
  readonly slopeDeg: number;
};

export type TipPivotDecision = {
  readonly lock: boolean;
  readonly releaseReason: TipPivotReleaseReason;
};

export function evaluateTipPivot(
  input: TipPivotInput,
  maxSlopeDeg = TIP_PIVOT_MAX_SLOPE_DEG,
  maxForceN = TIP_PIVOT_MAX_FORCE_N,
): TipPivotDecision {
  if (!input.grounded) {
    return { lock: false, releaseReason: "airborne" };
  }
  if (input.slopeDeg > maxSlopeDeg) {
    return { lock: false, releaseReason: "steep-slope" };
  }
  if (Math.abs(input.lateralForceN) > maxForceN) {
    return { lock: false, releaseReason: "over-force" };
  }
  return { lock: true, releaseReason: "none" };
}

export type PivotLoadInput = {
  readonly angularAccelRadPerSec2: number;
  readonly centerOfMassDistanceM: number;
  readonly gravityMPerSec2: number;
  readonly slopeRad: number;
  readonly totalMassKg: number;
};

export function estimatePivotLateralForceN(input: PivotLoadInput): number {
  const gravityLoad =
    input.totalMassKg * input.gravityMPerSec2 * Math.sin(input.slopeRad);
  const rotationLoad =
    input.totalMassKg *
    Math.abs(input.angularAccelRadPerSec2) *
    input.centerOfMassDistanceM;
  return Math.abs(gravityLoad) + rotationLoad;
}
