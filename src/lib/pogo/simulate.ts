import Matter from "matter-js";
import {
  accumulateAirborneRotation,
  cancelBoost,
  consumeBoostOnLaunch,
  createBoostState,
  handleContactBoost,
  type BoostState,
} from "./boost";
import { GRAVITY_Y, ROTATION_SPEED_DEG_PER_SEC } from "./constants";
import { computeBounce } from "./impulse";
import {
  alignmentDegrees,
  computeLaunchVelocity,
  createPlayerRig,
  createTerrainBodies,
  degToRad,
  isInsideBox,
  isOutsideKillBounds,
  normalImpactSpeed,
  outwardNormal,
  type PogoBox,
} from "./simulate-bodies";
import type { Point2D } from "./svg-terrain";

const { Body, Composite, Engine, Events } = Matter;

const FIXED_STEP_MS = 1000 / 60;
const MAX_FRAME_DT_MS = 50;
const OUCH_RECOVERY_MS = 260;

export type PogoInputState = {
  readonly left: boolean;
  readonly right: boolean;
  readonly jump: boolean;
};

export type PogoSnapshot = {
  readonly x: number;
  readonly y: number;
  readonly angleRad: number;
  readonly boostReady: boolean;
  readonly grounded: boolean;
  readonly ouch: boolean;
  readonly reachedGoal: boolean;
  readonly respawns: number;
};

export type PogoSimulationConfig = {
  readonly terrainPolygons: ReadonlyArray<ReadonlyArray<Point2D>>;
  readonly spawn: Point2D;
  readonly goalZone: PogoBox;
  readonly stageBounds: PogoBox;
};

export type PogoSimulation = {
  readonly pivotOffsetY: number;
  step(dtMs: number, input: PogoInputState): PogoSnapshot;
  respawn(): void;
  destroy(): void;
};

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
  let ouchTimerMs = 0;
  let reachedGoal = false;
  let respawns = 0;
  let prevVelocity: Point2D = { x: 0, y: 0 };
  let currentInput: PogoInputState = { jump: false, left: false, right: false };

  function resetPlayerState(): void {
    Body.setPosition(player, { x: config.spawn.x, y: config.spawn.y });
    Body.setVelocity(player, { x: 0, y: 0 });
    Body.setAngle(player, 0);
    Body.setAngularVelocity(player, 0);
    boostState = createBoostState();
    compressionRemainingMs = 0;
    contactImpactSpeed = 0;
    ouchTimerMs = 0;
    reachedGoal = false;
    prevVelocity = { x: 0, y: 0 };
  }

  function applyOuchBounce(
    normal: Point2D,
    bounceSpeed: number,
    horizontalDamp: number,
  ): void {
    boostState = cancelBoost();
    compressionRemainingMs = 0;
    ouchTimerMs = OUCH_RECOVERY_MS;
    Body.setVelocity(player, {
      x: player.velocity.x * horizontalDamp + normal.x * bounceSpeed,
      y: normal.y * bounceSpeed,
    });
  }

  function handleCollisionPairs(pairs: Array<Matter.Pair>): void {
    let tipPair: Matter.Pair | null = null;
    let bodyPair: Matter.Pair | null = null;

    for (const pair of pairs) {
      const aIsPlayer = playerPartIds.has(pair.bodyA.id);
      const bIsPlayer = playerPartIds.has(pair.bodyB.id);
      if (aIsPlayer === bIsPlayer) {
        continue;
      }
      const playerPart = aIsPlayer ? pair.bodyA : pair.bodyB;
      const otherBody = aIsPlayer ? pair.bodyB : pair.bodyA;
      if (!otherBody.isStatic) {
        continue;
      }
      if (playerPart.id === tipId) {
        tipPair = pair;
      } else {
        bodyPair = pair;
      }
    }

    if (bodyPair) {
      const normal = outwardNormal(bodyPair, player.position);
      const result = computeBounce({
        alignmentAngleDeg: 90,
        boostReady: boostState.ready,
        contactPart: "body",
        impactSpeed: normalImpactSpeed(prevVelocity, normal),
        jumpHeld: currentInput.jump,
      });
      applyOuchBounce(normal, result.bounceSpeed, 0.5);
      return;
    }

    if (!tipPair) {
      return;
    }

    const normal = outwardNormal(tipPair, player.position);
    const alignmentAngleDeg = alignmentDegrees(player.angle, normal);
    const impactSpeed = normalImpactSpeed(prevVelocity, normal);
    const result = computeBounce({
      alignmentAngleDeg,
      boostReady: boostState.ready,
      contactPart: "tip",
      impactSpeed,
      jumpHeld: currentInput.jump,
    });

    if (result.outcome === "clean") {
      if (compressionRemainingMs <= 0) {
        compressionRemainingMs = result.contactDurationMs;
        contactImpactSpeed = impactSpeed;
        ouchTimerMs = 0;
      }
      boostState = handleContactBoost(boostState, {
        isTipContact: true,
        jumpHeld: currentInput.jump,
      });
      if (isInsideBox(player.position, config.goalZone)) {
        reachedGoal = true;
      }
      return;
    }

    applyOuchBounce(normal, result.bounceSpeed, 0.6);
  }

  function onCollisionStart(
    event: Matter.IEventCollision<Matter.Engine>,
  ): void {
    handleCollisionPairs(event.pairs);
  }

  Events.on(engine, "collisionStart", onCollisionStart);

  function stepFixed(input: PogoInputState): void {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const deltaDeg = dir * ROTATION_SPEED_DEG_PER_SEC * (FIXED_STEP_MS / 1000);

    if (compressionRemainingMs > 0) {
      Body.setAngularVelocity(player, 0);
      Body.setAngle(player, player.angle + degToRad(deltaDeg));
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
          alignmentAngleDeg: 0,
          boostReady: boosted,
          contactPart: "tip",
          impactSpeed: contactImpactSpeed,
          jumpHeld: input.jump,
        });
        Body.setVelocity(
          player,
          computeLaunchVelocity(player.angle, launch.bounceSpeed),
        );
        boostState = nextState;
      } else {
        Body.setVelocity(player, {
          x: player.velocity.x * 0.75,
          y: Math.min(0, player.velocity.y),
        });
      }
    } else {
      const rotationScale = ouchTimerMs > 0 ? 0.6 : 1;
      if (ouchTimerMs > 0) {
        ouchTimerMs = Math.max(0, ouchTimerMs - FIXED_STEP_MS);
      }
      Body.setAngularVelocity(player, 0);
      Body.setAngle(player, player.angle + degToRad(deltaDeg * rotationScale));
      if (ouchTimerMs <= 0 && deltaDeg !== 0) {
        boostState = accumulateAirborneRotation(boostState, deltaDeg);
      }
    }

    prevVelocity = { x: player.velocity.x, y: player.velocity.y };
    Engine.update(engine, FIXED_STEP_MS);

    if (isOutsideKillBounds(player.position, config.stageBounds)) {
      respawns += 1;
      resetPlayerState();
    }
  }

  return {
    destroy(): void {
      Events.off(engine, "collisionStart", onCollisionStart);
      Composite.clear(engine.world, false, true);
      Engine.clear(engine);
    },
    pivotOffsetY,
    respawn(): void {
      respawns += 1;
      resetPlayerState();
    },
    step(dtMs: number, input: PogoInputState): PogoSnapshot {
      currentInput = input;
      accumulatorMs = Math.min(
        accumulatorMs + Math.min(dtMs, MAX_FRAME_DT_MS),
        MAX_FRAME_DT_MS * 2,
      );

      while (accumulatorMs >= FIXED_STEP_MS) {
        stepFixed(input);
        accumulatorMs -= FIXED_STEP_MS;
      }

      return {
        angleRad: player.angle,
        boostReady: boostState.ready,
        grounded: compressionRemainingMs > 0,
        ouch: ouchTimerMs > 0,
        reachedGoal,
        respawns,
        x: player.position.x,
        y: player.position.y,
      };
    },
  };
}
