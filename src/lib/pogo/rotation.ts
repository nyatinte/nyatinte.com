import {
  MATTER_BASE_DELTA_MS,
  ROTATION_ACCEL_DEG_PER_SEC2,
  ROTATION_MAX_DEG_PER_SEC,
  ROTATION_RELEASE_DECEL_DEG_PER_SEC2,
} from "./constants";

export type Pose = {
  readonly angleRad: number;
  readonly x: number;
  readonly y: number;
};

export type RotationModel = {
  readonly accelDegPerSec2: number;
  readonly maxDegPerSec: number;
  readonly releaseDecelDegPerSec2: number;
};

export const ROTATION_MODEL: RotationModel = {
  accelDegPerSec2: ROTATION_ACCEL_DEG_PER_SEC2,
  maxDegPerSec: ROTATION_MAX_DEG_PER_SEC,
  releaseDecelDegPerSec2: ROTATION_RELEASE_DECEL_DEG_PER_SEC2,
};

function moveToward(current: number, target: number, maxDelta: number): number {
  if (current < target) {
    return Math.min(target, current + maxDelta);
  }
  if (current > target) {
    return Math.max(target, current - maxDelta);
  }
  return current;
}

export function stepAngularVelocity(
  currentDegPerSec: number,
  inputDir: number,
  dtSec: number,
  model: RotationModel,
): number {
  const direction = Math.max(-1, Math.min(1, inputDir));
  if (direction === 0) {
    return moveToward(
      currentDegPerSec,
      0,
      model.releaseDecelDegPerSec2 * dtSec,
    );
  }
  return moveToward(
    currentDegPerSec,
    direction * model.maxDegPerSec,
    model.accelDegPerSec2 * dtSec,
  );
}

export function degPerSecToMatterAngularVelocity(degPerSec: number): number {
  return (degPerSec * Math.PI * MATTER_BASE_DELTA_MS) / (180 * 1000);
}

export function matterAngularVelocityToDegPerSec(
  angularVelocity: number,
): number {
  return (angularVelocity * 1000 * 180) / (MATTER_BASE_DELTA_MS * Math.PI);
}

export function lerpAngleShortArc(
  fromRad: number,
  toRad: number,
  alpha: number,
): number {
  const delta = Math.atan2(
    Math.sin(toRad - fromRad),
    Math.cos(toRad - fromRad),
  );
  return fromRad + delta * alpha;
}

export function lerpPose(prev: Pose, curr: Pose, alpha: number): Pose {
  return {
    angleRad: lerpAngleShortArc(prev.angleRad, curr.angleRad, alpha),
    x: prev.x + (curr.x - prev.x) * alpha,
    y: prev.y + (curr.y - prev.y) * alpha,
  };
}
