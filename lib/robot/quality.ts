/**
 * Adaptive 3D quality. The tier comes from device capability, not just width:
 * layout width, pointer type, CPU cores, device memory and the GPU renderer
 * string. The scene can still lower its pixel ratio at runtime when frames run
 * slow (components/robot-canvas.tsx).
 */
export type Tier = "desktop-high" | "desktop" | "tablet" | "mobile-high" | "mobile-low";

export type Profile = {
  tier: Tier;
  /** Maximum device pixel ratio. */
  dpr: number;
  antialias: boolean;
  /** Ambient particles (0 = none). */
  particles: number;
  /** Bevel and radial geometry detail. */
  detail: 1 | 2 | 3;
  /** Procedural wear shader on the armour. */
  wear: boolean;
  /** Directional lights: key, fill and two rims (4) or key and one rim (2). */
  lights: 2 | 4;
  /** Environment (reflection) map size in pixels. */
  environment: 64 | 128 | 256;
  /** Frame-rate cap while the twin is on screen. */
  fps: 30 | 60;
};

// No tier uses shadows or post-processing: the scene relies on an environment map
// and a few directional lights.
const profiles: Record<Tier, Omit<Profile, "tier">> = {
  "desktop-high": { dpr: 1.5, antialias: true, particles: 180, detail: 3, wear: true, lights: 4, environment: 256, fps: 60 },
  desktop: { dpr: 1.25, antialias: true, particles: 110, detail: 2, wear: true, lights: 4, environment: 128, fps: 60 },
  tablet: { dpr: 1.5, antialias: false, particles: 60, detail: 2, wear: true, lights: 4, environment: 128, fps: 60 },
  "mobile-high": { dpr: 1.5, antialias: false, particles: 0, detail: 2, wear: false, lights: 4, environment: 128, fps: 60 },
  "mobile-low": { dpr: 1.25, antialias: false, particles: 0, detail: 1, wear: false, lights: 2, environment: 64, fps: 30 },
};

const lowerTier: Partial<Record<Tier, Tier>> = {
  "desktop-high": "desktop",
  desktop: "tablet",
  "mobile-high": "mobile-low",
};

/** Software rasterisers keep the poster; older mobile/integrated GPUs drop a tier. */
const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render/i;
// Pre-2015 Intel HD (4-digit models), entry/older Mali, Adreno 3xx–5xx, PowerVR.
const MODEST_GPU = /intel\(r\) hd graphics \d{4}\b|mali-(4\d\d|t[67]\d\d|g[35]\d)\b|adreno[^\d]*[3-5]\d\d\b|powervr/i;

function pickTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = navigator.hardwareConcurrency || 4;
  const memory = nav.deviceMemory; // Chromium only; undefined elsewhere
  const coarse = matchMedia("(pointer: coarse)").matches;
  if (innerWidth >= 1024 && !coarse)
    return cores >= 8 && (memory ?? 8) >= 8 ? "desktop-high" : "desktop";
  if (innerWidth >= 700) return "tablet";
  return cores >= 6 && (memory ?? 4) >= 4 ? "mobile-high" : "mobile-low";
}

export type Probe = {
  profile: Profile;
  canvas: HTMLCanvasElement;
  context: WebGL2RenderingContext;
};

/**
 * Decide whether this device should get the interactive scene. Creates the one
 * WebGL2 context the scene will use, with its final attributes, so capability
 * checks never cost a second context. Returns null to keep the poster.
 */
export function probeDevice(): Probe | null {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData || (nav.deviceMemory ?? 4) < 2) return null;

  let tier = pickTier();
  const canvas = document.createElement("canvas");
  let context: WebGL2RenderingContext | null = null;
  try {
    // three r187 requires WebGL 2.
    context = canvas.getContext("webgl2", {
      alpha: true,
      antialias: profiles[tier].antialias,
      depth: true,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "default",
    });
  } catch {
    return null;
  }
  if (!context) return null;

  const debug = context.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(
    context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER),
  );
  if (SOFTWARE_GPU.test(renderer)) {
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  const antialias = profiles[tier].antialias; // fixed when the context was created
  if (MODEST_GPU.test(renderer)) tier = lowerTier[tier] ?? tier;
  return { profile: { tier, ...profiles[tier], antialias }, canvas, context };
}

/** Frame-rate cap before a probe exists (the stage loop needs one immediately). */
export const defaultFps = () => (innerWidth < 700 ? 30 : 60);
