import {
  OUCH_GLANCING_LINEAR_KEEP,
  OUCH_RESIDUAL_BOUNCE_SPEED_M_PER_SEC,
  TIP_ALIGN_MAX_ANGLE_DEG,
} from "./constants";
import type { Point2D } from "./coords";
import { defaultTunables, type PogoTunables } from "./tune";

export type ContactPart = "body" | "tip";
export type LandingOutcome = "clean" | "glancing" | "ouch";

export function classifyLanding(
  contactPart: ContactPart,
  alignmentAngleDeg: number,
): LandingOutcome {
  if (contactPart === "body") {
    return "ouch";
  }
  if (Math.abs(alignmentAngleDeg) <= TIP_ALIGN_MAX_ANGLE_DEG) {
    return "clean";
  }
  return "glancing";
}

export type LandingInput = {
  readonly alignmentAngleDeg: number;
  readonly angularVelocityDegPerSec: number;
  readonly contactPart: ContactPart;
  readonly normal: Point2D;
  readonly rotationInput: number;
  readonly velocity: Point2D;
};

export type LandingResolution = {
  readonly angularVelocityDegPerSec: number;
  readonly cancelBoost: boolean;
  readonly outcome: LandingOutcome;
  readonly startBounceCycle: boolean;
  readonly velocity: Point2D;
};

function tumbleDirection(input: LandingInput, tangentialSign: number): number {
  const inputSign = Math.sign(input.rotationInput);
  if (inputSign !== 0) {
    return inputSign;
  }
  return tangentialSign === 0 ? 1 : tangentialSign;
}

function failedLandingVelocity(
  velocity: Point2D,
  normal: Point2D,
  linearKeep: number,
): Point2D {
  const normalSpeed = velocity.x * normal.x + velocity.y * normal.y;
  const tangentX = velocity.x - normal.x * normalSpeed;
  const tangentY = velocity.y - normal.y * normalSpeed;
  const outwardNormalSpeed =
    Math.max(0, normalSpeed) * linearKeep +
    OUCH_RESIDUAL_BOUNCE_SPEED_M_PER_SEC;
  return {
    x: tangentX * linearKeep + normal.x * outwardNormalSpeed,
    y: tangentY * linearKeep + normal.y * outwardNormalSpeed,
  };
}

function reflectedVelocity(velocity: Point2D, normal: Point2D): Point2D {
  const normalSpeed = velocity.x * normal.x + velocity.y * normal.y;
  if (normalSpeed >= 0) {
    return velocity;
  }
  return {
    x: velocity.x - 2 * normalSpeed * normal.x,
    y: velocity.y - 2 * normalSpeed * normal.y,
  };
}

function bodyHitVelocity(
  velocity: Point2D,
  normal: Point2D,
  tune: PogoTunables,
): Point2D {
  const killed = failedLandingVelocity(
    velocity,
    normal,
    tune.ouchBodyLinearKeep,
  );
  const restitution = Math.min(1, Math.max(0, tune.ouchBodyRestitution));
  if (restitution <= 0) {
    return killed;
  }
  const bounced = reflectedVelocity(velocity, normal);
  return {
    x: killed.x * (1 - restitution) + bounced.x * restitution,
    y: killed.y * (1 - restitution) + bounced.y * restitution,
  };
}

export function resolveLanding(
  input: LandingInput,
  tune: PogoTunables = defaultTunables(),
): LandingResolution {
  const outcome = classifyLanding(input.contactPart, input.alignmentAngleDeg);

  if (outcome === "clean") {
    return {
      angularVelocityDegPerSec: input.angularVelocityDegPerSec,
      cancelBoost: false,
      outcome,
      startBounceCycle: true,
      velocity: input.velocity,
    };
  }

  const isBodyHit = outcome === "ouch";
  const tangentialSign = Math.sign(
    input.velocity.y * input.normal.x - input.velocity.x * input.normal.y,
  );
  const tumble =
    (isBodyHit ? tune.ouchTumbleAngularImpulseDegPerSec : 0) *
    tumbleDirection(input, tangentialSign);
  const velocity = isBodyHit
    ? bodyHitVelocity(input.velocity, input.normal, tune)
    : failedLandingVelocity(
        input.velocity,
        input.normal,
        OUCH_GLANCING_LINEAR_KEEP,
      );

  return {
    angularVelocityDegPerSec: input.angularVelocityDegPerSec + tumble,
    cancelBoost: true,
    outcome,
    startBounceCycle: false,
    velocity,
  };
}
