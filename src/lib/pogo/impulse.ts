import {
  AUTO_BOUNCE_SPEED,
  BOOST_BOUNCE_MULTIPLIER,
  CHARGED_BOUNCE_SPEED,
  FALL_SPEED_BOUNCE_SCALE,
  GROUND_CONTACT_BASE_MS,
  GROUND_CONTACT_FALL_MS_PER_SPEED,
  MAX_BOUNCE_SPEED,
  OUCH_BOUNCE_SCALE,
  TIP_ALIGN_MAX_ANGLE_DEG,
} from "./constants";

export type ContactPart = "tip" | "body";
export type LandingOutcome = "clean" | "glancing" | "ouch";

export type BounceInput = {
  readonly contactPart: ContactPart;
  readonly alignmentAngleDeg: number;
  readonly impactSpeed: number;
  readonly jumpHeld: boolean;
  readonly boostReady: boolean;
};

export type BounceResult = {
  readonly outcome: LandingOutcome;
  readonly bounceSpeed: number;
  readonly contactDurationMs: number;
  readonly usedBoost: boolean;
};

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

export function computeContactDurationMs(impactSpeed: number): number {
  return (
    GROUND_CONTACT_BASE_MS +
    Math.max(0, impactSpeed) * GROUND_CONTACT_FALL_MS_PER_SPEED
  );
}

export function computeBounce(input: BounceInput): BounceResult {
  const safeImpact = Math.max(0, input.impactSpeed);
  const outcome = classifyLanding(input.contactPart, input.alignmentAngleDeg);

  if (outcome !== "clean") {
    return {
      bounceSpeed: Math.min(MAX_BOUNCE_SPEED, safeImpact * OUCH_BOUNCE_SCALE),
      contactDurationMs: 0,
      outcome,
      usedBoost: false,
    };
  }

  const usedBoost = input.jumpHeld && input.boostReady;
  const baseSpeed = usedBoost
    ? CHARGED_BOUNCE_SPEED * BOOST_BOUNCE_MULTIPLIER
    : input.jumpHeld
      ? CHARGED_BOUNCE_SPEED
      : AUTO_BOUNCE_SPEED;

  return {
    bounceSpeed: Math.min(
      MAX_BOUNCE_SPEED,
      baseSpeed + safeImpact * FALL_SPEED_BOUNCE_SCALE,
    ),
    contactDurationMs: computeContactDurationMs(safeImpact),
    outcome,
    usedBoost,
  };
}
