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
    body: "Nusq continuously monitors Arabic and English news feeds and regional financial outlets, watching for anything that could move Gulf capital, Gulf policy, or Gulf-linked markets.",
  },
  {
    n: 2,
    title: "Selection",
    body: "An initial automated pass ranks the day's candidates by materiality — but nothing publishes on that basis alone. Every briefing sits as a draft until a human reviews, edits, and approves it. Editorial judgment, not an algorithm, decides what actually makes the cut.",
  },
  {
    n: 3,
    title: "Research enrichment",
    body: "Before a story is drafted, Nusq pulls in supporting context — related coverage, market data, prior statements — so the briefing isn't working from a single headline in isolation.",
  },
  {
    n: 4,
    title: "Drafting",
    body: "The briefing gets written in plain language first: what happened, why it matters, and what it means for capital. No unexplained jargon, no assumed finance background.",
  },
  {
    n: 5,
    title: "Quality pass",
    body: "A separate review checks every draft for clichéd phrasing, unsupported claims, and citation traceability — every factual claim needs a source. Sentences that ramble get broken up. Paragraphs that only restate facts get rewritten.",
  },
  {
    n: 6,
    title: "Ishara scoring",
    body: "Each story is assigned a direction — positive, negative, or watch — based on the evidence gathered for it, not a gut call. That scoring, and the story behind it, is what becomes an Ishara.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* ── Opening framing ── */}
      <div className="relative overflow-hidden">
        <div className="bg-blob" />
        <div className="max-w-2xl mx-auto px-6 pt-16 pb-8 relative">
          <span className="eyebrow block mb-4">How Nusq works</span>
          <h1
            className="leading-[1.05] mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.5rem, 7vw, 4rem)", letterSpacing: "-0.02em", color: "var(--c-text-1)" }}
          >
            Full pipeline,
            <br />
            no black box.
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-16">
      <ScrollReveal>
        <div className="mb-14">
          <div className="prose-nusq">
            <p>
              Most financial media is built for Wall Street and the City. MENA —
              Saudi Arabia, the UAE, Qatar, Kuwait, Egypt, and the wider Gulf-linked
              emerging markets — moves hundreds of billions of dollars a year, and
              most of what actually happens there is reported first in Arabic, then
              filtered, delayed, or dropped by the time it reaches English-language
              coverage.
            </p>
            <p>
              Nusq exists to close that gap: one daily briefing that reads the
              region&apos;s own sources directly and explains what matters in plain
              language, the same day.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Sources ── */}
      <ScrollReveal>
        <div className="mb-14 pt-10 border-t border-[var(--c-border)]">
          <span className="eyebrow block mb-4">Sources</span>
          <div className="prose-nusq">
            <p>
              Every weekday, Nusq reads hundreds of Arabic and English sources
              across the region: regional press and financial outlets, central bank
              statements, stock exchange filings from Tadawul, DFM, ADX, and EGX,
              sovereign wealth fund disclosures, and regulator announcements.
              Coverage spans Saudi Arabia, the UAE, Qatar, Kuwait, Bahrain, Oman,
              Egypt, and the broader markets that intersect with Gulf capital.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Pipeline ── */}
      <div className="mb-14 pt-10 border-t border-[var(--c-border)]">
        <span className="eyebrow block mb-8">The pipeline</span>
        <div className="flex flex-col">
          {STAGES.map((stage, i) => (
            <ScrollReveal key={stage.n} delay={i * 50}>
              <div
                className={`flex items-start gap-5 py-7 ${i < STAGES.length - 1 ? "border-b border-[var(--c-border)]" : ""}`}
              >
                <span
                  className="shrink-0 text-[2.5rem] leading-none font-black text-[var(--c-border-2)] select-none"
                  style={{ lineHeight: 0.9 }}
                  aria-hidden="true"
                >
                  {stage.n}
                </span>
                <div className="pt-1">
                  <h3
                    className="mb-2"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.01em", color: "var(--c-text-1)" }}
                  >
                    {stage.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                    {stage.body}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* ── What Nusq is not ── */}
      <ScrollReveal>
        <div className="mb-14 pt-10 border-t border-[var(--c-border)]">
          <span className="eyebrow block mb-4">What Nusq is not</span>
          <div className="prose-nusq">
            <p>
              Nusq is not investment advice. Nothing in a briefing or an Ishara is
              a recommendation to buy, sell, or hold anything — it&apos;s context, not
              instruction.
            </p>
            <p>
              The initial sourcing and ranking of stories is AI-assisted, and the
              first draft of every briefing is AI-written. But nothing publishes
              without a human reviewing, editing, and approving it first. Nusq will
              get things wrong sometimes; when it does, corrections happen in the
              open, not quietly.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Closing trust note ── */}
      <ScrollReveal>
        <div className="pt-10 border-t border-[var(--c-border)]">
          <span className="eyebrow block mb-4">Who&apos;s behind this</span>
          <div className="prose-nusq mb-2">
            <p>
              Nusq is written by Yousef Quaba, a student of Arabic and History who
              spent a year studying and working in Cairo — and built Nusq to close
              the gap between what happens in the Gulf and what English-language
              coverage actually reports.
            </p>
          </div>
        </div>
      </ScrollReveal>
      </div>
    </div>
  );
}
