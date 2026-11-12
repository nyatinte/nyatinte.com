// Android Chrome/Edge supports vibration after a gesture; Firefox Android does not.
// iOS Safari has no Vibration API: switch ticks may work on trusted taps (and
// scripted toggles on 17.4–26.4); drag is likely silent on 26.5+. Desktop is a no-op.
export function pulseHaptic() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
      return;
    }
    const input =
      document.querySelector<HTMLInputElement>("#toc-haptic-switch");
    if (input) {
      input.checked = !input.checked;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  } catch {
    // Haptics are best-effort and must never block navigation.
  }
}
