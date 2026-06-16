import Link from "next/link";
import { notFound } from "next/navigation";
import { getBriefingBySlug, formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const briefing = await getBriefingBySlug(slug);
  if (!briefing) notFound();

  const bodyParagraphs = briefing.body
    .split("\n\n")
    .filter((p) => p.trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href="/briefings"
        className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1A4731] transition-colors mb-10"
      >
        <span>←</span>
        <span>Briefings</span>
      </Link>

      <div className="flex flex-wrap gap-2 mb-5">
        {briefing.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium px-3 py-1 rounded-full bg-[#E8F0EC] text-[#1A4731]"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1
        className="text-[2rem] leading-[1.2] text-[#111111] mb-5"
        style={{ fontFamily: "var(--font-dm-serif)" }}
      >
        {briefing.title}
      </h1>

      <p className="text-[#737373] leading-relaxed mb-6 text-base border-l-[3px] border-[#1A4731] pl-4">
        {briefing.summary}
      </p>

      <div className="flex items-center gap-3 text-xs text-[#A8A8A8] mb-10 pb-10 border-b border-[#E8E5E0]">
        <span>{formatDate(briefing.date)}</span>
        <span>·</span>
        <span>{briefing.readingTime} min read</span>
      </div>

      <div className="prose-nusq">
        {bodyParagraphs.map((para, i) => {
          if (para.startsWith("## ")) {
            return <h2 key={i}>{para.replace("## ", "")}</h2>;
          }
          if (para.startsWith("**") && para.endsWith("**")) {
            return (
              <p key={i}>
                <strong>{para.slice(2, -2)}</strong>
              </p>
            );
          }
          const withBold = para.replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
          );
          return (
            <p key={i} dangerouslySetInnerHTML={{ __html: withBold }} />
          );
        })}
      </div>

      <div className="mt-14 pt-8 border-t border-[#E8E5E0]">
        <Link
          href="/briefings"
          className="text-sm text-[#737373] hover:text-[#1A4731] transition-colors"
        >
          ← All briefings
        </Link>
      </div>
    </div>
  );
}
