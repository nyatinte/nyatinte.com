export type RapierApi = typeof import("@dimforge/rapier2d");

let pending: Promise<RapierApi> | null = null;

export function loadRapier(): Promise<RapierApi> {
  pending ??= import("@dimforge/rapier2d");
  return pending;
}
