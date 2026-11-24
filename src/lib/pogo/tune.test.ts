import { describe, expect, it } from "vite-plus/test";
import {
  CHARGE_FULL_MS,
  OUCH_BODY_RESTITUTION,
  UNCHARGED_COMPRESSION_PX,
} from "./constants";
import { defaultTunables, mergeTune } from "./tune";

describe("mergeTune", () => {
  it("returns constants-module defaults when given no overrides", () => {
    const merged = mergeTune();
    expect(merged).toEqual(defaultTunables());
    expect(merged.chargeFullMs).toBe(CHARGE_FULL_MS);
    expect(merged.unchargedCompressionPx).toBe(UNCHARGED_COMPRESSION_PX);
    expect(merged.ouchBodyRestitution).toBe(OUCH_BODY_RESTITUTION);
  });

  it("overrides only the provided keys and rereads defaults each call", () => {
    const first = mergeTune({ chargeFullMs: 90, ouchBodyRestitution: 0.8 });
    expect(first.chargeFullMs).toBe(90);
    expect(first.ouchBodyRestitution).toBe(0.8);
    expect(first.unchargedCompressionPx).toBe(UNCHARGED_COMPRESSION_PX);
    expect(mergeTune({ chargeFullMs: 20 }).ouchBodyRestitution).toBe(
      OUCH_BODY_RESTITUTION,
    );
    expect(mergeTune({}).chargeFullMs).toBe(CHARGE_FULL_MS);
  });
});
