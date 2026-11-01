"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BackSide,
  Box3,
  BoxGeometry,
  Color,
  DoubleSide,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene as ThreeScene,
  Vector3,
  type PerspectiveCamera,
} from "three";
import { buildRobot, type Quality, type Robot } from "@/lib/robot/build";
import { copyPose, poseKeys, REST, type Pose } from "@/lib/robot/pose";
import { robot } from "@/lib/robot/store";
import { mark, measure, timed } from "@/lib/timing";

mark("3d-module");
measure("3d-download", "3d-start", "3d-module");

export type Eyewear = "none" | "spectacles" | "vr";

/** The reference poster's robot fills 1462 of its 1494 px height, centred. */
const POSTER_FILL = 1462 / 1494;
const ROBOT_HEIGHT = 2;
const FOV = 22;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const smooth = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
const bump = (value: number) =>
  value > 0.001 && value < 0.999 ? Math.sin(Math.PI * value) : 0;
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);

const scratch = new Vector3();

/**
 * A dark photo studio for reflections: an overhead softbox, a soft key strip and
 * cyan/blue rim strips. Gives graphite metal crisp edge highlights rather than the
 * flat grey of a uniformly lit room.
 */
function studio() {
  const scene = new ThreeScene();
  const disposables: { dispose(): void }[] = [];
  const room = new BoxGeometry(14, 14, 14);
  const roomMaterial = new MeshBasicMaterial({ color: 0x0f1114, side: BackSide });
  scene.add(new Mesh(room, roomMaterial));
  disposables.push(room, roomMaterial);
  const panels: [number, number, number, number, [number, number, number]][] = [
    [5, 2.4, 0xffffff, 4.5, [0.4, 5.5, 1.4]],
    [1.6, 4.5, 0xffffff, 2.4, [-4.5, 2.2, 3.2]],
    [5, 2.8, 0xffffff, 0.85, [0.5, 1.4, 6]],
    [1.1, 5, 0x49d9f5, 1.8, [4.5, 1.8, -2.8]],
    [1.1, 5, 0x3478ff, 1.1, [-4.6, 1.8, -3]],
  ];
  for (const [width, height, color, intensity, position] of panels) {
    const geometry = new PlaneGeometry(width, height);
    const material = new MeshBasicMaterial({
      color: new Color(color).multiplyScalar(intensity),
      side: DoubleSide,
    });
    const panel = new Mesh(geometry, material);
    panel.position.set(...position);
    panel.lookAt(0, 1, 0);
    scene.add(panel);
    disposables.push(geometry, material);
  }
  return {
    scene,
    dispose: () => disposables.forEach((item) => item.dispose()),
  };
}

function applyPose(model: Robot, pose: Pose, time: number) {
  // Deterministic, low-amplitude idle: breathing and a slow head drift.
  const breathe = Math.sin(time * 1.4);
  const drift = Math.sin(time * 0.43);

  model.spine.rotation.y = pose.torsoYaw * 0.4;
  model.chest.rotation.y = pose.torsoYaw * 0.6;
  model.chest.rotation.x = breathe * 0.006;
  model.chest.position.y = 0.27 + breathe * 0.0025;
  model.head.rotation.set(
    pose.headPitch + Math.sin(time * 0.61) * 0.008,
    pose.headYaw + drift * 0.022,
    pose.headRoll,
    "YXZ",
  );

  const arms = [
    [model.left, -1, pose.lArmPitch, pose.lArmRoll, pose.lArmYaw, pose.lElbow, pose.lWrist, pose.lTwist, pose.lGrip],
    [model.right, 1, pose.rArmPitch, pose.rArmRoll, pose.rArmYaw, pose.rElbow, pose.rWrist, pose.rTwist, pose.rGrip],
  ] as const;
  for (const [arm, side, pitch, roll, yaw, elbow, wrist, twist, grip] of arms) {
    arm.shoulder.rotation.x = pitch + drift * 0.006;
    arm.shoulder.rotation.z = roll + side * breathe * 0.005;
    arm.shoulder.rotation.y = yaw;
    arm.elbow.rotation.x = elbow;
    arm.wrist.rotation.x = wrist;
    arm.wrist.rotation.y = twist;
    arm.fingers.forEach((finger, index) => {
      if (index < 4) finger.rotation.z = -side * grip * (1.15 + index * 0.08);
      else finger.rotation.x = -grip * 0.5;
    });
  }

  // Spectacles → VR headset
  const specs = pose.specs * (1 - smooth(0.3, 0.7, pose.visor));
  model.specs.visible = specs > 0.01;
  model.specs.scale.set(
    (0.86 + 0.14 * specs) * (1 + 0.45 * smooth(0, 0.6, pose.visor)),
    0.86 + 0.14 * specs,
    1,
  );
  for (const material of model.specsMaterials) material.opacity = specs;
  model.specsLens.opacity = 0.32 * specs;
  model.specsLens.emissiveIntensity = 0.8 + 2.2 * bump(pose.visor);

  const vr = smooth(0.35, 0.9, pose.visor);
  model.visor.visible = vr > 0.01;
  model.visor.scale.setScalar(0.82 + 0.18 * easeOut(vr));
  model.visor.position.y = 0.08 + (1 - vr) * 0.05;
  for (const material of model.visorMaterials) material.opacity = vr;

  const specsScan = bump(pose.specs);
  const visorScan = bump(pose.visor);
  const scan = Math.max(specsScan, visorScan);
  model.scanRing.visible = scan > 0.02;
  if (model.scanRing.visible) {
    const progress = specsScan >= visorScan ? pose.specs : pose.visor;
    model.scanRing.position.y = MathUtils.lerp(0.21, -0.03, progress);
    model.scanRing.scale.setScalar(1 + 0.08 * scan);
    model.scanMaterial.opacity = scan;
  }

  // Holographic workflow panels
  model.holo.visible = pose.holo > 0.01;
  if (model.holo.visible) {
    model.holo.position.y = 1.2 + Math.sin(time * 0.8) * 0.006;
    model.holoPanels.forEach((panel, index) => {
      const appear = easeOut(pose.holo * 1.6 - index * 0.2);
      const focus = 1 - Math.min(Math.abs(pose.holoFocus - index), 1);
      panel.group.scale.set(0.6 + 0.4 * appear, Math.max(appear, 0.001), 1);
      panel.fill.opacity = (0.035 + 0.11 * focus) * appear;
      panel.line.opacity = (0.3 + 0.65 * focus) * appear;
    });
  }

  // Globe above the right palm
  model.globe.visible = pose.globe > 0.01;
  if (model.globe.visible) {
    model.right.palm.getWorldPosition(scratch);
    model.root.worldToLocal(scratch);
    model.globe.position.copy(scratch);
    model.globe.scale.setScalar(0.4 + 0.6 * easeOut(pose.globe));
    model.globeSpin.rotation.y = time * 0.35;
    model.orbitMesh.rotation.z = time * 0.5;
    model.globeLine.opacity = 0.75 * pose.globe;
    model.globeFill.opacity = 0.16 * pose.globe;
  }

  if (model.particles) model.particles.rotation.y = time * 0.02;

  return vr > 0.5 ? "vr" : specs > 0.5 ? "spectacles" : "none";
}

function Scene({
  quality,
  onReady,
  onEyewear,
}: {
  quality: Quality;
  onReady: () => void;
  onEyewear: (value: Eyewear) => void;
}) {
  // Three objects are mutable by design; read them through get() inside effects.
  const get = useThree((state) => state.get);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const model = useMemo(() => timed("3d-build", () => buildRobot(quality)), [quality]);
  const current = useRef<Pose>({ ...REST });
  const eyewear = useRef<Eyewear>("none");

  // Calibrate the rest pose to exactly match the poster's height and centre line.
  useLayoutEffect(() => {
    const { scene } = get();
    copyPose(current.current, REST);
    applyPose(model, REST, 0);
    model.root.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(model.pelvis);
    const scale = ROBOT_HEIGHT / (bounds.max.y - bounds.min.y);
    model.root.scale.setScalar(scale);
    model.root.position.set(
      -((bounds.max.x + bounds.min.x) / 2) * scale,
      -bounds.min.y * scale,
      0,
    );
    copyPose(current.current, robot.target);
    scene.add(model.root);
    return () => {
      scene.remove(model.root);
      model.dispose();
    };
  }, [model, get]);

  useLayoutEffect(() => {
    const camera = get().camera as PerspectiveCamera;
    const visible = ROBOT_HEIGHT / POSTER_FILL;
    const distance = visible / (2 * Math.tan(MathUtils.degToRad(FOV / 2)));
    camera.fov = FOV;
    camera.near = Math.max(distance - 4, 0.1);
    camera.far = distance + 4;
    camera.position.set(0, ROBOT_HEIGHT / 2, distance);
    camera.lookAt(0, ROBOT_HEIGHT / 2, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [get, size, invalidate]);

  useEffect(() => {
    const { gl, scene, camera } = get();
    mark("3d-environment-start");
    const pmrem = new PMREMGenerator(gl);
    const room = studio();
    const environment = pmrem.fromScene(room.scene, 0.02).texture;
    scene.environment = environment;
    scene.environmentIntensity = 1;
    room.dispose();
    pmrem.dispose();
    measure("3d-environment", "3d-environment-start");

    robot.invalidate = invalidate;
    let cancelled = false;
    mark("3d-compile-start");
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        invalidate();
        requestAnimationFrame(() => {
          if (cancelled) return;
          measure("3d-compile", "3d-compile-start");
          mark("3d-ready");
          measure("3d-total", "3d-start", "3d-ready");
          onReady();
        });
      });
    return () => {
      cancelled = true;
      robot.invalidate = undefined;
      scene.environment = null;
      environment.dispose();
    };
  }, [get, invalidate, onReady]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const alpha = 1 - Math.exp(-dt * 5.5);
    const pose = current.current;
    for (const key of poseKeys)
      pose[key] += (robot.target[key] - pose[key]) * alpha;
    const label = applyPose(model, pose, state.clock.elapsedTime);
    if (label !== eyewear.current) {
      eyewear.current = label;
      onEyewear(label);
    }
  });

  return (
    <>
      <directionalLight position={[1.5, 5, 4]} intensity={2.2} />
      <directionalLight position={[-2.5, 1.5, 4]} intensity={0.6} />
      <directionalLight position={[-3, 2.5, -3]} intensity={1.4} color={0x49d9f5} />
      <directionalLight position={[3.5, 1.6, -2.5]} intensity={0.8} color={0x3478ff} />
    </>
  );
}

export default function RobotCanvas({
  quality,
  onReady,
  onFail,
  onEyewear,
}: {
  quality: Quality;
  onReady: () => void;
  onFail: () => void;
  onEyewear: (value: Eyewear) => void;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, quality === "low" ? 1.25 : 1.5]}
      gl={{
        antialias: quality !== "low",
        alpha: true,
        stencil: false,
        // "high-performance" forces a discrete-GPU switch on dual-GPU laptops (measured
        // as a ~700 ms main-thread stall at context creation); this scene does not need it.
        powerPreference: "default",
      }}
      camera={{ fov: FOV, near: 0.1, far: 40, position: [0, 1, 10] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            onFail();
          },
          { once: true },
        );
      }}
    >
      <Scene quality={quality} onReady={onReady} onEyewear={onEyewear} />
    </Canvas>
  );
}
