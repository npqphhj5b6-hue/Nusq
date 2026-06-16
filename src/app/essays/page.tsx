import Link from "next/link";
import { getAllEssays, formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EssaysPage() {
  const essays = await getAllEssays();
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-[2px] bg-[#1A4731]" />
          <span className="text-[10px] font-medium tracking-[0.15em] text-[#1A4731] uppercase">
            Long reads
          </span>
        </div>
        <h1
          className="text-3xl text-[#111111] mb-2"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          Essays
        </h1>
        <p className="text-sm text-[#737373]">
          Longer analysis on MENA political economy, trade, and capital.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-[#E8E5E0]">
        {essays.map((e) => (
          <Link key={e.slug} href={`/essays/${e.slug}`} className="group block py-5 first:pt-0">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {e.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0EC] text-[#1A4731] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3
                  className="text-base text-[#111111] leading-snug mb-1.5 group-hover:text-[#1A4731] transition-colors"
                  style={{ fontFamily: "var(--font-dm-serif)" }}
                >
                  {e.title}
                </h3>
                <p className="text-sm text-[#737373] leading-relaxed line-clamp-2">
                  {e.summary}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs text-[#A8A8A8]">{formatDate(e.date)}</span>
                <p className="text-xs text-[#A8A8A8] mt-1">{e.readingTime} min read</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
