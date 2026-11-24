import { W_S_CAMERA_PAN } from "./constants";

export function cameraPanDirectionX(keys: ReadonlySet<string>): number {
  return (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
}

export function cameraPanDirectionY(keys: ReadonlySet<string>): number {
  const down =
    keys.has("ArrowDown") || (W_S_CAMERA_PAN && keys.has("KeyS")) ? 1 : 0;
  const up =
    keys.has("ArrowUp") || (W_S_CAMERA_PAN && keys.has("KeyW")) ? 1 : 0;
  return down - up;
}
