"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Counts down, then sends the visitor to the home page. They can stay on the page instead. */
export function RedirectHome({ seconds }: { seconds: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(seconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (!paused && left <= 0) router.push("/");
  }, [left, paused, router]);

  return (
    <p className="redirect-note">
      {paused ? (
        "Automatic redirect cancelled."
      ) : (
        <>
          Taking you back to the home page in <strong>{Math.max(left, 0)}</strong> {left === 1 ? "second" : "seconds"}.{" "}
          <button type="button" onClick={() => setPaused(true)}>
            Stay on this page
          </button>
        </>
      )}
    </p>
  );
}
