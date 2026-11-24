import {
  OUCH_BODY_LINEAR_KEEP,
  OUCH_GLANCING_LINEAR_KEEP,
  OUCH_RESIDUAL_BOUNCE_SPEED,
  OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC,
  TIP_ALIGN_MAX_ANGLE_DEG,
} from "./constants";
import type { Point2D } from "./svg-terrain";

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
    Math.max(0, normalSpeed) * linearKeep + OUCH_RESIDUAL_BOUNCE_SPEED;
  return {
    x: tangentX * linearKeep + normal.x * outwardNormalSpeed,
    y: tangentY * linearKeep + normal.y * outwardNormalSpeed,
  };
}

export function resolveLanding(input: LandingInput): LandingResolution {
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
  const linearKeep = isBodyHit
    ? OUCH_BODY_LINEAR_KEEP
    : OUCH_GLANCING_LINEAR_KEEP;
  const tangentialSign = Math.sign(
    input.velocity.y * input.normal.x - input.velocity.x * input.normal.y,
  );
  const tumble =
    (isBodyHit ? OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC : 0) *
    tumbleDirection(input, tangentialSign);

  return {
    angularVelocityDegPerSec: input.angularVelocityDegPerSec + tumble,
    cancelBoost: true,
    outcome,
    startBounceCycle: false,
    velocity: failedLandingVelocity(input.velocity, input.normal, linearKeep),
  };
}
