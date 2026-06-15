import Link from "next/link";
import { mockBriefings, mockEssays, formatDate, formatDateShort } from "@/lib/mockData";

export default function Home() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [featured, ...rest] = mockBriefings;
  const recentBriefings = rest.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Date line */}
      <p className="text-sm text-[#A8A8A8] mb-8 tracking-wide uppercase">
        {today}
      </p>

      {/* Featured briefing */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium tracking-widest text-[#1B4F72] uppercase">
            Today&apos;s Briefing
          </span>
        </div>
        <Link href={`/briefings/${featured.slug}`} className="group block">
          <div className="bg-white rounded-2xl border border-[#E5E2DC] p-8 hover:border-[#1B4F72]/30 hover:shadow-sm transition-all">
            <div className="flex flex-wrap gap-2 mb-4">
              {featured.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#EBF4FB] text-[#1B4F72]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-2xl font-bold text-[#1C1C1C] leading-snug mb-4 group-hover:text-[#1B4F72] transition-colors">
              {featured.title}
            </h2>
            <p className="text-[#737373] leading-relaxed mb-6 max-w-2xl">
              {featured.summary}
            </p>
            <div className="flex items-center gap-4 text-sm text-[#A8A8A8]">
              <span>{formatDate(featured.date)}</span>
              <span>·</span>
              <span>{featured.readingTime} min read</span>
            </div>
          </div>
        </Link>
      </section>

      {/* Recent briefings grid */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-medium tracking-widest text-[#A8A8A8] uppercase">
            Recent Briefings
          </h3>
          <Link
            href="/briefings"
            className="text-xs text-[#1B4F72] hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentBriefings.map((b) => (
            <Link key={b.slug} href={`/briefings/${b.slug}`} className="group block">
              <div className="bg-white rounded-xl border border-[#E5E2DC] p-5 h-full hover:border-[#1B4F72]/30 hover:shadow-sm transition-all flex flex-col">
                <span className="text-xs text-[#A8A8A8] mb-3">
                  {formatDateShort(b.date)}
                </span>
                <h4 className="text-sm font-semibold text-[#1C1C1C] leading-snug mb-3 group-hover:text-[#1B4F72] transition-colors flex-1">
                  {b.title}
                </h4>
                <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
                  {b.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-[#F4F3F0] text-[#737373]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Essays */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-medium tracking-widest text-[#A8A8A8] uppercase">
            Essays
          </h3>
          <Link
            href="/essays"
            className="text-xs text-[#1B4F72] hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {mockEssays.map((e) => (
            <Link key={e.slug} href={`/essays/${e.slug}`} className="group block">
              <div className="bg-white rounded-xl border border-[#E5E2DC] p-5 hover:border-[#1B4F72]/30 hover:shadow-sm transition-all flex items-start justify-between gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-[#1C1C1C] mb-1.5 group-hover:text-[#1B4F72] transition-colors">
                    {e.title}
                  </h4>
                  <p className="text-sm text-[#737373] leading-relaxed line-clamp-2">
                    {e.summary}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs text-[#A8A8A8]">
                    {formatDateShort(e.date)}
                  </span>
                  <p className="text-xs text-[#A8A8A8] mt-1">
                    {e.readingTime} min
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
