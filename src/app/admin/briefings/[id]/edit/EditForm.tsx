"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateBriefing } from "@/app/admin/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 text-xs font-bold tracking-[0.08em] uppercase bg-[#1B4F72] text-white rounded-lg hover:bg-[#154060] disabled:opacity-50 transition-colors"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

interface Briefing {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  date: string;
  status: string;
}

export default function EditForm({ briefing }: { briefing: Briefing }) {
  const boundAction = updateBriefing.bind(null, briefing.id);
  const [state, action] = useActionState(boundAction, null);
  const error = (state as { error?: string } | null)?.error;

  return (
    <form action={action} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
          Title
        </label>
        <input
          name="title"
          defaultValue={briefing.title}
          required
          className="w-full px-3 py-2 text-sm border border-[#E5E2DC] rounded-lg focus:outline-none focus:border-[#1B4F72] bg-white text-[#1C1C1C]"
        />
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
          Summary
        </label>
        <textarea
          name="summary"
          defaultValue={briefing.summary}
          rows={3}
          required
          className="w-full px-3 py-2 text-sm border border-[#E5E2DC] rounded-lg focus:outline-none focus:border-[#1B4F72] bg-white text-[#1C1C1C] resize-y leading-relaxed"
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
          Tags <span className="text-[#A8A8A8] normal-case font-normal">(comma-separated)</span>
        </label>
        <input
          name="tags"
          defaultValue={briefing.tags?.join(", ")}
          className="w-full px-3 py-2 text-sm border border-[#E5E2DC] rounded-lg focus:outline-none focus:border-[#1B4F72] bg-white text-[#1C1C1C]"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
          Body <span className="text-[#A8A8A8] normal-case font-normal">(Markdown)</span>
        </label>
        <textarea
          name="body"
          defaultValue={briefing.body}
          rows={28}
          required
          className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg focus:outline-none focus:border-[#1B4F72] bg-white text-[#1C1C1C] font-mono resize-y leading-relaxed"
        />
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-[#E5E2DC]">
        <SaveButton />
        <a
          href={`/admin/drafts/${briefing.id}`}
          className="text-xs text-[#737373] hover:text-[#1C1C1C] transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
