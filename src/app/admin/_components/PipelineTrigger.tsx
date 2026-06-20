"use client";

import { useState } from "react";

type State = "idle" | "running" | "success" | "error";

interface StoryInput {
  title: string;
  context: string;
  urls: string[];
}

const empty = (): StoryInput => ({ title: "", context: "", urls: [""] });

export default function PipelineTrigger() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [stories, setStories] = useState<[StoryInput, StoryInput]>([empty(), empty()]);

  function updateField(index: 0 | 1, field: "title" | "context", value: string) {
    setStories((prev) => {
      const next: [StoryInput, StoryInput] = [{ ...prev[0] }, { ...prev[1] }];
      next[index][field] = value;
      return next;
    });
  }

  function updateUrl(storyIndex: 0 | 1, urlIndex: number, value: string) {
    setStories((prev) => {
      const next: [StoryInput, StoryInput] = [
        { ...prev[0], urls: [...prev[0].urls] },
        { ...prev[1], urls: [...prev[1].urls] },
      ];
      next[storyIndex].urls[urlIndex] = value;
      return next;
    });
  }

  function addUrl(storyIndex: 0 | 1) {
    setStories((prev) => {
      const next: [StoryInput, StoryInput] = [
        { ...prev[0], urls: [...prev[0].urls] },
        { ...prev[1], urls: [...prev[1].urls] },
      ];
      next[storyIndex].urls.push("");
      return next;
    });
  }

  function removeUrl(storyIndex: 0 | 1, urlIndex: number) {
    setStories((prev) => {
      const next: [StoryInput, StoryInput] = [
        { ...prev[0], urls: [...prev[0].urls] },
        { ...prev[1], urls: [...prev[1].urls] },
      ];
      next[storyIndex].urls = next[storyIndex].urls.filter((_, i) => i !== urlIndex);
      if (next[storyIndex].urls.length === 0) next[storyIndex].urls = [""];
      return next;
    });
  }

  const canSubmit =
    stories[0].title.trim() !== "" &&
    stories[1].title.trim() !== "" &&
    stories[0].urls.some((u) => u.trim() !== "") &&
    stories[1].urls.some((u) => u.trim() !== "");

  async function run() {
    setState("running");
    setMessage("");
    try {
      const res = await fetch("/api/admin/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stories: stories.map((s) => ({
            title: s.title.trim(),
            context: s.context.trim() || undefined,
            urls: s.urls.map((u) => u.trim()).filter(Boolean),
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
    <div className="space-y-6">
      {labels.map((label, i) => (
        <div key={i} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B4F72]">{label}</p>
          <input
            type="text"
            placeholder="Title *"
            value={stories[i as 0 | 1].title}
            onChange={(e) => updateField(i as 0 | 1, "title", e.target.value)}
            disabled={state === "running"}
            className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg bg-white text-[#1C1C1C] placeholder-[#A8A8A8] focus:outline-none focus:border-[#1B4F72]/50 disabled:opacity-50"
          />
          <textarea
            placeholder="Context (optional — key angle, figures, why it matters)"
            value={stories[i as 0 | 1].context}
            onChange={(e) => updateField(i as 0 | 1, "context", e.target.value)}
            disabled={state === "running"}
            rows={2}
            className="w-full px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg bg-white text-[#1C1C1C] placeholder-[#A8A8A8] focus:outline-none focus:border-[#1B4F72]/50 disabled:opacity-50 resize-none"
          />
          <div className="space-y-1.5">
            {stories[i as 0 | 1].urls.map((url, urlIdx) => (
              <div key={urlIdx} className="flex gap-1.5">
                <input
                  type="url"
                  placeholder={urlIdx === 0 ? "Source URL *" : "Additional source URL"}
                  value={url}
                  onChange={(e) => updateUrl(i as 0 | 1, urlIdx, e.target.value)}
                  disabled={state === "running"}
                  className="flex-1 px-3 py-2 text-xs border border-[#E5E2DC] rounded-lg bg-white text-[#1C1C1C] placeholder-[#A8A8A8] focus:outline-none focus:border-[#1B4F72]/50 disabled:opacity-50"
                />
                {stories[i as 0 | 1].urls.length > 1 && (
                  <button
                    onClick={() => removeUrl(i as 0 | 1, urlIdx)}
                    disabled={state === "running"}
                    className="px-2 text-[#A8A8A8] hover:text-[#1C1C1C] disabled:opacity-50 text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addUrl(i as 0 | 1)}
              disabled={state === "running"}
              className="text-[10px] font-bold uppercase tracking-wider text-[#1B4F72] hover:text-[#154060] disabled:opacity-50 transition-colors"
            >
              + Add source
            </button>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 flex-wrap pt-1">
        <button
          onClick={run}
          disabled={state === "running" || !canSubmit}
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
