"use client";

import { useState } from "react";

type State = "idle" | "running" | "success" | "error";

export default function PipelineTrigger() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function run() {
    setState("running");
    setMessage("");
    try {
      const res = await fetch("/api/admin/run", { method: "POST" });
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

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={run}
        disabled={state === "running"}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-[0.08em] uppercase bg-[#1B4F72] text-white rounded-lg hover:bg-[#154060] disabled:opacity-50 transition-colors"
      >
        {state === "running" ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Running…
          </>
        ) : "Run pipeline"}
      </button>
      {message && (
        <span className={`text-xs font-medium ${state === "error" ? "text-red-500" : "text-emerald-600"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
