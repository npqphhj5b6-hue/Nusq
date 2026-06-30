import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY, CATEGORIES, termsByCategory } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "MENA Finance Glossary — Nusq",
  description:
    "Plain-language explanations of the financial terms, institutions, and markets that move the MENA region. No jargon, no prior knowledge needed.",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Stock Markets": "📈",
  "Currencies": "💱",
  "Institutions": "🏛️",
  "Instruments": "📄",
  "Concepts": "💡",
};

export default function GlossaryPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-10">
        <span className="eyebrow block mb-2">Reference</span>
        <h1
          className="font-bold mb-3 leading-tight"
          style={{
            fontSize: "clamp(1.9rem, 6vw, 2.8rem)",
            letterSpacing: "-0.04em",
            color: "var(--c-text-1)",
          }}
        >
          MENA finance,<br />
          <span className="gradient-text">word by word.</span>
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-2)", maxWidth: "46ch" }}>
          Every term that appears in Nusq briefings, explained in plain language.
          No finance degree needed — that&apos;s the whole point.
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--c-text-3)" }}>
          {GLOSSARY.length} terms
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-10">
        {CATEGORIES.map((category) => {
          const terms = termsByCategory(category);
          if (terms.length === 0) return null;
          return (
            <section key={category}>
              {/* Category heading */}
              <div className="flex items-center gap-2.5 mb-4">
                <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[category]}</span>
                <h2
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: "var(--c-text-3)" }}
                >
                  {category}
                </h2>
                <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
              </div>

              {/* Term cards */}
              <div className="flex flex-col gap-2">
                {terms.map((term) => (
                  <Link
                    key={term.slug}
                    href={`/glossary/${term.slug}`}
                    className="group flex items-start justify-between gap-4 px-5 py-4 rounded-2xl transition-all duration-150"
                    style={{
                      background: "var(--c-surface)",
                      border: "1px solid var(--c-border)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span
                          className="text-sm font-bold transition-colors group-hover:text-[var(--c-accent)]"
                          style={{ color: "var(--c-text-1)", letterSpacing: "-0.02em" }}
                        >
                          {term.term}
                        </span>
                        {term.fullName && (
                          <span className="text-xs" style={{ color: "var(--c-text-3)" }}>
                            {term.fullName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                        {term.oneLiner}
                      </p>
                    </div>
                    <span
                      className="text-sm shrink-0 mt-0.5 transition-transform duration-150 group-hover:translate-x-0.5"
                      style={{ color: "var(--c-text-3)" }}
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-[11px] mt-10 text-center" style={{ color: "var(--c-text-3)" }}>
        Definitions are for general understanding only · Not investment advice
      </p>
    </div>
  );
}
