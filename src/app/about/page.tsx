import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "About — Nusq",
  description: "Nusq is a daily briefing on MENA markets and what moves them.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <ScrollReveal>
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-5 h-[1px] bg-[#F59E0B] gold-line" />
            <span className="eyebrow">About</span>
          </div>
          <h1
            className="font-display mb-6"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
          >
            <span className="text-[#F0ECE5] block">MENA</span>
            <span className="text-[#F0ECE5] block">MARKETS,</span>
            <span className="text-[#F59E0B] text-glow block">MADE CLEAR.</span>
          </h1>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="prose-nusq space-y-5 mb-16">
          <p>
            Nusq is a daily financial briefing focused on the Gulf and the broader MENA region.
            Every morning, it distils what moved markets, what it means, and why it matters —
            written for people who need to know, not just want to know.
          </p>
          <p>
            The name comes from <strong>نسق</strong> — an Arabic word
            meaning order, pattern, and coherence. That is the aim: to bring clarity to a
            region that is complex, fast-moving, and often underreported.
          </p>
          <p>
            Nusq covers Saudi Arabia, the UAE, Qatar, Kuwait, Bahrain, Oman, Egypt, and the
            broader emerging markets that intersect with Gulf capital. Oil, Vision 2030,
            sovereign wealth, monetary policy, corporate earnings — whatever is moving the
            region that day.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <div className="border-t border-[#132030] pt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-[1px] bg-[#F59E0B] gold-line" />
            <span className="eyebrow">The author</span>
          </div>
          <p className="text-[#2A3F55] text-sm leading-relaxed">
            More on the person behind Nusq coming soon.
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
