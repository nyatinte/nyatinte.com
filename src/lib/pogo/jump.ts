export type JumpModel = {
  readonly baseDeltaMs: number;
  readonly gravityScale: number;
  readonly gravityY: number;
  readonly stepMs: number;
};

function gravityPxPerSec2(model: JumpModel): number {
  return model.gravityY * model.gravityScale * 1_000_000;
}

export function computeJumpApexPx(
  bounceSpeed: number,
  model: JumpModel,
): number {
  const launchPxPerSec = bounceSpeed * (1000 / model.baseDeltaMs);
  const stepSec = model.stepMs / 1000;
  return (
    (launchPxPerSec * launchPxPerSec) / (2 * gravityPxPerSec2(model)) -
    (launchPxPerSec * stepSec) / 2
  );
}

export function computeBounceSpeedForApexPx(
  apexPx: number,
  model: JumpModel,
): number {
  const gravity = gravityPxPerSec2(model);
  const stepSec = model.stepMs / 1000;
  const launchPxPerSec =
    (gravity * stepSec +
      Math.sqrt(gravity * gravity * stepSec * stepSec + 8 * gravity * apexPx)) /
    2;
  return launchPxPerSec * (model.baseDeltaMs / 1000);
}
