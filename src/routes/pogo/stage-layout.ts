export const STAGE_WIDTH = 1840;
export const STAGE_HEIGHT = 1040;
export const START_PAD_Y = 860;
export const SPAWN = { x: 220, y: START_PAD_Y } as const;
export const GOAL_ZONE = {
  maxX: 1710,
  maxY: 170,
  minX: 1385,
  minY: 50,
} as const;
export const STAGE_BOUNDS = {
  maxX: 1760,
  maxY: 980,
  minX: 80,
  minY: 80,
} as const;
export const BODY_WIDTH = 18;
export const BODY_HEIGHT = 44;
export const STICK_WIDTH = 6;
export const TIP_SIZE = 10;
