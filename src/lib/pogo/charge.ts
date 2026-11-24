import type { PogoTunables } from "./tune";
import { defaultTunables } from "./tune";

export type JumpTiming = {
  readonly held: boolean;
  readonly pressStartedAtMs: number | null;
  readonly releasedAtMs: number | null;
};

export function computeContactDurationMs(
  impactSpeedPxPerSec: number,
  tune: PogoTunables = defaultTunables(),
): number {
  const impact = Math.max(0, impactSpeedPxPerSec);
  const scaled = (impact / 100) * tune.groundContactFallMsPer100PxPerSec;
  return Math.min(tune.groundContactMaxMs, tune.groundContactBaseMs + scaled);
}

export function computeContactChargeMs(
  timing: JumpTiming,
  contactStartMs: number,
  tune: PogoTunables = defaultTunables(),
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
  if (timing.releasedAtMs < contactStartMs - tune.jumpPreLandingBufferMs) {
    return 0;
  }
  return Math.max(0, timing.releasedAtMs - timing.pressStartedAtMs);
}

export function computeChargeLevel(
  chargeMs: number,
  tune: PogoTunables = defaultTunables(),
): number {
  return Math.min(1, Math.max(0, chargeMs / tune.chargeFullMs));
}

export function computeCompressionPx(
  level: number,
  boosted: boolean,
  tune: PogoTunables = defaultTunables(),
): number {
  if (boosted) {
    return tune.boostCompressionPx;
  }
  return (
    tune.unchargedCompressionPx +
    (tune.chargedCompressionPx - tune.unchargedCompressionPx) *
      Math.min(1, Math.max(0, level))
  );
}
