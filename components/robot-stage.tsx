"use client";

import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Quality } from "@/lib/robot/build";
import { notify, robot, subscribe } from "@/lib/robot/store";
import { mark } from "@/lib/timing";
import type { Eyewear } from "./robot-canvas";

const RobotCanvas = lazy(() => import("./robot-canvas"));

type State = "poster" | "loading" | "ready" | "fallback";

class SceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
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

/** Decide whether this device should get the interactive scene, and at what quality. */
function chooseQuality(): Quality | null {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData || (nav.deviceMemory ?? 4) < 2) return null;
  try {
    const probe = document.createElement("canvas");
    const gl = (probe.getContext("webgl2") || probe.getContext("webgl")) as
      | WebGLRenderingContext
      | null;
    if (!gl) return null;
    // Software rasterisers (blocklisted GPUs, VMs, remote desktops) keep the poster.
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(
      gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
    );
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return null;
  } catch {
    return null;
  }
  const cores = navigator.hardwareConcurrency || 4;
  if (innerWidth < 700 || cores <= 2) return "low";
  if (innerWidth < 1024 || cores <= 4) return "medium";
  return "high";
}

const avifSet =
  "/robot/novahomin-robot-360.avif 360w, /robot/novahomin-robot-420.avif 420w, /robot/novahomin-robot-540.avif 540w, /robot/novahomin-robot-670.avif 670w";
const webpSet =
  "/robot/novahomin-robot-360.webp 360w, /robot/novahomin-robot-420.webp 420w, /robot/novahomin-robot-540.webp 540w, /robot/novahomin-robot-670.webp 670w";
const posterSizes = "(max-width: 699px) 27vh, 38vh";

export function RobotStage() {
  const stage = useRef<HTMLDivElement>(null);
  const ready = useRef(false);
  const [state, setState] = useState<State>("poster");
  const [quality, setQuality] = useState<Quality | null>(null);

  // Load the 3D twin on the first interaction. The hero shows the reference poster,
  // so nothing the visitor sees on arrival waits for WebGL.
  useEffect(() => {
    const events = ["scroll", "wheel", "touchstart", "pointerdown", "pointermove", "keydown"];
    const start = () => {
      cleanup();
      const chosen = chooseQuality();
      if (!chosen) return;
      mark("3d-start");
      setQuality(chosen);
      setState("loading");
    };
    function cleanup() {
      for (const name of events) removeEventListener(name, start);
    }
    if (scrollY > 0) start();
    else for (const name of events) addEventListener(name, start, { passive: true });
    return cleanup;
  }, []);

  // One loop drives the poster ↔ twin transition and requests WebGL frames.
  // It stops entirely while the poster is showing and the target is settled.
  useEffect(() => {
    const element = stage.current!;
    let frame = 0;
    let shown = 0;
    let last = 0;
    let lastRender = 0;
    let view = "";
    const interval = 1000 / (innerWidth < 700 ? 30 : 60) - 1;

    const tick = (now: number) => {
      frame = 0;
      const goal = ready.current ? robot.target.twin : 0;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      shown += (goal - shown) * (1 - Math.exp(-dt * 6));
      if (Math.abs(goal - shown) < 0.002) shown = goal;
      element.style.setProperty("--twin", shown.toFixed(4));
      element.style.setProperty("--scan", (4 * shown * (1 - shown)).toFixed(3));
      const next = shown <= 0 ? "poster" : shown >= 1 ? "3d" : "transition";
      if (next !== view) element.dataset.view = view = next;
      if (shown > 0 && now - lastRender >= interval) {
        robot.invalidate?.();
        lastRender = now;
      }
      if (shown > 0 || shown !== goal) frame = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const unsubscribe = subscribe(kick);
    const onVisibility = () => {
      if (document.visibilityState === "visible") kick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    kick();
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Subtle pointer parallax on the figure (fine pointers only).
  useEffect(() => {
    const element = stage.current!;
    if (
      !matchMedia("(pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const onMove = (event: PointerEvent) => {
      x = event.clientX / innerWidth - 0.5;
      y = event.clientY / innerHeight - 0.5;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        element.style.setProperty("--px", (x * 10).toFixed(1) + "px");
        element.style.setProperty("--py", (y * 6).toFixed(1) + "px");
      });
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => {
      removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const onReady = useCallback(() => {
    ready.current = true;
    setState("ready");
    notify();
  }, []);

  const onFail = useCallback(() => {
    ready.current = false;
    setState("fallback");
    setQuality(null);
    notify();
  }, []);

  const onEyewear = useCallback((value: Eyewear) => {
    if (stage.current) stage.current.dataset.eyewear = value;
  }, []);

  return (
    <div
      className="stage"
      ref={stage}
      data-state={state}
      data-quality={quality ?? undefined}
      data-view="poster"
      data-eyewear="none"
    >
      <div className="stage-atmosphere" aria-hidden="true" />
      {/* The rig is scaled/shifted per story beat on compact screens (--rig-s, --rig-y). */}
      <div className="stage-rig">
      <div className="stage-orbit" aria-hidden="true">
        <i />
      </div>
      <div className="stage-figure">
        <div className="stage-poster">
          <picture>
            <source type="image/avif" srcSet={avifSet} sizes={posterSizes} />
            <source type="image/webp" srcSet={webpSet} sizes={posterSizes} />
            <img
              src="/robot/novahomin-robot-540.webp"
              width={670}
              height={1494}
              alt="The Novahomin humanoid robot: graphite armour with navy panels, cyan lights and orange accents."
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
        <div className="stage-scan" aria-hidden="true" />
        <div className="stage-canvas" aria-hidden="true">
          {quality && state !== "fallback" && (
            <SceneBoundary onError={onFail}>
              <Suspense fallback={null}>
                <RobotCanvas
                  quality={quality}
                  onReady={onReady}
                  onFail={onFail}
                  onEyewear={onEyewear}
                />
              </Suspense>
            </SceneBoundary>
          )}
        </div>
      </div>
      <div className="stage-floor" aria-hidden="true" />
      </div>
    </div>
  );
}
