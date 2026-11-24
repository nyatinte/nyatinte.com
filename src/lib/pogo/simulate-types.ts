import type { Box2D, Point2D, Pose } from "./coords";
import type { RespawnReason } from "./respawn";
import type { PogoTuneOverrides } from "./tune";

export type PogoInputState = {
  readonly jump: boolean;
  readonly left: boolean;
  readonly right: boolean;
};

export type PogoSnapshot = {
  readonly body: Pose;
  readonly boostReady: boolean;
  readonly fixedStepHz: number;
  readonly grounded: boolean;
  readonly ouch: boolean;
  readonly physicsStepCount: number;
  readonly reachedGoal: boolean;
  readonly resetCount: number;
  readonly respawns: number;
  readonly tip: Pose;
};

export type TerrainPolyline = {
  readonly closed: boolean;
  readonly points: Array<Point2D>;
};

export type PogoSimulationConfig = {
  readonly goalZone: Box2D;
  readonly spawn: Point2D;
  readonly stageBounds: Box2D;
  readonly terrain: ReadonlyArray<TerrainPolyline>;
};

export type PogoSimulation = {
  readonly spawn: Point2D;
  step(dtMs: number, input: PogoInputState): PogoSnapshot;
  respawn(reason?: RespawnReason): void;
  setTune(overrides: PogoTuneOverrides): void;
  getTerrainPolylines(): Array<Array<Point2D>>;
  destroy(): void;
};
