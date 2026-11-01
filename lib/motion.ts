import type { gsap as GSAP } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import {
  resolveTracks,
  samplePose,
  sectionIds,
  type SectionBox,
  type SectionId,
  type Tracks,
} from "@/lib/robot/choreography";
import { notify, robot } from "@/lib/robot/store";

let tracks: Tracks | null = null;

function measureSections() {
  const boxes: Partial<Record<SectionId, SectionBox>> = {};
  for (const id of sectionIds) {
    const element = document.getElementById(id);
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    boxes[id] = { top: rect.top + scrollY, height: rect.height };
  }
  return boxes;
}

function updateChoreography(scroll: number) {
  if (!tracks) return;
  samplePose(tracks, scroll, robot.target);
  notify();
}

/**
 * Scroll choreography. The robot's pose is sampled from section-anchored keyframes
 * (lib/robot/choreography.ts); DOM panels use scrubbed GSAP tweens so every
 * transition plays forwards and backwards with the scrollbar.
 */
export function setupMotion(
  gsap: typeof GSAP,
  ScrollTrigger: typeof ScrollTriggerType,
) {
  const robotTrigger = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => updateChoreography(self.scroll()),
    onRefresh: (self) => {
      tracks = resolveTracks(measureSections(), innerHeight);
      updateChoreography(self.scroll());
    },
  });

  const media = gsap.matchMedia();
  media.add(
    {
      desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      compact: "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)",
    },
    (context) => {
      const { desktop } = context.conditions as { desktop: boolean };

      for (const element of gsap.utils.toArray<HTMLElement>("[data-reveal]")) {
        // Desktop content slides in from its side; compact layouts move vertically only.
        const direction = desktop ? element.dataset.reveal : "up";
        const offset = desktop ? 36 : 22;
        gsap.fromTo(
          element,
          {
            opacity: 0,
            x: direction === "left" ? -offset : direction === "right" ? offset : 0,
            y: direction === "up" ? offset : 0,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: element,
              start: "top 92%",
              end: "top 64%",
              scrub: 0.6,
            },
          },
        );
      }

      if (desktop) {
        servicesScene(gsap);
        processScene(gsap);
      } else {
        for (const element of gsap.utils.toArray<HTMLElement>("[data-panel], [data-step]")) {
          gsap.fromTo(
            element,
            { opacity: 0, y: 26, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: element,
                start: "top 94%",
                end: "top 72%",
                scrub: 0.5,
              },
            },
          );
        }
      }
    },
  );

  // Fonts and the sticky scenes can change section offsets after first layout.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => {
    media.revert();
    robotTrigger.kill();
  };
}

/** Desktop: panels enter around the robot in two waves, matching its gaze and gestures. */
function servicesScene(gsap: typeof GSAP) {
  const section = document.getElementById("services");
  if (!section) return;
  const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", section);
  const timeline = gsap.timeline({
    defaults: { ease: "power2.out", duration: 0.09 },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: ({ progress }) => {
        const focus = progress < 0.36 ? "left" : progress < 0.8 ? "right" : "all";
        if (section.dataset.focus !== focus) section.dataset.focus = focus;
      },
    },
  });
  let leftIndex = 0;
  let rightIndex = 0;
  for (const panel of panels) {
    const left = panel.dataset.side === "left";
    const at = left ? 0.04 + leftIndex++ * 0.09 : 0.42 + rightIndex++ * 0.08;
    timeline.fromTo(
      panel,
      { opacity: 0, x: left ? -64 : 64, y: 18, scale: 0.9, rotation: left ? -4 : 4 },
      { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0 },
      at,
    );
  }
  // A small, controlled orbital drift once every capability is in place.
  timeline.to(
    panels.filter((panel) => panel.dataset.side === "left"),
    { y: -12, x: -6, ease: "sine.inOut", duration: 0.18 },
    0.8,
  );
  timeline.to(
    panels.filter((panel) => panel.dataset.side === "right"),
    { y: 12, x: 6, ease: "sine.inOut", duration: 0.18 },
    0.8,
  );
  timeline.set({}, {}, 1);
}

/** Desktop: one step at a time, in sync with the holographic panel in focus. */
function processScene(gsap: typeof GSAP) {
  const section = document.getElementById("process");
  if (!section) return;
  const steps = gsap.utils.toArray<HTMLElement>("[data-step]", section);
  const timeline = gsap.timeline({
    defaults: { ease: "power2.out", duration: 0.1 },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: ({ progress }) => {
        const active = String(Math.min(Math.max(Math.round(progress / 0.3), 0), 3));
        if (section.dataset.active !== active) section.dataset.active = active;
      },
    },
  });
  steps.forEach((step, index) => {
    const left = step.dataset.side === "left";
    timeline.fromTo(
      step,
      { opacity: 0, x: left ? -40 : 40, scale: 0.96 },
      { opacity: 1, x: 0, scale: 1 },
      Math.max(index * 0.3 - 0.08, 0),
    );
  });
  timeline.set({}, {}, 1);
}
