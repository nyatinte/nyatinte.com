import { describe, expect, it } from "vite-plus/test";
import {
  MATTER_BASE_DELTA_MS,
  ROTATION_ACCEL_DEG_PER_SEC2,
  ROTATION_MAX_DEG_PER_SEC,
  ROTATION_RELEASE_DECEL_DEG_PER_SEC2,
} from "./constants";
import {
  degPerSecToMatterAngularVelocity,
  lerpAngleShortArc,
  lerpPose,
  matterAngularVelocityToDegPerSec,
  stepAngularVelocity,
  type RotationModel,
} from "./rotation";

const MODEL: RotationModel = {
  accelDegPerSec2: ROTATION_ACCEL_DEG_PER_SEC2,
  maxDegPerSec: ROTATION_MAX_DEG_PER_SEC,
  releaseDecelDegPerSec2: ROTATION_RELEASE_DECEL_DEG_PER_SEC2,
};

const DEG_TO_RAD = Math.PI / 180;

describe("stepAngularVelocity", () => {
  it("accelerates to the maximum in about 0.1 seconds and clamps there", () => {
    let degPerSec = 0;
    for (let i = 0; i < 10; i += 1) {
      degPerSec = stepAngularVelocity(degPerSec, 1, 0.01, MODEL);
    }
    expect(degPerSec).toBe(ROTATION_MAX_DEG_PER_SEC);

    for (let i = 0; i < 10; i += 1) {
      degPerSec = stepAngularVelocity(degPerSec, 1, 0.01, MODEL);
    }
    expect(degPerSec).toBe(ROTATION_MAX_DEG_PER_SEC);
  });

  it("decays to rest in about 0.12 seconds after release without overshoot", () => {
    let degPerSec = ROTATION_MAX_DEG_PER_SEC;
    for (let i = 0; i < 12; i += 1) {
      degPerSec = stepAngularVelocity(degPerSec, 0, 0.01, MODEL);
    }
    expect(degPerSec).toBe(0);

    degPerSec = stepAngularVelocity(0, 0, 0.1, MODEL);
    expect(degPerSec).toBe(0);
  });

  it("reverses through zero on opposite input", () => {
    const decelerated = stepAngularVelocity(
      ROTATION_MAX_DEG_PER_SEC,
      -1,
      0.1,
      MODEL,
    );
    expect(decelerated).toBe(0);

    const reversed = stepAngularVelocity(decelerated, -1, 0.1, MODEL);
    expect(reversed).toBe(-ROTATION_MAX_DEG_PER_SEC);
  });

  it("maps analog input to a proportional target speed", () => {
    let degPerSec = 0;
    for (let i = 0; i < 20; i += 1) {
      degPerSec = stepAngularVelocity(degPerSec, 0.5, 0.01, MODEL);
    }
    expect(degPerSec).toBe(ROTATION_MAX_DEG_PER_SEC / 2);
  });

  it("eases a spin that is faster than the maximum back toward the target", () => {
    const eased = stepAngularVelocity(2000, 0, 0.01, MODEL);
    expect(eased).toBeGreaterThan(ROTATION_MAX_DEG_PER_SEC);
    expect(eased).toBe(2000 - ROTATION_RELEASE_DECEL_DEG_PER_SEC2 * 0.01);

    const towardMax = stepAngularVelocity(2000, 1, 0.01, MODEL);
    expect(towardMax).toBeLessThan(2000);
    expect(towardMax).toBeGreaterThan(ROTATION_MAX_DEG_PER_SEC);
  });
});

describe("matter angular velocity conversion", () => {
  it("round trips degrees per second", () => {
    for (const degPerSec of [0, 120, 480, -480]) {
      const omega = degPerSecToMatterAngularVelocity(degPerSec);
      expect(matterAngularVelocityToDegPerSec(omega)).toBeCloseTo(degPerSec, 6);
    }
    expect(
      degPerSecToMatterAngularVelocity((360 * 1000) / MATTER_BASE_DELTA_MS),
    ).toBeCloseTo(2 * Math.PI, 6);
  });
});

describe("pose interpolation", () => {
  it("takes the short arc across the wrap point", () => {
    const from = 170 * DEG_TO_RAD;
    const to = -170 * DEG_TO_RAD;
    const halfway = lerpAngleShortArc(from, to, 0.5);
    expect(Math.abs(halfway)).toBeCloseTo(Math.PI, 6);
  });

  it("interpolates position and angle between physics states", () => {
    const pose = lerpPose(
      { angleRad: 0, x: 0, y: 0 },
      { angleRad: Math.PI / 2, x: 10, y: 20 },
      0.5,
    );
    expect(pose.x).toBe(5);
    expect(pose.y).toBe(10);
    expect(pose.angleRad).toBeCloseTo(Math.PI / 4, 6);
  });
});
