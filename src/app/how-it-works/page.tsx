import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "How Nusq Works — Nusq",
  description: "How Nusq sources, selects, and writes the daily MENA markets briefing — and where humans sit in that process.",
};

interface Stage {
  n: number;
  title: string;
  body: string;
}

const STAGES: Stage[] = [
  {
    n: 1,
    title: "Ingestion",
    body: "Continuously monitors Arabic and English news feeds and regional financial outlets for anything that could move Gulf capital, policy, or markets.",
  },
  {
    n: 2,
    title: "Selection",
    body: "Ranked by materiality, but nothing publishes on that alone — every briefing sits as a draft until a human reviews, edits, and approves it.",
  },
  {
    n: 3,
    title: "Research enrichment",
    body: "Pulls in supporting context — related coverage, market data, prior statements — before a story is drafted, not from a single headline in isolation.",
  },
  {
    n: 4,
    title: "Drafting",
    body: "Written in plain language first: what happened, why it matters, what it means for capital. No unexplained jargon, no assumed finance background.",
  },
  {
    n: 5,
    title: "Quality pass",
    body: "Checks every draft for clichéd phrasing, unsupported claims, and citation traceability — every factual claim needs a source.",
  },
  {
    n: 6,
    title: "Ishara scoring",
    body: "Assigned a direction — positive, negative, or watch — based on the evidence gathered, not a gut call. That scoring becomes an Ishara.",
  },
];

const SOURCES = ["Bloomberg", "Reuters", "Zawya", "Al Arabiya", "CBE", "Tadawul", "DFM", "ADX", "EGX", "OPEC", "IMF", "Argaam"];

function tintFor(n: number): { border: string; glow: string } {
  if (n <= 2) return { border: "var(--c-accent)", glow: "var(--c-accent-glow)" };
  if (n <= 4) return { border: "var(--c-secondary)", glow: "var(--c-secondary-soft)" };
  return { border: "var(--c-border-2)", glow: "transparent" };
}

export default function HowItWorksPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="bg-blob" />
        <div className="max-w-2xl mx-auto px-6 pt-16 pb-8 relative">
          <span className="eyebrow block mb-4">How Nusq works</span>
          <h1
            className="mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--c-text-1)" }}
          >
            Full pipeline,
            <br />
            no black box.
          </h1>
          <div style={{ maxWidth: 560 }}>
            <p className="mb-4" style={{ fontSize: 15, lineHeight: 1.7, color: "var(--c-text-2)" }}>
              Most financial media is built for Wall Street and the City. MENA —
              Saudi Arabia, the UAE, Qatar, Kuwait, Egypt, and the wider Gulf-linked
              emerging markets — moves hundreds of billions of dollars a year, and
              most of what actually happens there is reported first in Arabic, then
              filtered, delayed, or dropped by the time it reaches English-language
              coverage.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--c-text-2)" }}>
              Nusq exists to close that gap: one daily briefing that reads the
              region&apos;s own sources directly and explains what matters in plain
              language, the same day.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-16">
        {/* ── Pipeline ── */}
        <ScrollReveal>
          <div className="mb-14 pt-10 border-t border-[var(--c-border)]">
            <span className="eyebrow block mb-6">The pipeline — scroll →</span>
            <div className="pipeline-rail" style={{ marginLeft: -24, marginRight: -24, paddingLeft: 24, paddingRight: 24 }}>
              {STAGES.map((stage) => {
                const tint = tintFor(stage.n);
                return (
                  <div key={stage.n} className="pipeline-card">
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: -14,
                        right: -8,
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        fontSize: 84,
                        lineHeight: 1,
                        color: tint.glow === "transparent" ? "var(--c-border-2)" : tint.glow,
                        opacity: tint.glow === "transparent" ? 0.5 : 1,
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    >
                      {String(stage.n).padStart(2, "0")}
                    </span>
                    <div style={{ position: "relative" }}>
                      <span
                        className="block mb-3"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          color: tint.border,
                        }}
                      >
                        Step 0{stage.n}/06
                      </span>
                      <h3
                        className="mb-2"
                        style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", color: "var(--c-text-1)" }}
                      >
                        {stage.title}
                      </h3>
                      <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--c-text-2)" }}>
                        {stage.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 mt-5" aria-hidden="true">
              <span style={{ width: 22, height: 3, borderRadius: 2, background: "var(--c-accent)" }} />
              {STAGES.slice(1).map((s) => (
                <span key={s.n} style={{ width: 10, height: 3, borderRadius: 2, background: "var(--c-border-2)" }} />
              ))}
            </div>
          </div>
        </ScrollReveal>

        <div style={{ borderTop: "1px solid var(--c-border)", marginTop: 56, marginBottom: 40 }} />

        {/* ── Sources ── */}
        <ScrollReveal>
          <div>
            <span className="eyebrow block mb-4">Sources</span>
            <div className="prose-nusq">
              <p style={{ fontSize: 14.5, lineHeight: 1.7 }}>
                Every weekday, Nusq reads hundreds of Arabic and English sources
                across the region: regional press and financial outlets, central bank
                statements, stock exchange filings from Tadawul, DFM, and EGX,
                sovereign wealth fund disclosures, and regulator announcements.
                Coverage spans Saudi Arabia, the UAE, Qatar, Kuwait, Bahrain, Oman,
                Egypt, and the broader markets that intersect with Gulf capital.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Source logo marquee ── */}
        <div className="source-marquee my-10">
          <div className="source-marquee-track">
            {[...SOURCES, ...SOURCES].map((name, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--c-text-3)",
                  padding: "0 32px",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* ── What Nusq is not ── */}
        <ScrollReveal>
          <div className="pt-10 border-t border-[var(--c-border)]">
            <span className="eyebrow block mb-4">What Nusq is not</span>
            <div className="prose-nusq">
              <p style={{ fontSize: 14.5, lineHeight: 1.7 }}>
                Nusq is not investment advice. Nothing in a briefing or an Ishara is
                a recommendation to buy, sell, or hold anything — it&apos;s context, not
                instruction.
              </p>
              <p style={{ fontSize: 14.5, lineHeight: 1.7 }}>
                The initial sourcing and ranking of stories is AI-assisted, and the
                first draft of every briefing is AI-written. But nothing publishes
                without a human reviewing, editing, and approving it first. Nusq will
                get things wrong sometimes; when it does, corrections happen in the
                open, not quietly.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
