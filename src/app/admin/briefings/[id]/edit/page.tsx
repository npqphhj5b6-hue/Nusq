import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import EditForm from "./EditForm";

export const dynamic = "force-dynamic";

export default async function EditBriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: briefing } = await supabaseAdmin
    .from("briefings")
    .select("id, slug, title, summary, body, tags, date, status")
    .eq("id", id)
    .single();

  if (!briefing) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg font-bold text-[#1C1C1C]">Edit briefing</h1>
          <p className="text-xs text-[#A8A8A8] mt-0.5 font-mono">{briefing.slug}</p>
        </div>
        <a
          href={`/admin/drafts/${id}`}
          className="text-xs text-[#737373] hover:text-[#1C1C1C] transition-colors"
        >
          ← Cancel
        </a>
      </div>
      <EditForm briefing={briefing} />
    </div>
  );
}
