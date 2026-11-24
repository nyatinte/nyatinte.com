import { describe, expect, it } from "vite-plus/test";
import {
  alignmentDegrees,
  isInsideBox,
  isOutsideKillBounds,
  lerpPose,
  metersToPx,
  pogoUpVector,
  pxToMeters,
  rapierAngleToStage,
  rapierPointToStage,
  rapierVelocityToStage,
  stageAngleToRapier,
  stagePointToRapier,
  stageVelocityToRapier,
} from "./coords";

describe("pixel and meter conversion", () => {
  it("round trips pixels through meters", () => {
    for (const px of [0, 1, 46, 205.5, -120]) {
      expect(metersToPx(pxToMeters(px))).toBeCloseTo(px, 9);
    }
  });

  it("flips the Y axis between stage and Rapier", () => {
    expect(stagePointToRapier({ x: 220, y: 860 })).toEqual({ x: 2.2, y: -8.6 });
    const roundTrip = rapierPointToStage({ x: 2.2, y: -8.6 });
    expect(roundTrip.x).toBeCloseTo(220, 9);
    expect(roundTrip.y).toBeCloseTo(860, 9);
    const velocity = rapierVelocityToStage(
      stageVelocityToRapier({ x: -200, y: 400 }),
    );
    expect(velocity.x).toBeCloseTo(-200, 9);
    expect(velocity.y).toBeCloseTo(400, 9);
  });

  it("flips the rotation sign between screen and Rapier", () => {
    expect(rapierAngleToStage(stageAngleToRapier(0.4))).toBeCloseTo(0.4, 12);
    expect(stageAngleToRapier(0.4)).toBeCloseTo(-0.4, 12);
  });
});

describe("pogo orientation", () => {
  it("points up when upright", () => {
    const up = pogoUpVector(0);
    expect(up.x).toBeCloseTo(0, 12);
    expect(up.y).toBeCloseTo(1, 12);
  });

  it("measures tip alignment against the ground normal", () => {
    const up = { x: 0, y: 1 };
    expect(alignmentDegrees(0, up)).toBeCloseTo(0, 9);
    expect(alignmentDegrees(Math.PI / 4, up)).toBeCloseTo(45, 6);
    expect(alignmentDegrees(-Math.PI / 4, up)).toBeCloseTo(45, 6);
    expect(alignmentDegrees(0, { x: 1, y: 0 })).toBeCloseTo(90, 6);
  });
});

describe("stage bounds", () => {
  const box = { minX: 80, maxX: 1760, minY: 80, maxY: 980 };

  it("only reports points inside the inclusive box", () => {
    expect(isInsideBox({ x: 80, y: 980 }, box)).toBe(true);
    expect(isInsideBox({ x: 79, y: 500 }, box)).toBe(false);
  });

  it("kills only points past the margin", () => {
    expect(isOutsideKillBounds({ x: 500, y: 1060 }, box, 80)).toBe(false);
    expect(isOutsideKillBounds({ x: 500, y: 1061 }, box, 80)).toBe(true);
    expect(isOutsideKillBounds({ x: 1, y: 500 }, box, 80)).toBe(false);
    expect(isOutsideKillBounds({ x: -1, y: 500 }, box, 80)).toBe(true);
  });
});

describe("pose interpolation", () => {
  it("interpolates position and the short angle arc", () => {
    const pose = lerpPose(
      { angleRad: (170 * Math.PI) / 180, x: 0, y: 0 },
      { angleRad: (-170 * Math.PI) / 180, x: 10, y: 20 },
      0.5,
    );
    expect(pose.x).toBe(5);
    expect(pose.y).toBe(10);
    expect(Math.abs(pose.angleRad)).toBeCloseTo(Math.PI, 6);
  });
});
