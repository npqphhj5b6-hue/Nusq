"use client";

import { useState } from "react";

type State = "idle" | "running" | "success" | "error";

interface StoryInput {
  url: string;
  title: string;
  context: string;
}

const empty = (): StoryInput => ({ url: "", title: "", context: "" });

export default function PipelineTrigger() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [stories, setStories] = useState<[StoryInput, StoryInput]>([empty(), empty()]);

  function update(index: 0 | 1, field: keyof StoryInput, value: string) {
    setStories((prev) => {
      const next: [StoryInput, StoryInput] = [{ ...prev[0] }, { ...prev[1] }];
      next[index][field] = value;
      return next;
    });
  }

  const bothUrlsFilled = stories[0].url.trim() !== "" && stories[1].url.trim() !== "";

  async function run() {
    setState("running");
    setMessage("");
    try {
      const res = await fetch("/api/admin/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stories: stories.map((s) => ({
            url: s.url.trim(),
            title: s.title.trim() || undefined,
            context: s.context.trim() || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setState("success");
        setMessage(data.slug ? `Draft created: ${data.slug}` : (data.message ?? "Done"));
      } else if (data.error) {
        setState("error");
        setMessage(data.detail ? `${data.error}: ${data.detail}` : data.error);
      } else {
        setState("success");
        setMessage(data.message ?? "Done");
      }
    } catch (err) {
      setState("error");
      setMessage(String(err));
    }
  }

  const labels = ["Anchor story", "Supporting story"] as const;

  return (
    <div className="space-y-5">
      {labels.map((label, i) => (
        <div key={i} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B4F72]">{label}</p>
          <input
            type="url"
            placeholder="Article URL *"
            value={stories[i as 0 | 1].url}
            onChange={(e) => update(i as 0 | 1, "url", e.target.value)}
            disabled={state === "running"}
            className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg bg-white text-[#1C1C1C] placeholder-[#A8A8A8] focus:outline-none focus:border-[#1B4F72]/50 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Title (optional — taken from URL if blank)"
            value={stories[i as 0 | 1].title}
            onChange={(e) => update(i as 0 | 1, "title", e.target.value)}
            disabled={state === "running"}
            className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg bg-white text-[#1C1C1C] placeholder-[#A8A8A8] focus:outline-none focus:border-[#1B4F72]/50 disabled:opacity-50"
          />
          <textarea
            placeholder="Context (optional — what angle to take, key figures, why it matters)"
            value={stories[i as 0 | 1].context}
            onChange={(e) => update(i as 0 | 1, "context", e.target.value)}
            disabled={state === "running"}
            rows={2}
            className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg bg-white text-[#1C1C1C] placeholder-[#A8A8A8] focus:outline-none focus:border-[#1B4F72]/50 disabled:opacity-50 resize-none"
          />
        </div>
      ))}

      <div className="flex items-center gap-3 flex-wrap pt-1">
        <button
          onClick={run}
          disabled={state === "running" || !bothUrlsFilled}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-[0.08em] uppercase bg-[#1B4F72] text-white rounded-lg hover:bg-[#154060] disabled:opacity-40 transition-colors"
        >
          {state === "running" ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating…
            </>
          ) : "Generate briefing"}
        </button>
        {message && (
          <span className={`text-xs font-medium ${state === "error" ? "text-red-500" : "text-emerald-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
