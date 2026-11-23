import { afterEach, expect, test, vi } from "vite-plus/test";
import { pulseHaptic } from "./toc-haptics";

afterEach(() => vi.unstubAllGlobals());

test("navigator.vibrate が例外を投げても pulseHaptic は例外を伝播しない", () => {
  const vibrate = vi.fn(() => {
    throw new Error("vibration blocked");
  });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("navigator", { vibrate });

  expect(() => pulseHaptic()).not.toThrow();
  expect(vibrate).toHaveBeenCalledTimes(1);
});
