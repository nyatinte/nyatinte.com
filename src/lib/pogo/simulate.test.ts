import { beforeAll, describe, expect, it } from "vite-plus/test";
import {
  BOOST_APEX_PX,
  CHARGED_APEX_PX,
  FIXED_STEP_HZ,
  FIXED_STEP_MS,
  UNCHARGED_APEX_PX,
} from "./constants";
import type { Point2D } from "./coords";
import { loadRapier } from "./rapier-load";
import { createPogoSimulation } from "./simulate";
import type {
  PogoInputState,
  PogoSimulation,
  PogoSimulationConfig,
} from "./simulate-types";

const PAD_Y = 300;
const SPAWN = { x: 200, y: PAD_Y };
const INPUT_NONE: PogoInputState = { jump: false, left: false, right: false };
const INPUT_HOLD: PogoInputState = { jump: true, left: false, right: false };
const INPUT_HOLD_RIGHT: PogoInputState = {
  jump: true,
  left: false,
  right: true,
};
const GOAL_ZONE = { maxX: 0, maxY: 0, minX: 0, minY: 0 };
const STAGE_BOUNDS = { maxX: 1760, maxY: 980, minX: 80, minY: 80 };

function flatPad(): Array<Point2D> {
  return [
    { x: 0, y: PAD_Y },
    { x: 400, y: PAD_Y },
  ];
}

function config(points: Array<Point2D> = flatPad()): PogoSimulationConfig {
  return {
    goalZone: GOAL_ZONE,
    spawn: SPAWN,
    stageBounds: STAGE_BOUNDS,
    terrain: [{ closed: false, points }],
  };
}

type Flight = {
  readonly apexPx: number;
  readonly groundedSteps: number;
  readonly takeoffAngleRad: number;
  readonly takeoffTipX: number;
  readonly tipDriftPx: number;
};

function firstFlight(
  sim: PogoSimulation,
  input: PogoInputState | ((step: number) => PogoInputState),
): Flight {
  let grounded = true;
  let groundBodyY: number | null = null;
  let takeoffTipX = 0;
  let takeoffAngleRad = 0;
  let groundedTipX = 0;
  let tipDriftPx = 0;
  let groundedSteps = 0;
  let apexBodyY = Number.POSITIVE_INFINITY;

  for (let step = 0; step < 2400; step += 1) {
    const snapshot = sim.step(
      FIXED_STEP_MS,
      typeof input === "function" ? input(step) : input,
    );
    if (grounded) {
      if (!snapshot.grounded) {
        grounded = false;
        continue;
      }
      groundBodyY ??= snapshot.body.y;
      takeoffTipX = snapshot.tip.x;
      takeoffAngleRad = snapshot.body.angleRad;
      if (groundedSteps === 0) {
        groundedTipX = snapshot.tip.x;
      }
      tipDriftPx = Math.max(
        tipDriftPx,
        Math.abs(snapshot.tip.x - groundedTipX),
      );
      groundedSteps += 1;
      continue;
    }
    apexBodyY = Math.min(apexBodyY, snapshot.body.y);
    if (snapshot.grounded) {
      break;
    }
  }

  return {
    apexPx: (groundBodyY ?? 0) - apexBodyY,
    groundedSteps,
    takeoffAngleRad,
    takeoffTipX,
    tipDriftPx,
  };
}

async function withSim(
  input: (sim: PogoSimulation) => void | Promise<void>,
  terrain: Array<Point2D> = flatPad(),
): Promise<void> {
  const sim = await createPogoSimulation(config(terrain));
  try {
    await input(sim);
  } finally {
    sim.destroy();
  }
}

beforeAll(async () => {
  await loadRapier();
});

describe("Rapier pogo cycle", () => {
  it("auto-bounces to the uncharged height goal", async () => {
    await withSim((sim) => {
      const flight = firstFlight(sim, INPUT_NONE);
      expect(flight.apexPx).toBeCloseTo(UNCHARGED_APEX_PX, -1);
      expect(flight.apexPx).toBeGreaterThan(UNCHARGED_APEX_PX * 0.85);
      expect(flight.apexPx).toBeLessThan(UNCHARGED_APEX_PX * 1.15);
    });
  });

  it("hops higher when Space is held through the contact", async () => {
    await withSim((sim) => {
      const flight = firstFlight(sim, INPUT_HOLD);
      expect(flight.apexPx).toBeGreaterThan(UNCHARGED_APEX_PX * 1.3);
      expect(flight.apexPx).toBeCloseTo(CHARGED_APEX_PX, -1);
      expect(flight.apexPx).toBeLessThan(BOOST_APEX_PX);
    });
  });

  it("gives a shorter hop when Space is released early", async () => {
    await withSim((sim) => {
      const early = firstFlight(sim, (step) => ({
        ...INPUT_HOLD,
        jump: step < 3,
      }));
      expect(early.apexPx).toBeLessThan(CHARGED_APEX_PX * 0.9);
      expect(early.apexPx).toBeGreaterThan(UNCHARGED_APEX_PX * 0.5);
    });
  });

  it("keeps the grounded tip pinned while rotating", async () => {
    await withSim((sim) => {
      const flight = firstFlight(sim, INPUT_HOLD_RIGHT);
      expect(flight.groundedSteps).toBeGreaterThan(4);
      expect(flight.tipDriftPx).toBeLessThan(3);
      expect(Math.abs(flight.takeoffAngleRad)).toBeGreaterThan(0.2);
    });
  });

  it("releases the tip pivot after takeoff", async () => {
    const sim = await createPogoSimulation(config());
    try {
      const flight = firstFlight(sim, INPUT_HOLD_RIGHT);
      let tipX = flight.takeoffTipX;
      for (let step = 0; step < 40; step += 1) {
        tipX = sim.step(FIXED_STEP_MS, INPUT_HOLD_RIGHT).tip.x;
      }
      expect(Math.abs(tipX - flight.takeoffTipX)).toBeGreaterThan(10);
    } finally {
      sim.destroy();
    }
  });

  it("keeps auto-bouncing after a manual respawn without counting a fall", async () => {
    await withSim((sim) => {
      firstFlight(sim, INPUT_NONE);
      sim.respawn("manual");
      const afterReset = firstFlight(sim, INPUT_NONE);
      const snapshot = sim.step(FIXED_STEP_MS, INPUT_NONE);
      expect(snapshot.respawns).toBe(0);
      expect(afterReset.apexPx).toBeGreaterThan(UNCHARGED_APEX_PX * 0.85);
    });
  });

  it("counts a kill-plane fall but not a manual reset", async () => {
    await withSim((sim) => {
      sim.respawn("manual");
      const manual = sim.step(FIXED_STEP_MS, INPUT_NONE);
      expect(manual.respawns).toBe(0);
      sim.respawn("fall");
      const fall = sim.step(FIXED_STEP_MS, INPUT_NONE);
      expect(fall.respawns).toBe(1);
    });
  });

  it("runs the fixed step at 120Hz and exposes the terrain polylines", async () => {
    await withSim((sim) => {
      const start = sim.step(FIXED_STEP_MS, INPUT_NONE).physicsStepCount;
      for (let step = 0; step < FIXED_STEP_HZ; step += 1) {
        sim.step(FIXED_STEP_MS, INPUT_NONE);
      }
      const snapshot = sim.step(FIXED_STEP_MS, INPUT_NONE);
      expect(snapshot.physicsStepCount).toBe(start + FIXED_STEP_HZ + 1);
      expect(snapshot.fixedStepHz).toBe(FIXED_STEP_HZ);
      expect(sim.getTerrainPolylines()).toHaveLength(1);
    });
  });
});
