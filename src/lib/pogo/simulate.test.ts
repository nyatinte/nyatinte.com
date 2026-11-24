import Matter from "matter-js";
import { describe, expect, it } from "vite-plus/test";
import {
  BOOST_APEX_PX,
  BOOST_BOUNCE_SPEED,
  CHARGED_APEX_PX,
  CHARGED_BOUNCE_SPEED,
  FIXED_STEP_HZ,
  FIXED_STEP_MS,
  GRAVITY_Y,
  MAX_PHYSICS_STEPS_PER_FRAME,
  UNCHARGED_APEX_PX,
  AUTO_BOUNCE_SPEED,
} from "./constants";
import type { Point2D } from "./svg-terrain";
import { createPogoSimulation } from "./simulate";
import type { PogoSimulationConfig } from "./simulate-types";
import { computeLaunchVelocity, createPlayerRig } from "./simulate-bodies";

const INPUT_NONE = { jump: false, left: false, right: false };
const INPUT_RIGHT = { jump: false, left: false, right: true };
const GOAL_ZONE = { maxX: 0, maxY: 0, minX: 0, minY: 0 };
const OPEN_BOUNDS = {
  maxX: 1000,
  maxY: 100_000,
  minX: -1000,
  minY: -1000,
};
const START_PAD_Y = 860;
const PAD: Array<Point2D> = [
  { x: -500, y: START_PAD_Y },
  { x: 1000, y: START_PAD_Y },
  { x: 1000, y: 1000 },
  { x: -500, y: 1000 },
];

function config(
  overrides: Partial<PogoSimulationConfig> = {},
): PogoSimulationConfig {
  return {
    goalZone: GOAL_ZONE,
    spawn: { x: 220, y: START_PAD_Y },
    stageBounds: OPEN_BOUNDS,
    terrainPolygons: [],
    ...overrides,
  };
}

function measureApex(speed: number): number {
  const engine = Matter.Engine.create();
  engine.gravity.x = 0;
  engine.gravity.y = GRAVITY_Y;
  const rig = createPlayerRig({ x: 0, y: 0 });
  Matter.Composite.add(engine.world, rig.player);
  Matter.Body.setVelocity(rig.player, computeLaunchVelocity(0, speed));
  const startY = rig.player.position.y;
  let minY = startY;

  for (let step = 0; step < FIXED_STEP_HZ * 3; step += 1) {
    Matter.Engine.update(engine, FIXED_STEP_MS);
    minY = Math.min(minY, rig.player.position.y);
  }

  Matter.Engine.clear(engine);
  return startY - minY;
}

describe("fixed step accumulator", () => {
  it("runs two 120Hz steps for one 60Hz frame and none for a tiny frame", () => {
    const sim = createPogoSimulation(config());
    const twoSteps = sim.step(FIXED_STEP_MS * 2, INPUT_NONE);
    expect(twoSteps.physicsStepCount).toBe(2);
    expect(twoSteps.fixedStepHz).toBe(FIXED_STEP_HZ);

    const noSteps = sim.step(4, INPUT_NONE);
    expect(noSteps.physicsStepCount).toBe(2);
    expect(Number.isFinite(noSteps.x)).toBe(true);
    expect(Number.isFinite(noSteps.angleRad)).toBe(true);
    sim.destroy();
  });

  it("clamps a long frame to the step cap instead of spiralling", () => {
    const sim = createPogoSimulation(config());
    sim.step(FIXED_STEP_MS * 2, INPUT_NONE);
    const longFrame = sim.step(5000, INPUT_NONE);
    const steps = longFrame.physicsStepCount - 2;

    expect(steps).toBeGreaterThanOrEqual(5);
    expect(steps).toBeLessThanOrEqual(MAX_PHYSICS_STEPS_PER_FRAME);
    sim.destroy();
  });
});

describe("jump heights in the real 120Hz Matter engine", () => {
  it("reaches the body-height targets", () => {
    expect(measureApex(AUTO_BOUNCE_SPEED)).toBeCloseTo(UNCHARGED_APEX_PX, 0);
    expect(measureApex(CHARGED_BOUNCE_SPEED)).toBeCloseTo(CHARGED_APEX_PX, 0);
    expect(measureApex(BOOST_BOUNCE_SPEED)).toBeCloseTo(BOOST_APEX_PX, 0);
  });
});

describe("rotation in the real 120Hz engine", () => {
  it("turns at the requested angular speed without doubling it", () => {
    const sim = createPogoSimulation(config({ spawn: { x: 0, y: 0 } }));
    let snapshot = sim.step(0, INPUT_NONE);
    for (let step = 0; step < 60; step += 1) {
      snapshot = sim.step(FIXED_STEP_MS, INPUT_RIGHT);
    }
    const rotatedDeg = (snapshot.angleRad * 180) / Math.PI;

    expect(rotatedDeg).toBeGreaterThan(200);
    expect(rotatedDeg).toBeLessThan(235);
    sim.destroy();
  });
});

describe("spawn and fall counter", () => {
  it("spawns resting on the pad so holding a direction lands cleanly", () => {
    const sim = createPogoSimulation(config({ terrainPolygons: [PAD] }));
    let sawOuch = false;
    let respawns = 0;

    for (let step = 0; step < 60; step += 1) {
      const snapshot = sim.step(FIXED_STEP_MS, INPUT_RIGHT);
      sawOuch ||= snapshot.ouch;
      respawns = snapshot.respawns;
    }

    expect(sawOuch).toBe(false);
    expect(respawns).toBe(0);
    sim.destroy();
  });

  it("counts only the kill-plane fall, not manual resets", () => {
    const sim = createPogoSimulation(
      config({
        spawn: { x: 0, y: 0 },
        stageBounds: { maxX: 1000, maxY: 100, minX: -1000, minY: -1000 },
      }),
    );
    expect(sim.step(0, INPUT_NONE).respawns).toBe(0);

    sim.respawn();
    const manual = sim.step(0, INPUT_NONE);
    expect(manual.respawns).toBe(0);
    expect(manual.resetCount).toBe(1);

    let fell = 0;
    for (let step = 0; step < 200 && fell === 0; step += 1) {
      fell = sim.step(FIXED_STEP_MS, INPUT_NONE).respawns;
    }
    expect(fell).toBe(1);

    sim.respawn();
    expect(sim.step(0, INPUT_NONE).respawns).toBe(1);
    sim.destroy();
  });

  it("exposes terrain vertices for the debug overlay", () => {
    const sim = createPogoSimulation(config({ terrainPolygons: [PAD] }));
    const polygons = sim.getTerrainPolygons();
    expect(polygons).toHaveLength(1);
    expect(polygons[0]).toHaveLength(4);
    for (const point of polygons[0] ?? []) {
      expect(point.x).toBeGreaterThanOrEqual(-500);
      expect(point.x).toBeLessThanOrEqual(1000);
      expect(point.y).toBeGreaterThanOrEqual(START_PAD_Y);
    }
    sim.destroy();
  });
});
