export type RapierApi = typeof import("@dimforge/rapier2d-compat");

let pending: Promise<RapierApi> | null = null;

export function loadRapier(): Promise<RapierApi> {
  pending ??= import("@dimforge/rapier2d-compat").then(async (module) => {
    await module.init();
    return module;
  });
  return pending;
}
