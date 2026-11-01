"use client";

import { useEffect } from "react";

const intent = ["scroll", "wheel", "touchstart", "pointerdown", "pointermove", "keydown"];

/**
 * Loads GSAP on the visitor's first interaction, off the critical path. Nothing
 * above the fold depends on it: every scroll animation starts below the hero.
 * Renders nothing.
 */
export function ScrollDirector() {
  useEffect(() => {
    // Reduced motion: content is static and fully visible; skip the library entirely.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let started = false;
    let teardown: (() => void) | undefined;
    const start = async () => {
      if (started) return;
      started = true;
      for (const name of intent) removeEventListener(name, trigger);
      let modules;
      try {
        modules = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("@/lib/motion"),
        ]);
      } catch {
        return; // Offline or blocked: content is already visible and static.
      }
      const [{ gsap }, { ScrollTrigger }, { setupMotion }] = modules;
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      teardown = setupMotion(gsap, ScrollTrigger);
      document.documentElement.dataset.motion = "ready";
    };
    const trigger = () => void start();
    // Already scrolled (restored position or a #section link): start straight away.
    if (scrollY > 0 || location.hash) trigger();
    else for (const name of intent) addEventListener(name, trigger, { passive: true });
    return () => {
      cancelled = true;
      for (const name of intent) removeEventListener(name, trigger);
      teardown?.();
    };
  }, []);
  return null;
}
