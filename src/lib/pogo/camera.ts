import { CAMERA_PAN_LIMIT, CAMERA_PAN_SPEED } from "./constants";
import type { Point2D } from "./coords";

export type CameraState = {
  camX: number;
  camY: number;
  hasAnchor: boolean;
  lastResetCount: number;
  panX: number;
  panY: number;
};

export function createCameraState(spawn: Point2D): CameraState {
  return {
    camX: spawn.x,
    camY: spawn.y,
    hasAnchor: false,
    lastResetCount: 0,
    panX: 0,
    panY: 0,
  };
}

export type CameraFrame = {
  readonly dtSec: number;
  readonly panDirectionX: number;
  readonly panDirectionY: number;
  readonly resetCount: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly viewportHeight: number;
  readonly viewportWidth: number;
};

function decayOrPan(current: number, direction: number, dtSec: number): number {
  if (direction === 0) {
    return current * Math.max(0, 1 - 6 * dtSec);
  }
  return Math.max(
    -CAMERA_PAN_LIMIT,
    Math.min(CAMERA_PAN_LIMIT, current + direction * CAMERA_PAN_SPEED * dtSec),
  );
}

export function updateCamera(state: CameraState, frame: CameraFrame) {
  state.panX = decayOrPan(state.panX, frame.panDirectionX, frame.dtSec);
  state.panY = decayOrPan(state.panY, frame.panDirectionY, frame.dtSec);

  const targetX = frame.targetX + state.panX;
  const targetY = frame.targetY + state.panY;

  if (!state.hasAnchor || frame.resetCount !== state.lastResetCount) {
    state.camX = targetX;
    state.camY = targetY;
    state.hasAnchor = true;
    state.lastResetCount = frame.resetCount;
  } else {
    const lerp = 1 - Math.exp(-8 * frame.dtSec);
    state.camX += (targetX - state.camX) * lerp;
    state.camY += (targetY - state.camY) * lerp;
  }

  return {
    offsetX: Math.round(frame.viewportWidth / 2 - state.camX),
    offsetY: Math.round(frame.viewportHeight / 2 - state.camY),
  };
}
