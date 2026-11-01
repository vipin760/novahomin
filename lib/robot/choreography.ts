import { REST, poseKeys, type Pose, type PoseKey } from "./pose";

export const sectionIds = [
  "top",
  "about",
  "services",
  "expertise",
  "process",
  "visibility",
  "why",
  "contact",
] as const;

export type SectionId = (typeof sectionIds)[number];

/**
 * A keyframe anchored to a section rather than to absolute pixels, so the same
 * choreography holds on every breakpoint.
 *
 * `p` measures entry: 0 when the section's top reaches the bottom of the viewport,
 * 1 when it reaches the top. `q` measures travel through a section taller than the
 * viewport (0 at its top, 1 when its bottom meets the viewport bottom).
 */
type Key = {
  id: SectionId;
  p: number;
  q?: number;
  pose: Partial<Pose>;
};

const leftArmRest = {
  lArmPitch: REST.lArmPitch,
  lArmRoll: REST.lArmRoll,
  lArmYaw: 0,
  lElbow: REST.lElbow,
  lWrist: 0,
  lTwist: 0,
  lGrip: REST.lGrip,
};

const rightArmRest = {
  rArmPitch: REST.rArmPitch,
  rArmRoll: REST.rArmRoll,
  rArmYaw: 0,
  rElbow: REST.rElbow,
  rWrist: 0,
  rTwist: 0,
  rGrip: REST.rGrip,
};

const armsRest = { ...leftArmRest, ...rightArmRest };

/** Right hand at the bridge of the spectacles (joint angles solved for the rig). */
const handAtFace = {
  rArmPitch: -1.17,
  rArmRoll: -0.1,
  rArmYaw: -0.64,
  rElbow: -2.06,
  rWrist: -0.15,
  rTwist: 0.2,
  rGrip: 0.55,
};

const handsAtHead = {
  lArmPitch: -1.49,
  lArmRoll: -0.54,
  lArmYaw: 0.49,
  lElbow: -2.37,
  lWrist: -0.1,
  lTwist: 0,
  lGrip: 0.25,
  rArmPitch: -1.49,
  rArmRoll: 0.54,
  rArmYaw: -0.49,
  rElbow: -2.37,
  rWrist: -0.1,
  rTwist: 0,
  rGrip: 0.25,
};

const handsOnHologram = {
  lArmPitch: -0.61,
  lArmRoll: -0.09,
  lArmYaw: 0.64,
  lElbow: -0.86,
  lWrist: 0.25,
  lTwist: 1.1,
  lGrip: 0.15,
  rArmPitch: -0.61,
  rArmRoll: 0.09,
  rArmYaw: -0.64,
  rElbow: -0.86,
  rWrist: 0.25,
  rTwist: -1.1,
  rGrip: 0.15,
};

export const keys: Key[] = [
  // Hero: the supplied reference, exactly as rendered.
  { id: "top", p: 1, pose: { ...REST } },

  // About: the 3D twin scans in, puts on spectacles and adjusts them.
  { id: "about", p: 0.22, pose: { twin: 0 } },
  { id: "about", p: 0.62, pose: { twin: 1, ...armsRest, headYaw: -0.34 } },
  {
    id: "about",
    p: 0.92,
    pose: { headYaw: -0.12, headPitch: -0.04, ...handAtFace, specs: 0 },
  },
  { id: "about", p: 1.02, pose: { specs: 1 } },
  {
    id: "about",
    p: 1.1,
    pose: { rArmPitch: -1.24, rElbow: -2.14, headPitch: 0.02 },
  },
  { id: "about", p: 1.4, pose: { ...armsRest, headYaw: -0.2 } },

  // Services: attention moves to the left panels, then the right.
  {
    id: "services",
    p: 1,
    q: 0.04,
    pose: { headYaw: -0.46, torsoYaw: -0.1, headPitch: -0.02 },
  },
  {
    id: "services",
    p: 1,
    q: 0.14,
    pose: {
      lArmPitch: -0.42,
      lArmRoll: -0.55,
      lArmYaw: 0.3,
      lElbow: -0.65,
      lWrist: 0.15,
      lTwist: -1.2,
      lGrip: 0.05,
    },
  },
  {
    id: "services",
    p: 1,
    q: 0.3,
    pose: { headYaw: -0.4, lArmPitch: -0.38, lArmRoll: -0.6 },
  },
  {
    id: "services",
    p: 1,
    q: 0.4,
    pose: { headYaw: 0, torsoYaw: 0, ...leftArmRest },
  },
  {
    id: "services",
    p: 1,
    q: 0.5,
    pose: {
      headYaw: 0.46,
      torsoYaw: 0.1,
      rArmPitch: -0.42,
      rArmRoll: 0.55,
      rArmYaw: -0.3,
      rElbow: -0.65,
      rWrist: 0.15,
      rTwist: 1.2,
      rGrip: 0.05,
    },
  },
  {
    id: "services",
    p: 1,
    q: 0.74,
    pose: { headYaw: 0.4, rArmPitch: -0.38, rArmRoll: 0.6 },
  },
  {
    id: "services",
    p: 1,
    q: 0.92,
    pose: { ...rightArmRest, headYaw: 0, torsoYaw: 0, headPitch: 0 },
  },

  // Expertise: hands rise to the frame and the spectacles become a VR headset.
  { id: "expertise", p: 0.45, pose: { ...armsRest, visor: 0, specs: 1 } },
  { id: "expertise", p: 0.78, pose: { ...handsAtHead, headPitch: 0.04 } },
  { id: "expertise", p: 0.84, pose: { visor: 0 } },
  { id: "expertise", p: 1.04, pose: { visor: 1 } },
  { id: "expertise", p: 1.12, pose: { ...handsAtHead } },

  // Process: in VR, working a holographic interface one step at a time.
  { id: "process", p: 0.5, pose: { ...handsOnHologram, holo: 0, headPitch: 0 } },
  {
    id: "process",
    p: 0.92,
    pose: { holo: 1, holoFocus: 0, headYaw: -0.16, headPitch: -0.1 },
  },
  {
    id: "process",
    p: 1,
    q: 0.3,
    pose: { holoFocus: 1, rArmRoll: 0.3, lArmRoll: -0.04 },
  },
  {
    id: "process",
    p: 1,
    q: 0.6,
    pose: { holoFocus: 2, headYaw: 0.16, rArmRoll: 0.04, lArmRoll: -0.3 },
  },
  {
    id: "process",
    p: 1,
    q: 0.9,
    pose: { holoFocus: 3, rArmRoll: 0.32, lArmRoll: -0.08 },
  },

  // SEO & GEO: the interface condenses into a globe held in the right palm.
  { id: "visibility", p: 0.35, pose: { holo: 1, globe: 0, ...handsOnHologram } },
  { id: "visibility", p: 0.55, pose: { holo: 0 } },
  {
    id: "visibility",
    p: 0.82,
    pose: {
      globe: 1,
      headYaw: 0.22,
      headPitch: -0.2,
      ...leftArmRest,
      rArmPitch: -0.22,
      rArmRoll: 0.1,
      rArmYaw: -0.36,
      rElbow: -1.36,
      rWrist: 0,
      rTwist: 1.57,
      rGrip: 0.1,
    },
  },
  { id: "visibility", p: 1.15, pose: { globe: 1, headYaw: 0.16 } },

  // Why Novahomin: headset back to spectacles, spectacles away.
  {
    id: "why",
    p: 0.42,
    pose: { globe: 0, ...armsRest, headYaw: 0, headPitch: 0 },
  },
  { id: "why", p: 0.66, pose: { ...handsAtHead, visor: 1 } },
  { id: "why", p: 0.88, pose: { visor: 0, specs: 1 } },
  {
    id: "why",
    p: 1.02,
    pose: { ...leftArmRest, ...handAtFace },
  },
  { id: "why", p: 1.1, pose: { specs: 0 } },
  { id: "why", p: 1.2, pose: { ...armsRest, headYaw: -0.2 } },

  // Contact: back to the original appearance.
  { id: "contact", p: 0.38, pose: { ...REST, twin: 1 } },
  { id: "contact", p: 0.75, pose: { twin: 0 } },
];

export type SectionBox = { top: number; height: number };

type Track = { at: number[]; value: number[] };
export type Tracks = Record<PoseKey, Track>;

/** Per-property tracks from keyframes already resolved to scroll positions. */
function buildTracks(resolved: { at: number; pose: Partial<Pose> }[]): Tracks {
  const tracks = Object.fromEntries(
    poseKeys.map((key) => [key, { at: [], value: [] }]),
  ) as unknown as Tracks;
  // Stable sort keeps authored order for keys that resolve to the same position.
  for (const { at, pose } of [...resolved].sort((a, b) => a.at - b.at)) {
    for (const name of Object.keys(pose) as PoseKey[]) {
      const track = tracks[name];
      const last = track.at.length - 1;
      // Ensure strictly increasing positions so interpolation never divides by zero.
      const position = last >= 0 && at <= track.at[last] ? track.at[last] + 1 : at;
      track.at.push(position);
      track.value.push(pose[name]!);
    }
  }
  return tracks;
}

export function resolveTracks(
  boxes: Partial<Record<SectionId, SectionBox>>,
  viewport: number,
): Tracks {
  return buildTracks(
    keys
      .map((key) => {
        const box = boxes[key.id];
        if (!box) return null;
        const at =
          box.top +
          (key.p - 1) * viewport +
          (key.q ?? 0) * Math.max(box.height - viewport, 0);
        return { at, pose: key.pose };
      })
      .filter((key) => key !== null),
  );
}

/*
 * Compact screens (cinematic story, lib/story.ts): keyframes in beat units.
 * Beat k is active from about k + 0.23 to k + 0.58; the transition into it runs
 * from k - 0.42 to k + 0.23 (lib/story.ts). The robot looks and gestures towards the side each panel
 * enters from.
 */
const look = (side: -1 | 1) => ({ headYaw: side * 0.4, headPitch: -0.12, torsoYaw: side * 0.08 });
const present = (side: -1 | 1) =>
  side < 0
    ? { lArmPitch: -0.42, lArmRoll: -0.55, lArmYaw: 0.3, lElbow: -0.65, lWrist: 0.15, lTwist: -1.2, lGrip: 0.05, ...rightArmRest }
    : { rArmPitch: -0.42, rArmRoll: 0.55, rArmYaw: -0.3, rElbow: -0.65, rWrist: 0.15, rTwist: 1.2, rGrip: 0.05, ...leftArmRest };

const serviceBeats = [2, 3, 4, 5, 6].flatMap((beat) => {
  const side = beat % 2 === 0 ? -1 : 1;
  return [
    { at: beat - 0.25, pose: { ...look(side), ...present(side) } },
    { at: beat + 0.55, pose: { ...look(side), headPitch: -0.08 } },
  ];
});

export const storyKeys: { at: number; pose: Partial<Pose> }[] = [
  { at: 0, pose: { ...REST } },
  // Hero → About: scan to the twin, spectacles on and adjusted.
  { at: 0.6, pose: { twin: 0 } },
  { at: 1.0, pose: { twin: 1, ...armsRest, headYaw: -0.34 } },
  { at: 1.22, pose: { headYaw: -0.12, headPitch: -0.04, ...handAtFace, specs: 0 } },
  { at: 1.36, pose: { specs: 1 } },
  { at: 1.46, pose: { rArmPitch: -1.24, rElbow: -2.14, headPitch: 0.02 } },
  { at: 1.66, pose: { ...armsRest, headYaw: 0, headPitch: 0, torsoYaw: 0 } },
  // Services: alternate gaze and gesture with each panel.
  ...serviceBeats,
  { at: 6.62, pose: { ...armsRest, headYaw: 0, headPitch: 0, torsoYaw: 0, globe: 0 } },
  // SEO & GEO (from the right): globe in the right palm.
  {
    at: 7.05,
    pose: {
      globe: 1,
      headYaw: 0.22,
      headPitch: -0.2,
      ...leftArmRest,
      rArmPitch: -0.22,
      rArmRoll: 0.1,
      rArmYaw: -0.36,
      rElbow: -1.36,
      rWrist: 0,
      rTwist: 1.57,
      rGrip: 0.1,
    },
  },
  { at: 7.5, pose: { globe: 1, headYaw: 0.16 } },
  { at: 7.68, pose: { globe: 0, ...armsRest, headYaw: 0, headPitch: 0 } },
  // Expertise: spectacles become the VR headset.
  { at: 7.85, pose: { ...handsAtHead, visor: 0, headPitch: 0.04 } },
  { at: 7.95, pose: { visor: 0 } },
  { at: 8.2, pose: { visor: 1 } },
  { at: 8.45, pose: { ...handsAtHead } },
  // Process: hologram, one step at a time.
  { at: 8.7, pose: { ...handsOnHologram, holo: 0, headPitch: 0 } },
  { at: 9.0, pose: { holo: 1, holoFocus: 0, headYaw: -0.16, headPitch: -0.1 } },
  { at: 9.2, pose: { holoFocus: 1, rArmRoll: 0.3, lArmRoll: -0.04 } },
  { at: 9.38, pose: { holoFocus: 2, headYaw: 0.16, rArmRoll: 0.04, lArmRoll: -0.3 } },
  { at: 9.56, pose: { holoFocus: 3, rArmRoll: 0.32, lArmRoll: -0.08 } },
  // Why Novahomin: headset off, spectacles off.
  { at: 9.72, pose: { holo: 0, ...armsRest, headYaw: 0, headPitch: 0 } },
  { at: 9.92, pose: { ...handsAtHead, visor: 1 } },
  { at: 10.12, pose: { visor: 0, specs: 1 } },
  { at: 10.26, pose: { ...leftArmRest, ...handAtFace } },
  { at: 10.36, pose: { specs: 0 } },
  { at: 10.52, pose: { ...armsRest, headYaw: -0.2 } },
  // Contact: the original appearance returns.
  { at: 10.62, pose: { ...REST, twin: 1 } },
  { at: 11.0, pose: { twin: 0 } },
];

export function resolveStoryTracks(start: number, unit: number): Tracks {
  return buildTracks(storyKeys.map((key) => ({ at: start + key.at * unit, pose: key.pose })));
}

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Piecewise interpolation with a cubic ease between neighbouring keys. */
export function samplePose(tracks: Tracks, scroll: number, out: Pose) {
  for (const name of poseKeys) {
    const { at, value } = tracks[name];
    if (at.length === 0) {
      out[name] = REST[name];
      continue;
    }
    if (scroll <= at[0]) {
      out[name] = value[0];
      continue;
    }
    const last = at.length - 1;
    if (scroll >= at[last]) {
      out[name] = value[last];
      continue;
    }
    let index = 1;
    while (at[index] < scroll) index++;
    const t = (scroll - at[index - 1]) / (at[index] - at[index - 1]);
    out[name] = value[index - 1] + (value[index] - value[index - 1]) * easeInOut(t);
  }
  return out;
}
