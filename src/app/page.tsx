import Link from "next/link";
import { getAllBriefings } from "@/lib/db";
import { extractSignals, directionLabel, directionClass } from "@/lib/signals";
import type { Signal } from "@/lib/signals";
import MarketBar from "@/components/MarketBar";
import ScrollReveal from "@/components/ScrollReveal";
import SubscribeForm from "@/components/SubscribeForm";
import SignalShareButton from "@/components/SignalShareButton";
import StreakBadge from "@/components/StreakBadge";

export const dynamic = "force-dynamic";

/* ── Hero signal — the one card that earns the screen ── */
function HeroSignal({ signal }: { signal: Signal }) {
  const dirClass = directionClass(signal.direction);
  const dotColor =
    signal.direction === "positive"
      ? "var(--c-positive)"
      : signal.direction === "negative"
      ? "var(--c-negative)"
      : "var(--c-watch)";

  return (
    <Link href={`/briefings/${signal.sourceSlug}`} className="group block">
      <div
        className="relative rounded-3xl overflow-hidden transition-all duration-300 group-hover:scale-[1.005]"
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          boxShadow: "var(--shadow-card-hover)",
        }}
      >
        {/* Subtle direction glow at top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: dotColor, opacity: 0.6 }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, color-mix(in srgb, ${dotColor} 6%, transparent), transparent)`,
          }}
        />

        <div className="p-6 sm:p-8">
          {/* Top row */}
          <div className="flex items-center justify-between mb-5">
            <span className="eyebrow">Today&apos;s top signal</span>
            <span
              className="text-[10px] tabular-nums"
              style={{ color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}
            >
              {signal.confidence}% confidence
            </span>
          </div>

          {/* Direction badge */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase px-3 py-1.5 rounded-xl ${dirClass}`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: dotColor,
                  boxShadow: `0 0 8px ${dotColor}`,
                }}
              />
              {directionLabel(signal.direction)}
            </span>
            {signal.sectors.slice(0, 2).map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  color: "var(--c-text-3)",
                  background: "var(--c-surface-2)",
                  border: "1px solid var(--c-border)",
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Headline */}
          <h2
            className="font-bold leading-snug mb-4 transition-colors group-hover:text-[var(--c-accent)]"
            style={{
              color: "var(--c-text-1)",
              fontSize: "clamp(1.15rem, 3vw, 1.45rem)",
              letterSpacing: "-0.03em",
            }}
          >
            {signal.headline}
          </h2>

          {/* Plain-language detail */}
          {signal.detail && (
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: "var(--c-text-2)", maxWidth: "52ch" }}
            >
              {signal.detail}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {signal.geographies.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="text-[10px] px-2 py-0.5 rounded-md"
                  style={{
                    color: "var(--c-text-3)",
                    background: "var(--c-surface-2)",
                    border: "1px solid var(--c-border)",
                  }}
                >
                  {g}
                </span>
              ))}
              <span
                className="text-[10px] ml-1"
                style={{ color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}
              >
                via {signal.sourcePublisher}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <SignalShareButton
                headline={signal.headline}
                detail={signal.detail ?? ""}
                slug={signal.sourceSlug}
              />
              <span
                className="text-xs font-medium transition-colors group-hover:text-[var(--c-accent)]"
                style={{ color: "var(--c-text-3)" }}
              >
                Read full briefing →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Compact secondary signal row ── */
function SecondarySignal({ signal }: { signal: Signal }) {
  const dotColor =
    signal.direction === "positive"
      ? "var(--c-positive)"
      : signal.direction === "negative"
      ? "var(--c-negative)"
      : "var(--c-watch)";

  return (
    <Link href={`/briefings/${signal.sourceSlug}`} className="group block">
      <div
        className="flex items-start gap-3 p-4 rounded-2xl transition-all duration-150"
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
        }}
      >
        <span
          className="mt-1.5 w-2 h-2 rounded-full shrink-0"
          style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}60` }}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-snug mb-1 group-hover:text-[var(--c-accent)] transition-colors line-clamp-2"
            style={{ color: "var(--c-text-1)", letterSpacing: "-0.02em" }}
          >
            {signal.headline}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {signal.sectors.slice(0, 2).map((s) => (
              <span key={s} className="text-[10px]" style={{ color: "var(--c-text-3)" }}>
                {s}
              </span>
            ))}
            <span className="text-[10px] ml-auto" style={{ color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}>
              {new Date(signal.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function Home() {
  const now = new Date();
  const today = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isWeekend = [0, 6].includes(now.getUTCDay());

  const briefings = await getAllBriefings();
  const signals = extractSignals(briefings.slice(0, 12));

  // Lead: highest-relevance signal
  const hero = signals.find((s) => s.relevance === "high") ?? signals[0];
  const secondary = signals.filter((s) => s.id !== hero?.id).slice(0, 4);
  const alsoWatching = briefings[0]?.alsoWatching ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">

      {/* ── Hero copy ── */}
      <div className="pt-8 pb-7">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <p
            className="text-[11px] font-medium tracking-[0.1em] uppercase"
            style={{ color: "var(--c-text-3)" }}
          >
            {today}
            {isWeekend && (
              <span className="ml-3" style={{ color: "var(--c-text-3)" }}>
                · Next briefing Monday
              </span>
            )}
          </p>
          <StreakBadge />
        </div>

        <h1
          className="font-bold leading-[1.05] mb-3"
          style={{
            fontSize: "clamp(2.4rem, 8vw, 3.8rem)",
            letterSpacing: "-0.045em",
            color: "var(--c-text-1)",
          }}
        >
          MENA markets,<br />
          <span className="gradient-text">explained.</span>
        </h1>

        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--c-text-2)", maxWidth: "34ch" }}
        >
          One daily briefing. Plain language. No finance degree needed.
        </p>
      </div>

      {/* ── Market bar ── */}
      <MarketBar />

      {/* ── Content ── */}
      {signals.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
            No signals yet — briefings publish every weekday morning.
          </p>
        </div>
      ) : (
        <div className="py-7 flex flex-col gap-4">

          {/* Lead signal */}
          {hero && (
            <ScrollReveal>
              <HeroSignal signal={hero} />
            </ScrollReveal>
          )}

          {/* Secondary signals */}
          {secondary.length > 0 && (
            <div className="flex flex-col gap-2">
              {secondary.map((signal, i) => (
                <ScrollReveal key={signal.id} delay={i * 40}>
                  <SecondarySignal signal={signal} />
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* View all */}
          <div className="text-center pt-2">
            <Link
              href="/signals"
              className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-150"
              style={{
                color: "var(--c-accent)",
                background: "var(--c-accent-glow)",
                border: "1px solid color-mix(in srgb, var(--c-accent) 25%, transparent)",
              }}
            >
              View all {signals.length} signals →
            </Link>
          </div>
        </div>
      )}

      {/* ── Subscribe ── */}
      <ScrollReveal>
        <div
          className="mb-6 rounded-2xl px-6 py-6"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
          }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-2"
            style={{ color: "var(--c-accent)" }}
          >
            Daily brief
          </p>
          <p
            className="font-semibold mb-1 leading-snug"
            style={{ color: "var(--c-text-1)", fontSize: "1rem", letterSpacing: "-0.02em" }}
          >
            Get it in your inbox every weekday morning.
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--c-text-2)" }}>
            Plain language. No jargon. Free.
          </p>
          <SubscribeForm />
        </div>
      </ScrollReveal>

      {/* ── Also Watching ── */}
      {alsoWatching.length > 0 && (
        <ScrollReveal>
          <div
            className="px-5 py-5 mb-6 rounded-2xl"
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
            }}
          >
            <span className="eyebrow block mb-3">Also watching</span>
            <ul className="flex flex-col gap-2.5">
              {alsoWatching.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm"
                  style={{ color: "var(--c-text-2)" }}
                >
                  <span
                    className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "var(--c-accent)", opacity: 0.7 }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      )}

      {/* ── What is Nusq ── */}
      <ScrollReveal>
        <div
          className="mb-8 rounded-3xl p-6 sm:p-8"
          style={{
            background: "linear-gradient(135deg, var(--c-surface-2) 0%, var(--c-surface) 100%)",
            border: "1px solid var(--c-border)",
          }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: "var(--c-accent)" }}
          >
            What is Nusq?
          </p>
          <p
            className="font-bold mb-3 leading-snug"
            style={{
              fontSize: "clamp(1.1rem, 3vw, 1.35rem)",
              color: "var(--c-text-1)",
              letterSpacing: "-0.03em",
            }}
          >
            The MENA market briefing built for people who aren&apos;t finance experts — but want to be.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--c-text-2)" }}>
            Every weekday morning, Nusq reads hundreds of Arabic and English sources — central bank statements, exchange filings, regional press — and turns them into plain-language signals scored by direction and relevance. No jargon. No noise. Just what matters, and why.
          </p>
          <Link
            href="/glossary"
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors"
            style={{ color: "var(--c-accent)" }}
          >
            New to MENA markets? Browse the glossary →
          </Link>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "📰", label: "Daily briefing", sub: "One morning read covering the stories that moved markets overnight" },
              { icon: "⚡", label: "Scored signals", sub: "Every signal rated positive, watch, or negative — with a plain-language explanation" },
              { icon: "🗺️", label: "MENA-wide", sub: "Egypt, Saudi, UAE, Qatar, Kuwait — not just the Western markets everyone else covers" },
            ].map(({ icon, label, sub }) => (
              <div
                key={label}
                className="rounded-2xl p-4"
                style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
              >
                <span className="text-xl block mb-2">{icon}</span>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--c-text-1)", letterSpacing: "-0.02em" }}>
                  {label}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-3)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

    </div>
  );
}
