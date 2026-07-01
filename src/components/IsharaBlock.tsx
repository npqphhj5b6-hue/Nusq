import Link from "next/link";
import type { Signal, Direction } from "@/lib/signals";
import { directionLabel } from "@/lib/signals";
import SignalShareButton from "@/components/SignalShareButton";
import AnnotatedText from "@/components/AnnotatedText";
import { annotateText } from "@/lib/terms";

interface Props {
  signal: Signal;
  compact?: boolean;
}

function TrendUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 6" />
      <polyline points="14 6 21 6 21 13" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 7 9 13 13 9 21 18" />
      <polyline points="14 18 21 18 21 11" />
    </svg>
  );
}

function WatchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const DIRECTION_ICON: Record<Direction, () => React.ReactElement> = {
  positive: TrendUpIcon,
  negative: TrendDownIcon,
  watch: WatchIcon,
};

const DIRECTION_CLASS: Record<Direction, string> = {
  positive: "chip-positive",
  negative: "chip-negative",
  watch: "chip-watch",
};

export default function IsharaBlock({ signal, compact = false }: Props) {
  const Icon = DIRECTION_ICON[signal.direction];
  const country = signal.geographies[0];

  // Own scope, independent of any surrounding briefing prose — each Ishara block
  // is its own reading unit, so its first term mention gets the click-to-define treatment.
  const usedTermSlugs = new Set<string>();
  const headlineTokens = annotateText(signal.headline, usedTermSlugs);
  const detailTokens = signal.detail ? annotateText(signal.detail, usedTermSlugs) : null;

  return (
    <Link href={`/briefings/${signal.sourceSlug}`} className="group block">
      <div className="card">
        <div className="p-4 sm:p-5">
          {/* Direction indicator: icon + word */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-lg ${DIRECTION_CLASS[signal.direction]}`}>
              <Icon />
              {directionLabel(signal.direction)}
            </span>
            <SignalShareButton
              headline={signal.headline}
              detail={signal.detail ?? ""}
              slug={signal.sourceSlug}
            />
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
            <AnnotatedText tokens={headlineTokens} />
          </p>

          {/* Why it matters */}
          {detailTokens && (
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--c-text-2)" }}>
              <AnnotatedText tokens={detailTokens} />
            </p>
          )}

          {/* Source + country — muted */}
          <p
            className="text-[10px]"
            style={{ color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}
          >
            {signal.sourcePublisher}
            {country ? ` · ${country}` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
