import type {
  Collider,
  ImpulseJoint,
  PrismaticImpulseJoint,
  RigidBody,
  World,
} from "@dimforge/rapier2d-compat";
import { buildPolylineGeometry, toRapierPolyline } from "./polyline";
import {
  BODY_FRICTION,
  BODY_TO_TIP_PX,
  FIXED_STEP_SEC,
  GRAVITY_M_PER_SEC2,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PRISMATIC_MIN_LENGTH_PX,
  SPRING_LAUNCH_DAMPING,
  SPRING_LAUNCH_STIFFNESS,
  SPRING_MOTOR_MAX_FORCE,
  STICK_MASS_KG,
  TERRAIN_MIN_EDGE_PX,
  TIP_FRICTION,
  TIP_RADIUS,
  TORSO_MASS_KG,
} from "./constants";
import {
  degToRad,
  metersToPx,
  pxToMeters,
  rapierAngleToStage,
  stageAngleToRapier,
  stagePointToRapier,
  type Point2D,
  type Pose,
} from "./coords";
import type { RapierApi } from "./rapier-load";
import type { PogoSimulationConfig, TerrainPolyline } from "./simulate-types";

export type PogoWorld = {
  readonly world: World;
  readonly torsoBody: RigidBody;
  readonly stickBody: RigidBody;
  readonly torsoCollider: Collider;
  readonly tipCollider: Collider;
  readonly spawnTip: Point2D;
  readonly spawnTorso: Point2D;
  createPivot(): void;
  hasPivot(): boolean;
  removePivot(): void;
  setMotor(targetLengthM: number, stiffness: number, damping: number): void;
  setKinematics(velocity: Point2D, angularDegPerSec: number): void;
  setAngularVelocity(angularDegPerSec: number): void;
  jointLengthM(): number;
  torsoPose(): Pose;
  tipPose(): Pose;
  bodyCenterStage(): Point2D;
  tipNormal(): Point2D | null;
  torsoNormal(): Point2D | null;
  torsoTouching(): boolean;
  setJointLength(lengthM: number): void;
  reset(): void;
  terrainPolylines(): Array<Array<Point2D>>;
  destroy(): void;
};

function createTerrainColliders(
  api: RapierApi,
  world: World,
  terrain: ReadonlyArray<TerrainPolyline>,
  body: RigidBody,
): Set<number> {
  const handles = new Set<number>();
  for (const polyline of terrain) {
    const geometry = buildPolylineGeometry(
      polyline.points,
      polyline.closed,
      TERRAIN_MIN_EDGE_PX,
    );
    if (!geometry) {
      continue;
    }
    const converted = toRapierPolyline(geometry, stagePointToRapier);
    const collider = world.createCollider(
      api.ColliderDesc.polyline(converted.vertices, converted.indices),
      body,
    );
    handles.add(collider.handle);
  }
  return handles;
}

function poseOf(body: RigidBody): Pose {
  const translation = body.translation();
  return {
    angleRad: rapierAngleToStage(body.rotation()),
    x: metersToPx(translation.x),
    y: -metersToPx(translation.y),
  };
}

export function createPogoWorld(
  api: RapierApi,
  config: PogoSimulationConfig,
): PogoWorld {
  const world = new api.World({ x: 0, y: -GRAVITY_M_PER_SEC2 });
  world.timestep = FIXED_STEP_SEC;

  const terrainBody = world.createRigidBody(api.RigidBodyDesc.fixed());
  const terrainHandles = createTerrainColliders(
    api,
    world,
    config.terrain,
    terrainBody,
  );

  const spawnTip = stagePointToRapier({
    x: config.spawn.x,
    y: config.spawn.y - TIP_RADIUS,
  });
  const spawnTorso = {
    x: spawnTip.x,
    y: spawnTip.y + pxToMeters(BODY_TO_TIP_PX),
  };
  const restLengthM = pxToMeters(BODY_TO_TIP_PX);

  const torsoBody = world.createRigidBody(
    api.RigidBodyDesc.dynamic()
      .setTranslation(spawnTorso.x, spawnTorso.y)
      .setLinearDamping(0)
      .setAngularDamping(0),
  );
  const torsoCollider = world.createCollider(
    api.ColliderDesc.cuboid(
      pxToMeters(PLAYER_WIDTH / 2),
      pxToMeters(PLAYER_HEIGHT / 2),
    )
      .setMass(TORSO_MASS_KG)
      .setFriction(BODY_FRICTION),
    torsoBody,
  );

  const stickBody = world.createRigidBody(
    api.RigidBodyDesc.dynamic()
      .setTranslation(spawnTip.x, spawnTip.y)
      .setLinearDamping(0)
      .setAngularDamping(0)
      .setCcdEnabled(true),
  );
  const tipCollider = world.createCollider(
    api.ColliderDesc.ball(pxToMeters(TIP_RADIUS))
      .setMass(STICK_MASS_KG)
      .setFriction(TIP_FRICTION),
    stickBody,
  );

  const jointData = api.JointData.prismatic(
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: -1 },
  );
  jointData.limitsEnabled = true;
  jointData.limits = [
    pxToMeters(PRISMATIC_MIN_LENGTH_PX),
    pxToMeters(BODY_TO_TIP_PX),
  ];
  const joint = world.createImpulseJoint(
    jointData,
    torsoBody,
    stickBody,
    true,
  ) as PrismaticImpulseJoint;
  joint.setContactsEnabled(false);
  joint.configureMotorModel(api.MotorModel.ForceBased);
  joint.setMotorMaxForce(SPRING_MOTOR_MAX_FORCE);
  joint.configureMotorPosition(
    restLengthM,
    SPRING_LAUNCH_STIFFNESS,
    SPRING_LAUNCH_DAMPING,
  );

  let pivot: ImpulseJoint | null = null;

  function jointLengthM(): number {
    const torso = torsoBody.translation();
    const tip = stickBody.translation();
    return Math.hypot(torso.x - tip.x, torso.y - tip.y);
  }

  function findTerrainContact(collider: Collider): Point2D | null {
    const contacts: Array<Collider> = [];
    world.contactPairsWith(collider, (other) => {
      if (terrainHandles.has(other.handle)) {
        contacts.push(other);
      }
    });
    let normal: Point2D | null = null;
    for (const other of contacts) {
      world.contactPair(collider, other, (manifold, _flipped) => {
        if (normal) {
          return;
        }
        const vector = manifold.normal();
        normal = { x: vector.x, y: vector.y };
      });
    }
    return normal;
  }

  function removePivot(): void {
    if (!pivot) {
      return;
    }
    world.removeImpulseJoint(pivot, true);
    pivot = null;
  }

  function reset(): void {
    removePivot();
    torsoBody.setTranslation(spawnTorso, true);
    torsoBody.setRotation(0, true);
    torsoBody.setLinvel({ x: 0, y: 0 }, true);
    torsoBody.setAngvel(0, true);
    stickBody.setTranslation(spawnTip, true);
    stickBody.setRotation(0, true);
    stickBody.setLinvel({ x: 0, y: 0 }, true);
    stickBody.setAngvel(0, true);
    joint.configureMotorPosition(
      restLengthM,
      SPRING_LAUNCH_STIFFNESS,
      SPRING_LAUNCH_DAMPING,
    );
  }

  return {
    bodyCenterStage(): Point2D {
      const translation = torsoBody.translation();
      return { x: metersToPx(translation.x), y: -metersToPx(translation.y) };
    },
    createPivot(): void {
      if (pivot) {
        return;
      }
      const tip = stickBody.translation();
      const pivotData = api.JointData.revolute(
        { x: 0, y: 0 },
        { x: tip.x, y: tip.y },
      );
      pivot = world.createImpulseJoint(pivotData, stickBody, terrainBody, true);
    },
    destroy(): void {
      removePivot();
      world.free();
    },
    hasPivot: () => pivot !== null,
    jointLengthM,
    removePivot,
    reset,
    setAngularVelocity(angularDegPerSec: number): void {
      const angvel = stageAngleToRapier(degToRad(angularDegPerSec));
      torsoBody.setAngvel(angvel, true);
      stickBody.setAngvel(angvel, true);
    },
    setJointLength(lengthM: number): void {
      const tip = stickBody.translation();
      const angle = torsoBody.rotation();
      torsoBody.setTranslation(
        {
          x: tip.x - Math.sin(angle) * lengthM,
          y: tip.y + Math.cos(angle) * lengthM,
        },
        true,
      );
    },
    setKinematics(velocity: Point2D, angularDegPerSec: number): void {
      const angvel = stageAngleToRapier(degToRad(angularDegPerSec));
      torsoBody.setLinvel(velocity, true);
      stickBody.setLinvel(velocity, true);
      torsoBody.setAngvel(angvel, true);
      stickBody.setAngvel(angvel, true);
    },
    setMotor(targetLengthM: number, stiffness: number, damping: number): void {
      joint.configureMotorPosition(targetLengthM, stiffness, damping);
    },
    spawnTip,
    spawnTorso,
    stickBody,
    terrainPolylines(): Array<Array<Point2D>> {
      return config.terrain.map((polyline) => [...polyline.points]);
    },
    tipCollider,
    tipNormal: () => findTerrainContact(tipCollider),
    tipPose: () => poseOf(stickBody),
    torsoBody,
    torsoCollider,
    torsoNormal: () => findTerrainContact(torsoCollider),
    torsoPose: () => poseOf(torsoBody),
    torsoTouching: () => findTerrainContact(torsoCollider) !== null,
    world,
  };
}
