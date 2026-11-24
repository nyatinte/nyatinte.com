import { describe, expect, it } from "vite-plus/test";
import {
  accumulateAirborneRotation,
  cancelBoost,
  consumeBoostOnLaunch,
  createBoostState,
  handleContactBoost,
} from "./boost";
import { BOOST_ROTATION_DEGREES } from "./constants";

describe("boost state accumulation", () => {
  it("does not arm below the threshold", () => {
    const state = accumulateAirborneRotation(
      createBoostState(),
      BOOST_ROTATION_DEGREES - 1,
    );
    expect(state.ready).toBe(false);
  });

  it("arms on a clockwise rotation reaching 285 degrees", () => {
    const step1 = accumulateAirborneRotation(createBoostState(), 140);
    const step2 = accumulateAirborneRotation(step1, 145);
    expect(step2.ready).toBe(true);
  });

  it("arms on a counter-clockwise rotation reaching -285 degrees", () => {
    const state = accumulateAirborneRotation(
      createBoostState(),
      -BOOST_ROTATION_DEGREES,
    );
    expect(state.ready).toBe(true);
  });

  it("does not arm when wiggling back and forth without net 285 degrees", () => {
    let state = createBoostState();
    state = accumulateAirborneRotation(state, 180);
    state = accumulateAirborneRotation(state, -180);
    state = accumulateAirborneRotation(state, 180);
    expect(state.ready).toBe(false);
  });

  it("stays ready on minor counter-rotation or extra rotation past 285 degrees", () => {
    let state = accumulateAirborneRotation(createBoostState(), 290);
    expect(state.ready).toBe(true);

    state = accumulateAirborneRotation(state, -40);
    expect(state.ready).toBe(true);

    state = accumulateAirborneRotation(state, 720);
    expect(state.ready).toBe(true);
  });
});

describe("boost cancellation and launch consumption", () => {
  it("cancels boost on non-tip contact even when jump is held", () => {
    const armed = accumulateAirborneRotation(
      createBoostState(),
      BOOST_ROTATION_DEGREES,
    );
    const afterBodyHit = handleContactBoost(armed, {
      isTipContact: false,
      jumpHeld: true,
    });
    expect(afterBodyHit.ready).toBe(false);
    expect(afterBodyHit.accumulatedDeg).toBe(0);
  });

  it("cancels boost if jump is released during tip contact and does not restore on re-press", () => {
    const armed = accumulateAirborneRotation(
      createBoostState(),
      BOOST_ROTATION_DEGREES,
    );
    const released = handleContactBoost(armed, {
      isTipContact: true,
      jumpHeld: false,
    });
    expect(released.ready).toBe(false);

    const repressed = handleContactBoost(released, {
      isTipContact: true,
      jumpHeld: true,
    });
    expect(repressed.ready).toBe(false);
  });

  it("keeps boost armed while tip is in contact and jump stays held", () => {
    const armed = accumulateAirborneRotation(
      createBoostState(),
      BOOST_ROTATION_DEGREES,
    );
    const held = handleContactBoost(armed, {
      isTipContact: true,
      jumpHeld: true,
    });
    expect(held.ready).toBe(true);
  });

  it("consumes boost on launch when jump is held and resets state", () => {
    const armed = accumulateAirborneRotation(
      createBoostState(),
      BOOST_ROTATION_DEGREES,
    );
    const { boosted, nextState } = consumeBoostOnLaunch(armed, true);
    expect(boosted).toBe(true);
    expect(nextState).toEqual({ accumulatedDeg: 0, ready: false });
  });

  it("does not fire boost on launch when jump is released", () => {
    const armed = accumulateAirborneRotation(
      createBoostState(),
      BOOST_ROTATION_DEGREES,
    );
    const { boosted, nextState } = consumeBoostOnLaunch(armed, false);
    expect(boosted).toBe(false);
    expect(nextState).toEqual({ accumulatedDeg: 0, ready: false });
  });

  it("resets to unarmed state on cancelBoost", () => {
    expect(cancelBoost()).toEqual({ accumulatedDeg: 0, ready: false });
  });
});
