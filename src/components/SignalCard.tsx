import Link from "next/link";
import type { Signal } from "@/lib/signals";
import { directionLabel, directionClass } from "@/lib/signals";
import SignalShareButton from "@/components/SignalShareButton";

interface Props {
  signal: Signal;
  compact?: boolean;
}

const DOT_CLASS: Record<string, string> = {
  positive: "dot-positive",
  watch: "dot-watch",
  negative: "dot-negative",
};

const BAR_CLASS: Record<string, string> = {
  positive: "bar-positive",
  watch: "bar-watch",
  negative: "bar-negative",
};

export default function SignalCard({ signal, compact = false }: Props) {
  return (
    <Link href={`/briefings/${signal.sourceSlug}`} className="group block">
      <div
        className="card relative overflow-hidden flex"
        style={{ minHeight: compact ? 0 : undefined }}
      >
        {/* Left accent bar */}
        <div className={`w-[3px] shrink-0 rounded-l-full ${BAR_CLASS[signal.direction]}`} style={{ opacity: 0.8 }} />

        <div className="flex-1 p-4 sm:p-5">
          {/* Top row: chips + share */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.07em] uppercase px-2.5 py-1 rounded-lg ${directionClass(signal.direction)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[signal.direction]}`} />
              {directionLabel(signal.direction)}
            </span>

            {signal.relevance === "high" && (
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ color: "var(--c-accent)", background: "var(--c-accent-glow)" }}
              >
                High relevance
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span
                className="text-[10px] tabular-nums"
                style={{ color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}
              >
                {signal.confidence}% conf.
              </span>
              <SignalShareButton
                headline={signal.headline}
                detail={signal.detail ?? ""}
                slug={signal.sourceSlug}
              />
            </div>
          </div>

          {/* Headline */}
          <p
            className="font-semibold leading-snug mb-2 transition-colors duration-150 group-hover:text-[var(--c-accent)]"
            style={{
              color: "var(--c-text-1)",
              fontSize: compact ? "0.875rem" : "0.975rem",
              letterSpacing: "-0.02em",
            }}
          >
            {signal.headline}
          </p>

          {/* Detail */}
          {!compact && signal.detail && (
            <p
              className="text-sm leading-relaxed mb-3.5 line-clamp-2"
              style={{ color: "var(--c-text-2)" }}
            >
              {signal.detail}
            </p>
          )}

          {/* Tags + source */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[...signal.sectors.slice(0, 3), ...signal.geographies.slice(0, 2)].map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                style={{
                  color: "var(--c-text-3)",
                  background: "var(--c-surface-2)",
                  border: "1px solid var(--c-border)",
                }}
              >
                {tag}
              </span>
            ))}
            <span
              className="text-[10px] ml-auto whitespace-nowrap"
              style={{ color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}
            >
              {signal.sourcePublisher} ·{" "}
              {new Date(signal.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
