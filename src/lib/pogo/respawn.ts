export type RespawnReason = "fall" | "manual";

export function shouldCountFall(reason: RespawnReason): boolean {
  return reason === "fall";
}
