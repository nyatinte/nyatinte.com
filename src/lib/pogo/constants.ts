import { computeBounceSpeedForApexPx, type JumpModel } from "./jump";

export const FIXED_STEP_HZ = 120;
export const FIXED_STEP_MS = 1000 / FIXED_STEP_HZ;
export const MAX_FRAME_DT_MS = 50;
export const MAX_PHYSICS_STEPS_PER_FRAME = 8;
export const MATTER_BASE_DELTA_MS = 1000 / 60;
export const MATTER_GRAVITY_SCALE = 0.001;

export const GRAVITY_Y = 1.6;
export const PLAYER_WIDTH = 18;
export const PLAYER_HEIGHT = 44;
export const STICK_LENGTH = 36;
export const TIP_RADIUS = 5;
export const PLAYER_FRICTION_AIR = 0;

const JUMP_MODEL: JumpModel = {
  baseDeltaMs: MATTER_BASE_DELTA_MS,
  gravityScale: MATTER_GRAVITY_SCALE,
  gravityY: GRAVITY_Y,
  stepMs: FIXED_STEP_MS,
};

export const UNCHARGED_APEX_BODY_HEIGHTS = 2;
export const CHARGED_APEX_BODY_HEIGHTS = 5 / 1.5;
export const BOOST_APEX_BODY_HEIGHTS = 7 / 1.5;

export const UNCHARGED_APEX_PX = PLAYER_HEIGHT * UNCHARGED_APEX_BODY_HEIGHTS;
export const CHARGED_APEX_PX = PLAYER_HEIGHT * CHARGED_APEX_BODY_HEIGHTS;
export const BOOST_APEX_PX = PLAYER_HEIGHT * BOOST_APEX_BODY_HEIGHTS;

export const AUTO_BOUNCE_SPEED = computeBounceSpeedForApexPx(
  UNCHARGED_APEX_PX,
  JUMP_MODEL,
);
export const CHARGED_BOUNCE_SPEED = computeBounceSpeedForApexPx(
  CHARGED_APEX_PX,
  JUMP_MODEL,
);
export const BOOST_BOUNCE_SPEED = computeBounceSpeedForApexPx(
  BOOST_APEX_PX,
  JUMP_MODEL,
);
export const BOOST_BOUNCE_MULTIPLIER =
  BOOST_BOUNCE_SPEED / CHARGED_BOUNCE_SPEED;
export const MAX_BOUNCE_SPEED = BOOST_BOUNCE_SPEED;
export const FALL_SPEED_BOUNCE_SCALE = 0.35;

export const ROTATION_MAX_DEG_PER_SEC = 480;
export const ROTATION_ACCEL_DEG_PER_SEC2 = 4800;
export const ROTATION_RELEASE_DECEL_DEG_PER_SEC2 = 4000;
export const BOUNCE_ANGULAR_KEEP = 0.7;

export const BOOST_ROTATION_DEGREES = 285;
export const TIP_ALIGN_MAX_ANGLE_DEG = 50;
export const TIP_FRICTION = 0.05;
export const BODY_FRICTION = 0.45;
export const OUCH_BODY_LINEAR_KEEP = 0.05;
export const OUCH_GLANCING_LINEAR_KEEP = 0.3;
export const OUCH_RESIDUAL_BOUNCE_SPEED = 0.6;
export const OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC = 180;
export const OUCH_FLASH_MS = 260;
export const COMPRESSION_HORIZONTAL_DAMP = 0.75;
export const GROUND_CONTACT_BASE_MS = 90;
export const GROUND_CONTACT_FALL_MS_PER_SPEED = 12;

export const PATH_SAMPLE_SPACING = 8;
export const KILL_PLANE_MARGIN = 80;
export const CAMERA_PAN_SPEED = 420;
export const CAMERA_PAN_LIMIT = 320;
export const W_S_CAMERA_PAN = true;

export const GRID_CELL_PX = 40;
export const GRID_MIN_X = -4000;
export const GRID_MAX_X = 6000;
export const GRID_MIN_Y = -4000;
export const GRID_MAX_Y = 4000;
