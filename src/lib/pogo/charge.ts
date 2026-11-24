import {
  BOOST_COMPRESSION_PX,
  CHARGED_COMPRESSION_PX,
  CHARGE_FULL_MS,
  GROUND_CONTACT_BASE_MS,
  GROUND_CONTACT_FALL_MS_PER_100_PX_PER_SEC,
  GROUND_CONTACT_MAX_MS,
  JUMP_PRE_LANDING_BUFFER_MS,
  UNCHARGED_COMPRESSION_PX,
} from "./constants";

export type JumpTiming = {
  readonly held: boolean;
  readonly pressStartedAtMs: number | null;
  readonly releasedAtMs: number | null;
};

export function computeContactDurationMs(impactSpeedPxPerSec: number): number {
  const impact = Math.max(0, impactSpeedPxPerSec);
  const scaled = (impact / 100) * GROUND_CONTACT_FALL_MS_PER_100_PX_PER_SEC;
  return Math.min(GROUND_CONTACT_MAX_MS, GROUND_CONTACT_BASE_MS + scaled);
}

export function computeContactChargeMs(
  timing: JumpTiming,
  contactStartMs: number,
): number {
  if (timing.pressStartedAtMs === null) {
    return 0;
  }
  if (timing.held) {
    return Math.max(0, contactStartMs - timing.pressStartedAtMs);
  }
  if (timing.releasedAtMs === null) {
    return 0;
  }
  if (timing.releasedAtMs < contactStartMs - JUMP_PRE_LANDING_BUFFER_MS) {
    return 0;
  }
  return Math.max(0, timing.releasedAtMs - timing.pressStartedAtMs);
}

export function computeChargeLevel(chargeMs: number): number {
  return Math.min(1, Math.max(0, chargeMs / CHARGE_FULL_MS));
}

export function computeCompressionPx(level: number, boosted: boolean): number {
  if (boosted) {
    return BOOST_COMPRESSION_PX;
  }
  return (
    UNCHARGED_COMPRESSION_PX +
    (CHARGED_COMPRESSION_PX - UNCHARGED_COMPRESSION_PX) *
      Math.min(1, Math.max(0, level))
  );
}
