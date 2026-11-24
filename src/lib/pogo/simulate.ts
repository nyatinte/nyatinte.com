import Matter from "matter-js";
import {
  accumulateAirborneRotation,
  cancelBoost,
  consumeBoostOnLaunch,
  createBoostState,
  handleContactBoost,
  type BoostState,
} from "./boost";
import {
  BOUNCE_ANGULAR_KEEP,
  COMPRESSION_HORIZONTAL_DAMP,
  FIXED_STEP_HZ,
  FIXED_STEP_MS,
  GRAVITY_Y,
  MAX_FRAME_DT_MS,
  MAX_PHYSICS_STEPS_PER_FRAME,
  OUCH_FLASH_MS,
} from "./constants";
import { computeBounce } from "./impulse";
import {
  degPerSecToMatterAngularVelocity,
  lerpPose,
  matterAngularVelocityToDegPerSec,
  ROTATION_MODEL,
  stepAngularVelocity,
  type Pose,
} from "./rotation";
import { shouldCountFall, type RespawnReason } from "./respawn";
import { decideContact } from "./simulate-collision";
import {
  computeLaunchVelocity,
  createPlayerRig,
  createTerrainBodies,
  isOutsideKillBounds,
  terrainDebugPolygons,
} from "./simulate-bodies";
import type {
  PogoInputState,
  PogoSimulation,
  PogoSimulationConfig,
  PogoSnapshot,
} from "./simulate-types";
import type { Point2D } from "./svg-terrain";

const { Body, Composite, Engine, Events } = Matter;

export function createPogoSimulation(
  config: PogoSimulationConfig,
): PogoSimulation {
  const engine = Engine.create();
  engine.gravity.x = 0;
  engine.gravity.y = GRAVITY_Y;

  const terrainBodies = createTerrainBodies(config.terrainPolygons);
  if (terrainBodies.length > 0) {
    Composite.add(engine.world, terrainBodies);
  }

  const rig = createPlayerRig(config.spawn);
  const { pivotOffsetY, player, stickId, tipId, torsoId } = rig;
  Composite.add(engine.world, player);

  const playerPartIds = new Set([torsoId, stickId, tipId]);

  let accumulatorMs = 0;
  let boostState: BoostState = createBoostState();
  let compressionRemainingMs = 0;
  let contactImpactSpeed = 0;
  let ouchFlashRemainingMs = 0;
  let reachedGoal = false;
  let respawns = 0;
  let resetCount = 0;
  let physicsStepCount = 0;
  let appliedAngularVelocityDegPerSec = 0;
  let prevVelocity: Point2D = { x: 0, y: 0 };
  let currentInput: PogoInputState = { jump: false, left: false, right: false };
  let prevPose: Pose = {
    angleRad: 0,
    x: rig.spawnPosition.x,
    y: rig.spawnPosition.y,
  };
  let currPose: Pose = prevPose;

  function poseOfPlayer(): Pose {
    return {
      angleRad: player.angle,
      x: player.position.x,
      y: player.position.y,
    };
  }

  function rotationInput(): number {
    return (currentInput.right ? 1 : 0) - (currentInput.left ? 1 : 0);
  }

  function resetPlayerState(): void {
    Body.setPosition(player, rig.spawnPosition);
    Body.setVelocity(player, { x: 0, y: 0 });
    Body.setAngle(player, 0);
    Body.setAngularVelocity(player, 0);
    boostState = createBoostState();
    compressionRemainingMs = computeBounce({
      boostReady: false,
      impactSpeed: 0,
      jumpHeld: currentInput.jump,
    }).contactDurationMs;
    contactImpactSpeed = 0;
    ouchFlashRemainingMs = 0;
    reachedGoal = false;
    appliedAngularVelocityDegPerSec = 0;
    prevVelocity = { x: 0, y: 0 };
    accumulatorMs = 0;
    prevPose = poseOfPlayer();
    currPose = prevPose;
    resetCount += 1;
  }

  function respawn(reason: RespawnReason = "manual"): void {
    if (shouldCountFall(reason)) {
      respawns += 1;
    }
    resetPlayerState();
  }

  function onCollisionStart(
    event: Matter.IEventCollision<Matter.Engine>,
  ): void {
    const decision = decideContact({
      angularVelocityDegPerSec: appliedAngularVelocityDegPerSec,
      goalZone: config.goalZone,
      pairs: event.pairs,
      player,
      playerPartIds,
      prevVelocity,
      rotationInput: rotationInput(),
      tipId,
    });

    if (decision.kind === "none") {
      return;
    }

    if (decision.kind === "clean") {
      if (compressionRemainingMs <= 0) {
        compressionRemainingMs = computeBounce({
          boostReady: boostState.ready,
          impactSpeed: decision.impactSpeed,
          jumpHeld: currentInput.jump,
        }).contactDurationMs;
        contactImpactSpeed = decision.impactSpeed;
        ouchFlashRemainingMs = 0;
      }
      boostState = handleContactBoost(boostState, {
        isTipContact: true,
        jumpHeld: currentInput.jump,
      });
      if (decision.reachedGoal) {
        reachedGoal = true;
      }
      return;
    }

    compressionRemainingMs = 0;
    ouchFlashRemainingMs = OUCH_FLASH_MS;
    if (decision.resolution.cancelBoost) {
      boostState = cancelBoost();
    }
    Body.setVelocity(player, decision.resolution.velocity);
    Body.setAngularVelocity(
      player,
      degPerSecToMatterAngularVelocity(
        decision.resolution.angularVelocityDegPerSec,
      ),
    );
  }

  Events.on(engine, "collisionStart", onCollisionStart);

  function stepFixed(input: PogoInputState): void {
    const dtSec = FIXED_STEP_MS / 1000;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);

    prevPose = poseOfPlayer();
    prevVelocity = { x: player.velocity.x, y: player.velocity.y };

    const currentDegPerSec = matterAngularVelocityToDegPerSec(
      player.angularVelocity,
    );
    const nextDegPerSec = stepAngularVelocity(
      currentDegPerSec,
      dir,
      dtSec,
      ROTATION_MODEL,
    );
    appliedAngularVelocityDegPerSec = nextDegPerSec;
    Body.setAngularVelocity(
      player,
      degPerSecToMatterAngularVelocity(nextDegPerSec),
    );

    if (compressionRemainingMs > 0) {
      boostState = handleContactBoost(boostState, {
        isTipContact: true,
        jumpHeld: input.jump,
      });
      compressionRemainingMs -= FIXED_STEP_MS;
      if (compressionRemainingMs <= 0) {
        const { boosted, nextState } = consumeBoostOnLaunch(
          boostState,
          input.jump,
        );
        const launch = computeBounce({
          boostReady: boosted,
          impactSpeed: contactImpactSpeed,
          jumpHeld: input.jump,
        });
        Body.setVelocity(
          player,
          computeLaunchVelocity(player.angle, launch.bounceSpeed),
        );
        Body.setAngularVelocity(
          player,
          degPerSecToMatterAngularVelocity(nextDegPerSec * BOUNCE_ANGULAR_KEEP),
        );
        boostState = nextState;
      } else {
        Body.setVelocity(player, {
          x: player.velocity.x * COMPRESSION_HORIZONTAL_DAMP,
          y: Math.min(0, player.velocity.y),
        });
      }
    } else if (dir !== 0) {
      boostState = accumulateAirborneRotation(
        boostState,
        nextDegPerSec * dtSec,
      );
    }

    if (ouchFlashRemainingMs > 0) {
      ouchFlashRemainingMs = Math.max(0, ouchFlashRemainingMs - FIXED_STEP_MS);
    }

    Engine.update(engine, FIXED_STEP_MS);
    currPose = poseOfPlayer();
    physicsStepCount += 1;

    if (isOutsideKillBounds(player.position, config.stageBounds)) {
      respawn("fall");
    }
  }

  return {
    destroy(): void {
      Events.off(engine, "collisionStart", onCollisionStart);
      Composite.clear(engine.world, false, true);
      Engine.clear(engine);
    },
    getTerrainPolygons(): Array<Array<Point2D>> {
      return terrainDebugPolygons(terrainBodies);
    },
    pivotOffsetY,
    respawn,
    spawn: rig.spawnPosition,
    step(dtMs: number, input: PogoInputState): PogoSnapshot {
      currentInput = input;
      accumulatorMs += Math.min(Math.max(dtMs, 0), MAX_FRAME_DT_MS);

      let steps = 0;
      while (
        accumulatorMs >= FIXED_STEP_MS &&
        steps < MAX_PHYSICS_STEPS_PER_FRAME
      ) {
        accumulatorMs -= FIXED_STEP_MS;
        stepFixed(input);
        steps += 1;
      }
      if (accumulatorMs >= FIXED_STEP_MS) {
        accumulatorMs = 0;
      }

      const alpha = Math.min(1, Math.max(0, accumulatorMs / FIXED_STEP_MS));
      const pose = lerpPose(prevPose, currPose, alpha);

      return {
        angleRad: pose.angleRad,
        boostReady: boostState.ready,
        fixedStepHz: FIXED_STEP_HZ,
        grounded: compressionRemainingMs > 0,
        ouch: ouchFlashRemainingMs > 0,
        physicsStepCount,
        reachedGoal,
        resetCount,
        respawns,
        x: pose.x,
        y: pose.y,
      };
    },
  };
}
