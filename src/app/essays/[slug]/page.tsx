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
      <Link
        href="/essays"
        className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] hover:text-[var(--c-amber)] transition-colors mb-10"
      >
        ← Research
      </Link>

      <div className="flex flex-wrap gap-2 mb-5">
        {essay.tags.map((tag) => (
          <span
            key={tag}
            className="text-[9px] font-bold tracking-[0.14em] text-[var(--c-green)] uppercase bg-[var(--c-green-bg)] px-2.5 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1
        className="text-[2.75rem] md:text-[3.5rem] leading-[1.06] text-[var(--c-text-1)] mb-5"
        style={{ fontFamily: "var(--font-barlow)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}
      >
        {essay.title}
      </h1>

      <p className="text-[var(--c-text-2)] leading-relaxed mb-6 text-base border-l-[3px] border-[var(--c-amber)] pl-4">
        {essay.summary}
      </p>

      <div
        className="flex items-center gap-3 text-xs text-[var(--c-text-3)] mb-10 pb-10 border-b border-[var(--c-border)]"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <span>{formatDate(essay.date)}</span>
        <span>·</span>
        <span>{essay.readingTime} min read</span>
      </div>

      <div className="prose-nusq">
        {bodyParagraphs.map((para, i) => {
          if (para.startsWith("## ")) {
            return <h2 key={i}>{para.replace("## ", "")}</h2>;
          }
          const withBold = para.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
          return <p key={i} dangerouslySetInnerHTML={{ __html: withBold }} />;
        })}
      </div>

      <div className="mt-14 pt-8 border-t border-[var(--c-border)]">
        <Link
          href="/essays"
          className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--c-text-3)] hover:text-[var(--c-amber)] transition-colors"
        >
          ← All research
        </Link>
      </div>
    </div>
  );
}
