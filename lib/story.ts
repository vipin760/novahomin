/**
 * Compact-screen (< 1024 px) cinematic story. Content is grouped into twelve beats
 * declared in the markup with data attributes:
 *
 *   data-story="k"        first beat the element is on screen
 *   data-story-exit="m"   last beat it stays (defaults to k)
 *   data-from="left|right" side it enters from (and leaves towards)
 *   data-zone="upper|lower" where it rests: above or below the robot
 *
 * Timeline, in beat units (one unit = --beat of scroll):
 *   entrance  k - 0.12 → k + 0.23   translateX(∓100%) → 0, opacity 0 → 1, scale 0.94 → 1
 *   active    k + 0.23 → k + 0.58
 *   exit      m + 0.58 → m + 0.90   away towards its side, opacity → 0
 * The next beat enters from the opposite side as the exit completes, so two
 * panels never sit half-visible on top of each other.
 */
export const STORY_BEATS = 12;
export const ENTER_START = -0.12;
export const ENTER_DURATION = 0.35;
export const EXIT_START = 0.58;
export const EXIT_DURATION = 0.32;
/** The robot re-fits (scale/position) across each transition window. */
export const RIG_START = -0.42;
export const RIG_DURATION = 0.65;

/** Where in-page links land in the story (active start of the section's first beat). */
export const storyAnchors: Record<string, number> = {
  top: 0,
  about: 1,
  services: 2,
  visibility: 7,
  expertise: 8,
  process: 9,
  why: 10,
  contact: 11,
};
