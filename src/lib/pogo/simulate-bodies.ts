import Matter from "matter-js";
import decomp from "poly-decomp";
import {
  BODY_FRICTION,
  KILL_PLANE_MARGIN,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  STICK_LENGTH,
  TIP_FRICTION,
  TIP_RADIUS,
} from "./constants";
import type { Point2D } from "./svg-terrain";

const { Bodies, Body, Common, Vertices } = Matter;

Common.setDecomp(decomp);

export type PogoBox = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

export type PlayerRig = {
  readonly player: Matter.Body;
  readonly torsoId: number;
  readonly stickId: number;
  readonly tipId: number;
  readonly pivotOffsetY: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function stickUpVector(angleRad: number): Point2D {
  return {
    x: Math.sin(angleRad),
    y: -Math.cos(angleRad),
  };
}

export function isInsideBox(point: Point2D, box: PogoBox): boolean {
  return (
    point.x >= box.minX &&
    point.x <= box.maxX &&
    point.y >= box.minY &&
    point.y <= box.maxY
  );
}

export function isOutsideKillBounds(point: Point2D, bounds: PogoBox): boolean {
  return (
    point.y > bounds.maxY + KILL_PLANE_MARGIN ||
    point.x < bounds.minX - KILL_PLANE_MARGIN ||
    point.x > bounds.maxX + KILL_PLANE_MARGIN
  );
}

export function outwardNormal(pair: Matter.Pair, playerPos: Point2D): Point2D {
  const raw = pair.collision.normal;
  const support = pair.collision.supports[0];
  const ref = support ?? pair.bodyA.position;
  const toPlayerX = playerPos.x - ref.x;
  const toPlayerY = playerPos.y - ref.y;
  if (raw.x * toPlayerX + raw.y * toPlayerY < 0) {
    return { x: -raw.x, y: -raw.y };
  }
  return { x: raw.x, y: raw.y };
}

export function normalImpactSpeed(velocity: Point2D, normal: Point2D): number {
  return Math.max(0, -(velocity.x * normal.x + velocity.y * normal.y));
}

export function alignmentDegrees(angleRad: number, normal: Point2D): number {
  const up = stickUpVector(angleRad);
  return (
    (Math.acos(clamp(up.x * normal.x + up.y * normal.y, -1, 1)) * 180) / Math.PI
  );
}

export function computeLaunchVelocity(
  angleRad: number,
  bounceSpeed: number,
): Point2D {
  const up = stickUpVector(angleRad);
  return {
    x: up.x * bounceSpeed,
    y: up.y * bounceSpeed,
  };
}

export function createTerrainBodies(
  polygons: ReadonlyArray<ReadonlyArray<Point2D>>,
): Array<Matter.Body> {
  const bodies: Array<Matter.Body> = [];

  for (const rawVerts of polygons) {
    if (rawVerts.length < 3) {
      continue;
    }
    const verts = rawVerts.map((point) => ({ x: point.x, y: point.y }));
    const minX = Math.min(...verts.map((point) => point.x));
    const minY = Math.min(...verts.map((point) => point.y));
    const centre = Vertices.centre(verts);
    const body = Bodies.fromVertices(
      centre.x,
      centre.y,
      [verts],
      {
        friction: BODY_FRICTION,
        isStatic: true,
        label: "terrain",
        restitution: 0.1,
      },
      false,
      0.01,
      10,
    );
    if (!body) {
      continue;
    }
    Body.translate(body, {
      x: minX - body.bounds.min.x,
      y: minY - body.bounds.min.y,
    });
    bodies.push(body);
  }

  return bodies;
}

export function createPlayerRig(spawn: Point2D): PlayerRig {
  const torso = Bodies.rectangle(0, -14, PLAYER_WIDTH, PLAYER_HEIGHT, {
    friction: BODY_FRICTION,
    label: "pogo-body",
  });
  const stick = Bodies.rectangle(0, 8, 6, Math.max(12, STICK_LENGTH - 12), {
    friction: BODY_FRICTION,
    label: "pogo-stick",
  });
  const tip = Bodies.circle(0, 32, TIP_RADIUS, {
    friction: TIP_FRICTION,
    label: "pogo-tip",
  });

  const player = Body.create({
    frictionAir: 0.01,
    parts: [torso, stick, tip],
    restitution: 0.05,
  });

  const pivotOffsetY = player.position.y;
  Body.setPosition(player, { x: spawn.x, y: spawn.y });

  return {
    pivotOffsetY,
    player,
    stickId: stick.id,
    tipId: tip.id,
    torsoId: torso.id,
  };
}
