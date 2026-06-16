import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Nusq",
  description: "Nusq is a daily briefing on MENA markets and what moves them.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-[2px] bg-[#1A4731]" />
          <span className="text-[10px] font-medium tracking-[0.15em] text-[#1A4731] uppercase">
            About
          </span>
        </div>
        <h1
          className="text-[2.5rem] leading-[1.1] text-[#111111] mb-6"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          MENA markets,<br />
          <span className="text-[#1A4731]">made clear.</span>
        </h1>
      </div>

      <div className="prose-nusq space-y-5 mb-14">
        <p>
          Nusq is a daily financial briefing focused on the Gulf and the broader MENA region.
          Every morning, it distils what moved markets, what it means, and why it matters —
          written for people who need to know, not just want to know.
        </p>
        <p>
          The name comes from <span className="font-semibold">نسق</span> — an Arabic word
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

      <div className="border-t border-[#E8E5E0] pt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-[2px] bg-[#1A4731]" />
          <span className="text-[10px] font-medium tracking-[0.15em] text-[#1A4731] uppercase">
            The author
          </span>
        </div>
        <p className="text-[#737373] text-sm leading-relaxed">
          More on the person behind Nusq coming soon.
        </p>
      </div>
    </div>
  );
}
