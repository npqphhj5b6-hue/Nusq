import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "About — Nusq",
  description: "Nusq draws on Arabic and English sources to cover Gulf capital, written by Yousef Quaba.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <ScrollReveal>
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-5 h-[1px] bg-[var(--c-amber)] gold-line" />
            <span className="eyebrow">About</span>
          </div>
          <h1 className="font-display mb-6" style={{ fontSize: "clamp(3rem, 17vw, 6rem)" }}>
            <span className="text-[var(--c-text-1)] block">THE GULF</span>
            <span className="text-[var(--c-text-1)] block">IN ITS</span>
            <span className="text-[var(--c-amber)] text-glow block">OWN WORDS.</span>
          </h1>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="prose-nusq space-y-5 mb-16">
          <p>
            I first noticed the gap in Cairo. On exchange at the American University in my
            third year, I started reading the Arabic financial press alongside my coursework —
            the central bank statements, market commentary, filings from Saudi and Emirati
            firms. What struck me was how much appeared there first, and how little of it
            reached English-language coverage — or how watered-down it was when it did.
          </p>
          <p>
            That observation became Nusq. The Gulf is one of the most consequential parts of
            the global economy right now: Saudi Arabia&apos;s Vision 2030 is redirecting hundreds
            of billions of dollars; sovereign wealth funds from Abu Dhabi to Doha are
            reshaping industries from technology to infrastructure. Most of that, in the
            first instance, is said and written in Arabic — in official statements, domestic
            press, and market filings that most Western analysts never reach. Each briefing
            draws on both: Arabic and English sources, written clearly for people who need to
            understand the region, not just follow it.
          </p>
          <p>
            The name comes from <strong>نسق</strong> — an Arabic word meaning order, pattern,
            and coherence. Nusq covers Saudi Arabia, the UAE, Qatar, Kuwait, Bahrain, Oman,
            Egypt, and the broader emerging markets that intersect with Gulf capital: oil,
            sovereign wealth, monetary policy, corporate earnings — whatever is actually
            moving that day.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <div className="border-t border-[var(--c-border)] pt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-[1px] bg-[var(--c-amber)] gold-line" />
            <span className="eyebrow">The author</span>
          </div>
          <div className="prose-nusq space-y-5">
            <p>
              Yousef Quaba is a fourth-year student of Arabic and History at the University of Edinburgh.
              His third year was spent on exchange at the American University in Cairo — studying Modern
              Standard Arabic and Egyptian Colloquial alongside economics and history, and developing a
              close familiarity with how the region&apos;s media, business press, and official communications
              actually work.
            </p>
            <p>
              The gap between what is happening in the Gulf and what gets reported in English is wider
              than it looks. The most important signals — policy statements, filings, market commentary —
              often appear first in Arabic, in sources most Western analysts never reach. That gap is what
              Nusq is trying to close.
            </p>
            <p>
              Yousef has worked in equity research and is building towards a career in asset management
              and emerging-market analysis, with a focus on the Gulf and MENA.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="https://www.linkedin.com/in/yousefquaba"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-2)] hover:text-[var(--c-amber)] transition-colors duration-200"
            >
              Connect on LinkedIn →
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
