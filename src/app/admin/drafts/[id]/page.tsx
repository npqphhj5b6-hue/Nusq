import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { approveBriefing, deleteBriefing } from "../../actions";
import { formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DraftReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: draft } = await supabaseAdmin
    .from("briefings")
    .select("*")
    .eq("id", id)
    .single();

  if (!draft) notFound();

  const bodyParagraphs = draft.body
    .split("\n\n")
    .filter((p: string) => p.trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Admin controls */}
      <div className="flex items-center justify-between mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Draft</span>
          <span className="text-xs text-amber-600">— review before publishing</span>
        </div>
        <div className="flex items-center gap-2">
          <form action={deleteBriefing.bind(null, id)}>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </form>
          <form action={approveBriefing.bind(null, id)}>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#1B4F72] rounded-lg hover:bg-[#154060] transition-colors"
            >
              Approve & publish
            </button>
          </form>
        </div>
      </div>

      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#1C1C1C] transition-colors mb-8"
      >
        <span>←</span>
        <span>Back to drafts</span>
      </Link>

      {/* Preview — same layout as public page */}
      <div className="flex flex-wrap gap-2 mb-5">
        {draft.tags?.map((tag: string) => (
          <span
            key={tag}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#EBF4FB] text-[#1B4F72]"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1 className="text-2xl font-bold text-[#1C1C1C] leading-snug mb-4">
        {draft.title}
      </h1>

      <p className="text-[#737373] leading-relaxed mb-6 text-base border-l-2 border-[#1B4F72]/30 pl-4">
        {draft.summary}
      </p>

      <div className="flex items-center gap-3 text-xs text-[#A8A8A8] mb-10 pb-10 border-b border-[#E5E2DC]">
        <span>{formatDate(draft.date)}</span>
        <span>·</span>
        <span>{draft.reading_time} min read</span>
      </div>

      <div className="prose-nusq">
        {bodyParagraphs.map((para: string, i: number) => {
          if (para.startsWith("## ")) {
            return <h2 key={i}>{para.replace("## ", "")}</h2>;
          }
          const withBold = para.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
          return <p key={i} dangerouslySetInnerHTML={{ __html: withBold }} />;
        })}
      </div>
    </div>
  );
}
