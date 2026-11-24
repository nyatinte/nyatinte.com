import {
  AUTO_BOUNCE_SPEED,
  BOOST_BOUNCE_MULTIPLIER,
  CHARGED_BOUNCE_SPEED,
  FALL_SPEED_BOUNCE_SCALE,
  GROUND_CONTACT_BASE_MS,
  GROUND_CONTACT_FALL_MS_PER_SPEED,
  MAX_BOUNCE_SPEED,
} from "./constants";

export type BounceInput = {
  readonly boostReady: boolean;
  readonly impactSpeed: number;
  readonly jumpHeld: boolean;
};

export type BounceResult = {
  readonly bounceSpeed: number;
  readonly contactDurationMs: number;
  readonly usedBoost: boolean;
};

export function computeContactDurationMs(impactSpeed: number): number {
  return (
    GROUND_CONTACT_BASE_MS +
    Math.max(0, impactSpeed) * GROUND_CONTACT_FALL_MS_PER_SPEED
  );
}

export function computeBounce(input: BounceInput): BounceResult {
  const impactSpeed = Math.max(0, input.impactSpeed);
  const usedBoost = input.jumpHeld && input.boostReady;
  const baseSpeed = usedBoost
    ? CHARGED_BOUNCE_SPEED * BOOST_BOUNCE_MULTIPLIER
    : input.jumpHeld
      ? CHARGED_BOUNCE_SPEED
      : AUTO_BOUNCE_SPEED;
  const fallBonus =
    Math.max(0, impactSpeed - baseSpeed) * FALL_SPEED_BOUNCE_SCALE;

  return {
    bounceSpeed: Math.min(MAX_BOUNCE_SPEED, baseSpeed + fallBonus),
    contactDurationMs: computeContactDurationMs(impactSpeed),
    usedBoost,
  };
}
