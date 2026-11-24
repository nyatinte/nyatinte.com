import { cancelBoost, handleContactBoost } from "./boost";
import {
  BODY_TO_TIP_PX,
  GRAVITY_M_PER_SEC2,
  OUCH_FLASH_MS,
  SPRING_CHARGE_DAMPING,
  SPRING_CHARGE_STIFFNESS,
  STICK_MASS_KG,
  TORSO_MASS_KG,
} from "./constants";
import {
  computeChargeLevel,
  computeCompressionPx,
  computeContactChargeMs,
  computeContactDurationMs,
} from "./charge";
import {
  alignmentDegrees,
  degToRad,
  isInsideBox,
  metersToPx,
  normalImpactSpeed,
  pxToMeters,
  slopeDegFromUpNormal,
  type Point2D,
} from "./coords";
import { resolveLanding, type LandingResolution } from "./landing";
import { evaluateTipPivot, estimatePivotLateralForceN } from "./pivot";
import type { PogoWorld } from "./rapier-world";
import type { SimulationState } from "./simulate-state";
import type { PogoInputState, PogoSimulationConfig } from "./simulate-types";

const REST_LENGTH_M = pxToMeters(BODY_TO_TIP_PX);
const TOTAL_MASS_KG = TORSO_MASS_KG + STICK_MASS_KG;
const COM_FROM_TIP_M =
  (pxToMeters(BODY_TO_TIP_PX) * TORSO_MASS_KG) / TOTAL_MASS_KG;

function rotationInput(input: PogoInputState): number {
  return (input.right ? 1 : 0) - (input.left ? 1 : 0);
}

export function updatePivot(
  rig: PogoWorld,
  state: SimulationState,
  accelDegPerSec2: number,
): void {
  if (!state.groundNormal) {
    rig.removePivot();
    return;
  }
  const slopeDeg = slopeDegFromUpNormal(state.groundNormal);
  const decision = evaluateTipPivot({
    grounded: true,
    lateralForceN: estimatePivotLateralForceN({
      angularAccelRadPerSec2: degToRad(accelDegPerSec2),
      centerOfMassDistanceM: COM_FROM_TIP_M,
      gravityMPerSec2: GRAVITY_M_PER_SEC2,
      slopeRad: degToRad(slopeDeg),
      totalMassKg: TOTAL_MASS_KG,
    }),
    slopeDeg,
  });
  if (decision.lock) {
    rig.createPivot();
  } else {
    rig.removePivot();
  }
}

function applyLandingResolution(
  rig: PogoWorld,
  state: SimulationState,
  resolution: LandingResolution,
): void {
  rig.setKinematics(resolution.velocity, resolution.angularVelocityDegPerSec);
  if (resolution.cancelBoost) {
    state.boostState = cancelBoost();
  }
  rig.removePivot();
  state.phase = "air";
  state.chargeMs = 0;
  state.compressionPx = 0;
  state.ouchFlashRemainingMs = OUCH_FLASH_MS;
}

function startCharge(
  rig: PogoWorld,
  config: PogoSimulationConfig,
  state: SimulationState,
  input: PogoInputState,
  normal: Point2D,
  previousStickVelocity: Point2D,
  accelDegPerSec2: number,
): void {
  const impactSpeedPxPerSec = metersToPx(
    normalImpactSpeed(previousStickVelocity, normal),
  );
  const resolution = resolveLanding({
    alignmentAngleDeg: alignmentDegrees(rig.torsoBody.rotation(), normal),
    angularVelocityDegPerSec: state.appliedAngularDegPerSec,
    contactPart: "tip",
    normal,
    rotationInput: rotationInput(input),
    velocity: previousStickVelocity,
  });
  if (resolution.outcome !== "clean") {
    applyLandingResolution(rig, state, resolution);
    return;
  }

  state.chargeMs = computeContactChargeMs(
    {
      held: input.jump,
      pressStartedAtMs: state.pressStartedAtMs,
      releasedAtMs: state.releasedAtMs,
    },
    state.simTimeMs,
  );
  state.launchOnRelease = input.jump;
  state.contactRemainingMs = computeContactDurationMs(impactSpeedPxPerSec);
  state.boostState = handleContactBoost(state.boostState, {
    isTipContact: true,
    jumpHeld: input.jump,
  });
  state.compressionPx = computeCompressionPx(
    computeChargeLevel(state.chargeMs),
    state.boostState.ready && input.jump,
  );
  state.ouchFlashRemainingMs = 0;
  state.phase = "charging";
  state.groundNormal = normal;
  rig.setMotor(
    REST_LENGTH_M - pxToMeters(state.compressionPx),
    SPRING_CHARGE_STIFFNESS,
    SPRING_CHARGE_DAMPING,
  );
  updatePivot(rig, state, accelDegPerSec2);
  if (isInsideBox(rig.bodyCenterStage(), config.goalZone)) {
    state.reachedGoal = true;
  }
}

export function resolveContacts(
  rig: PogoWorld,
  config: PogoSimulationConfig,
  state: SimulationState,
  input: PogoInputState,
  previousStickVelocity: Point2D,
  accelDegPerSec2: number,
): void {
  const normal = rig.tipNormal();
  const torsoTouching = rig.torsoTouching();

  if (torsoTouching && !state.torsoWasTouching) {
    applyLandingResolution(
      rig,
      state,
      resolveLanding({
        alignmentAngleDeg: 90,
        angularVelocityDegPerSec: state.appliedAngularDegPerSec,
        contactPart: "body",
        normal: normal ?? { x: 0, y: 1 },
        rotationInput: rotationInput(input),
        velocity: previousStickVelocity,
      }),
    );
  }
  state.torsoWasTouching = torsoTouching;

  if (normal && !state.tipWasGrounded && state.ouchFlashRemainingMs === 0) {
    startCharge(
      rig,
      config,
      state,
      input,
      normal,
      previousStickVelocity,
      accelDegPerSec2,
    );
  } else if (!normal && state.tipWasGrounded && state.phase !== "air") {
    rig.removePivot();
    state.phase = "air";
    state.chargeMs = 0;
    state.compressionPx = 0;
    state.groundNormal = null;
  }
  state.tipWasGrounded = normal !== null;
}
