import { describe, expect, it } from "vite-plus/test";
import {
  OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC,
  TIP_ALIGN_MAX_ANGLE_DEG,
} from "./constants";
import { classifyLanding, resolveLanding } from "./landing";

const UP_NORMAL = { x: 0, y: -1 };

describe("classifyLanding", () => {
  it("classifies body contact as ouch regardless of angle", () => {
    expect(classifyLanding("body", 0)).toBe("ouch");
    expect(classifyLanding("body", 15)).toBe("ouch");
  });

  it("classifies tip contact within alignment threshold as clean", () => {
    expect(classifyLanding("tip", 0)).toBe("clean");
    expect(classifyLanding("tip", TIP_ALIGN_MAX_ANGLE_DEG)).toBe("clean");
    expect(classifyLanding("tip", -TIP_ALIGN_MAX_ANGLE_DEG)).toBe("clean");
  });

  it("classifies tip contact beyond alignment threshold as glancing", () => {
    expect(classifyLanding("tip", TIP_ALIGN_MAX_ANGLE_DEG + 0.1)).toBe(
      "glancing",
    );
    expect(classifyLanding("tip", -TIP_ALIGN_MAX_ANGLE_DEG - 10)).toBe(
      "glancing",
    );
  });
});

describe("resolveLanding", () => {
  it("starts the bounce cycle on a clean tip landing", () => {
    const velocity = { x: 3, y: 12 };
    const result = resolveLanding({
      alignmentAngleDeg: 10,
      angularVelocityDegPerSec: 240,
      contactPart: "tip",
      normal: UP_NORMAL,
      rotationInput: 1,
      velocity,
    });

    expect(result.outcome).toBe("clean");
    expect(result.startBounceCycle).toBe(true);
    expect(result.cancelBoost).toBe(false);
    expect(result.velocity).toEqual(velocity);
    expect(result.angularVelocityDegPerSec).toBe(240);
  });

  it("kills nearly all momentum and cancels boost on a body hit", () => {
    const result = resolveLanding({
      alignmentAngleDeg: 90,
      angularVelocityDegPerSec: 100,
      contactPart: "body",
      normal: UP_NORMAL,
      rotationInput: 0,
      velocity: { x: 10, y: 20 },
    });

    expect(result.outcome).toBe("ouch");
    expect(result.startBounceCycle).toBe(false);
    expect(result.cancelBoost).toBe(true);
    expect(Math.hypot(result.velocity.x, result.velocity.y)).toBeLessThan(1);
    expect(
      result.velocity.x * UP_NORMAL.x + result.velocity.y * UP_NORMAL.y,
    ).toBeGreaterThan(0);
  });

  it("keeps the body tumbling instead of resetting the angle", () => {
    const result = resolveLanding({
      alignmentAngleDeg: 90,
      angularVelocityDegPerSec: 100,
      contactPart: "body",
      normal: UP_NORMAL,
      rotationInput: 0,
      velocity: { x: 10, y: 20 },
    });

    expect(result.angularVelocityDegPerSec).toBe(
      100 + OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC,
    );
  });

  it("uses initial input to choose the tumble direction", () => {
    const left = resolveLanding({
      alignmentAngleDeg: 90,
      angularVelocityDegPerSec: 0,
      contactPart: "body",
      normal: UP_NORMAL,
      rotationInput: -1,
      velocity: { x: 10, y: 20 },
    });
    const right = resolveLanding({
      alignmentAngleDeg: 90,
      angularVelocityDegPerSec: 0,
      contactPart: "body",
      normal: UP_NORMAL,
      rotationInput: 1,
      velocity: { x: 10, y: 20 },
    });

    expect(left.angularVelocityDegPerSec).toBe(
      -OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC,
    );
    expect(right.angularVelocityDegPerSec).toBe(
      OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC,
    );
  });

  it("keeps more momentum on a glancing tip hit than on a body hit", () => {
    const common = {
      alignmentAngleDeg: TIP_ALIGN_MAX_ANGLE_DEG + 10,
      angularVelocityDegPerSec: 100,
      normal: UP_NORMAL,
      rotationInput: 0,
      velocity: { x: 10, y: 20 },
    } as const;
    const glancing = resolveLanding({ ...common, contactPart: "tip" });
    const body = resolveLanding({ ...common, contactPart: "body" });

    expect(glancing.outcome).toBe("glancing");
    expect(glancing.startBounceCycle).toBe(false);
    expect(glancing.cancelBoost).toBe(true);
    expect(glancing.angularVelocityDegPerSec).toBe(100);
    expect(
      Math.hypot(glancing.velocity.x, glancing.velocity.y),
    ).toBeGreaterThan(Math.hypot(body.velocity.x, body.velocity.y) * 3);
    expect(
      glancing.velocity.x * UP_NORMAL.x + glancing.velocity.y * UP_NORMAL.y,
    ).toBeGreaterThan(0);
    expect(
      body.velocity.x * UP_NORMAL.x + body.velocity.y * UP_NORMAL.y,
    ).toBeGreaterThan(0);
  });
});
