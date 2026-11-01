/**
 * Every value the scroll timeline can drive. Angles are radians in the rig's joint space.
 * Accessory and hologram values run from 0 (absent) to 1 (fully present).
 */
export type Pose = {
  headYaw: number;
  headPitch: number;
  headRoll: number;
  torsoYaw: number;
  lArmPitch: number;
  lArmRoll: number;
  /** Rotation of the upper arm about its own axis; lets the forearm swing inwards. */
  lArmYaw: number;
  lElbow: number;
  lWrist: number;
  lTwist: number;
  lGrip: number;
  rArmPitch: number;
  rArmRoll: number;
  rArmYaw: number;
  rElbow: number;
  rWrist: number;
  rTwist: number;
  rGrip: number;
  /** Spectacles on the face. */
  specs: number;
  /** Spectacles (0) morphing into the VR headset (1). */
  visor: number;
  /** Holographic workflow panels in front of the robot. */
  holo: number;
  /** Which holographic panel is in focus, 0–3. */
  holoFocus: number;
  /** Search/AI globe above the right palm. */
  globe: number;
  /** Reference poster (0) to interactive 3D twin (1). */
  twin: number;
};

export type PoseKey = keyof Pose;

/** Matches the supplied reference render: head turned to its right, arms relaxed. */
export const REST: Pose = {
  headYaw: -0.34,
  headPitch: 0.02,
  headRoll: 0.05,
  torsoYaw: 0,
  lArmPitch: 0,
  lArmRoll: -0.1,
  lArmYaw: 0,
  lElbow: -0.1,
  lWrist: 0,
  lTwist: 0,
  lGrip: 0.35,
  rArmPitch: 0,
  rArmRoll: 0.1,
  rArmYaw: 0,
  rElbow: -0.1,
  rWrist: 0,
  rTwist: 0,
  rGrip: 0.35,
  specs: 0,
  visor: 0,
  holo: 0,
  holoFocus: 0,
  globe: 0,
  twin: 0,
};

export const poseKeys = Object.keys(REST) as PoseKey[];

export function copyPose(target: Pose, source: Pose) {
  for (const key of poseKeys) target[key] = source[key];
}
