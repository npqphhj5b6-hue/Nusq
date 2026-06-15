import Link from "next/link";
import { notFound } from "next/navigation";
import { getEssayBySlug, formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EssayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const essay = await getEssayBySlug(slug);
  if (!essay) notFound();

  const bodyParagraphs = essay.body
    .split("\n\n")
    .filter((p) => p.trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Back */}
      <Link
        href="/essays"
        className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1C1C1C] transition-colors mb-8"
      >
        <span>←</span>
        <span>Essays</span>
      </Link>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {essay.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F4F3F0] text-[#737373]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-[#1C1C1C] leading-snug mb-4">
        {essay.title}
      </h1>

      {/* Summary / dek */}
      <p className="text-[#737373] leading-relaxed mb-6 text-base border-l-2 border-[#E5E2DC] pl-4">
        {essay.summary}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-[#A8A8A8] mb-10 pb-10 border-b border-[#E5E2DC]">
        <span>{formatDate(essay.date)}</span>
        <span>·</span>
        <span>{essay.readingTime} min read</span>
      </div>

      {/* Body */}
      <div className="prose-nusq">
        {bodyParagraphs.map((para, i) => {
          if (para.startsWith("## ")) {
            return <h2 key={i}>{para.replace("## ", "")}</h2>;
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

      {/* Footer nav */}
      <div className="mt-14 pt-8 border-t border-[#E5E2DC]">
        <Link
          href="/essays"
          className="text-sm text-[#737373] hover:text-[#1C1C1C] transition-colors"
        >
          ← All essays
        </Link>
      </div>
    </div>
  );
}
