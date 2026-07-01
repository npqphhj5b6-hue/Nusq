"use client";

import { useEffect, useState } from "react";
import { getStreak } from "@/lib/streak";

export default function StreakBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const s = getStreak();
    if (s && s.count > 0) setCount(s.count);
  }, []);

  if (!count) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 100,
        background: "var(--c-accent-glow)",
        color: "var(--c-accent)",
      }}
      title={`${count}-day reading streak`}
    >
      <span style={{ display: "inline-block", animation: "pulseSoft 2.2s ease-in-out infinite" }}>🔥</span>
      {count}-day streak
    </span>
  );
}
