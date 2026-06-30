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
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl"
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        color: "var(--c-text-2)",
      }}
      title={`${count}-day reading streak`}
    >
      🔥 {count}-day streak
    </span>
  );
}
