"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { defaultFps, probeDevice, type Probe, type Tier } from "@/lib/robot/quality";
import { notify, robot, subscribe } from "@/lib/robot/store";
import { mark } from "@/lib/timing";
import type { Eyewear } from "./robot-canvas";

type State = "poster" | "loading" | "ready" | "fallback";

const avifSet =
  "/robot/novahomin-robot-360.avif 360w, /robot/novahomin-robot-420.avif 420w, /robot/novahomin-robot-540.avif 540w, /robot/novahomin-robot-670.avif 670w";
const webpSet =
  "/robot/novahomin-robot-360.webp 360w, /robot/novahomin-robot-420.webp 420w, /robot/novahomin-robot-540.webp 540w, /robot/novahomin-robot-670.webp 670w";
const posterSizes = "(max-width: 699px) 27vh, 38vh";

export function RobotStage() {
  const stage = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const probe = useRef<Probe | null>(null);
  const ready = useRef(false);
  const [state, setState] = useState<State>("poster");
  const [tier, setTier] = useState<Tier | null>(null);

  // Load the 3D twin on the first interaction. The hero shows the reference poster,
  // so nothing the visitor sees on arrival waits for WebGL.
  useEffect(() => {
    const events = ["scroll", "wheel", "touchstart", "pointerdown", "pointermove", "keydown"];
    const start = () => {
      cleanup();
      const found = probeDevice();
      if (!found) return;
      mark("3d-start");
      probe.current = found;
      robot.fps = found.profile.fps;
      setTier(found.profile.tier);
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
    let twin = "";

    const tick = (now: number) => {
      frame = 0;
      const goal = ready.current ? robot.target.twin : 0;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      shown += (goal - shown) * (1 - Math.exp(-dt * 6));
      if (Math.abs(goal - shown) < 0.002) shown = goal;
      // Only touch styles when the value changes (steady 3D frames write nothing).
      const value = shown.toFixed(4);
      if (value !== twin) {
        twin = value;
        element.style.setProperty("--twin", value);
        element.style.setProperty("--scan", (4 * shown * (1 - shown)).toFixed(3));
      }
      const next = shown <= 0 ? "poster" : shown >= 1 ? "3d" : "transition";
      if (next !== view) element.dataset.view = view = next;
      const interval = 1000 / (robot.fps || defaultFps()) - 1;
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
    probe.current = null;
    setState("fallback");
    setTier(null);
    notify();
  }, []);

  const onEyewear = useCallback((value: Eyewear) => {
    if (stage.current) stage.current.dataset.eyewear = value;
  }, []);

  // Mount the scene once loading starts; it lives until fallback or unmount.
  const active = state === "loading" || state === "ready";
  useEffect(() => {
    const host = canvasHost.current;
    const found = probe.current;
    if (!active || !host || !found) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("./robot-canvas")
      .then(({ mountRobotScene }) =>
        cancelled ? undefined : mountRobotScene(host, found, { onReady, onFail, onEyewear }),
      )
      .then((release) => {
        if (cancelled) release?.();
        else dispose = release;
      })
      .catch(onFail);
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [active, onReady, onFail, onEyewear]);

  return (
    <div
      className="stage"
      ref={stage}
      data-state={state}
      data-quality={tier ?? undefined}
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
        {/* The WebGL canvas is attached here imperatively (mountRobotScene). */}
        <div className="stage-canvas" ref={canvasHost} aria-hidden="true" />
      </div>
      <div className="stage-floor" aria-hidden="true" />
      </div>
    </div>
  );
}
