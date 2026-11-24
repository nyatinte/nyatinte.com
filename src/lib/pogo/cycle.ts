import {
  accumulateAirborneRotation,
  consumeBoostOnLaunch,
  createBoostState,
} from "./boost";
import { computeChargeLevel, computeCompressionPx } from "./charge";
import {
  BOUNCE_ANGULAR_KEEP,
  BODY_TO_TIP_PX,
  FIXED_STEP_MS,
  FIXED_STEP_SEC,
  PIVOT_RELEASE_EXTENSION_FRACTION,
  SPRING_CHARGE_DAMPING,
  SPRING_CHARGE_STIFFNESS,
  SPRING_LAUNCH_DAMPING,
  SPRING_LAUNCH_STIFFNESS,
} from "./constants";
import { pxToMeters } from "./coords";
import { resolveContacts, updatePivot } from "./contact";
import type { PogoWorld } from "./rapier-world";
import { shouldCountFall, type RespawnReason } from "./respawn";
import { ROTATION_MODEL, stepAngularVelocity } from "./rotation";
import type { SimulationState } from "./simulate-state";
import type { PogoInputState, PogoSimulationConfig } from "./simulate-types";

const REST_LENGTH_M = pxToMeters(BODY_TO_TIP_PX);

function rotationInput(input: PogoInputState): number {
  return (input.right ? 1 : 0) - (input.left ? 1 : 0);
}

function launch(
  rig: PogoWorld,
  state: SimulationState,
  input: PogoInputState,
): void {
  const launchBoost = consumeBoostOnLaunch(state.boostState, input.jump);
  state.boostState = launchBoost.nextState;
  const unboostedCompressionPx = computeCompressionPx(
    computeChargeLevel(state.chargeMs),
    false,
  );
  if (!launchBoost.boosted && state.compressionPx > unboostedCompressionPx) {
    const allowedLengthM = REST_LENGTH_M - pxToMeters(unboostedCompressionPx);
    if (rig.jointLengthM() < allowedLengthM) {
      rig.setJointLength(allowedLengthM);
    }
  }
  const currentLengthM = rig.jointLengthM();
  state.releaseLengthM =
    currentLengthM +
    (REST_LENGTH_M - currentLengthM) * PIVOT_RELEASE_EXTENSION_FRACTION;
  rig.setMotor(REST_LENGTH_M, SPRING_LAUNCH_STIFFNESS, SPRING_LAUNCH_DAMPING);
  state.phase = "launching";
}

function finishGroundPhase(rig: PogoWorld, state: SimulationState): void {
  rig.removePivot();
  state.phase = "air";
  state.chargeMs = 0;
  state.compressionPx = 0;
  state.appliedAngularDegPerSec *= BOUNCE_ANGULAR_KEEP;
  rig.setAngularVelocity(state.appliedAngularDegPerSec);
}

export function stepPogo(
  rig: PogoWorld,
  config: PogoSimulationConfig,
  state: SimulationState,
  input: PogoInputState,
): void {
  state.simTimeMs += FIXED_STEP_MS;
  if (input.jump && !state.prevHeld) {
    state.pressStartedAtMs = state.simTimeMs;
    state.releasedAtMs = null;
  } else if (!input.jump && state.prevHeld) {
    state.releasedAtMs = state.simTimeMs;
  }
  state.prevHeld = input.jump;

  const stickVelocity = rig.stickBody.linvel();
  const previousDegPerSec = state.appliedAngularDegPerSec;
  const nextDegPerSec = stepAngularVelocity(
    previousDegPerSec,
    rotationInput(input),
    FIXED_STEP_SEC,
    ROTATION_MODEL,
  );
  state.appliedAngularDegPerSec = nextDegPerSec;
  const accelDegPerSec2 = (nextDegPerSec - previousDegPerSec) / FIXED_STEP_SEC;

  if (state.phase === "charging") {
    updatePivot(rig, state, accelDegPerSec2);
    if (state.launchOnRelease && !input.jump) {
      launch(rig, state, input);
    } else {
      if (input.jump) {
        state.chargeMs += FIXED_STEP_MS;
      }
      state.compressionPx = computeCompressionPx(
        computeChargeLevel(state.chargeMs),
        state.boostState.ready && input.jump,
      );
      rig.setMotor(
        REST_LENGTH_M - pxToMeters(state.compressionPx),
        SPRING_CHARGE_STIFFNESS,
        SPRING_CHARGE_DAMPING,
      );
      state.contactRemainingMs -= FIXED_STEP_MS;
      if (state.contactRemainingMs <= 0) {
        launch(rig, state, input);
      }
    }
  } else if (state.phase === "launching") {
    rig.setMotor(REST_LENGTH_M, SPRING_LAUNCH_STIFFNESS, SPRING_LAUNCH_DAMPING);
  }

  rig.setAngularVelocity(nextDegPerSec);
  rig.world.step();
  state.physicsStepCount += 1;

  resolveContacts(rig, config, state, input, stickVelocity, accelDegPerSec2);

  if (
    state.phase === "launching" &&
    rig.jointLengthM() >= state.releaseLengthM
  ) {
    finishGroundPhase(rig, state);
  }

  if (
    state.phase === "air" &&
    rotationInput(input) !== 0 &&
    !state.tipWasGrounded
  ) {
    state.boostState = accumulateAirborneRotation(
      state.boostState,
      nextDegPerSec * FIXED_STEP_SEC,
    );
  }

  if (state.ouchFlashRemainingMs > 0) {
    state.ouchFlashRemainingMs = Math.max(
      0,
      state.ouchFlashRemainingMs - FIXED_STEP_MS,
    );
  }
}

export function resetPogo(
  rig: PogoWorld,
  state: SimulationState,
  input: PogoInputState,
): void {
  rig.reset();
  state.phase = "air";
  state.chargeMs = 0;
  state.compressionPx = 0;
  state.contactRemainingMs = 0;
  state.releaseLengthM = REST_LENGTH_M;
  state.launchOnRelease = false;
  state.boostState = createBoostState();
  state.ouchFlashRemainingMs = 0;
  state.reachedGoal = false;
  state.appliedAngularDegPerSec = 0;
  state.groundNormal = null;
  state.tipWasGrounded = false;
  state.torsoWasTouching = false;
  state.prevHeld = input.jump;
  state.pressStartedAtMs = input.jump ? state.simTimeMs : null;
  state.releasedAtMs = null;
  state.resetCount += 1;
}

export function respawnPogo(
  rig: PogoWorld,
  state: SimulationState,
  input: PogoInputState,
  reason: RespawnReason,
): void {
  if (shouldCountFall(reason)) {
    state.respawns += 1;
  }
  resetPogo(rig, state, input);
}
