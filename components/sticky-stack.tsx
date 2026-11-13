"use client";

import { useEffect, useRef } from "react";

/**
 * Stacking cards: each child pins while the next slides over it. A card taller than the
 * screen (phones) pins by a negative offset, so its bottom edge is what stays in view.
 */
export function StickyStack({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const place = () => {
      for (const card of Array.from(root.children) as HTMLElement[]) {
        const room = window.innerHeight - card.offsetHeight - 16;
        card.style.top = `${Math.min(96, room)}px`;
      }
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(root);
    for (const card of Array.from(root.children)) observer.observe(card);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  return (
    <div className="feature-stack" ref={ref}>
      {children}
    </div>
  );
}
