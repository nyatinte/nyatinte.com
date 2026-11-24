import { BOOST_ROTATION_DEGREES } from "./constants";

export type BoostState = {
  readonly accumulatedDeg: number;
  readonly ready: boolean;
};

export function createBoostState(): BoostState {
  return {
    accumulatedDeg: 0,
    ready: false,
  };
}

export function accumulateAirborneRotation(
  state: BoostState,
  deltaDeg: number,
  thresholdDeg = BOOST_ROTATION_DEGREES,
): BoostState {
  const accumulatedDeg = state.accumulatedDeg + deltaDeg;
  return {
    accumulatedDeg,
    ready: state.ready || Math.abs(accumulatedDeg) >= thresholdDeg,
  };
}

export function cancelBoost(): BoostState {
  return createBoostState();
}

export function handleContactBoost(
  state: BoostState,
  options: { readonly isTipContact: boolean; readonly jumpHeld: boolean },
): BoostState {
  if (!options.isTipContact || !options.jumpHeld) {
    return cancelBoost();
  }
  return state;
}

export type LaunchBoostResult = {
  readonly boosted: boolean;
  readonly nextState: BoostState;
};

export function consumeBoostOnLaunch(
  state: BoostState,
  jumpHeld: boolean,
): LaunchBoostResult {
  return {
    boosted: state.ready && jumpHeld,
    nextState: createBoostState(),
  };
}
