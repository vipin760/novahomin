"use client";

export function BackToTop() {
  return (
    <button
      type="button"
      className="back-to-top"
      onClick={() => {
        const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
      }}
    >
      Back to top <span aria-hidden="true">↑</span>
    </button>
  );
}
