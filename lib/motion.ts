import type { gsap as GSAP } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import {
  resolveStoryTracks,
  resolveTracks,
  samplePose,
  sectionIds,
  type SectionBox,
  type SectionId,
  type Tracks,
} from "@/lib/robot/choreography";
import { notify, robot } from "@/lib/robot/store";
import {
  ENTER_DURATION,
  ENTER_START,
  EXIT_DURATION,
  EXIT_START,
  RIG_DURATION,
  RIG_START,
  STORY_BEATS,
  storyAnchors,
} from "@/lib/story";

let tracks: Tracks | null = null;
/** Set while the compact cinematic story is active; the robot then follows story beats. */
let story: { start: () => number; unit: () => number } | null = null;

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
 * Scroll choreography. Desktop: the robot's pose is sampled from section-anchored
 * keyframes and DOM panels use scrubbed tweens. Compact screens with motion: a
 * single scrubbed story timeline moves every panel horizontally around the robot
 * (lib/story.ts). Everything plays forwards and backwards with the scrollbar.
 */
export function setupMotion(
  gsap: typeof GSAP,
  ScrollTrigger: typeof ScrollTriggerType,
) {
  const media = gsap.matchMedia();
  media.add(
    {
      desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      compact: "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)",
      landscape: "(orientation: landscape)",
    },
    (context) => {
      const { desktop, compact, landscape } = context.conditions as Record<string, boolean>;
      if (desktop) {
        for (const element of gsap.utils.toArray<HTMLElement>("[data-reveal]")) {
          const offset = element.dataset.reveal === "left" ? -36 : 36;
          gsap.fromTo(
            element,
            { opacity: 0, x: offset },
            {
              opacity: 1,
              x: 0,
              ease: "power2.out",
              scrollTrigger: { trigger: element, start: "top 92%", end: "top 64%", scrub: 0.6 },
            },
          );
        }
        servicesScene(gsap);
        processScene(gsap);
      } else if (compact && document.documentElement.hasAttribute("data-cinema")) {
        return storyScene(gsap, landscape);
      }
    },
  );

  // Created after the scenes so its first refresh already knows the active mode.
  const robotTrigger = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => updateChoreography(self.scroll()),
    onRefresh: (self) => {
      tracks = story
        ? resolveStoryTracks(story.start(), story.unit())
        : resolveTracks(measureSections(), innerHeight);
      updateChoreography(self.scroll());
    },
  });

  return () => {
    media.revert();
    robotTrigger.kill();
  };
}

type StoryItem = {
  element: HTMLElement;
  beat: number;
  exit: number;
  side: -1 | 1;
  zone: string;
};

/**
 * Compact screens: one sticky viewport, twelve beats. Each element enters from its
 * side (translateX ∓100%, opacity 0, scale 0.94 → rest), holds, then leaves towards
 * the same side as the next beat arrives from the opposite one.
 */
function storyScene(gsap: typeof GSAP, landscape: boolean) {
  const root = document.querySelector<HTMLElement>(".story");
  const viewport = root?.querySelector<HTMLElement>(".story-viewport");
  const stage = document.querySelector<HTMLElement>(".stage");
  const figure = stage?.querySelector<HTMLElement>(".stage-figure");
  if (!root || !viewport || !stage || !figure) return;

  const items: StoryItem[] = gsap.utils
    .toArray<HTMLElement>("[data-story]", root)
    .filter((element) => getComputedStyle(element).display !== "none")
    .map((element) => {
      const beat = Number(element.dataset.story);
      return {
        element,
        beat,
        exit: Number(element.dataset.storyExit ?? beat),
        side: element.dataset.from === "left" ? -1 : 1,
        zone: element.dataset.zone ?? "lower",
      };
    });

  const span = () => root.offsetHeight - viewport.offsetHeight;
  story = {
    start: () => root.getBoundingClientRect().top + scrollY,
    unit: () => span() / STORY_BEATS,
  };

  const process = document.getElementById("process");
  let beatShown = "";
  let stepShown = "";
  const onProgress = (units: number) => {
    const beat = String(Math.min(STORY_BEATS - 1, Math.max(0, Math.floor(units + 0.4))));
    if (beat !== beatShown) root.dataset.beat = beatShown = beat;
    // Process steps light up in sync with the hologram panel in focus.
    const step = String(Math.min(3, Math.max(0, Math.floor((units - 8.92) / 0.18))));
    if (process && step !== stepShown) process.dataset.active = stepShown = step;
  };

  onProgress(0);
  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: () => `+=${span()}`,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => onProgress(self.progress * STORY_BEATS),
    },
  });

  for (const item of items) {
    // Several elements in one zone (two cards, two step columns) follow each other closely.
    const order = items
      .filter((other) => other.beat === item.beat && other.zone === item.zone)
      .indexOf(item);
    const delay = order * 0.04 + (item.zone === "lower" ? 0.03 : 0);
    if (item.beat > 0)
      timeline.fromTo(
        item.element,
        { xPercent: item.side * 100, autoAlpha: 0, scale: 0.94 },
        { xPercent: 0, autoAlpha: 1, scale: 1, duration: ENTER_DURATION, ease: "power2.out" },
        item.beat + ENTER_START + delay,
      );
    if (item.exit < STORY_BEATS - 1)
      timeline.fromTo(
        item.element,
        { xPercent: 0, autoAlpha: 1, scale: 1 },
        {
          xPercent: item.side * 70,
          autoAlpha: 0,
          scale: 0.96,
          duration: EXIT_DURATION,
          ease: "power2.in",
          immediateRender: false,
        },
        item.exit + EXIT_START + delay / 2,
      );
  }

  // Portrait: scale/shift the robot per beat so no panel ever covers it.
  if (!landscape) {
    const fits = fitRobot(items, figure, viewport);
    const rig = (index: number) => ({ "--rig-s": fits[index].s, "--rig-y": `${fits[index].y}px` });
    gsap.set(stage, rig(0));
    for (let beat = 1; beat < STORY_BEATS; beat++)
      timeline.fromTo(
        stage,
        rig(beat - 1),
        { ...rig(beat), duration: RIG_DURATION, ease: "power1.inOut", immediateRender: false },
        beat + RIG_START,
      );
  }
  timeline.set({}, {}, STORY_BEATS);

  // In-page links land on the right beat instead of the section's DOM position.
  const goTo = (id: string, behavior: ScrollBehavior) => {
    const beat = storyAnchors[id];
    if (beat === undefined || !story) return false;
    scrollTo({ top: story.start() + (beat + 0.3) * story.unit(), behavior });
    return true;
  };
  const onClick = (event: MouseEvent) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (link && goTo(link.hash.slice(1), "smooth")) event.preventDefault();
  };
  document.addEventListener("click", onClick);
  if (location.hash) requestAnimationFrame(() => goTo(location.hash.slice(1), "instant"));

  return () => {
    document.removeEventListener("click", onClick);
    story = null;
    delete root.dataset.beat;
  };
}

/**
 * For each beat, find the free band between the upper and lower content and fit
 * the robot inside it: unchanged if it already fits, otherwise scaled (≥ 0.5) and
 * centred. Uses layout offsets, so current transforms do not matter.
 */
function fitRobot(items: StoryItem[], figure: HTMLElement, viewport: HTMLElement) {
  const top = figure.offsetTop;
  const height = figure.offsetHeight;
  const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 64;
  const fits: { s: number; y: number }[] = [];
  for (let beat = 0; beat < STORY_BEATS; beat++) {
    let upper = header;
    let lower = viewport.clientHeight;
    for (const item of items) {
      if (item.beat > beat || item.exit < beat) continue;
      const offset = item.element.offsetTop;
      if (item.zone === "upper") upper = Math.max(upper, offset + item.element.offsetHeight);
      else lower = Math.min(lower, offset);
    }
    const bandTop = upper + 12;
    const bandBottom = lower - 12;
    if (top >= bandTop && top + height <= bandBottom) {
      fits.push({ s: 1, y: 0 });
      continue;
    }
    const band = bandBottom - bandTop;
    const s = Math.min(1, Math.max(band / height, 0.5));
    fits.push({
      s: Math.round(s * 1000) / 1000,
      y: Math.round(bandTop + Math.max(0, (band - s * height) / 2) - top),
    });
  }
  return fits;
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
