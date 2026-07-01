"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AnnotatedToken } from "@/lib/terms";

function TermSpan({ value, definition }: { value: string; definition: string }) {
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<"left" | "right">("left");
  const ref = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Flip to right-aligned if the popover would overflow the viewport edge.
  // useLayoutEffect avoids a visible flash — safe here since `open` is always
  // false during SSR, so this never runs on the server.
  useLayoutEffect(() => {
    if (!open || !popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    setAlign(rect.right > window.innerWidth - 8 ? "right" : "left");
  }, [open]);

  return (
    <span ref={ref} className="term-span">
      <button
        type="button"
        className="term-trigger"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {value}
      </button>
      {open && (
        <span
          ref={popoverRef}
          className={`term-popover ${align === "right" ? "term-popover-right" : ""}`}
          role="tooltip"
        >
          {definition}
        </span>
      )}
    </span>
  );
}

export default function AnnotatedText({ tokens }: { tokens: AnnotatedToken[] }) {
  return (
    <>
      {tokens.map((t, i) => {
        switch (t.type) {
          case "text":
            return t.value;
          case "bold":
            return <strong key={i}>{t.value}</strong>;
          case "citation":
            return t.url ? (
              <sup key={i}>
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="citation-link">
                  {t.n}
                </a>
              </sup>
            ) : (
              <sup key={i} className="citation-ref">{t.n}</sup>
            );
          case "term":
            return <TermSpan key={i} value={t.value} definition={t.definition} />;
        }
      })}
    </>
  );
}
