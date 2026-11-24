export const FIXED_STEP_HZ = 120;
export const FIXED_STEP_MS = 1000 / FIXED_STEP_HZ;
export const FIXED_STEP_SEC = 1 / FIXED_STEP_HZ;
export const MAX_FRAME_DT_MS = 50;
export const MAX_PHYSICS_STEPS_PER_FRAME = 8;

export const PIXELS_PER_METER = 100;
export const GRAVITY_M_PER_SEC2 = 16;

export const PLAYER_WIDTH = 18;
export const PLAYER_HEIGHT = 44;
export const BODY_TO_TIP_PX = 46;
export const TIP_RADIUS = 5;
export const TORSO_MASS_KG = 1;
export const STICK_MASS_KG = 0.15;
export const BODY_FRICTION = 0.45;
export const TIP_FRICTION = 0.05;

export const UNCHARGED_APEX_BODY_HEIGHTS = 2;
export const CHARGED_APEX_BODY_HEIGHTS = 5 / 1.5;
export const BOOST_APEX_BODY_HEIGHTS = 7 / 1.5;
export const UNCHARGED_APEX_PX = PLAYER_HEIGHT * UNCHARGED_APEX_BODY_HEIGHTS;
export const CHARGED_APEX_PX = PLAYER_HEIGHT * CHARGED_APEX_BODY_HEIGHTS;
export const BOOST_APEX_PX = PLAYER_HEIGHT * BOOST_APEX_BODY_HEIGHTS;

export const PRISMATIC_TRAVEL_PX = 30;
export const PRISMATIC_MIN_LENGTH_PX = BODY_TO_TIP_PX - PRISMATIC_TRAVEL_PX;
export const SPRING_CHARGE_STIFFNESS = 20_000;
export const SPRING_CHARGE_DAMPING = 400;
export const SPRING_LAUNCH_STIFFNESS = 2600;
export const SPRING_LAUNCH_DAMPING = 4;
export const SPRING_MOTOR_MAX_FORCE = 20_000;
export const PIVOT_RELEASE_EXTENSION_FRACTION = 0.5;

export const UNCHARGED_COMPRESSION_PX = 14;
export const CHARGED_COMPRESSION_PX = 18;
export const BOOST_COMPRESSION_PX = 24.5;

export const JUMP_PRE_LANDING_BUFFER_MS = 120;
export const CHARGE_FULL_MS = 45;

export const GROUND_CONTACT_BASE_MS = 90;
export const GROUND_CONTACT_FALL_MS_PER_100_PX_PER_SEC = 12;
export const GROUND_CONTACT_MAX_MS = 400;

export const ROTATION_MAX_DEG_PER_SEC = 480;
export const ROTATION_ACCEL_DEG_PER_SEC2 = 4800;
export const ROTATION_RELEASE_DECEL_DEG_PER_SEC2 = 4000;
export const BOUNCE_ANGULAR_KEEP = 0.7;

export const BOOST_ROTATION_DEGREES = 285;
export const TIP_ALIGN_MAX_ANGLE_DEG = 50;
export const TIP_PIVOT_MAX_SLOPE_DEG = 55;
export const TIP_PIVOT_MAX_FORCE_N = 60;

export const OUCH_BODY_LINEAR_KEEP = 0.05;
export const OUCH_BODY_RESTITUTION = 0;
export const OUCH_GLANCING_LINEAR_KEEP = 0.3;
export const OUCH_RESIDUAL_BOUNCE_SPEED_M_PER_SEC = 0.36;
export const OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC = 180;
export const OUCH_FLASH_MS = 260;

export const TERRAIN_SAMPLE_STEP_PX = 8;
export const TERRAIN_MIN_EDGE_PX = 2;

export const KILL_PLANE_MARGIN = 80;
export const CAMERA_PAN_SPEED = 420;
export const CAMERA_PAN_LIMIT = 320;
export const W_S_CAMERA_PAN = true;

export const GRID_CELL_PX = 40;
export const GRID_MIN_X = -4000;
export const GRID_MAX_X = 6000;
export const GRID_MIN_Y = -4000;
export const GRID_MAX_Y = 4000;
