import { PIXELS_PER_METER } from "./constants";

export type Point2D = {
  readonly x: number;
  readonly y: number;
};

export type Pose = {
  readonly angleRad: number;
  readonly x: number;
  readonly y: number;
};

export type Box2D = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

export function pxToMeters(px: number): number {
  return px / PIXELS_PER_METER;
}

export function metersToPx(meters: number): number {
  return meters * PIXELS_PER_METER;
}

export function stagePointToRapier(point: Point2D): Point2D {
  return { x: pxToMeters(point.x), y: -pxToMeters(point.y) };
}

export function rapierPointToStage(point: Point2D): Point2D {
  return { x: metersToPx(point.x), y: -metersToPx(point.y) };
}

export function stageVectorToRapier(vector: Point2D): Point2D {
  return { x: vector.x, y: -vector.y };
}

export function stageVelocityToRapier(velocity: Point2D): Point2D {
  return { x: pxToMeters(velocity.x), y: -pxToMeters(velocity.y) };
}

export function rapierVelocityToStage(velocity: Point2D): Point2D {
  return { x: metersToPx(velocity.x), y: -metersToPx(velocity.y) };
}

export function stageAngleToRapier(angleRad: number): number {
  return -angleRad;
}

export function rapierAngleToStage(angleRad: number): number {
  return -angleRad;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isInsideBox(point: Point2D, box: Box2D): boolean {
  return (
    point.x >= box.minX &&
    point.x <= box.maxX &&
    point.y >= box.minY &&
    point.y <= box.maxY
  );
}

export function isOutsideKillBounds(
  point: Point2D,
  bounds: Box2D,
  margin: number,
): boolean {
  return (
    point.y > bounds.maxY + margin ||
    point.x < bounds.minX - margin ||
    point.x > bounds.maxX + margin
  );
}

export function pogoUpVector(angleRad: number): Point2D {
  return { x: -Math.sin(angleRad), y: Math.cos(angleRad) };
}

export function alignmentDegrees(angleRad: number, normal: Point2D): number {
  const up = pogoUpVector(angleRad);
  return radToDeg(Math.acos(clamp(up.x * normal.x + up.y * normal.y, -1, 1)));
}

export function normalImpactSpeed(velocity: Point2D, normal: Point2D): number {
  return Math.max(0, -(velocity.x * normal.x + velocity.y * normal.y));
}

export function slopeDegFromUpNormal(normal: Point2D): number {
  return radToDeg(Math.acos(clamp(normal.y, -1, 1)));
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
