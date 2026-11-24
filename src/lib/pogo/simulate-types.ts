import type { RespawnReason } from "./respawn";
import type { PogoBox } from "./simulate-bodies";
import type { Point2D } from "./svg-terrain";

export type PogoInputState = {
  readonly jump: boolean;
  readonly left: boolean;
  readonly right: boolean;
};

export type PogoSnapshot = {
  readonly angleRad: number;
  readonly boostReady: boolean;
  readonly fixedStepHz: number;
  readonly grounded: boolean;
  readonly ouch: boolean;
  readonly physicsStepCount: number;
  readonly reachedGoal: boolean;
  readonly resetCount: number;
  readonly respawns: number;
  readonly x: number;
  readonly y: number;
};

export type PogoSimulationConfig = {
  readonly goalZone: PogoBox;
  readonly spawn: Point2D;
  readonly stageBounds: PogoBox;
  readonly terrainPolygons: ReadonlyArray<ReadonlyArray<Point2D>>;
};

export type PogoSimulation = {
  readonly pivotOffsetY: number;
  readonly spawn: Point2D;
  step(dtMs: number, input: PogoInputState): PogoSnapshot;
  respawn(reason?: RespawnReason): void;
  getTerrainPolygons(): Array<Array<Point2D>>;
  destroy(): void;
};
