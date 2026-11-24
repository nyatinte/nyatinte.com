import type { BoostState } from "./boost";
import { createBoostState } from "./boost";
import { BODY_TO_TIP_PX } from "./constants";
import { pxToMeters, type Point2D } from "./coords";

export type Phase = "air" | "charging" | "launching";

export type SimulationState = {
  phase: Phase;
  simTimeMs: number;
  chargeMs: number;
  compressionPx: number;
  contactRemainingMs: number;
  releaseLengthM: number;
  launchOnRelease: boolean;
  boostState: BoostState;
  ouchFlashRemainingMs: number;
  reachedGoal: boolean;
  respawns: number;
  resetCount: number;
  physicsStepCount: number;
  appliedAngularDegPerSec: number;
  groundNormal: Point2D | null;
  prevHeld: boolean;
  pressStartedAtMs: number | null;
  releasedAtMs: number | null;
  tipWasGrounded: boolean;
  torsoWasTouching: boolean;
};

export function createSimulationState(): SimulationState {
  return {
    appliedAngularDegPerSec: 0,
    boostState: createBoostState(),
    chargeMs: 0,
    compressionPx: 0,
    contactRemainingMs: 0,
    groundNormal: null,
    launchOnRelease: false,
    ouchFlashRemainingMs: 0,
    phase: "air",
    physicsStepCount: 0,
    pressStartedAtMs: null,
    prevHeld: false,
    reachedGoal: false,
    releaseLengthM: pxToMeters(BODY_TO_TIP_PX),
    releasedAtMs: null,
    resetCount: 0,
    respawns: 0,
    simTimeMs: 0,
    tipWasGrounded: false,
    torsoWasTouching: false,
  };
}
