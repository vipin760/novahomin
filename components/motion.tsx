"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type Lenis from "lenis";

/**
 * Motion matching the Finvelle reference (values read from its Webflow interactions):
 * - Lenis smooth scroll: duration 1.2, exponential easing, driven by the GSAP ticker.
 * - [data-anim="text"]: opacity 0 → 1, y 75px → 0, 0.8 s, 0.2 s delay, power2.out,
 *   starting when the element's top reaches the bottom of the viewport.
 * - [data-anim="card"]: opacity 0 → 1, scale 0.75 → 1, same timing.
 * - [data-anim="hero"]: opacity 0 → 1, y 75px → 0, 0.6 s, 0.2 s stagger, power1.out.
 *   The first entrance is CSS (globals.css) so it starts at first paint.
 * Unlike the reference, every animation replays each time it scrolls back into view.
 *
 * Only runs when the pre-paint script has set html.motion (motion allowed). Hidden
 * start states live in CSS under that class; html.motion-ready marks a working engine.
 */

type Engine = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  lenis: Lenis;
};

let engine: Promise<Engine> | undefined;

function loadEngine() {
  engine ??= (async () => {
    const [{ gsap }, { ScrollTrigger }, { default: LenisClass }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("lenis"),
    ]);
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new LenisClass({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return { gsap, ScrollTrigger, lenis };
  })();
  return engine;
}

type Tween = ReturnType<Engine["gsap"]["fromTo"]>;

/** Start and end states, from the reference's interactions. */
const states = {
  hero: { from: { opacity: 0, y: 75 }, to: { opacity: 1, y: 0, duration: 0.6, ease: "power1.out" } },
  text: { from: { opacity: 0, y: 75 }, to: { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power2.out" } },
  card: { from: { opacity: 0, scale: 0.75 }, to: { opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: "power2.out" } },
} as const;

export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("motion")) return;
    let disposed = false;
    const triggers: { kill(): void }[] = [];

    loadEngine()
      .then(({ gsap, ScrollTrigger, lenis }) => {
        if (disposed) return;
        lenis.resize();

        /**
         * Replays on every entry, in both scroll directions (the reference plays once).
         * An element resets only when it is completely off screen, so the reset is
         * never visible; it animates again the next time it scrolls into view.
         */
        const bind = (element: HTMLElement, tween: Tween, startHidden: boolean) => {
          let hidden = startHidden;
          const show = () => {
            if (!hidden) return;
            hidden = false;
            tween.restart(true);
          };
          const hide = () => {
            hidden = true;
            tween.pause(0);
          };
          triggers.push(
            ScrollTrigger.create({
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              onEnter: show,
              onEnterBack: show,
              onLeave: hide,
              onLeaveBack: hide,
            }),
          );
        };

        const elements = document.querySelectorAll<HTMLElement>("[data-anim]:not([data-animated])");
        for (const element of elements) {
          const kind = element.dataset.anim as keyof typeof states;
          if (!(kind in states)) continue;
          element.dataset.animated = "";
          const { from, to } = states[kind];

          if (kind !== "hero") {
            // Start state applied now (matches the CSS one), so a reset always hides.
            const tween = gsap.fromTo(element, from, { ...to, paused: true });
            bind(element, tween, true);
            continue;
          }

          // Hero: the first entrance is CSS (starts at first paint). Once it has
          // finished, hand the element to GSAP so it replays like everything else.
          const index = Number(getComputedStyle(element).getPropertyValue("--i")) || 0;
          Promise.all(element.getAnimations().map((animation) => animation.finished))
            .catch(() => undefined)
            .then(() => {
              if (disposed) return;
              element.style.animation = "none";
              // Created here so its start state is the hidden one; rendered straight
              // to the end in the same frame (lazy: false), so nothing flickers.
              const tween = gsap.fromTo(element, from, {
                ...to,
                delay: index * 0.2,
                paused: true,
                lazy: false,
              });
              tween.progress(1);
              const rect = element.getBoundingClientRect();
              const offscreen = rect.bottom < 0 || rect.top > innerHeight;
              // Scrolled away before the entrance finished: reset now, replay on return.
              if (offscreen) tween.pause(0);
              bind(element, tween, offscreen);
            });
        }
        root.classList.add("motion-ready");
        ScrollTrigger.refresh();
      })
      .catch(() => {
        // Engine failed to load: reveal everything rather than leave it hidden.
        root.classList.remove("motion");
      });

    return () => {
      disposed = true;
      for (const trigger of triggers) trigger.kill();
    };
  }, [pathname]);

  return null;
}

