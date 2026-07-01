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

/* ── Hero signal card ── */
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
      <div className="glass-card relative overflow-hidden">
        {/* Direction glow strip at top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: dotColor, opacity: 0.5 }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, color-mix(in srgb, ${dotColor} 7%, transparent), transparent)`,
          }}
        />

        <div className="p-6 sm:p-7">
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

          {/* Direction badge + sector tags */}
          <div className="flex items-center gap-2.5 mb-4 flex-wrap">
            <span
              className={`inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase px-3 py-1.5 rounded-xl ${dirClass}`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }}
              />
              {directionLabel(signal.direction)}
            </span>
            {signal.sectors.slice(0, 2).map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  color: "var(--c-text-3)",
                  background: "rgba(0,212,190,0.06)",
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
              fontSize: "clamp(1.1rem, 2.8vw, 1.4rem)",
              letterSpacing: "-0.03em",
            }}
          >
            {signal.headline}
          </h2>

          {/* Detail */}
          {signal.detail && (
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: "var(--c-text-2)", maxWidth: "50ch" }}
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
                Full briefing →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Compact secondary signal ── */
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
        className="flex items-start gap-3 p-4 rounded-2xl transition-all duration-200"
        style={{
          background: "color-mix(in srgb, var(--c-surface) 70%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
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
            <span
              className="text-[10px] ml-auto"
              style={{ color: "var(--c-text-3)", fontFamily: "var(--font-mono)" }}
            >
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

  const hero = signals.find((s) => s.relevance === "high") ?? signals[0];
  const secondary = signals.filter((s) => s.id !== hero?.id).slice(0, 4);
  const alsoWatching = briefings[0]?.alsoWatching ?? [];

  return (
    <>
      {/* ── Hero zone — full width, ambient glow ── */}
      <div className="relative overflow-hidden">
        {/* Ambient orb — top right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-15%",
            right: "-8%",
            width: "700px",
            height: "700px",
            background: "radial-gradient(circle, rgba(0,212,190,0.1) 0%, transparent 62%)",
            borderRadius: "50%",
          }}
        />
        {/* Ambient orb — bottom left */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-20%",
            left: "-12%",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(0,212,190,0.06) 0%, transparent 62%)",
            borderRadius: "50%",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            className={`grid gap-8 lg:gap-16 items-center py-12 lg:py-20 ${
              hero ? "grid-cols-1 lg:grid-cols-[1fr_420px]" : "grid-cols-1 max-w-3xl"
            }`}
          >
            {/* Left: headline */}
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-6">
                <p
                  className="text-[11px] font-medium tracking-[0.12em] uppercase"
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
                className="font-bold leading-[1.0] mb-5"
                style={{
                  fontSize: "clamp(3rem, 8vw, 5.5rem)",
                  letterSpacing: "-0.05em",
                }}
              >
                <span style={{ color: "var(--c-accent)" }}>MENA</span>
                <br />
                <span style={{ color: "var(--c-text-1)" }}>markets,</span>
                <br />
                <span style={{ color: "var(--c-text-2)" }}>explained.</span>
              </h1>

              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: "var(--c-text-2)", maxWidth: "32ch" }}
              >
                One daily briefing. Plain language. No finance degree needed.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/briefings"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "var(--c-accent)",
                    color: "#030C09",
                  }}
                >
                  Read today&apos;s briefing →
                </Link>
                <Link
                  href="/signals"
                  className="text-sm font-medium px-5 py-2.5 rounded-2xl transition-all duration-200 hover:border-[var(--c-border-2)]"
                  style={{
                    color: "var(--c-text-2)",
                    border: "1px solid var(--c-border)",
                  }}
                >
                  View signals
                </Link>
              </div>
            </div>

            {/* Right: floating glass signal card with ambient glow bloom */}
            {hero && (
              <div className="relative">
                {/* Glow bloom behind the card */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    inset: "-60px",
                    background: "radial-gradient(circle, rgba(0,212,190,0.16) 0%, transparent 65%)",
                    borderRadius: "50%",
                  }}
                />
                <HeroSignal signal={hero} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Market ticker ── */}
      <MarketBar />

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {signals.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
              No signals yet — briefings publish every weekday morning.
            </p>
          </div>
        ) : (
          <div className="py-7 flex flex-col gap-3">
            {/* "More signals" heading + secondary cards */}
            {secondary.length > 0 && (
              <>
                <p className="eyebrow pt-2 pb-1">More signals</p>
                <div className="flex flex-col gap-2">
                  {secondary.map((signal, i) => (
                    <ScrollReveal key={signal.id} delay={i * 60}>
                      <SecondarySignal signal={signal} />
                    </ScrollReveal>
                  ))}
                </div>
              </>
            )}

            {/* View all */}
            <div className="text-center pt-3">
              <Link
                href="/signals"
                className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-2xl transition-all duration-200"
                style={{
                  color: "var(--c-accent)",
                  background: "var(--c-accent-glow)",
                  border: "1px solid rgba(0,212,190,0.2)",
                }}
              >
                View all {signals.length} signals →
              </Link>
            </div>
          </div>
        )}

        {/* ── Subscribe ── */}
        <ScrollReveal>
          <div className="mb-6 glass-card px-6 py-6">
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
                background: "color-mix(in srgb, var(--c-surface) 80%, transparent)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
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
          <div className="mb-8 glass-card p-6 sm:p-8">
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
                { label: "Daily briefing", sub: "One morning read covering the stories that moved markets overnight" },
                { label: "Scored signals", sub: "Every signal rated positive, watch, or negative — with a plain-language explanation" },
                { label: "MENA-wide", sub: "Egypt, Saudi, UAE, Qatar, Kuwait — not just the Western markets everyone else covers" },
              ].map(({ label, sub }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(0,212,190,0.04)",
                    border: "1px solid rgba(0,212,190,0.1)",
                  }}
                >
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: "var(--c-text-1)", letterSpacing: "-0.02em" }}
                  >
                    {label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-3)" }}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </>
  );
}
