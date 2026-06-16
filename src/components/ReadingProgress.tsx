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
    <div className="h-[1px] bg-[#132030]">
      <div
        className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FCD34D]"
        style={{ width: `${progress}%`, transition: "width 0.08s linear" }}
      />
    </div>
  );
}
