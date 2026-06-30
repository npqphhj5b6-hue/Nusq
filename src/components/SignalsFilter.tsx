"use client";

import { useRouter, usePathname } from "next/navigation";
import { directionLabel } from "@/lib/signals";

type Dir = "positive" | "watch" | "negative";

interface Props {
  sectors: string[];
  directions: readonly Dir[];
  active: { sector?: string; direction?: string };
}

const DIR_STYLE: Record<Dir, { color: string; bg: string; border: string }> = {
  positive: { color: "var(--c-positive)", bg: "var(--c-positive-bg)", border: "var(--c-positive-border)" },
  watch:    { color: "var(--c-watch)",    bg: "var(--c-watch-bg)",    border: "var(--c-watch-border)" },
  negative: { color: "var(--c-negative)", bg: "var(--c-negative-bg)", border: "var(--c-negative-border)" },
};

export default function SignalsFilter({ sectors, directions, active }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams();
    if (key !== "sector" && active.sector) params.set("sector", active.sector);
    if (key !== "direction" && active.direction) params.set("direction", active.direction);
    if (value) params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Direction */}
      <div className="flex flex-wrap gap-2">
        {directions.map(d => {
          const s = DIR_STYLE[d];
          const isActive = active.direction === d;
          return (
            <button
              key={d}
              onClick={() => setParam("direction", isActive ? undefined : d)}
              className="text-[11px] font-bold tracking-[0.06em] uppercase px-3 py-1.5 rounded-xl transition-all duration-150"
              style={{
                color: isActive ? s.color : "var(--c-text-3)",
                background: isActive ? s.bg : "var(--c-surface-2)",
                border: `1px solid ${isActive ? s.border : "var(--c-border)"}`,
              }}
            >
              {directionLabel(d)}
            </button>
          );
        })}
      </div>

      {/* Sectors */}
      {sectors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sectors.map(s => {
            const isActive = active.sector === s;
            return (
              <button
                key={s}
                onClick={() => setParam("sector", isActive ? undefined : s)}
                className="text-[11px] px-3 py-1.5 rounded-xl transition-all duration-150 font-medium"
                style={{
                  color: isActive ? "var(--c-text-1)" : "var(--c-text-3)",
                  background: isActive ? "var(--c-surface-3)" : "var(--c-surface-2)",
                  border: `1px solid ${isActive ? "var(--c-border-2)" : "var(--c-border)"}`,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
