import { useState, useEffect } from "react";

/**
 * ReadingProgressBar — a thin yellow bar at the very top of the page
 * that fills from left to right as the user scrolls through an article.
 */
export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) { setProgress(0); return; }
      const pct = Math.min((scrollTop / docHeight) * 100, 100);
      setProgress(pct);
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress(); // set initial value
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 z-[100] h-[3px] transition-none"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, oklch(0.85 0.18 95), oklch(0.78 0.18 95))",
        boxShadow: progress > 0 ? "0 0 8px oklch(0.85 0.18 95 / 0.6)" : "none",
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    />
  );
}
