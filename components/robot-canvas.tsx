"use client";

import { createRoot, useFrame, useThree } from "@react-three/fiber";
import { Component, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import {
  BackSide,
  Box3,
  BoxGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene as ThreeScene,
  Vector3,
  WebGLRenderer,
  type PerspectiveCamera,
  type Texture,
} from "three";
import { buildRobot, type Robot } from "@/lib/robot/build";
import { copyPose, poseKeys, REST, type Pose } from "@/lib/robot/pose";
import type { Profile, Probe } from "@/lib/robot/quality";
import { robot } from "@/lib/robot/store";
import { mark, measure } from "@/lib/timing";

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

/** Lets the browser handle input and paint between start-up steps. */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

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

/** Prefiltered reflection map of the studio, sized by quality tier. */
function createEnvironment(renderer: WebGLRenderer, size: number) {
  const pmrem = new PMREMGenerator(renderer);
  const room = studio();
  const texture = pmrem.fromScene(room.scene, 0.02, 0.1, 100, { size }).texture;
  room.dispose();
  pmrem.dispose();
  return texture;
}

function createLights(count: Profile["lights"]) {
  const lights: [number, number, number, number, number][] = [
    [1.5, 5, 4, 2.2, 0xffffff],
    [-3, 2.5, -3, 1.4, 0x49d9f5],
    [-2.5, 1.5, 4, 0.6, 0xffffff],
    [3.5, 1.6, -2.5, 0.8, 0x3478ff],
  ];
  return lights.slice(0, count).map(([x, y, z, intensity, color]) => {
    const light = new DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    return light;
  });
}

function applyArm(
  arm: Robot["left"],
  side: -1 | 1,
  pitch: number,
  roll: number,
  yaw: number,
  elbow: number,
  wrist: number,
  twist: number,
  grip: number,
  breathe: number,
  drift: number,
) {
  arm.shoulder.rotation.x = pitch + drift * 0.006;
  arm.shoulder.rotation.z = roll + side * breathe * 0.005;
  arm.shoulder.rotation.y = yaw;
  arm.elbow.rotation.x = elbow;
  arm.wrist.rotation.x = wrist;
  arm.wrist.rotation.y = twist;
  const fingers = arm.fingers;
  for (let index = 0; index < fingers.length; index++) {
    if (index < 4) fingers[index].rotation.z = -side * grip * (1.15 + index * 0.08);
    else fingers[index].rotation.x = -grip * 0.5;
  }
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

  // Scalar arguments only: nothing is allocated per frame.
  applyArm(model.left, -1, pose.lArmPitch, pose.lArmRoll, pose.lArmYaw, pose.lElbow, pose.lWrist, pose.lTwist, pose.lGrip, breathe, drift);
  applyArm(model.right, 1, pose.rArmPitch, pose.rArmRoll, pose.rArmYaw, pose.rElbow, pose.rWrist, pose.rTwist, pose.rGrip, breathe, drift);

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
    for (let index = 0; index < model.holoPanels.length; index++) {
      const panel = model.holoPanels[index];
      const appear = easeOut(pose.holo * 1.6 - index * 0.2);
      const focus = 1 - Math.min(Math.abs(pose.holoFocus - index), 1);
      panel.group.scale.set(0.6 + 0.4 * appear, Math.max(appear, 0.001), 1);
      panel.fill.opacity = (0.035 + 0.11 * focus) * appear;
      panel.line.opacity = (0.3 + 0.65 * focus) * appear;
    }
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

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type SceneProps = {
  model: Robot;
  environment: Texture;
  profile: Profile;
  onReady: () => void;
  onEyewear: (value: Eyewear) => void;
  /** Reports a runtime pixel-ratio downgrade so later resizes keep it. */
  onDpr: (dpr: number) => void;
};

function Scene({ model, environment, profile, onReady, onEyewear, onDpr }: SceneProps) {
  // Three objects are mutable by design; read them through get() inside effects.
  const get = useThree((state) => state.get);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const setDpr = useThree((state) => state.setDpr);
  const lights = useMemo(() => createLights(profile.lights), [profile.lights]);
  const current = useRef<Pose>({ ...REST });
  const eyewear = useRef<Eyewear>("none");
  const frames = useRef({ average: 0, slow: 0, dpr: profile.dpr });

  // Calibrate the rest pose to exactly match the poster's height and centre line.
  useLayoutEffect(() => {
    const { scene } = get();
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
    scene.add(model.root, ...lights);
    scene.environment = environment;
    scene.environmentIntensity = 1;
    return () => {
      scene.remove(model.root, ...lights);
      scene.environment = null;
      model.dispose();
      environment.dispose();
      for (const light of lights) light.dispose();
    };
  }, [model, environment, lights, get]);

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

  useLayoutEffect(() => {
    const { gl, scene, camera } = get();
    robot.invalidate = invalidate;
    let cancelled = false;
    mark("3d-compile-start");
    // Parallel shader compilation where supported (KHR_parallel_shader_compile).
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
    };
  }, [get, invalidate, onReady]);

  useFrame((state, delta) => {
    // Runtime adaptation: if frames stay well over budget for ~2 s, lower the pixel
    // ratio step by step, then the frame-rate cap. Never raises it again (no flapping).
    const fps = robot.fps || profile.fps;
    const watch = frames.current;
    if (delta < 0.25) {
      watch.average = watch.average * 0.9 + delta * 0.1;
      watch.slow = watch.average > (1 / fps) * 1.6 ? watch.slow + 1 : 0;
      if (watch.slow > fps * 2) {
        watch.slow = 0;
        if (watch.dpr > 1) {
          watch.dpr = Math.max(1, watch.dpr - 0.25);
          onDpr(watch.dpr);
          setDpr(watch.dpr);
        } else if (fps > 30) robot.fps = 30;
      }
    }
    const dt = Math.min(delta, 0.1);
    const alpha = 1 - Math.exp(-dt * 5.5);
    const pose = current.current;
    for (const key of poseKeys) pose[key] += (robot.target[key] - pose[key]) * alpha;
    const label = applyPose(model, pose, state.clock.elapsedTime);
    if (label !== eyewear.current) {
      eyewear.current = label;
      onEyewear(label);
    }
  });

  return null;
}

type Callbacks = {
  onReady: () => void;
  onFail: () => void;
  onEyewear: (value: Eyewear) => void;
};

/**
 * Mounts the scene into `host` using the probe's WebGL context. Start-up runs in
 * separate tasks (renderer, environment, model, first render) so no single step
 * blocks input for long. Resolves to a dispose function.
 */
export async function mountRobotScene(host: HTMLElement, probe: Probe, callbacks: Callbacks) {
  const { canvas, context, profile } = probe;
  let disposed = false;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  host.appendChild(canvas);
  const onLost = (event: Event) => {
    event.preventDefault();
    if (!disposed) callbacks.onFail();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const size = () => ({ width: host.clientWidth, height: host.clientHeight, top: 0, left: 0 });
  const root = createRoot(canvas);
  let renderer: WebGLRenderer | undefined;
  // configure() applies a whole configuration: omitted props fall back to defaults
  // (frameloop "always"), so every call passes the complete set.
  const config = {
    gl: (defaults: ConstructorParameters<typeof WebGLRenderer>[0]) =>
      (renderer ??= new WebGLRenderer({
        ...defaults,
        canvas,
        context,
        alpha: true,
        antialias: profile.antialias,
        stencil: false,
        powerPreference: "default",
      })),
    dpr: [1, profile.dpr] as [number, number],
    frameloop: "demand" as const,
    camera: { fov: FOV, near: 0.1, far: 40, position: [0, 1, 10] as [number, number, number] },
  };
  const resize = new ResizeObserver(() => {
    if (!disposed) root.configure({ ...config, size: size() });
  });
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    resize.disconnect();
    root.unmount();
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.remove();
  };

  try {
    await root.configure({ ...config, size: size() });
    renderer!.setClearColor(0x000000, 0);
    resize.observe(host);
    await yieldToMain();
    if (disposed) return dispose;

    mark("3d-environment-start");
    const environment = createEnvironment(renderer!, profile.environment);
    measure("3d-environment", "3d-environment-start");
    await yieldToMain();
    if (disposed) {
      environment.dispose();
      return dispose;
    }

    mark("3d-build-start");
    const model = await buildRobot(profile, yieldToMain);
    measure("3d-build", "3d-build-start");
    await yieldToMain();
    if (disposed) {
      model.dispose();
      environment.dispose();
      return dispose;
    }

    root.render(
      <SceneBoundary onError={callbacks.onFail}>
        <Scene
          model={model}
          environment={environment}
          profile={profile}
          onReady={callbacks.onReady}
          onEyewear={callbacks.onEyewear}
          onDpr={(dpr) => (config.dpr = [1, dpr])}
        />
      </SceneBoundary>,
    );
  } catch {
    dispose();
    callbacks.onFail();
  }
  return dispose;
}
