"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const total = scrollHeight - clientHeight;
      setProgress(total > 0 ? (scrollTop / total) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="h-[2px] bg-[#1A2B40]">
      <div
        className="h-full bg-gradient-to-r from-[#C9A967] to-[#E8C97A]"
        style={{ width: `${progress}%`, transition: "width 0.08s linear" }}
      />
    </div>
  );
}
