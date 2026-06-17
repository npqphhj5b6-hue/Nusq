import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logout } from "./actions";
import { formatDate } from "@/lib/db";
import PipelineTrigger from "./_components/PipelineTrigger";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data: drafts } = await supabaseAdmin
    .from("briefings")
    .select("id, slug, title, date, summary, tags")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  const { data: published } = await supabaseAdmin
    .from("briefings")
    .select("id, slug, title, date, tags")
    .eq("status", "published")
    .order("date", { ascending: false })
    .limit(10);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">nusq admin</h1>
          <p className="text-sm text-[#737373] mt-0.5">
            {drafts?.length ?? 0} draft{drafts?.length !== 1 ? "s" : ""} pending
            · {published?.length ?? 0} published
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-xs text-[#737373] hover:text-[#1C1C1C] transition-colors">
            Sign out
          </button>
        </form>
      </div>

      {/* ── Pipeline trigger ── */}
      <div className="mb-10 p-5 rounded-xl border border-[#E5E2DC] bg-white">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#737373] mb-3">Pipeline</p>
        <p className="text-xs text-[#737373] mb-4">
          Runs automatically Monday – Friday. Use this to trigger manually or re-run after changes.
        </p>
        <PipelineTrigger />
      </div>

      {/* ── Drafts ── */}
      <div className="mb-10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#737373] mb-4">
          Drafts pending review
        </p>
        {drafts?.length === 0 ? (
          <div className="bg-white border border-[#E5E2DC] rounded-xl p-6 text-center">
            <p className="text-sm text-[#737373]">No drafts waiting.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {drafts?.map((draft) => (
              <div key={draft.id} className="bg-white border border-[#E5E2DC] rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {draft.tags?.map((tag: string) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#EBF4FB] text-[#1B4F72]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-[#1C1C1C] leading-snug mb-1 truncate">
                      {draft.title}
                    </p>
                    <p className="text-xs text-[#A8A8A8]">{formatDate(draft.date)}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href={`/admin/briefings/${draft.id}/edit`}
                      className="px-3 py-1.5 text-xs font-medium text-[#737373] bg-white border border-[#E5E2DC] rounded-lg hover:border-[#1B4F72]/40 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/drafts/${draft.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#1B4F72] rounded-lg hover:bg-[#154060] transition-colors"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Published ── */}
      {published && published.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#737373] mb-4">
            Published
          </p>
          <div className="flex flex-col gap-2">
            {published.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 py-3 border-b border-[#E5E2DC] last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1C1C1C] font-medium truncate">{b.title}</p>
                  <p className="text-xs text-[#A8A8A8] mt-0.5">{formatDate(b.date)}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    href={`/briefings/${b.slug}`}
                    target="_blank"
                    className="text-xs text-[#737373] hover:text-[#1B4F72] transition-colors"
                  >
                    View ↗
                  </Link>
                  <Link
                    href={`/admin/briefings/${b.id}/edit`}
                    className="px-3 py-1.5 text-xs font-medium text-[#737373] bg-white border border-[#E5E2DC] rounded-lg hover:border-[#1B4F72]/40 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
