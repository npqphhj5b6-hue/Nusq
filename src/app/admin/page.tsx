import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logout } from "./actions";
import { formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data: drafts } = await supabaseAdmin
    .from("briefings")
    .select("id, slug, title, date, summary, tags")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  const { count: publishedCount } = await supabaseAdmin
    .from("briefings")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">nusq admin</h1>
          <p className="text-sm text-[#737373] mt-0.5">
            {drafts?.length ?? 0} draft{drafts?.length !== 1 ? "s" : ""} pending
            · {publishedCount ?? 0} published
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-xs text-[#737373] hover:text-[#1C1C1C] transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

      {drafts?.length === 0 ? (
        <div className="bg-white border border-[#E5E2DC] rounded-xl p-8 text-center">
          <p className="text-sm text-[#737373]">No drafts waiting. Check back after the next pipeline run.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {drafts?.map((draft) => (
            <Link
              key={draft.id}
              href={`/admin/drafts/${draft.id}`}
              className="group block bg-white border border-[#E5E2DC] rounded-xl p-5 hover:border-[#1B4F72]/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {draft.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-[#EBF4FB] text-[#1B4F72]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-sm font-semibold text-[#1C1C1C] leading-snug mb-1.5 group-hover:text-[#1B4F72] transition-colors">
                    {draft.title}
                  </h3>
                  <p className="text-sm text-[#737373] line-clamp-2 leading-relaxed">
                    {draft.summary}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs text-[#A8A8A8]">{formatDate(draft.date)}</span>
                  <p className="text-xs text-amber-500 font-medium mt-1">Draft</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
