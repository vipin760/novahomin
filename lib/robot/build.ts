import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Euler,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  WireframeGeometry,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Profile } from "./quality";

/** Geometry and shading detail, from the device's quality profile (lib/robot/quality.ts). */
export type Detail = Pick<Profile, "detail" | "particles" | "wear">;

/**
 * Worn-metal variation without textures: object-space value noise modulates
 * roughness and albedo. Object space keeps the pattern fixed to each part as it moves.
 */
function weather(material: MeshStandardMaterial, strength: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWear = { value: strength };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWearPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWearPos = transformed;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vWearPos;
uniform float uWear;
float wearHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float wearNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wearHash(i), wearHash(i + vec3(1,0,0)), f.x), mix(wearHash(i + vec3(0,1,0)), wearHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wearHash(i + vec3(0,0,1)), wearHash(i + vec3(1,0,1)), f.x), mix(wearHash(i + vec3(0,1,1)), wearHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float wearLarge = wearNoise(vWearPos * 11.0);
diffuseColor.rgb *= 1.0 - uWear * 0.45 * smoothstep(0.35, 0.9, wearLarge);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
float wearFine = wearNoise(vWearPos * 64.0) * 0.6 + wearNoise(vWearPos * 23.0) * 0.4;
roughnessFactor = clamp(roughnessFactor + uWear * (wearFine - 0.5) * 0.45, 0.06, 1.0);`,
      );
  };
  material.customProgramCacheKey = () => `wear-${strength}`;
}

type V3 = [number, number, number];

/**
 * Procedural digital twin of the supplied reference robot: graphite armour, navy
 * panels, cyan lights and orange accents on a rigid joint hierarchy. Hard-surface
 * robots are rigid segments, so each joint is a Group (no skinning required).
 * Units: metres-ish, feet at y = 0, facing +z, total height ≈ 2.
 */
/**
 * Builds the robot in a few slices. `pause` (for example a setTimeout yield) runs
 * between them so construction never blocks input for one long task.
 */
export async function buildRobot(
  { detail, particles: particleCount, wear }: Detail,
  pause: () => Promise<void> = async () => {},
) {
  const seg = detail;
  const radial = [12, 18, 24][detail - 1];

  const materials = {
    armor: new MeshStandardMaterial({ color: 0x5c5f65, metalness: 0.8, roughness: 0.42 }),
    armorDark: new MeshStandardMaterial({ color: 0x2e3035, metalness: 0.74, roughness: 0.48 }),
    navy: new MeshStandardMaterial({ color: 0x283653, metalness: 0.6, roughness: 0.42 }),
    steel: new MeshStandardMaterial({ color: 0x8e949c, metalness: 1, roughness: 0.3 }),
    orange: new MeshStandardMaterial({ color: 0xe8a02a, metalness: 0.35, roughness: 0.42 }),
    mech: new MeshStandardMaterial({ color: 0x17191c, metalness: 0.85, roughness: 0.38 }),
    face: new MeshStandardMaterial({ color: 0x040507, metalness: 0.5, roughness: 0.1 }),
    glow: new MeshBasicMaterial({ color: 0x8ff3ff, toneMapped: false }),
  };
  if (wear) {
    weather(materials.armor, 1);
    weather(materials.armorDark, 0.8);
    weather(materials.navy, 0.7);
  }
  type Key = keyof typeof materials;
  const owned = new Set<Material>(Object.values(materials));
  const geometries = new Set<BufferGeometry>();

  // --- geometry helpers -------------------------------------------------------
  const pending = new Map<Object3D, Map<Key, BufferGeometry[]>>();
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const euler = new Euler();

  // Mirrored left/right parts share parameters: build each shape once, copy it per use.
  const shared = new Map<string, BufferGeometry>();
  const sharedSources = new Set<BufferGeometry>();
  function once(key: string, create: () => BufferGeometry) {
    let geometry = shared.get(key);
    if (!geometry) {
      geometry = create();
      shared.set(key, geometry);
      sharedSources.add(geometry);
    }
    return geometry;
  }

  function add(
    parent: Object3D,
    key: Key,
    source: BufferGeometry,
    position: V3 = [0, 0, 0],
    rotation: V3 = [0, 0, 0],
    scale: V3 = [1, 1, 1],
  ) {
    // Only shared shapes need a copy; one-off non-indexed geometry is used as is.
    const isShared = sharedSources.has(source);
    const geometry = source.index ? source.toNonIndexed() : isShared ? source.clone() : source;
    if (!isShared && geometry !== source) source.dispose();
    for (const name of Object.keys(geometry.attributes))
      if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
    geometry.clearGroups();
    matrix.compose(
      new Vector3(...position),
      quaternion.setFromEuler(euler.set(...rotation)),
      new Vector3(...scale),
    );
    geometry.applyMatrix4(matrix);
    if (!pending.has(parent)) pending.set(parent, new Map());
    const byKey = pending.get(parent)!;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(geometry);
  }

  const box = (w: number, h: number, d: number, r = 0.012) =>
    once(`box ${w} ${h} ${d} ${r}`, () =>
      new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2.2, h / 2.2, d / 2.2)),
    );

  /** Extruded plate with individually chamfered corners [tl, tr, br, bl], facing +z. */
  function plate(
    w: number,
    h: number,
    d: number,
    chamfer: number | [number, number, number, number] = 0.25,
    bevel = 0.005,
  ) {
    return once(`plate ${w} ${h} ${d} ${chamfer} ${bevel}`, () => plateShape(w, h, d, chamfer, bevel));
  }

  function plateShape(
    w: number,
    h: number,
    d: number,
    chamfer: number | [number, number, number, number],
    bevel: number,
  ) {
    const [tl, tr, br, bl] = Array.isArray(chamfer)
      ? chamfer
      : [0, 0, 0, 0].map(() => Math.min(w, h) * chamfer);
    const x = w / 2;
    const y = h / 2;
    const shape = new Shape();
    shape.moveTo(-x + bl, -y);
    shape.lineTo(x - br, -y);
    shape.lineTo(x, -y + br);
    shape.lineTo(x, y - tr);
    shape.lineTo(x - tr, y);
    shape.lineTo(-x + tl, y);
    shape.lineTo(-x, y - tl);
    shape.lineTo(-x, -y + bl);
    const depth = Math.max(d - bevel * 2, 0.002);
    const geometry = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 1,
      curveSegments: 1,
    });
    geometry.translate(0, 0, -depth / 2);
    return geometry;
  }

  /** Rectangular frame (handle) with a through-hole, facing +z. */
  const frame = (w: number, h: number, d: number, t: number) =>
    once(`frame ${w} ${h} ${d} ${t}`, () => frameShape(w, h, d, t));

  function frameShape(w: number, h: number, d: number, t: number) {
    const shape = new Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    const hole = new Shape();
    hole.moveTo(-w / 2 + t, -h / 2 + t);
    hole.lineTo(-w / 2 + t, h / 2 - t);
    hole.lineTo(w / 2 - t, h / 2 - t);
    hole.lineTo(w / 2 - t, -h / 2 + t);
    shape.holes.push(hole);
    const geometry = new ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 1,
    });
    geometry.translate(0, 0, -d / 2);
    return geometry;
  }

  const triangle = (size: number) =>
    once(`triangle ${size}`, () => {
      const shape = new Shape();
      shape.moveTo(-size / 2, -size * 0.43);
      shape.lineTo(size / 2, -size * 0.43);
      shape.lineTo(0, size * 0.43);
      return new ExtrudeGeometry(shape, { depth: 0.004, bevelEnabled: false });
    });

  const cyl = (top: number, bottom: number, h: number, segments = radial) =>
    once(`cyl ${top} ${bottom} ${h} ${segments}`, () => new CylinderGeometry(top, bottom, h, segments));
  /** Cylinder lying along the x axis (joint discs, pods). */
  const disc = (r: number, h: number, segments = radial) =>
    once(`disc ${r} ${h} ${segments}`, () =>
      new CylinderGeometry(r, r, h, segments).rotateZ(Math.PI / 2),
    );

  const joint = (parent: Object3D, position: V3, name: string) => {
    const group = new Group();
    group.name = name;
    group.position.set(...position);
    parent.add(group);
    return group;
  };

  // --- skeleton ---------------------------------------------------------------
  const root = new Group();
  root.name = "robot";
  const pelvis = joint(root, [0, 1.04, 0], "pelvis");
  const spine = joint(pelvis, [0, 0.11, 0], "spine");
  const chest = joint(spine, [0, 0.27, 0], "chest");
  const neck = joint(chest, [0, 0.32, 0], "neck");
  const head = joint(neck, [0, 0.075, 0], "head");

  // Pelvis
  add(pelvis, "armorDark", box(0.3, 0.14, 0.2, 0.03), [0, 0.02, -0.01]);
  add(pelvis, "armor", plate(0.27, 0.07, 0.18, 0.3), [0, 0.1, 0]);
  add(pelvis, "armor", plate(0.13, 0.17, 0.06, [0.02, 0.02, 0.05, 0.05]), [0, -0.03, 0.09]);
  add(pelvis, "mech", box(0.2, 0.08, 0.16, 0.02), [0, -0.07, -0.02]);

  // Abdomen: mechanical core, pistons, hoses and side vents
  add(spine, "mech", cyl(0.05, 0.065, 0.24), [0, 0.1, -0.02]);
  for (const s of [-1, 1]) {
    add(spine, "steel", cyl(0.011, 0.011, 0.22, 10), [s * 0.055, 0.13, 0.035], [0, 0, s * 0.28]);
    add(spine, "mech", cyl(0.018, 0.018, 0.22, 10), [s * 0.1, 0.12, 0.0], [0, 0, s * 0.12]);
    add(spine, "armorDark", box(0.075, 0.13, 0.13, 0.015), [s * 0.155, 0.13, -0.01]);
    for (let i = 0; i < 4; i++)
      add(spine, "mech", box(0.078, 0.012, 0.11, 0.004), [s * 0.158, 0.085 + i * 0.03, 0.012]);
  }
  add(spine, "navy", plate(0.17, 0.17, 0.06, [0.03, 0.03, 0.055, 0.055]), [0, 0.03, 0.085]);
  add(spine, "armorDark", plate(0.1, 0.07, 0.02, 0.3), [0, 0.035, 0.118]);

  // Chest
  add(chest, "armorDark", box(0.36, 0.34, 0.24, 0.04), [0, 0.12, -0.02]);
  add(chest, "armorDark", box(0.34, 0.3, 0.07, 0.03), [0, 0.14, -0.15]);
  for (const s of [-1, 1]) {
    // Pectoral plates angled outwards, with recessed inner panels
    const pec: [number, number, number, number] =
      s < 0 ? [0.03, 0.06, 0.03, 0.07] : [0.06, 0.03, 0.07, 0.03];
    add(chest, "armor", plate(0.2, 0.17, 0.07, pec), [s * 0.11, 0.165, 0.105], [0, s * 0.2, 0]);
    add(chest, "armorDark", plate(0.13, 0.08, 0.02, 0.3), [s * 0.12, 0.16, 0.145], [0, s * 0.2, 0]);
    // Navy cross-belt
    add(chest, "navy", plate(0.17, 0.065, 0.06, 0.3), [s * 0.09, 0.0, 0.12], [0, s * 0.12, s * 0.22]);
    // Shoulder yokes, orange handles and steel pipes
    add(chest, "armor", plate(0.16, 0.075, 0.2, 0.3), [s * 0.165, 0.255, 0], [0, 0, -s * 0.14]);
    add(chest, "orange", frame(0.085, 0.048, 0.012, 0.012), [s * 0.15, 0.305, 0.035], [-0.35, 0, -s * 0.14]);
    add(chest, "armorDark", cyl(0.012, 0.012, 0.07, 10), [s * 0.245, 0.305, -0.06]);
    add(chest, "armorDark", new TorusGeometry(0.028, 0.012, 6, 10, Math.PI), [s * 0.217, 0.34, -0.06]);
    add(chest, "armorDark", cyl(0.012, 0.012, 0.03, 10), [s * 0.189, 0.325, -0.06]);
  }
  add(chest, "navy", plate(0.085, 0.11, 0.05, 0.3), [0, 0.205, 0.135]);
  add(chest, "steel", disc(0.012, 0.03, 10), [-0.06, 0.24, 0.14]);
  add(chest, "steel", disc(0.012, 0.03, 10), [0.06, 0.24, 0.14]);
  add(chest, "armor", plate(0.11, 0.095, 0.065, 0.3), [0, 0.07, 0.135]);
  add(chest, "armor", box(0.3, 0.05, 0.19, 0.015), [0, -0.06, 0.02]);
  add(chest, "navy", box(0.14, 0.09, 0.1, 0.02), [0, 0.29, -0.07]);

  // Neck: spring coil around a core
  add(neck, "mech", cyl(0.022, 0.026, 0.1), [0, 0.035, 0]);
  for (let i = 0; i < 4; i++)
    add(neck, "steel", new TorusGeometry(0.03, 0.006, 6, radial), [0, 0.0 + i * 0.018, 0], [Math.PI / 2, 0, 0]);

  // Head: helmet, faceplate with vertical eye slits, forehead lamp and ear pods
  add(head, "armor", box(0.2, 0.21, 0.23, 0.045), [0, 0.065, -0.01]);
  add(head, "armor", box(0.17, 0.16, 0.13, 0.05), [0, 0.075, -0.1]);
  add(head, "armorDark", plate(0.16, 0.2, 0.02, 0.22), [0, 0.055, 0.1]);
  add(head, "face", box(0.135, 0.175, 0.03, 0.02), [0, 0.055, 0.107]);
  add(head, "glow", box(0.009, 0.038, 0.008, 0.003), [-0.027, 0.085, 0.123]);
  add(head, "glow", box(0.009, 0.038, 0.008, 0.003), [0.027, 0.085, 0.123]);
  add(head, "armorDark", box(0.06, 0.014, 0.02, 0.005), [0, -0.015, 0.118]);
  add(head, "armorDark", box(0.12, 0.045, 0.1, 0.015), [0, -0.035, 0.04]);
  add(head, "armorDark", cyl(0.032, 0.036, 0.03), [0, 0.165, 0.085], [0.75, 0, 0]);
  add(head, "glow", cyl(0.016, 0.016, 0.006, 16), [0, 0.177, 0.097], [0.75, 0, 0]);
  for (const s of [-1, 1]) {
    add(head, "armorDark", disc(0.05, 0.06), [s * 0.125, 0.04, 0]);
    add(head, "armor", disc(0.034, 0.016), [s * 0.16, 0.04, 0]);
    add(head, "glow", box(0.01, 0.03, 0.008, 0.003), [s * 0.14, 0.03, 0.047]);
  }

  await pause();

  // Arms
  type Arm = {
    shoulder: Group;
    elbow: Group;
    wrist: Group;
    fingers: Group[];
    palm: Object3D;
  };
  function arm(s: -1 | 1): Arm {
    const shoulder = joint(chest, [s * 0.27, 0.2, 0], s < 0 ? "l-shoulder" : "r-shoulder");
    add(shoulder, "armor", box(0.155, 0.17, 0.2, 0.05), [s * 0.03, 0, 0]);
    add(shoulder, "armorDark", plate(0.13, 0.05, 0.19, 0.3), [s * 0.03, 0.085, 0], [0, 0, s * 0.12]);
    add(shoulder, "armorDark", disc(0.068, 0.03), [s * 0.112, -0.01, 0]);
    add(shoulder, "armor", disc(0.044, 0.036), [s * 0.12, -0.01, 0]);
    add(shoulder, "orange", triangle(0.03), [s * 0.139, -0.008, 0], [0, s * (Math.PI / 2), 0]);
    add(shoulder, "armor", box(0.1, 0.2, 0.11, 0.025), [s * 0.01, -0.17, 0]);
    add(shoulder, "mech", cyl(0.032, 0.032, 0.18), [s * 0.0, -0.17, -0.01]);
    add(shoulder, "armor", plate(0.07, 0.14, 0.03, 0.25), [s * 0.01, -0.165, 0.06]);

    const elbow = joint(shoulder, [s * 0.01, -0.32, 0], s < 0 ? "l-elbow" : "r-elbow");
    add(elbow, "mech", disc(0.042, 0.11), [0, 0, 0]);
    add(elbow, "steel", disc(0.024, 0.118), [0, 0, 0]);
    add(elbow, "orange", box(0.118, 0.022, 0.122, 0.006), [0, -0.048, 0]);
    add(elbow, "armor", box(0.125, 0.2, 0.13, 0.026), [0, -0.152, 0]);
    add(elbow, "navy", plate(0.075, 0.12, 0.03, 0.22), [s * 0.018, -0.16, 0.066]);
    add(elbow, "armorDark", box(0.03, 0.15, 0.09, 0.01), [s * 0.064, -0.15, 0]);
    add(elbow, "steel", cyl(0.053, 0.053, 0.036), [0, -0.268, 0]);

    const wrist = joint(elbow, [0, -0.29, 0], s < 0 ? "l-wrist" : "r-wrist");
    wrist.rotation.order = "YXZ";
    add(wrist, "armorDark", box(0.042, 0.085, 0.078, 0.012), [0, -0.045, 0]);
    add(wrist, "armor", plate(0.07, 0.06, 0.014, 0.25), [s * 0.025, -0.04, 0], [0, s * (Math.PI / 2), 0]);
    add(wrist, "orange", box(0.004, 0.012, 0.012, 0.002), [s * 0.033, -0.035, 0.02]);

    const fingers: Group[] = [];
    for (const [index, z] of [0.027, 0.009, -0.009, -0.027].entries()) {
      const finger = joint(wrist, [0, -0.088, z], "finger");
      const length = index === 3 ? 0.028 : 0.034;
      add(finger, "armor", box(0.017, length, 0.016, 0.004), [0, -length / 2, 0]);
      add(finger, "mech", disc(0.007, 0.019, 8), [0, -length, 0]);
      add(finger, "armorDark", box(0.015, 0.03, 0.015, 0.004), [-s * 0.004, -length - 0.016, 0], [0, 0, -s * 0.25]);
      fingers.push(finger);
    }
    const thumb = joint(wrist, [-s * 0.012, -0.03, 0.04], "thumb");
    add(thumb, "armor", box(0.017, 0.045, 0.017, 0.004), [0, -0.02, 0.008], [0.45, 0, 0]);
    fingers.push(thumb);

    // Anchor just off the palm surface; the globe follows it.
    const palm = joint(wrist, [-s * 0.15, -0.055, 0], "palm-anchor");
    return { shoulder, elbow, wrist, fingers, palm };
  }
  const left = arm(-1);
  const right = arm(1);
  for (const limb of [left, right]) limb.shoulder.rotation.order = "XZY";

  // Legs
  type Leg = { hip: Group; knee: Group; ankle: Group };
  function leg(s: -1 | 1): Leg {
    const hip = joint(pelvis, [s * 0.14, -0.02, 0], s < 0 ? "l-hip" : "r-hip");
    hip.rotation.z = s * 0.065;
    add(hip, "mech", new SphereGeometry(0.06, radial, Math.max(radial / 2, 8)), [0, 0, 0]);
    add(hip, "armor", plate(0.12, 0.13, 0.17, 0.25), [s * 0.085, 0.02, 0], [0, 0, -s * 0.08]);
    add(hip, "orange", triangle(0.028), [s * 0.152, 0.03, 0.03], [0, s * (Math.PI / 2), 0]);
    add(hip, "armorDark", box(0.19, 0.3, 0.21, 0.04), [s * 0.02, -0.165, -0.01]);
    add(hip, "armor", plate(0.215, 0.27, 0.06, [0.05, 0.05, 0.07, 0.07]), [s * 0.02, -0.16, 0.095], [-0.05, 0, 0]);
    add(hip, "armorDark", plate(0.12, 0.15, 0.02, 0.28), [s * 0.02, -0.15, 0.13], [-0.05, 0, 0]);
    add(hip, "armor", plate(0.2, 0.25, 0.05, 0.25), [s * 0.115, -0.16, -0.005], [0, s * (Math.PI / 2), 0]);
    add(hip, "mech", cyl(0.05, 0.05, 0.3), [-s * 0.05, -0.17, -0.03]);
    add(hip, "orange", triangle(0.026), [s * 0.128, -0.12, 0.03], [0, s * (Math.PI / 2), 0]);

    const knee = joint(hip, [0, -0.31, 0], s < 0 ? "l-knee" : "r-knee");
    add(knee, "mech", disc(0.05, 0.14), [0, 0, 0]);
    add(knee, "navy", plate(0.13, 0.19, 0.08, 0.3), [0, 0.03, 0.105], [-0.08, 0, 0]);
    add(knee, "glow", box(0.044, 0.008, 0.008, 0.003), [0, -0.04, 0.149]);
    add(knee, "armorDark", disc(0.066, 0.03), [s * 0.09, -0.01, 0]);
    add(knee, "armor", disc(0.036, 0.036), [s * 0.098, -0.01, 0]);
    add(knee, "armorDark", box(0.15, 0.42, 0.17, 0.03), [0, -0.27, -0.015]);
    add(knee, "armor", plate(0.175, 0.38, 0.055, [0.03, 0.03, 0.05, 0.05]), [0, -0.27, 0.075]);
    add(knee, "armor", plate(0.17, 0.3, 0.04, 0.2), [s * 0.085, -0.25, -0.01], [0, s * (Math.PI / 2), 0]);
    add(knee, "navy", plate(0.09, 0.22, 0.03, 0.25), [0, -0.26, 0.108]);
    add(knee, "armorDark", plate(0.14, 0.28, 0.08, 0.3), [0, -0.22, -0.11]);
    add(knee, "orange", triangle(0.024), [s * 0.088, -0.15, 0.03], [0, s * (Math.PI / 2), 0]);

    const ankle = joint(knee, [0, -0.53, 0], s < 0 ? "l-ankle" : "r-ankle");
    ankle.rotation.z = -s * 0.065;
    add(ankle, "navy", plate(0.085, 0.07, 0.04, 0.3), [0, 0.0, 0.082]);
    add(ankle, "glow", box(0.036, 0.007, 0.008, 0.003), [0, 0.012, 0.104]);
    add(ankle, "mech", disc(0.045, 0.15), [0, -0.02, 0]);
    add(ankle, "armor", box(0.16, 0.08, 0.2, 0.02), [0, -0.065, -0.02]);
    add(ankle, "armor", box(0.185, 0.1, 0.32, 0.028), [0, -0.13, 0.05]);
    add(ankle, "armorDark", plate(0.175, 0.065, 0.11, 0.3), [0, -0.13, 0.19], [0.2, 0, 0]);
    add(ankle, "orange", frame(0.07, 0.036, 0.01, 0.011), [s * 0.087, -0.095, 0.07], [0, s * (Math.PI / 2), 0]);
    return { hip, knee, ankle };
  }
  await pause();
  const lLeg = leg(-1);
  const rLeg = leg(1);

  await pause();

  // --- spectacles -------------------------------------------------------------
  const specsFrame = new MeshStandardMaterial({
    color: 0x1a1d22,
    metalness: 0.9,
    roughness: 0.25,
    transparent: true,
  });
  const specsLens = new MeshStandardMaterial({
    color: 0x49d9f5,
    emissive: 0x0b4f62,
    emissiveIntensity: 0.8,
    metalness: 0.2,
    roughness: 0.05,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  owned.add(specsFrame).add(specsLens);
  const specs = new Group();
  specs.name = "spectacles";
  specs.position.set(0, 0.084, 0.14);
  head.add(specs);
  for (const s of [-1, 1]) {
    add(specs, "mech", new TorusGeometry(0.036, 0.0045, 6, 28), [s * 0.043, 0, 0], [0, 0, 0], [1.2, 0.86, 1]);
    add(specs, "glow", new CircleGeometry(0.035, 24), [s * 0.043, 0, -0.001], [0, 0, 0], [1.2, 0.86, 1]);
    add(specs, "mech", new BoxGeometry(0.004, 0.006, 0.13), [s * 0.093, 0.004, -0.06], [0, -s * 0.12, 0]);
  }
  add(specs, "mech", disc(0.004, 0.022, 8), [0, 0.005, 0.002]);

  // --- VR headset -------------------------------------------------------------
  const vrShell = new MeshStandardMaterial({
    color: 0x30343b,
    metalness: 0.8,
    roughness: 0.35,
    transparent: true,
  });
  const vrGlass = new MeshStandardMaterial({
    color: 0x05070a,
    metalness: 0.6,
    roughness: 0.08,
    transparent: true,
  });
  const vrLight = new MeshBasicMaterial({ color: 0x7ff1ff, transparent: true, toneMapped: false });
  const vrNavy = new MeshStandardMaterial({
    color: 0x1e2f57,
    metalness: 0.6,
    roughness: 0.38,
    transparent: true,
  });
  owned.add(vrShell).add(vrGlass).add(vrLight).add(vrNavy);
  const visor = new Group();
  visor.name = "vr-headset";
  visor.position.set(0, 0.08, 0);
  head.add(visor);
  const vrParts: [Material, BufferGeometry, V3, V3?][] = [
    [vrShell, box(0.225, 0.105, 0.09, 0.028), [0, 0, 0.14]],
    [vrGlass, box(0.205, 0.082, 0.012, 0.022), [0, 0, 0.186]],
    [vrLight, box(0.15, 0.006, 0.004, 0.002), [0, -0.002, 0.193]],
    [vrNavy, box(0.03, 0.055, 0.05, 0.01), [-0.117, 0, 0.1]],
    [vrNavy, box(0.03, 0.055, 0.05, 0.01), [0.117, 0, 0.1]],
    [vrShell, new TorusGeometry(0.128, 0.012, 6, 36), [0, 0.008, -0.01], [Math.PI / 2, 0, 0]],
  ];
  for (const [material, geometry, position, rotation] of vrParts) {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    geometries.add(geometry);
    visor.add(mesh);
  }

  // Scan ring used when accessories materialise
  const scanMaterial = new MeshBasicMaterial({
    color: 0x49d9f5,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  owned.add(scanMaterial);
  const scanGeometry = new TorusGeometry(0.165, 0.0025, 4, 64);
  geometries.add(scanGeometry);
  const scanRing = new Mesh(scanGeometry, scanMaterial);
  scanRing.rotation.x = Math.PI / 2;
  scanRing.visible = false;
  head.add(scanRing);

  // --- holographic workflow panels ---------------------------------------------
  const holo = new Group();
  holo.name = "hologram";
  holo.position.set(0, 1.2, 0);
  holo.visible = false;
  root.add(holo);
  const holoPanels: {
    group: Group;
    fill: MeshBasicMaterial;
    line: LineBasicMaterial;
  }[] = [];
  const panelGeometry = new PlaneGeometry(0.24, 0.155);
  const edgeGeometry = new EdgesGeometry(panelGeometry);
  const rows = new BufferGeometry();
  const rowVertices: number[] = [];
  for (const [y, w] of [
    [0.045, 0.16],
    [0.015, 0.12],
    [-0.012, 0.18],
    [-0.04, 0.09],
  ])
    rowVertices.push(-0.1, y, 0.001, -0.1 + w, y, 0.001);
  rowVertices.push(-0.12, 0.06, 0.001, 0.12, 0.06, 0.001);
  rows.setAttribute("position", new Float32BufferAttribute(rowVertices, 3));
  geometries.add(panelGeometry).add(edgeGeometry).add(rows);
  [-0.78, -0.26, 0.26, 0.78].forEach((angle, index) => {
    const group = new Group();
    const radius = 0.56;
    group.position.set(Math.sin(angle) * radius, index % 2 ? 0.05 : -0.02, Math.cos(angle) * radius);
    group.rotation.y = angle;
    const fill = new MeshBasicMaterial({
      color: 0x49d9f5,
      transparent: true,
      opacity: 0.06,
      side: DoubleSide,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const line = new LineBasicMaterial({
      color: 0x8ff3ff,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    owned.add(fill).add(line);
    group.add(new Mesh(panelGeometry, fill));
    group.add(new LineSegments(edgeGeometry, line));
    group.add(new LineSegments(rows, line));
    holo.add(group);
    holoPanels.push({ group, fill, line });
  });

  // --- search / AI globe ---------------------------------------------------------
  const globe = new Group();
  globe.name = "globe";
  globe.visible = false;
  root.add(globe);
  const globeLine = new LineBasicMaterial({
    color: 0x8ff3ff,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const globeFill = new MeshBasicMaterial({
    color: 0x3478ff,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  owned.add(globeLine).add(globeFill);
  const sphereSource = new IcosahedronGeometry(0.1, detail === 1 ? 1 : 2);
  const wire = new WireframeGeometry(sphereSource);
  sphereSource.dispose();
  const inner = new SphereGeometry(0.094, 24, 16);
  const orbit = new TorusGeometry(0.16, 0.0018, 4, 72);
  const beam = new CylinderGeometry(0.004, 0.035, 0.12, 16, 1, true);
  geometries.add(wire).add(inner).add(orbit).add(beam);
  const globeSpin = new Group();
  globeSpin.add(new LineSegments(wire, globeLine));
  globe.add(globeSpin);
  globe.add(new Mesh(inner, globeFill));
  const orbitMesh = new Mesh(orbit, globeLine);
  orbitMesh.rotation.set(1.2, 0.3, 0);
  globe.add(orbitMesh);
  const beamMesh = new Mesh(beam, globeFill);
  beamMesh.position.y = -0.13;
  beamMesh.rotation.x = Math.PI;
  globe.add(beamMesh);

  // --- ambient particles (not on constrained devices) ---------------------------
  let particles: Points | null = null;
  if (particleCount > 0) {
    const count = particleCount;
    const positions = new Float32Array(count * 3);
    // Deterministic distribution: identical on every load.
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996;
      const r = 0.7 + ((i * 0.618) % 1) * 0.9;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.1 + ((i * 0.381) % 1) * 2.2;
      positions[i * 3 + 2] = Math.sin(a) * r - 0.3;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: 0x8fe9ff,
      size: 0.012,
      transparent: true,
      opacity: 0.45,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    geometries.add(geometry);
    owned.add(material);
    particles = new Points(geometry, material);
    root.add(particles);
  }

  await pause();

  // --- merge collected parts: one draw call per joint × material ------------------
  const specsMaterialFor = (key: Key) =>
    key === "mech" ? specsFrame : key === "glow" ? specsLens : materials[key];
  let mergedParents = 0;
  for (const [parent, byKey] of pending) {
    if (++mergedParents % 10 === 0) await pause();
    for (const [key, list] of byKey) {
      const merged = mergeGeometries(list, false);
      for (const geometry of list) geometry.dispose();
      if (!merged) continue;
      geometries.add(merged);
      // Spectacles get their own fadeable materials (frame in "mech", lenses in "glow").
      const material = parent === specs ? specsMaterialFor(key) : materials[key];
      parent.add(new Mesh(merged, material));
    }
  }
  pending.clear();
  // Shared shapes were only copied from, unless a mesh uses one directly (VR headset).
  for (const geometry of shared.values()) if (!geometries.has(geometry)) geometry.dispose();
  shared.clear();

  return {
    root,
    pelvis,
    spine,
    chest,
    neck,
    head,
    left,
    right,
    lLeg,
    rLeg,
    specs,
    specsMaterials: [specsFrame],
    specsLens,
    visor,
    visorMaterials: [vrShell, vrGlass, vrLight, vrNavy],
    scanRing,
    scanMaterial,
    holo,
    holoPanels,
    globe,
    globeSpin,
    globeLine,
    globeFill,
    orbitMesh,
    particles,
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      for (const material of owned) material.dispose();
    },
  };
}

export type Robot = Awaited<ReturnType<typeof buildRobot>>;
