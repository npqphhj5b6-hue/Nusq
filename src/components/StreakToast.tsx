"use client";

import { useEffect, useState } from "react";
import { streakMessage } from "@/lib/streak";

interface Props {
  count: number;
}

export default function StreakToast({ count }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 1200);
    const hide = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setVisible(false), 400);
    }, 5200);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(80px + env(safe-area-inset-bottom))",
        right: 16,
        zIndex: 100,
        transition: "opacity 0.35s ease, transform 0.35s ease",
        opacity: exiting ? 0 : 1,
        transform: exiting ? "translateY(12px)" : "translateY(0)",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border-2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>🔥</span>
        <div>
          <p
            className="text-sm font-bold leading-none mb-0.5"
            style={{ color: "var(--c-text-1)", letterSpacing: "-0.02em" }}
          >
            {count}-day streak
          </p>
          <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
            {streakMessage(count)}
          </p>
        </div>
      </div>
    </div>
  );
}
