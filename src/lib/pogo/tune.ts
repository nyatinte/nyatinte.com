import {
  BOOST_COMPRESSION_PX,
  CHARGED_COMPRESSION_PX,
  CHARGE_FULL_MS,
  GROUND_CONTACT_BASE_MS,
  GROUND_CONTACT_FALL_MS_PER_100_PX_PER_SEC,
  GROUND_CONTACT_MAX_MS,
  JUMP_PRE_LANDING_BUFFER_MS,
  OUCH_BODY_LINEAR_KEEP,
  OUCH_BODY_RESTITUTION,
  OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC,
  ROTATION_ACCEL_DEG_PER_SEC2,
  ROTATION_MAX_DEG_PER_SEC,
  ROTATION_RELEASE_DECEL_DEG_PER_SEC2,
  UNCHARGED_COMPRESSION_PX,
} from "./constants";

export type PogoTunables = {
  readonly boostCompressionPx: number;
  readonly chargedCompressionPx: number;
  readonly chargeFullMs: number;
  readonly groundContactBaseMs: number;
  readonly groundContactFallMsPer100PxPerSec: number;
  readonly groundContactMaxMs: number;
  readonly jumpPreLandingBufferMs: number;
  readonly ouchBodyLinearKeep: number;
  readonly ouchBodyRestitution: number;
  readonly ouchTumbleAngularImpulseDegPerSec: number;
  readonly rotationAccelDegPerSec2: number;
  readonly rotationMaxDegPerSec: number;
  readonly rotationReleaseDecelDegPerSec2: number;
  readonly unchargedCompressionPx: number;
};

export type PogoTuneOverrides = Partial<PogoTunables>;

export type PogoTuneField = {
  readonly key: keyof PogoTunables;
  readonly label: string;
  readonly max: number;
  readonly min: number;
  readonly step: number;
  readonly unit: string;
};

export const POGO_TUNE_FIELDS: ReadonlyArray<PogoTuneField> = [
  {
    key: "chargeFullMs",
    label: "チャージ完了時間",
    max: 200,
    min: 10,
    step: 1,
    unit: "ms",
  },
  {
    key: "unchargedCompressionPx",
    label: "無チャージ圧縮",
    max: 30,
    min: 2,
    step: 0.5,
    unit: "px",
  },
  {
    key: "chargedCompressionPx",
    label: "チャージ圧縮",
    max: 40,
    min: 4,
    step: 0.5,
    unit: "px",
  },
  {
    key: "boostCompressionPx",
    label: "ブースト圧縮",
    max: 50,
    min: 8,
    step: 0.5,
    unit: "px",
  },
  {
    key: "rotationMaxDegPerSec",
    label: "回転の最大速度",
    max: 1200,
    min: 60,
    step: 10,
    unit: "deg/s",
  },
  {
    key: "rotationAccelDegPerSec2",
    label: "回転の加速度",
    max: 20_000,
    min: 200,
    step: 50,
    unit: "deg/s²",
  },
  {
    key: "rotationReleaseDecelDegPerSec2",
    label: "離鍵時の減速度",
    max: 20_000,
    min: 200,
    step: 50,
    unit: "deg/s²",
  },
  {
    key: "jumpPreLandingBufferMs",
    label: "着地前入力バッファ",
    max: 400,
    min: 0,
    step: 5,
    unit: "ms",
  },
  {
    key: "groundContactBaseMs",
    label: "接地時間（基本）",
    max: 400,
    min: 10,
    step: 5,
    unit: "ms",
  },
  {
    key: "groundContactFallMsPer100PxPerSec",
    label: "接地時間（落下 100px/s あたり）",
    max: 80,
    min: 0,
    step: 1,
    unit: "ms",
  },
  {
    key: "groundContactMaxMs",
    label: "接地時間（上限）",
    max: 1000,
    min: 50,
    step: 10,
    unit: "ms",
  },
  {
    key: "ouchBodyLinearKeep",
    label: "Ouch の運動量残し",
    max: 1,
    min: 0,
    step: 0.01,
    unit: "",
  },
  {
    key: "ouchTumbleAngularImpulseDegPerSec",
    label: "Ouch の転倒",
    max: 720,
    min: 0,
    step: 5,
    unit: "deg/s",
  },
  {
    key: "ouchBodyRestitution",
    label: "体ヒットの反発",
    max: 1,
    min: 0,
    step: 0.05,
    unit: "",
  },
];

export function defaultTunables(): PogoTunables {
  return {
    boostCompressionPx: BOOST_COMPRESSION_PX,
    chargedCompressionPx: CHARGED_COMPRESSION_PX,
    chargeFullMs: CHARGE_FULL_MS,
    groundContactBaseMs: GROUND_CONTACT_BASE_MS,
    groundContactFallMsPer100PxPerSec:
      GROUND_CONTACT_FALL_MS_PER_100_PX_PER_SEC,
    groundContactMaxMs: GROUND_CONTACT_MAX_MS,
    jumpPreLandingBufferMs: JUMP_PRE_LANDING_BUFFER_MS,
    ouchBodyLinearKeep: OUCH_BODY_LINEAR_KEEP,
    ouchBodyRestitution: OUCH_BODY_RESTITUTION,
    ouchTumbleAngularImpulseDegPerSec: OUCH_TUMBLE_ANGULAR_IMPULSE_DEG_PER_SEC,
    rotationAccelDegPerSec2: ROTATION_ACCEL_DEG_PER_SEC2,
    rotationMaxDegPerSec: ROTATION_MAX_DEG_PER_SEC,
    rotationReleaseDecelDegPerSec2: ROTATION_RELEASE_DECEL_DEG_PER_SEC2,
    unchargedCompressionPx: UNCHARGED_COMPRESSION_PX,
  };
}

export function mergeTune(overrides: PogoTuneOverrides = {}): PogoTunables {
  return {
    ...defaultTunables(),
    ...overrides,
  };
}

export function patchTuneOverrides(
  overrides: PogoTuneOverrides,
  key: keyof PogoTunables,
  value: number,
): PogoTuneOverrides {
  return { ...overrides, [key]: value };
}
