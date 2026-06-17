import Link from "next/link";
import { getAllEssays, formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EssaysPage() {
  const essays = await getAllEssays();
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-[1px] bg-[#F59E0B]" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-[#F59E0B] uppercase">
            Long reads
          </span>
        </div>
        <h1
          className="text-[2.5rem] md:text-[3rem] leading-[1.06] text-[#F0ECE5] mb-4"
          style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
        >
          Research
        </h1>
        <p className="text-[#4E6880] text-base leading-relaxed max-w-lg">
          Longer analysis on MENA political economy, trade, and capital.
        </p>
      </div>

      {/* Essay list */}
      <div className="flex flex-col divide-y divide-[#132030]">
        {essays.length === 0 && (
          <p className="text-[#2A3F55] py-10">No research published yet.</p>
        )}
        {essays.map((e) => (
          <Link key={e.slug} href={`/essays/${e.slug}`} className="group block py-7 first:pt-0">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {e.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-bold tracking-[0.14em] text-[#15A06E] uppercase bg-[#0A1F15] px-2.5 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Title */}
                <h3
                  className="text-[1.25rem] md:text-[1.4rem] leading-snug text-[#F0ECE5] mb-2 group-hover:text-[#F59E0B] transition-colors duration-200"
                  style={{ fontFamily: "var(--font-barlow)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.01em" }}
                >
                  {e.title}
                </h3>
                {/* Summary */}
                <p className="text-sm text-[#4E6880] leading-relaxed line-clamp-2">
                  {e.summary}
                </p>
              </div>
              {/* Meta */}
              <div className="shrink-0 text-right pt-1">
                <span
                  className="text-xs text-[#2A3F55]"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {formatDate(e.date)}
                </span>
                <p
                  className="text-xs text-[#2A3F55] mt-1"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  {e.readingTime} min read
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
