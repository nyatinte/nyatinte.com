import {
  FIXED_STEP_HZ,
  FIXED_STEP_MS,
  KILL_PLANE_MARGIN,
  MAX_FRAME_DT_MS,
  MAX_PHYSICS_STEPS_PER_FRAME,
} from "./constants";
import { isOutsideKillBounds, lerpPose, type Pose } from "./coords";
import { respawnPogo, stepPogo } from "./cycle";
import { createPogoWorld } from "./rapier-world";
import { loadRapier } from "./rapier-load";
import type { RespawnReason } from "./respawn";
import { createSimulationState } from "./simulate-state";
import type {
  PogoInputState,
  PogoSimulation,
  PogoSimulationConfig,
  PogoSnapshot,
} from "./simulate-types";

const REST_POSE: Pose = { angleRad: 0, x: 0, y: 0 };

export async function createPogoSimulation(
  config: PogoSimulationConfig,
): Promise<PogoSimulation> {
  const rig = createPogoWorld(await loadRapier(), config);
  const state = createSimulationState();
  const input: PogoInputState = { jump: false, left: false, right: false };
  let currentInput: PogoInputState = input;
  let accumulatorMs = 0;
  let prevBodyPose: Pose = REST_POSE;
  let currBodyPose: Pose = REST_POSE;
  let prevTipPose: Pose = REST_POSE;
  let currTipPose: Pose = REST_POSE;

  function measurePoses(): void {
    currBodyPose = rig.torsoPose();
    currTipPose = rig.tipPose();
  }

  function syncPoses(): void {
    measurePoses();
    prevBodyPose = currBodyPose;
    prevTipPose = currTipPose;
  }

  syncPoses();

  function respawn(reason: RespawnReason = "manual"): void {
    respawnPogo(rig, state, currentInput, reason);
    accumulatorMs = 0;
    syncPoses();
  }

  function stepFixed(): void {
    prevBodyPose = currBodyPose;
    prevTipPose = currTipPose;
    stepPogo(rig, config, state, currentInput);
    measurePoses();

    if (
      isOutsideKillBounds(
        rig.bodyCenterStage(),
        config.stageBounds,
        KILL_PLANE_MARGIN,
      )
    ) {
      respawn("fall");
    }
  }

  return {
    destroy(): void {
      rig.destroy();
    },
    getTerrainPolylines(): Array<Array<{ x: number; y: number }>> {
      return rig.terrainPolylines();
    },
    respawn,
    spawn: config.spawn,
    step(dtMs: number, nextInput: PogoInputState): PogoSnapshot {
      currentInput = nextInput;
      accumulatorMs += Math.min(Math.max(dtMs, 0), MAX_FRAME_DT_MS);

      let steps = 0;
      while (
        accumulatorMs >= FIXED_STEP_MS &&
        steps < MAX_PHYSICS_STEPS_PER_FRAME
      ) {
        accumulatorMs -= FIXED_STEP_MS;
        stepFixed();
        steps += 1;
      }
      if (accumulatorMs >= FIXED_STEP_MS) {
        accumulatorMs = 0;
      }

      const alpha = Math.min(1, Math.max(0, accumulatorMs / FIXED_STEP_MS));
      return {
        body: lerpPose(prevBodyPose, currBodyPose, alpha),
        boostReady: state.boostState.ready,
        fixedStepHz: FIXED_STEP_HZ,
        grounded: state.phase !== "air",
        ouch: state.ouchFlashRemainingMs > 0,
        physicsStepCount: state.physicsStepCount,
        reachedGoal: state.reachedGoal,
        resetCount: state.resetCount,
        respawns: state.respawns,
        tip: lerpPose(prevTipPose, currTipPose, alpha),
      };
    },
  };
}
