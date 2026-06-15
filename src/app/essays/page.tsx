import Link from "next/link";
import { getAllEssays, formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EssaysPage() {
  const mockEssays = await getAllEssays();
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">Essays</h1>
        <p className="text-sm text-[#737373]">
          Longer analysis on MENA political economy, trade, and capital.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {mockEssays.map((e) => (
          <Link key={e.slug} href={`/essays/${e.slug}`} className="group block">
            <div className="bg-white rounded-xl border border-[#E5E2DC] p-5 hover:border-[#1B4F72]/30 hover:shadow-sm transition-all flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {e.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-[#F4F3F0] text-[#737373]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-sm font-semibold text-[#1C1C1C] leading-snug mb-1.5 group-hover:text-[#1B4F72] transition-colors">
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
