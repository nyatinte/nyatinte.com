import type Matter from "matter-js";
import { resolveLanding, type LandingResolution } from "./landing";
import {
  alignmentDegrees,
  isInsideBox,
  normalImpactSpeed,
  outwardNormal,
  type PogoBox,
} from "./simulate-bodies";
import type { Point2D } from "./svg-terrain";

export type ContactDecision =
  | { readonly kind: "none" }
  | {
      readonly kind: "clean";
      readonly impactSpeed: number;
      readonly reachedGoal: boolean;
    }
  | { readonly kind: "failed"; readonly resolution: LandingResolution };

export type ContactQuery = {
  readonly angularVelocityDegPerSec: number;
  readonly goalZone: PogoBox;
  readonly pairs: Array<Matter.Pair>;
  readonly player: Matter.Body;
  readonly playerPartIds: ReadonlySet<number>;
  readonly prevVelocity: Point2D;
  readonly rotationInput: number;
  readonly tipId: number;
};

export function decideContact(query: ContactQuery): ContactDecision {
  let tipPair: Matter.Pair | null = null;
  let bodyPair: Matter.Pair | null = null;

  for (const pair of query.pairs) {
    const aIsPlayer = query.playerPartIds.has(pair.bodyA.id);
    const bIsPlayer = query.playerPartIds.has(pair.bodyB.id);
    if (aIsPlayer === bIsPlayer) {
      continue;
    }
    const playerPart = aIsPlayer ? pair.bodyA : pair.bodyB;
    const otherBody = aIsPlayer ? pair.bodyB : pair.bodyA;
    if (!otherBody.isStatic) {
      continue;
    }
    if (playerPart.id === query.tipId) {
      tipPair = pair;
    } else {
      bodyPair = pair;
    }
  }

  if (!tipPair && !bodyPair) {
    return { kind: "none" };
  }

  const contactPart = bodyPair ? "body" : "tip";
  const pair = bodyPair ?? tipPair;
  if (!pair) {
    return { kind: "none" };
  }

  const normal = outwardNormal(pair, query.player.position);
  const impactSpeed = normalImpactSpeed(query.prevVelocity, normal);
  const resolution = resolveLanding({
    alignmentAngleDeg:
      contactPart === "tip" ? alignmentDegrees(query.player.angle, normal) : 90,
    angularVelocityDegPerSec: query.angularVelocityDegPerSec,
    contactPart,
    normal,
    rotationInput: query.rotationInput,
    velocity: query.prevVelocity,
  });

  if (resolution.outcome === "clean") {
    return {
      impactSpeed,
      kind: "clean",
      reachedGoal: isInsideBox(query.player.position, query.goalZone),
    };
  }

  return { kind: "failed", resolution };
}
