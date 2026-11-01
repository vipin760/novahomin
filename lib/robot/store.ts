import { REST, type Pose } from "./pose";

/**
 * Mutable, framework-free bridge between the scroll timeline (GSAP), the DOM stage
 * and the WebGL scene. Nothing here triggers React renders, and nothing here is
 * heavy: the keyframe data loads later with GSAP (lib/motion.ts).
 */
export const robot = {
  target: { ...REST } as Pose,
  listeners: new Set<() => void>(),
  /** Registered by the WebGL scene; requests one frame (frameloop is on demand). */
  invalidate: undefined as (() => void) | undefined,
};

export function notify() {
  for (const listener of robot.listeners) listener();
}

export function subscribe(listener: () => void) {
  robot.listeners.add(listener);
  return () => {
    robot.listeners.delete(listener);
  };
}
